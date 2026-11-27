'use strict';

// Use native pointer and keyboard events with the homepage's normal smooth scrolling.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function waitForScrollToSettle(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const start = performance.now();
    let previous = scrollY;
    let stable = 0;
    function check() {
      stable = Math.abs(scrollY - previous) < 0.5 ? stable + 1 : 0;
      previous = scrollY;
      if (stable >= 12 && performance.now() - start > 400) return resolve();
      if (performance.now() - start > 4000) return reject(new Error('Page scrolling did not settle'));
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }));
}

async function measureHamburgerAtGridMiddle(page, lesson, desktop) {
  const grid = lesson.locator('.material-grid');
  const originalY = await page.evaluate(() => scrollY);
  const bounds = await grid.boundingBox();
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), originalY + bounds.y + bounds.height / 2);
  await waitForScrollToSettle(page);
  const hamburger = await grid.locator(':scope > aside').boundingBox();
  const activity = await grid.locator(':scope > .activity').boundingBox();
  if (desktop) {
    assert.ok(hamburger.x >= activity.x + activity.width - 1, 'the hamburger is beside the material list');
    assert.ok(Math.abs(hamburger.y - 18) <= 2, 'the hamburger must stay 18px below the viewport top, measured ' + hamburger.y);
  } else {
    assert.ok(hamburger.y >= activity.y + activity.height - 1, 'on a narrow screen the hamburger follows the activities in one column');
  }
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), originalY);
  await waitForScrollToSettle(page);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - originalY) <= 1);
  return hamburger.y;
}

test('the embedded lesson fits the homepage and pointer and keyboard navigation keep the current step in view', async t => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1368, 390, 320]) await t.test(width + 'px', async () => {
      const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'no-preference' });
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
        const iframe = page.locator('#learn iframe');
        const lesson = page.frameLocator('#learn iframe');
        await page.locator('.hero-actions a[href="#learn"]').click();
        await waitForScrollToSettle(page);
        assert.equal(new URL(page.url()).hash, '#learn');
        const frameBox = await iframe.boundingBox();
        assert.ok(frameBox.width > 0 && frameBox.x >= -1 && frameBox.x + frameBox.width <= width + 1, 'the embedded lesson fits the page');

        async function checkStep(step, focused) {
          await waitForScrollToSettle(page);
          const tab = lesson.locator('#step-' + step);
          assert.equal(await tab.getAttribute('aria-selected'), 'true');
          const heading = lesson.locator('#stageTitle');
          const title = await heading.innerText();
          assert.ok((await tab.innerText()).includes(title));
          const target = focused === 'tab' ? tab : heading;
          assert.ok(await target.evaluate(el => el === document.activeElement), 'focus stays with the new step');
          const box = await target.boundingBox();
          assert.ok(box.y >= -1 && box.y + box.height <= 845, title + ' must be in the homepage viewport: ' + JSON.stringify(box));
          const sizes = await lesson.locator('html').evaluate(el => ({
            width: el.clientWidth, content: el.scrollWidth, viewport: innerHeight, document: el.scrollHeight
          }));
          assert.ok(sizes.content <= sizes.width + 1, title + ' has no horizontal overflow: ' + JSON.stringify(sizes));
          assert.ok(sizes.document <= sizes.viewport + 2, 'the frame fits the whole lesson, allowing the homepage to scroll');
          assert.equal(new URL(page.url()).hash, '#learn', 'lesson navigation stays in the homepage learning section');
        }

        await lesson.locator('.lesson-entry').click();
        await waitForScrollToSettle(page);
        const nav = await lesson.locator('#lessonNav').boundingBox();
        assert.ok(nav.y >= -1 && nav.y + nav.height <= 845, 'the lesson entry reveals the seven tabs');
        await lesson.locator('#step-1').click();
        await checkStep(1, 'heading');
        await lesson.locator('[data-reveal-all]').click();
        const expandedHeight = (await iframe.boundingBox()).height;
        const embeddedTop = await measureHamburgerAtGridMiddle(page, lesson, width > 1100);
        if (width > 1100) {
          const standalone = await browser.newPage({ viewport: { width, height: 844 } });
          try {
            await standalone.goto(pathToFileURL(path.resolve(__dirname, '..', 'burger-lab.html')).href);
            await standalone.locator('#step-1').click();
            await standalone.locator('[data-reveal-all]').click();
            const standaloneTop = await measureHamburgerAtGridMiddle(standalone, standalone, true);
            assert.ok(Math.abs(standaloneTop - embeddedTop) <= 2);
          } finally {
            await standalone.close();
          }
        }
        await lesson.locator('#next').click();
        await checkStep(2, 'heading');
        assert.ok((await iframe.boundingBox()).height < expandedHeight, 'the iframe shrinks when leaving the long material list');

        await lesson.locator('#prev').press('Enter');
        await checkStep(1, 'heading');
        await lesson.locator('#step-1').press('End');
        await checkStep(6, 'tab');
        await lesson.locator('#confirm').click();
        await lesson.locator('#step-6').press('Home');
        await checkStep(0, 'tab');
        assert.equal(await lesson.locator('#step-6.done').count(), 1, 'the completed step still has a frame after leaving it');
        const tabs = lesson.locator('#lessonNav [role="tab"]');
        const frames = await tabs.evaluateAll(elements => elements.map(el => {
          const style = getComputedStyle(el);
          const nav = el.parentElement;
          const box = el.getBoundingClientRect();
          const bounds = nav.getBoundingClientRect();
          const sides = ['Top', 'Right', 'Bottom', 'Left'];
          return {
            visibleBorder: sides.every(side => {
              const color = style['border' + side + 'Color'];
              return parseFloat(style['border' + side + 'Width']) >= 1 &&
                !['none', 'hidden'].includes(style['border' + side + 'Style']) &&
                color !== 'rgba(0, 0, 0, 0)' && color !== getComputedStyle(nav).backgroundColor && color !== style.backgroundColor;
            }),
            fits: box.width > 0 && box.height > 0 && box.left >= bounds.left && box.right <= bounds.right + 1 &&
              box.top >= bounds.top && box.bottom <= bounds.bottom + 1,
            color: style.borderTopColor
          };
        }));
        assert.equal(frames.length, 7);
        frames.forEach((frame, index) => {
          assert.ok(frame.visibleBorder, 'all four edges of step ' + (index + 1) + ' must be visible');
          assert.ok(frame.fits, 'the whole frame of step ' + (index + 1) + ' fits inside the step list');
        });
        assert.notEqual(frames[0].color, frames[1].color, 'the selected step has a distinct outline');
        assert.ok(await lesson.locator('#step-0').evaluate(el =>
          el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) > 0
        ), 'keyboard focus is visible on the selected step');
        await lesson.locator('#step-0').press('ArrowRight');
        await checkStep(1, 'tab');
        await page.locator('[role="tab"][aria-controls="workshop"]').click();
        await waitForScrollToSettle(page);
        const workshop = await page.locator('#workshop').boundingBox();
        assert.ok(workshop.y < 844 && workshop.y + workshop.height > 0, 'the independent workshop entry remains reachable');
        assert.equal(await lesson.locator('#step-1').getAttribute('aria-selected'), 'true');
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  } finally {
    await browser.close();
  }
});

'use strict';

// node --test tests/homepage-tabs.browser.test.cjs (Playwright with Microsoft Edge)
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const homepage = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const sections = ['learn', 'workshop', 'transitions', 'topics'];
const tab = (page, section) => page.locator('.top-links [role="tab"][aria-controls="' + section + '"]');

async function checkSection(page, active) {
  await page.locator('#' + active).waitFor({ state: 'visible' });
  const tabs = page.locator('.top-links [role="tab"]');
  assert.deepEqual(await tabs.evaluateAll(nodes => nodes.map(el => el.getAttribute('aria-controls'))), sections);
  for (const name of sections) {
    const panel = page.locator('#' + name);
    const selected = name === active;
    assert.equal(await panel.isVisible(), selected, name);
    assert.equal(await panel.getAttribute('role'), 'tabpanel');
    assert.equal(await tab(page, name).getAttribute('aria-selected'), String(selected));
    assert.equal(await tab(page, name).evaluate(el => el.tabIndex), selected ? 0 : -1);
    assert.equal(await panel.getAttribute('aria-labelledby'), await tab(page, name).getAttribute('id'));
  }
}

test('homepage tabs support keyboard navigation, direct links and browser history on desktop and mobile', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1368, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
      try {
        await page.goto(homepage);
        await checkSection(page, 'learn');
        assert.equal(await page.locator('.top-links[role="tablist"]').count(), 1);
        assert.ok(await page.locator('.top-links [role="tab"]').evaluateAll(nodes => nodes.every(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth + 1;
        })), 'all four tab labels fit at ' + width + 'px');
        await tab(page, 'learn').focus();
        for (const [key, expected] of [['ArrowRight', 'workshop'], ['End', 'topics'], ['ArrowRight', 'learn'],
          ['ArrowLeft', 'topics'], ['Home', 'learn']]) {
          await page.keyboard.press(key);
          await checkSection(page, expected);
          assert.ok(await tab(page, expected).evaluate(el => el === document.activeElement));
        }

        await page.goto(homepage + '#transitions');
        await checkSection(page, 'transitions');
        await tab(page, 'topics').click();
        await tab(page, 'workshop').click();
        assert.equal(new URL(page.url()).hash, '#workshop');
        await page.goBack();
        await checkSection(page, 'topics');
        await page.goBack();
        await checkSection(page, 'transitions');
        await page.goForward();
        await checkSection(page, 'topics');
        await page.reload();
        await checkSection(page, 'topics');
        const park = page.locator('.topic-card').filter({ has: page.locator('[data-use-topic="park"]') });
        await park.locator(':scope > summary').click();
        await park.locator('a[href="#learn"]').click();
        await checkSection(page, 'learn');
        await page.locator('.hero-actions [data-start]').click();
        await checkSection(page, 'workshop');
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test('topic import keeps the current draft and tab on cancellation and opens the chosen topic on acceptance', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.goto(homepage + '#workshop');
    await page.locator('#workshop .step-link[data-step="2"]').click();
    const draft = 'My writing workshop sentence about parks.';
    await page.locator('#p1s1').fill(draft);
    const saved = () => page.evaluate(() => localStorage.getItem('stepwrite-draft-v1'));
    const previous = await saved();
    await tab(page, 'topics').click();
    const robot = page.locator('.topic-card').filter({ has: page.locator('[data-use-topic="robot"]') });
    await robot.locator(':scope > summary').click();
    const importButton = robot.locator('[data-use-topic="robot"]');
    const cancel = page.waitForEvent('dialog').then(async dialog => {
      assert.equal(dialog.type(), 'confirm');
      await dialog.dismiss();
    });
    await Promise.all([cancel, importButton.click()]);
    await checkSection(page, 'topics');
    assert.equal(new URL(page.url()).hash, '#topics');
    assert.equal(await saved(), previous);

    await tab(page, 'workshop').click();
    assert.equal(await page.locator('#p1s1').inputValue(), draft);
    await tab(page, 'topics').click();
    assert.ok(await importButton.isVisible(), 'switching tabs retains the open topic');
    const accept = page.waitForEvent('dialog').then(dialog => dialog.accept());
    await Promise.all([accept, importButton.click()]);
    await checkSection(page, 'workshop');
    assert.ok(await page.locator('#prompt').isVisible());
    assert.match(await page.locator('#prompt').inputValue(), /機器人/);
    assert.equal(await page.locator('#selectedTopic').inputValue(), 'robot');
    assert.equal(await page.locator('#p1s1').inputValue(), '');
    await page.reload();
    await checkSection(page, 'workshop');
    assert.equal(await page.locator('#selectedTopic').inputValue(), 'robot');
    await page.goBack();
    await checkSection(page, 'topics');
  } finally {
    await browser.close();
  }
});

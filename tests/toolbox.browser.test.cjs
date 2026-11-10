'use strict';

// Requires Playwright and Microsoft Edge. Run from the project root:
// node tests/toolbox.browser.test.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1368, height: 900 },
      reducedMotion: 'reduce'
    });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('index.html')).href);
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    const cards = page.locator('.tool-card');
    assert.equal(await cards.count(), 10);
    assert.equal(await cards.locator('button.example-chip').count(), 50);
    assert.equal(await cards.locator('span.chip').count(), 0);

    const isOpen = card => card.evaluate(element => element.open);
    async function setOpen(card, open) {
      if (await isOpen(card) !== open) await card.locator('summary').click();
      assert.equal(await isOpen(card), open);
    }
    async function checkClosedHeight(card) {
      const box = await card.boundingBox();
      const summary = await card.locator('summary').boundingBox();
      assert.ok(Math.abs(box.height - summary.height - 2) < 1,
        `closed card must fit its summary (${box.height} vs ${summary.height})`);
    }
    async function readExamples() {
      return cards.locator('.tool-example').evaluateAll(elements => elements.map(element => element.textContent));
    }
    for (let i = 0; i < 10; i++) await setOpen(cards.nth(i), false);

    // Exercise every left/right pair in both directions, including both open.
    for (let i = 0; i < 10; i += 2) {
      const left = cards.nth(i);
      const right = cards.nth(i + 1);
      await setOpen(right, true);
      assert.equal(await isOpen(left), false);
      await checkClosedHeight(left);
      await setOpen(left, true);
      assert.equal(await isOpen(right), true);
      await setOpen(right, false);
      assert.equal(await isOpen(left), true);
      await checkClosedHeight(right);
      await setOpen(left, false);
    }
    console.log('PASS all five pairs expand independently without stretching closed cards');

    const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
    assert.equal(new Set(ids).size, ids.length, 'all DOM IDs are unique');
    let clickCount = 0;
    for (let i = 0; i < 10; i++) {
      const card = cards.nth(i);
      await setOpen(card, true);
      const buttons = card.locator('button.example-chip');
      assert.equal(await card.locator('[aria-pressed="true"]').count(), 1);
      assert.equal(await card.locator('.example-chip.active').getAttribute('data-example'),
        await card.locator('.example').textContent(), 'initial selection matches the initial example');
      assert.equal(await card.locator('.example-chip.active').getAttribute('data-translation'),
        await card.locator('.sentence-translation').textContent(), 'initial translation matches');
      const originalExamples = await readExamples();
      const sentences = new Set();
      for (let j = 0; j < await buttons.count(); j++) {
        const button = buttons.nth(j);
        const example = await button.getAttribute('data-example');
        const translation = await button.getAttribute('data-translation');
        const phrase = (await button.textContent()).replace(/\s*\.\.\.$/, '').trim();
        assert.ok(example.toLowerCase().includes(phrase.toLowerCase()), `${phrase} appears in its example`);
        assert.match(translation, /[\u3400-\u9fff]/, 'Chinese translation is present');
        assert.ok(!sentences.has(example), 'each option has its own example');
        sentences.add(example);
        await button.click();
        assert.equal(await card.locator('.example').textContent(), example);
        assert.equal(await card.locator('.sentence-translation').textContent(), translation);
        assert.equal(await card.locator('.example-chip.active').count(), 1);
        assert.equal(await card.locator('[aria-pressed="true"]').count(), 1);
        assert.equal(await button.getAttribute('aria-pressed'), 'true');
        for (const id of (await button.getAttribute('aria-controls')).split(' ')) {
          assert.equal(await card.locator(`[id="${id}"]`).count(), 1, 'controls target its own card');
        }
        const updated = await readExamples();
        updated.forEach((value, index) => {
          if (index !== i) assert.equal(value, originalExamples[index], 'other cards retain their examples');
        });
        assert.equal(await isOpen(card), true, 'selecting a phrase does not close the card');
        clickCount++;
      }
      const selected = await card.locator('.example').textContent();
      await setOpen(card, false);
      await setOpen(card, true);
      assert.equal(await card.locator('.example').textContent(), selected, 'reopening retains the selection');
      await setOpen(card, false);
    }
    console.log(`PASS ${clickCount} bilingual examples, selected states, and isolation between cards`);

    const purpose = cards.nth(9);
    await purpose.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await isOpen(purpose), true);
    await purpose.locator('button').nth(1).focus();
    await page.keyboard.press('Space');
    assert.equal(await purpose.locator('button').nth(1).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.equal(await purpose.locator('button').nth(2).getAttribute('aria-pressed'), 'true');
    const focus = await purpose.locator('button').nth(2).evaluate(element => ({
      focused: document.activeElement === element,
      outlineStyle: getComputedStyle(element).outlineStyle,
      outlineWidth: getComputedStyle(element).outlineWidth
    }));
    assert.equal(focus.focused, true);
    assert.notEqual(focus.outlineStyle, 'none');
    assert.notEqual(focus.outlineWidth, '0px');
    await purpose.scrollIntoViewIfNeeded();
    const desktopShot = path.join(os.tmpdir(), 'stepwrite-toolbox-after-desktop.png');
    await page.screenshot({ path: desktopShot });
    console.log('PASS keyboard expansion, Space/Enter selection, and visible focus');

    for (const width of [640, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (let i = 0; i < 10; i++) {
        const card = cards.nth(i);
        await setOpen(card, true);
        await card.locator('button').last().click();
        const bounds = await card.evaluate(element => {
          const box = element.getBoundingClientRect();
          return {
            x: box.x, right: box.right,
            contentFits: element.scrollWidth <= element.clientWidth + 1,
            controlsFit: [...element.querySelectorAll('button')].every(button => {
              const rect = button.getBoundingClientRect();
              return rect.left >= box.left && rect.right <= box.right;
            })
          };
        });
        assert.ok(bounds.x >= 0 && bounds.right <= width, `card ${i + 1} fits at ${width}px`);
        assert.ok(bounds.contentFits && bounds.controlsFit, `controls fit at ${width}px`);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page has no horizontal overflow');
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      assert.ok(second.y >= first.y + first.height, 'mobile cards form one column');
      if (width === 390) {
        await purpose.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(os.tmpdir(), 'stepwrite-toolbox-after-mobile.png') });
      }
    }
    assert.deepEqual(pageErrors, [], 'no browser script errors');
    console.log('PASS 640px, 390px, and 320px layouts without overflow or script errors');
    console.log(`Screenshots: ${desktopShot} and ${path.join(os.tmpdir(), 'stepwrite-toolbox-after-mobile.png')}`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

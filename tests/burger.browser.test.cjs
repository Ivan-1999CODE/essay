'use strict';

// Requires Playwright and Microsoft Edge. Run from the project root:
// node tests/burger.browser.test.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1410, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = pathToFileURL(path.resolve('index.html')).href;
    await page.goto(url);
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    const burgers = page.locator('.burger');
    const pieces = page.locator('.burger-piece');
    assert.equal(await burgers.count(), 2);
    assert.equal(await pieces.count(), 8);
    assert.equal(await page.locator('.burger-piece[open]').count(), 0);
    const closedHeights = await burgers.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    await page.locator('#prompt').fill('My own park writing task.');
    const savedBefore = await page.evaluate(() => JSON.stringify(localStorage));

    // Seven examples must match the existing basic park essay; the optional
    // first-paragraph conclusion is deliberately outside that complete model.
    const essay = await page.locator('#lesson-panel-5 .annotated-model').first().locator('.answer-part').evaluateAll(elements => elements.map(element => {
      const clone = element.cloneNode(true);
      const translation = clone.querySelector('.sentence-translation').textContent.trim();
      clone.querySelectorAll('.answer-label, .sentence-translation').forEach(child => child.remove());
      return { english: clone.textContent.trim(), translation };
    }));
    for (const [pieceIndex, essayIndex] of [[0, 0], [1, 1], [2, 2], [4, 3], [5, 4], [6, 5], [7, 6]]) {
      assert.equal(await pieces.nth(pieceIndex).locator('.burger-sample p[lang="en"]').textContent(), essay[essayIndex].english);
      assert.equal(await pieces.nth(pieceIndex).locator('.sentence-translation').textContent(), essay[essayIndex].translation);
    }
    assert.match(await pieces.nth(3).locator('.burger-how').textContent(), /省略|不用/);
    console.log('PASS all examples agree with the park essay and the optional layer stays optional');

    for (let i = 0; i < 8; i++) {
      const piece = pieces.nth(i);
      const burgerIndex = Math.floor(i / 4);
      await piece.locator('summary').click();
      assert.equal(await piece.evaluate(element => element.open), true);
      assert.equal(await piece.locator('.burger-tip').isVisible(), true);
      assert.equal(await burgers.nth(burgerIndex).locator('.burger-piece[open]').count(), 1);
      assert.match(await piece.locator('.burger-how').textContent(), /怎麼寫/);
      assert.match(await piece.locator('.sentence-translation').textContent(), /[\u3400-\u9fff]/);
      if (burgerIndex === 0) {
        const right = await burgers.nth(1).boundingBox();
        assert.ok(Math.abs(right.height - closedHeights[1]) < 1, 'closed neighbor retains its own height');
      } else {
        assert.equal(await pieces.nth(3).evaluate(element => element.open), true, 'right burger does not close the left one');
      }
    }
    await pieces.nth(7).locator('summary').click();
    assert.equal(await pieces.nth(7).evaluate(element => element.open), false, 'repeat click collapses the layer');
    await pieces.nth(3).locator('summary').click();
    assert.equal(await page.locator('.burger-piece[open]').count(), 0);
    assert.equal(await page.locator('#prompt').inputValue(), 'My own park writing task.');
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), savedBefore, 'exploring layers does not change draft or practice progress');
    console.log('PASS all eight layers, one open per burger, independent columns, and unchanged writing');

    const reason = pieces.nth(5);
    await reason.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await reason.evaluate(element => element.open), true);
    await page.keyboard.press('Space');
    assert.equal(await reason.evaluate(element => element.open), false);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(260);
    const selectedStyle = await reason.locator('summary').evaluate(element => ({
      outline: getComputedStyle(element).outlineStyle,
      transform: getComputedStyle(element).transform,
      focused: document.activeElement === element
    }));
    assert.equal(selectedStyle.focused, true);
    assert.equal(selectedStyle.outline, 'solid');
    assert.notEqual(selectedStyle.transform, 'none', 'open ingredient is lifted');
    await page.mouse.move(0, 0);
    await page.locator('.burger-grid').screenshot({ path: path.join(os.tmpdir(), 'stepwrite-burger-after-desktop.png') });
    console.log('PASS Enter/Space, visible focus, and the lifted ingredient');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await reason.locator('.burger-tip').evaluate(element => getComputedStyle(element).animationName), 'none');
    assert.equal(await reason.locator('summary').evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    for (const width of [768, 640, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (let i = 0; i < 8; i++) {
        const piece = pieces.nth(i);
        if (!await piece.evaluate(element => element.open)) await piece.locator('summary').click();
        const fits = await piece.evaluate(element => {
          const burger = element.closest('.burger').getBoundingClientRect();
          return [...element.querySelectorAll('.burger-layer, .burger-tip, .burger-sample')].every(child => {
            const box = child.getBoundingClientRect();
            // The lifted layer intentionally scales beyond its details wrapper,
            // but must stay inside the burger's padding without clipping text.
            return box.left >= Math.max(0, burger.left) && box.right <= Math.min(innerWidth, burger.right)
              && child.scrollWidth <= child.clientWidth + 1;
          });
        });
        assert.equal(fits, true, `layer ${i + 1} fits at ${width}px`);
      }
      if (width <= 640) {
        const left = await burgers.nth(0).boundingBox();
        const right = await burgers.nth(1).boundingBox();
        assert.ok(right.y >= left.y + left.height, 'small screens stack the two burgers');
      }
      if (width === 390) {
        await reason.locator('summary').click();
        await burgers.nth(1).screenshot({ path: path.join(os.tmpdir(), 'stepwrite-burger-after-mobile.png') });
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS all layers at 768px, 640px, 390px, and 320px, plus reduced motion');

    const noScript = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    const fallback = await noScript.newPage();
    await fallback.goto(url);
    const fallbackPieces = fallback.locator('.burger-piece');
    await fallbackPieces.nth(0).locator('summary').click();
    assert.equal(await fallbackPieces.nth(0).getAttribute('open'), '');
    await fallbackPieces.nth(1).locator('summary').click();
    assert.equal(await fallbackPieces.nth(0).getAttribute('open'), null);
    assert.equal(await fallbackPieces.nth(1).locator('.burger-tip').isVisible(), true);
    await noScript.close();
    console.log('PASS native interaction remains usable without JavaScript');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

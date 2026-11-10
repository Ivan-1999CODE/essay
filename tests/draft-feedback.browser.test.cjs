'use strict';

// Requires Playwright and Microsoft Edge. Run from the project root:
// node tests/draft-feedback.browser.test.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1368, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    const url = pathToFileURL(path.resolve('index.html')).href;
    await page.goto(url);
    const legacy = 'Picture A shows many children. [圖 A 的動作：請確認完整句，原素材：play on colorful equipment] The park feels lively and exciting.';
    const repaired = 'Picture A shows many children. Children play on colorful equipment. The park feels lively and exciting.';
    const setState = async overrides => {
      await page.evaluate(overrides => {
        localStorage.setItem('stepwrite-draft-v1', JSON.stringify({
          ...topicSeeds.park, selectedTopic: 'park', activeStep: 2,
          a1: 'many children', a2: 'play on colorful equipment', a3: 'lively and exciting', ...overrides
        }));
      }, overrides);
      await page.reload();
    };

    await setState({ p1s2: legacy, finalDraft: `${legacy}\n\nMy own conclusion.` });
    assert.equal(await page.locator('#p1s2').inputValue(), repaired);
    assert.equal(await page.locator('#a2').inputValue(), 'play on colorful equipment');
    assert.equal(await page.locator('#finalDraft').inputValue(), `${repaired}\n\nMy own conclusion.`);
    assert.equal(await page.locator('#p1s2Note').isVisible(), true);
    assert.match(await page.locator('#p1s2Note').textContent(), /舊版提示/);
    assert.equal(await page.locator('#p1s2').getAttribute('aria-describedby'), 'p1s2Note');
    await page.locator('[data-build="p1"]').click();
    assert.equal(await page.locator('#p1s2').inputValue(), repaired);
    assert.equal(await page.locator('#p1s2Note').isVisible(), false);
    assert.equal(await page.locator('#finalDraft').inputValue(), `${repaired}\n\nMy own conclusion.`, 'regeneration preserves the separately edited final draft');
    await page.locator('#p1s2').locator('xpath=ancestor::div[contains(@class,"sentence-card")]').screenshot({ path: path.join(os.tmpdir(), 'stepwrite-draft-english-fixed.png') });
    await page.reload();
    assert.equal(await page.locator('#p1s2').inputValue(), repaired);
    assert.equal(await page.locator('#p1s2Note').isVisible(), false);
    console.log('PASS reported saved draft migration, English regeneration, and persistence');

    await setState({ a1: 'colorful playground equipment' });
    await page.locator('[data-build="p1"]').click();
    assert.doesNotMatch(await page.locator('#p1s2').inputValue(), /[\u3400-\u9fff]|\[/);
    assert.equal(await page.locator('#p1s2Note').isVisible(), true);
    assert.equal(await page.locator('#p1s2').getAttribute('data-needs-review'), 'true');
    assert.match(await page.locator('#p1s2Note').textContent(), /play on colorful equipment/);
    await page.reload();
    assert.equal(await page.locator('#p1s2Note').isVisible(), true, 'unresolved guidance survives reload');
    await page.setViewportSize({ width: 390, height: 844 });
    const card = page.locator('#p1s2').locator('xpath=ancestor::div[contains(@class,"sentence-card")]');
    await card.screenshot({ path: path.join(os.tmpdir(), 'stepwrite-draft-guidance-mobile.png') });
    assert.equal(await card.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    await page.locator('#p1s2').fill('In Picture A, children play on colorful equipment.');
    assert.equal(await page.locator('#p1s2Note').isVisible(), false);
    await page.reload();
    assert.equal(await page.locator('#p1s2Note').isVisible(), false);
    assert.equal(await page.locator('#p1s2').inputValue(), 'In Picture A, children play on colorful equipment.');
    console.log('PASS external feedback, mobile layout, and preserving the student correction');

    await page.setViewportSize({ width: 1368, height: 1000 });
    await setState({ a2: '', reason1: '', detail2: 'Sarah reads a book under the tree.' });
    await page.locator('[data-build="p1"]').click();
    assert.equal(await page.locator('#p1s2Note').isVisible(), true);
    await page.locator('[data-step="3"]').click();
    await page.locator('[data-build="p2"]').click();
    assert.equal(await page.locator('#p2s2').inputValue(), '');
    assert.equal(await page.locator('#p2s2Note').isVisible(), true);
    assert.equal(await page.locator('#p2s5').inputValue(), 'Sarah reads a book under the tree.');
    await page.locator('[data-step="5"]').click();
    assert.doesNotMatch(await page.locator('#finalDraft').inputValue(), /[\u3400-\u9fff]|\[/);
    assert.equal(await page.locator('#finalDraftNote').isVisible(), true);
    assert.match(await page.locator('#feedback').textContent(), /仍需確認/);
    await page.reload();
    assert.equal(await page.locator('#finalDraftNote').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS incomplete source guidance stays outside assembled English and no browser errors');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

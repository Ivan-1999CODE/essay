'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const homepage = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href + '#workshop';

test('writing fields, paragraph hints and copy work independently on desktop and mobile', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const [width, colorScheme] of [[1368, 'light'], [320, 'dark']]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
          writeText: async text => { window.copiedDraft = text; }
        } });
      });
      await page.goto(homepage);
      await page.locator('[data-load-topic="robot"]').click();
      const p1 = page.locator('#writingP1');
      const p2 = page.locator('#writingP2');
      const first = "I can't focus at school.";
      const second = 'My robot reminds me to rest.';
      const hint1 = page.locator('#writingHint1');
      const hint2 = page.locator('#writingHint2');
      const copy = page.locator('#copyDraft');
      assert.ok(await copy.isDisabled());
      assert.equal(await hint1.evaluate(el => el.open), false);
      assert.equal(await hint2.evaluate(el => el.open), false);
      await p1.fill(first);
      assert.equal(await page.locator('#wordCount').innerText(), '5');
      assert.equal(await page.locator('#paragraphCount').innerText(), '1');
      const toggle = hint2.locator('summary');
      await toggle.focus();
      await page.keyboard.press('Enter');
      assert.ok(await hint2.locator('li').first().isVisible(), 'the keyboard reveals practical questions');
      assert.equal(await hint1.evaluate(el => el.open), false);
      assert.ok(await toggle.evaluate(el => el.matches(':focus-visible')));
      await toggle.hover();
      await hint2.screenshot({ path: path.join(os.tmpdir(), 'stepwrite-open-robot-hint-' + width + '.png') });
      assert.ok(await hint2.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await p2.fill(second);
      assert.equal(await page.locator('#wordCount').innerText(), '11');
      assert.equal(await page.locator('#paragraphCount').innerText(), '2');
      const example = page.locator('#writingExample');
      const seeExample = example.locator('summary');
      await seeExample.focus();
      await page.keyboard.press('Space');
      assert.ok(await example.locator('p[lang="en"]').first().isVisible());
      assert.ok(await seeExample.evaluate(el => el.matches(':focus-visible')));
      await seeExample.hover();
      await example.screenshot({ path: path.join(os.tmpdir(), 'stepwrite-open-model-' + width + '.png') });
      assert.ok(await example.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await copy.click();
      assert.equal(await page.evaluate(() => window.copiedDraft), first + '\n\n' + second);
      await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw Error('Permission denied'); }; });
      await copy.click();
      const manual = page.locator('#writingCopyText');
      assert.ok(await manual.isVisible());
      const selection = await page.evaluate(() => window.getSelection().toString());
      assert.equal(selection, first + '\n\n' + second);
      await page.locator('[data-load-topic="marketing"]').click();
      assert.equal(await manual.isVisible(), false);
      assert.equal(await hint2.evaluate(el => el.open), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test('an edited legacy essay is available in the corresponding topic with its original notes', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const legacy = {
      selectedTopic: 'robot', prompt: 'Describe the robot you would build.',
      a1: 'my own idea about helping my classmates', p1s1: 'Earlier first sentence.',
      finalDraft: 'My revised first paragraph.\r\n\r\nMy revised second paragraph.'
    };
    await page.goto(homepage);
    await page.evaluate(data => localStorage.setItem('stepwrite-draft-v1', JSON.stringify(data)), legacy);
    await page.reload();
    await page.locator('[data-load-topic="robot"]').click();
    assert.equal(await page.locator('#writingP1').inputValue(), 'My revised first paragraph.');
    assert.equal(await page.locator('#writingP2').inputValue(), 'My revised second paragraph.');
    const notes = page.locator('#writingNotes');
    await notes.locator('summary').click();
    assert.ok((await notes.innerText()).includes(legacy.a1));
    await page.locator('#writingP2').fill('This paragraph has now been edited in the new workshop.');
    await page.locator('[data-load-topic="marketing"]').click();
    assert.equal(await notes.isVisible(), false);
    assert.equal(await page.locator('#writingP1').inputValue(), '');
    await page.locator('[data-load-topic="robot"]').click();
    await page.reload();
    assert.equal(await page.locator('#writingP2').inputValue(), 'This paragraph has now been edited in the new workshop.');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('stepwrite-draft-v1'))), legacy);
  } finally {
    await browser.close();
  }
});

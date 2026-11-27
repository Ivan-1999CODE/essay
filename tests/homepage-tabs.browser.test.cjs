'use strict';

// node --test tests/homepage-tabs.browser.test.cjs (Playwright with Microsoft Edge)
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const homepage = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const sections = ['learn', 'transitions', 'workshop'];
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
        assert.deepEqual(await page.locator('.top-links [role="tab"]').allTextContents(),
          ['七關作文', '轉折詞與長句', '換一題，自己寫']);
        assert.ok(await page.locator('.top-links [role="tab"]').evaluateAll(nodes => nodes.every(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth + 1;
        })), 'all three tab labels fit at ' + width + 'px');
        await tab(page, 'learn').focus();
        for (const [key, expected] of [['ArrowRight', 'transitions'], ['End', 'workshop'], ['ArrowRight', 'learn'],
          ['ArrowLeft', 'workshop'], ['Home', 'learn']]) {
          await page.keyboard.press(key);
          await checkSection(page, expected);
          assert.ok(await tab(page, expected).evaluate(el => el === document.activeElement));
        }

        await page.goto(homepage + '#transitions');
        await checkSection(page, 'transitions');
        await page.goto(homepage + '#topics');
        await checkSection(page, 'workshop');
        assert.equal(new URL(page.url()).hash, '#workshop');
        await page.goBack();
        await checkSection(page, 'transitions');
        await page.goForward();
        await checkSection(page, 'workshop');
        await page.reload();
        await checkSection(page, 'workshop');
        await tab(page, 'learn').click();
        await checkSection(page, 'learn');
        const start = page.locator('.hero-actions [data-start]');
        assert.match(await start.innerText(), /換一題，自己寫/);
        await start.click();
        await checkSection(page, 'workshop');
        assert.equal(await page.locator('#writingEditor').isVisible(), false);
        assert.equal(await page.locator('#workshop [data-load-topic]:visible').count(), 4);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test('each topic opens both writing tasks with its own model essay and independent draft', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const dialogs = [];
    page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
    await page.goto(homepage + '#workshop');
    await page.locator('[data-load-topic="park"]').click();
    const p1 = page.locator('#writingP1');
    const p2 = page.locator('#writingP2');
    const park = ['There are two different parks.', 'My ideal park has a pond.'];
    await p1.fill(park[0]);
    await p2.fill(park[1]);
    const example = page.locator('#writingExample');
    const originalTasks = new Set();
    const samples = [
      ['robot', /機器人/, /robot/i], ['marketing', /促銷|行銷/, /marketing|promotion/i],
      ['disaster', /災害|互助/, /disaster|volunteer/i], ['park', /公園/, /park/i]
    ];
    for (const [topic, title, theme] of samples) {
      await page.locator('[data-load-topic="' + topic + '"]').click();
      await checkSection(page, 'workshop');
      assert.match(await page.locator('#writingTitle').innerText(), title);
      assert.ok(await p1.isEditable() && await p2.isEditable());
      assert.equal(await page.locator('#writingEditor textarea:visible').count(), 2);
      for (const n of [1, 2]) {
        const task = (await page.locator('#writingTask' + n).innerText()).trim();
        assert.ok(task && !originalTasks.has(task), 'each topic has its own paragraph task');
        originalTasks.add(task);
        assert.equal(await page.locator('#writingHint' + n).evaluate(el => el.open), false);
      }
      assert.equal(await p1.inputValue(), topic === 'park' ? park[0] : '');
      assert.equal(await p2.inputValue(), topic === 'park' ? park[1] : '');
      assert.equal(await example.locator('summary').innerText(), '看看別人怎麼寫');
      assert.equal(await example.evaluate(el => el.open), false);
      assert.ok(await example.evaluate(el => [1, 2].every(n =>
        document.getElementById('writingP' + n).compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)));
      if (topic === 'robot') {
        await p1.fill('I often lose focus while studying.');
        await p2.fill('I would design a robot that helps me study.');
        await page.locator('#writingHint1 summary').click();
        assert.equal(await page.locator('#writingHint2').evaluate(el => el.open), false);
        assert.equal(await example.evaluate(el => el.open), false);
      }
      const before = [await p1.inputValue(), await p2.inputValue()];
      await example.locator('summary').click();
      const english = example.locator('#writingExampleBody p[lang="en"]');
      const chinese = example.locator('#writingExampleBody p[lang^="zh"]');
      assert.equal(await english.count(), 2);
      assert.equal(await chinese.count(), 2);
      for (const paragraph of await english.allInnerTexts()) assert.match(paragraph, /[A-Za-z]+\s+[A-Za-z]+/);
      for (const paragraph of await chinese.allInnerTexts()) assert.match(paragraph, /[\u3400-\u9fff]/);
      assert.match((await english.allInnerTexts()).join(' '), theme);
      assert.deepEqual([await p1.inputValue(), await p2.inputValue()], before);
      assert.equal(await page.locator('#writingHint1').evaluate(el => el.open), topic === 'robot');
    }
    await page.locator('[data-load-topic="robot"]').click();
    await tab(page, 'transitions').click();
    await tab(page, 'workshop').click();
    await page.reload();
    await checkSection(page, 'workshop');
    assert.match(await page.locator('#writingTitle').innerText(), /機器人/);
    assert.equal(await p1.inputValue(), 'I often lose focus while studying.');
    assert.equal(await p2.inputValue(), 'I would design a robot that helps me study.');
    assert.deepEqual(dialogs, []);
  } finally {
    await browser.close();
  }
});

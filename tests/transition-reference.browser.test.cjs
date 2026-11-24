'use strict';

// NODE_PATH may point to the bundled runtime's node_modules when Playwright is not installed locally.
// Run from the project root: node tests/transition-reference.browser.test.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const expectedCategoryIds = [
  'first', 'second', 'third', 'addition', 'example', 'result', 'contrast',
  'concession', 'opinion', 'clarification', 'emphasis', 'bridge', 'conclusion'
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const file of ['轉折詞詳細查閱表.html', 'index.html']) {
      await page.goto(pathToFileURL(path.resolve(file)).href);
      if (file === 'index.html') await page.locator('[role="tab"][aria-controls="transitions"]').click();
      const root = page.locator('#transitionReference');
      const data = await page.evaluate(() => window.transitionReference);
      assert.equal(data.categories.length, 13);
      assert.equal(data.rows.length, 58);
      assert.deepEqual(data.categories.map(category => category[0]), expectedCategoryIds,
        'retain the approved 13 categories, excluding all seven removed categories');
      assert.deepEqual(await root.locator('[data-ref-category]').evaluateAll(elements => elements.map(element => element.dataset.refCategory)), expectedCategoryIds,
        'both pages render exactly the approved categories in order');
      const keys = new Set(data.categories.map(category => category[0]));
      assert.equal(keys.size, 13);
      for (const id of ['opinion', 'clarification', 'emphasis', 'bridge']) {
        assert.equal(data.rows.filter(row => row[0] === id).length, 4,
          `${id} retains all four entries requested by the user`);
      }
      for (const row of data.rows) {
        assert.equal(row.length, 8);
        row.forEach(cell => assert.ok(typeof cell === 'string' && cell.trim()));
        assert.ok(keys.has(row[0]));
        assert.ok(['優先背', '可替換'].includes(row[7]), 'each entry has one of the two approved priorities');
        assert.match(row[3], /\[[^\]]+\]/, 'each frame has a meaningful slot');
        assert.doesNotMatch(row[4], /\[|\]|…/, 'examples are complete, not placeholders');
        assert.match(row[5], /[\u3400-\u9fff]/, 'each example has a Chinese translation');
      }
      for (const categoryId of expectedCategoryIds) {
        const entries = data.rows.map((row, index) => ({ row, index })).filter(entry => entry.row[0] === categoryId);
        const primaryCount = entries.filter(entry => entry.row[7] === '優先背').length;
        assert.ok(primaryCount >= 1 && primaryCount <= 2, `${categoryId} has one or two priority entries`);
        assert.ok(entries.slice(0, primaryCount).every(entry => entry.row[7] === '優先背'),
          `${categoryId} stores all priority entries before alternatives`);
        const renderedRows = await root.locator(`[data-ref-category="${categoryId}"] [data-ref-row]`).evaluateAll(elements => elements.map(element => {
          const tag = element.querySelector('.ref-row-tag');
          return {
            index: Number(element.dataset.refRow),
            priority: element.dataset.refPriority,
            label: tag.textContent,
            primaryTag: tag.classList.contains('primary'),
            alternativeTag: tag.classList.contains('alternative'),
            copyIndex: Number(element.querySelector('[data-ref-copy]').dataset.refCopy),
            template: element.querySelector('td:nth-child(2) .ref-en').textContent
          };
        }));
        assert.deepEqual(renderedRows, entries.map(({ row, index }) => ({
          index,
          priority: row[7] === '優先背' ? 'primary' : 'alternative',
          label: row[7],
          primaryTag: row[7] === '優先背',
          alternativeTag: row[7] === '可替換',
          copyIndex: index,
          template: row[3]
        })), `${categoryId} renders the sorted priorities, labels and copy targets without losing row identity`);
      }
      const sequenceTemplates = ['first', 'second', 'third', 'conclusion'].map(categoryId =>
        data.rows.find(row => row[0] === categoryId && row[7] === '優先背')[3]);
      assert.deepEqual(await root.locator('.ref-sequence > article .ref-en').allTextContents(), sequenceTemplates,
        'the four sequence cards use each category\'s first priority entry after reordering');
      const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
      assert.equal(new Set(ids).size, ids.length);
      assert.equal(await root.locator('[data-ref-row]').count(), 58);
      const visibleRows = () => root.locator('[data-ref-row]:not([hidden])').count();
      await root.locator('[data-ref-filter="sequence"]').click();
      assert.equal(await visibleRows(), 15);
      assert.equal(await root.locator('.ref-category:not([hidden])').count(), 3);
      const third = data.rows.filter(row => row[0] === 'third');
      assert.ok(third.every(row => row[3].startsWith('Last but not least,')));
      await root.locator('#transitionSearch').fill('第二點');
      assert.equal(await visibleRows(), 6);
      const searchedIndex = data.rows.findIndex(row => row[0] === 'second' && row[7] === '可替換');
      const searchedEntry = data.rows[searchedIndex];
      await root.locator('#transitionSearch').fill(searchedEntry[1]);
      const searchedRow = root.locator(`[data-ref-row="${searchedIndex}"]`);
      assert.equal(await searchedRow.isVisible(), true, 'search finds an alternative after category filtering and reordering');
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedFrame = text; } } }));
      await searchedRow.locator('[data-ref-copy]').click();
      assert.equal(await page.evaluate(() => window.__copiedFrame), searchedEntry[3],
        'copying a searched alternative uses its own template rather than its former position');
      await root.locator('#transitionSearch').fill('THIS DOES NOT EXIST 12345');
      assert.equal(await visibleRows(), 0);
      assert.equal(await root.locator('#transitionEmpty').isVisible(), true);
      await root.locator('#transitionReset').click();
      assert.equal(await visibleRows(), 58);
      await root.locator('.ref-filters > [data-ref-filter="priority"]').click();
      assert.equal(await visibleRows(), data.rows.filter(row => row[7] === '優先背').length);
      assert.equal(await root.locator('[data-ref-row][data-ref-priority="alternative"]:not([hidden])').count(), 0);
      const filteredPrimary = root.locator('[data-ref-row]:not([hidden])').last();
      const filteredIndex = Number(await filteredPrimary.getAttribute('data-ref-row'));
      await filteredPrimary.locator('[data-ref-copy]').click();
      assert.equal(await page.evaluate(() => window.__copiedFrame), data.rows[filteredIndex][3],
        'copying after the priority filter preserves the displayed row\'s template');
      await root.locator('#transitionReset').click();
      await root.locator('.ref-controls > .ref-filters > [data-ref-filter="conclusion"]').click();
      assert.equal(await visibleRows(), 7, 'the conclusion shortcut contains only the retained conclusion entries');
      await root.locator('.ref-category-picker > summary').click();
      await root.locator('.ref-category-picker [data-ref-filter="conclusion"]').click();
      assert.equal(await visibleRows(), 7, 'the conclusion category and shortcut show the same retained entries');

      // Test both successful copying and the selection fallback without relying on OS clipboard access.
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedFrame = text; } } }));
      const copy = root.locator('.ref-category:not([hidden]) [data-ref-copy]').first();
      await copy.click();
      assert.equal(await page.evaluate(() => window.__copiedFrame), data.rows.find(row => row[0] === 'conclusion')[3]);
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Unavailable'); } } }));
      await copy.click();
      assert.equal(await page.evaluate(() => getSelection().toString()), data.rows.find(row => row[0] === 'conclusion')[3]);
      assert.match(await root.locator('#transitionCopyStatus').textContent(), /Ctrl/);

      await root.locator('#transitionReset').click();
      await root.locator('#transitionExpand').click();
      assert.equal(await root.locator('.ref-category[open]').count(), 13);
      await root.locator('#transitionCollapse').click();
      assert.equal(await root.locator('.ref-category[open]').count(), 0);
      await root.locator('.ref-category > summary').first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await root.locator('.ref-category[open]').count(), 1);
      await root.locator('.ref-category-picker > summary').click();

      for (const width of [1440, 720, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file} fits ${width}px`);
        const bounds = await root.locator('.ref-category[open]').first().evaluate(element => ({ scroll: element.scrollWidth, client: element.clientWidth }));
        assert.ok(bounds.scroll <= bounds.client + 1, 'table fits its container');
        if (file !== 'index.html' && [1440, 390].includes(width)) {
          await page.screenshot({ path: path.join(os.tmpdir(), `stepwrite-reference-${width}.png`) });
          await root.locator('.ref-category[open]').first().scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(os.tmpdir(), `stepwrite-reference-table-${width}.png`) });
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
      await page.emulateMedia({ media: 'print' });
      assert.equal(await root.isVisible(), true, `${file} table is not hidden by print rules`);
      assert.equal(await root.locator('[data-ref-row]:visible').count(), 58, 'printing expands all current results');
      assert.equal(await root.locator('#transitionSearch').isVisible(), false);
      if (file === 'index.html') assert.equal(await page.locator('#workshop').isVisible(), false);
      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
      assert.equal(await root.locator('.ref-category[open]').count(), 1, 'printing restores open state');
      console.log(`PASS ${file}: 13 approved categories, 58 bilingual entries, priority ordering, sequence cards, filtered copy, keyboard, 4 widths, print state`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS no browser errors; screenshots saved to the system temporary directory');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

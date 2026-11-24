'use strict';

// Requires Playwright and Microsoft Edge. Run with:
// node --test tests/burger-lab-palette.browser.test.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const pointBackgrounds = { 1: 'rgb(238, 223, 206)', 2: 'rgb(226, 237, 216)' };
const categoryColors = {
  Where: ['rgb(228, 237, 218)', 'rgb(173, 191, 149)'],
  What: ['rgb(245, 230, 203)', 'rgb(216, 187, 136)'],
  Who: ['rgb(224, 236, 232)', 'rgb(165, 191, 181)'],
  When: ['rgb(231, 229, 241)', 'rgb(187, 180, 209)'],
  Why: ['rgb(242, 225, 213)', 'rgb(208, 175, 152)'],
  How: ['rgb(233, 237, 207)', 'rgb(185, 195, 141)']
};

async function checkPointSentence(layer, sentence, markedPhrases) {
  assert.equal(await layer.innerText(), sentence);
  const marks = await layer.locator('mark').evaluateAll(elements => elements.map(mark => ({
    text: mark.textContent,
    tone: mark.dataset.pointTone,
    background: getComputedStyle(mark).backgroundColor
  })));
  assert.deepEqual(marks, markedPhrases.map(([text, tone]) => ({ text, tone, background: pointBackgrounds[tone] })));
}

test('the second Bonus card opens from its title and keeps the placed sentence when closed', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'burger-lab.html')).href);
    await page.locator('#step-2').click();
    await page.locator('[data-bonus-toggle]').click();
    const title = page.locator('summary#bonusExampleTitle-2');
    const evidence = page.locator('#bonusEvidence-2');
    const reveal = page.locator('[data-bonus-reveal="2"]');
    const adopt = page.locator('[data-bonus-adopt="2"]');
    const layer = page.locator('[data-burger-sentence="bridgeEn"] .user-content');
    assert.ok(await page.locator('#bonusEvidence-1').isVisible());
    assert.ok(await title.isVisible());
    assert.equal(await evidence.isVisible(), false);
    assert.equal(await reveal.isVisible(), false);

    await title.focus();
    await page.keyboard.press('Enter');
    assert.ok(await evidence.isVisible());
    await reveal.click();
    const comparison = await page.locator('#bonusExample-2 .bonus-example-en').innerText();
    await adopt.click();
    await checkPointSentence(layer, comparison, [['play', '1'], ['walking', '2'], ['resting', '2']]);
    await title.click();
    assert.equal(await adopt.isVisible(), false);
    assert.equal(await layer.innerText(), comparison);

    await page.locator('[data-switch="sentence"][data-value="B"]').click();
    await page.reload();
    assert.ok(await title.isVisible());
    assert.equal(await evidence.isVisible(), false);
    await title.focus();
    await page.keyboard.press('Space');
    assert.equal(await adopt.getAttribute('aria-pressed'), 'true');
    assert.equal(await layer.innerText(), comparison);
  } finally {
    await browser.close();
  }
});

test('Bonus keeps the original 5W1H colors in source cards and quotes and uses picture colors for the takeaways', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'burger-lab.html')).href);
    await page.locator('#step-1').click();
    for (const picture of ['A', 'B']) {
      await page.getByRole('button', { name: `觀察圖 ${picture}`, exact: true }).click();
      await page.locator('[data-model-preset]').click();
      for (const category of ['When', 'Why']) await page.locator(`[data-category-pick="${category}"]`).check();
    }
    await page.locator('#step-2').click();
    for (const picture of ['A', 'B']) {
      await page.locator(`[data-switch="sentence"][data-value="${picture}"]`).first().click();
      await page.locator('[data-model-fuse]').click();
      await page.locator('[data-model-adopt]').click();
    }
    await page.locator('[data-bonus-toggle]').click();
    await page.locator('summary#bonusExampleTitle-2').click();

    async function checkCategoryColors(elements, expectedCategories) {
      const colors = await elements.evaluateAll(nodes => nodes.map(el => [el.dataset.materialCategory, getComputedStyle(el).backgroundColor]));
      assert.deepEqual([...new Set(colors.map(([category]) => category))].sort(), expectedCategories.toSorted());
      for (const [category, color] of colors) assert.equal(color, categoryColors[category][0], category);
    }
    for (const picture of ['A', 'B']) {
      const source = page.locator(`[data-bonus-source="${picture}"]`);
      const sentenceMarks=source.locator('.bonus-actual-sentence mark');
      await checkCategoryColors(sentenceMarks, ['Where', 'Who', 'What', 'How']);
      assert.ok(await sentenceMarks.evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).borderBottomWidth==='0px')));
      const wordList=source.locator('.bonus-materials');
      assert.equal(await wordList.isVisible(),false);
      await source.locator('summary').click();
      assert.ok(await wordList.isVisible());
      await checkCategoryColors(wordList.locator('.bonus-material-row'), Object.keys(categoryColors));
      assert.equal(await wordList.locator('mark').count(),0);
      assert.ok(await wordList.locator('li').count()>6);
      await source.locator('summary').click();
      for (const number of [1, 2]) {
        const evidence = page.locator(`#bonusEvidence-${number} [data-bonus-evidence="${picture}"]`);
        assert.equal(await evidence.getAttribute('data-evidence-source'), 'student');
        await checkCategoryColors(evidence.locator('.bonus-quote mark'), number === 1 ? ['How'] : ['What', 'Who', 'Where']);
      }
    }
    for (const [number, picture, phrase, marks] of [
      [1, 'A', 'a lively park', [['lively', '1']]], [1, 'B', 'a quiet one', [['quiet', '2']]],
      [2, 'A', 'a place for play', [['play', '1']]], [2, 'B', 'space for walking and resting', [['walking', '2'], ['resting', '2']]]
    ]) {
      await checkPointSentence(page.locator(`#bonusEvidence-${number} [data-bonus-evidence="${picture}"] .bonus-takeaway strong`), phrase, marks);
    }
  } finally {
    await browser.close();
  }
});

test('the placed hamburger layers keep their colors and become the learner’s two-paragraph essay', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1050 } });
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'burger-lab.html')).href);
    const advanced = page.locator('[data-case-version="advanced"]');
    await page.locator('#step-6').click();
    await advanced.locator(':scope > summary').click();
    assert.equal(await advanced.locator('p[lang="en"]').count(), 0);
    await page.locator('#step-1').click();
    await page.locator('[data-opening-choice="pattern"][value="contrast"]').check();
    await page.locator('[data-opening-choice="focus"][value="features"]').check();
    await page.locator('[data-opening-place]').click();
    await page.locator('#step-2').click();
    for (const picture of ['A', 'B']) {
      await page.locator(`[data-switch="sentence"][data-value="${picture}"]`).first().click();
      await page.locator('[data-model-preset]').click();
      await page.locator('[data-model-fuse]').click();
      await page.locator('[data-model-adopt]').click();
    }
    await page.locator('[data-bonus-toggle]').click();
    await page.locator('[data-bonus-reveal="1"]').click();
    await page.locator('[data-bonus-adopt="1"]').click();
    const bottom = page.locator('#liveBurger .layer.bottom .user-content');
    await checkPointSentence(bottom, 'Overall, Picture A shows a lively park, while Picture B shows a quiet one.',
      [['lively', '1'], ['quiet', '2']]);
    const screenshotDir = process.env.BURGER_LAB_SCREENSHOT_DIR;
    if (screenshotDir) await page.locator('#liveBurger .burger-card').screenshot({ path: path.join(screenshotDir, 'first-hamburger.png') });
    const first = (await page.locator('#liveBurger [data-burger-sentence] .user-content').allInnerTexts()).join(' ');

    await page.locator('#step-3').click();
    await page.locator('[data-route="B"]').check();
    await page.locator('[data-stance-material][value="model-where-trees"]').check();
    await page.locator('[data-stance-starter="perspective"]').check();
    await page.locator('[data-stance-place]').click();
    const stance = await page.locator('#stanceSentence').innerText();
    await page.locator('#step-4').click();
    const points = [];
    const translations = [];
    for (const [slot, why] of [[1, 'friends'], [2, 'active']]) {
      await page.locator(`[data-support-slot="${slot}"]`).click();
      await page.locator(`[data-support-why][value="${why}"]`).check();
      await page.locator('[data-point-preset]').click();
      if (slot === 2) await page.locator('[data-point-mode="explain"]').check();
      points.push(await page.locator('#pointSentencePreview').innerText());
      translations.push(await page.locator('#pointSentenceTranslation').innerText());
      await page.locator('[data-support-place]').click();
    }
    await page.locator('#step-5').click();
    for (const slot of [1, 2]) await page.locator(`[data-ending-phrase="${slot}"][value="1"]`).check();
    await page.locator('[data-ending-place]').click();
    const ending = 'To sum up, my ideal park would offer space to get together with friends and get some exercise by walking.';
    const phrases = [['get together with friends', '1'], ['get some exercise by walking', '2']];
    await checkPointSentence(bottom, ending, phrases);
    if (screenshotDir) await page.locator('#liveBurger .burger-card').screenshot({ path: path.join(screenshotDir, 'second-hamburger.png') });
    await page.reload();
    await checkPointSentence(bottom, ending, phrases);
    await page.locator('#step-6').click();
    await advanced.locator(':scope > summary').click();
    const english = advanced.locator('p[lang="en"]');
    assert.equal(await english.count(), 2);
    assert.equal(await english.first().innerText(), first);
    const second = await english.nth(1).innerText();
    assert.ok(second.startsWith(stance) && second.endsWith(ending));
    for (const point of points) assert.ok(second.includes(point), point);
    await advanced.locator('details > summary').click();
    const chinese = advanced.locator('p[lang="zh-Hant"]');
    assert.equal(await chinese.count(), 2);
    const translated = await chinese.nth(1).innerText();
    for (const text of translations) assert.ok(translated.includes(text), text);
    if (screenshotDir) await advanced.screenshot({ path: path.join(screenshotDir, 'learner-case-essay.png') });
    await page.reload();
    await advanced.locator(':scope > summary').click();
    assert.deepEqual(await english.allInnerTexts(), [first, second]);
  } finally {
    await browser.close();
  }
});

test('the lesson uses consistent point backgrounds, example buttons and 5W1H colors', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'burger-lab.html')).href);

    const backgrounds = {
      body: 'rgb(246, 244, 237)',
      '.card': 'rgb(255, 254, 251)',
      '.burger-card': 'rgb(246, 245, 237)',
      '#confirm': 'rgb(52, 98, 79)',
      '.layer.top': 'rgb(239, 205, 134)',
      '.layer.meat': pointBackgrounds[1],
      '.layer.leaf': pointBackgrounds[2],
      '.layer.bottom': 'rgb(236, 211, 160)'
    };
    for (const [selector, expected] of Object.entries(backgrounds)) {
      const element = page.locator(selector).first();
      assert.ok(await element.isVisible(), selector);
      assert.equal(await element.evaluate(el => getComputedStyle(el).backgroundColor), expected, selector);
    }
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).color), 'rgb(37, 59, 54)');

    await page.locator('#step-1').click();
    const presetBackground = el => getComputedStyle(el).backgroundColor;
    const orange = 'rgb(255, 226, 198)';
    assert.equal(await page.locator('[data-model-preset]').evaluate(presetBackground), orange);
    assert.equal(await page.locator('[data-model-opening-adopt]').evaluate(presetBackground), orange);
    assert.equal(await page.locator('.material-workbench').evaluate(presetBackground), backgrounds['.layer.meat']);
    await page.locator('[data-reveal-all]').click();
    for (const [category, expected] of Object.entries(categoryColors)) {
      const answer = page.locator(`[data-category-card="${category}"] .category-answer`);
      assert.ok(await answer.isVisible(), category);
      const actual = await answer.evaluate(el => {
        const style = getComputedStyle(el);
        return [style.backgroundColor, style.borderTopColor];
      });
      assert.deepEqual(actual, expected, category);
    }
    await page.getByRole('button',{name:'觀察圖 B',exact:true}).click();
    assert.equal(await page.locator('.material-workbench').evaluate(presetBackground), backgrounds['.layer.leaf']);
    await page.locator('#step-2').click();
    assert.equal(await page.locator('[data-model-preset]').evaluate(presetBackground), orange);
    await page.locator('#step-4').click();
    await page.locator('[data-support-why][value="relax"]').check();
    assert.equal(await page.locator('[data-point-preset]').evaluate(presetBackground), orange);
    assert.equal(await page.locator('#supportPart').evaluate(presetBackground), backgrounds['.layer.meat']);
    await page.locator('[data-support-slot="2"]').click();
    assert.equal(await page.locator('#supportPart').evaluate(presetBackground), backgrounds['.layer.leaf']);
    await page.locator('#step-6').click();
    await page.locator('[data-case-version="basic"] summary').click();
    const paragraphs=page.locator('[data-case-version="basic"] p[lang]');
    assert.equal(await paragraphs.count(), 4);
    for(const paragraph of await paragraphs.all()){
      assert.ok(await paragraph.isVisible());
      assert.deepEqual(await paragraph.locator('.essay-point').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).backgroundColor)),
        [backgrounds['.layer.meat'],backgrounds['.layer.leaf']]);
    }
  } finally {
    await browser.close();
  }
});

test('the material and fusion toggles keep focus, selections, and independently placed picture sentences', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'burger-lab.html')).href);
    await page.locator('#step-1').click();
    const toggle = page.locator('[data-reveal-all]');
    const when = page.locator('[data-category-pick="When"]');
    const visible = page.locator('.category-answer[aria-hidden="false"]');
    await when.check();
    assert.equal(await visible.count(), 1);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await visible.count(), 6);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Space');
    assert.equal(await visible.count(), 0);
    assert.equal(await page.locator('.category-answer[inert]').count(), 6);
    assert.equal(await when.isChecked(), true);
    assert.equal(await toggle.evaluate(el => document.activeElement === el), true);
    assert.equal(await page.getByText('範例來源備註', { exact: true }).count(), 0);
    await page.locator('#step-2').click();
    for (const picture of ['A', 'B']) {
      await page.locator('[data-switch="sentence"][data-value="' + picture + '"]').first().click();
      await page.locator('[data-model-preset][data-picture="' + picture + '"]').click();
      const fuse = page.locator('[data-model-fuse][data-picture="' + picture + '"]');
      const output = page.locator('#modelOutput-' + picture);
      await fuse.focus();
      await page.keyboard.press('Enter');
      assert.equal(await fuse.getAttribute('aria-expanded'), 'true');
      const sentence = await output.innerText();
      await page.locator('[data-model-adopt][data-picture="' + picture + '"]').click();
      await fuse.focus();
      await page.keyboard.press('Space');
      assert.equal(await output.isVisible(), false);
      assert.equal(await fuse.getAttribute('aria-expanded'), 'false');
      assert.equal(await fuse.evaluate(el => document.activeElement === el), true);
      const layer = page.locator('[data-burger-sentence="' + picture.toLowerCase() + 'En"] .user-content');
      assert.equal(await layer.innerText(), sentence);
      await page.keyboard.press('Enter');
      assert.equal(await output.innerText(), sentence);
    }
    assert.equal(await page.getByText('範例來源備註', { exact: true }).count(), 0);
  } finally {
    await browser.close();
  }
});

test('the fifth step synchronizes all six material panels and returns to a saved second point', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(5000);
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'burger-lab.html')).href);
    await page.locator('#step-4').click();
    const slot = number => page.locator('[data-support-slot="' + number + '"]');
    const reason = value => page.locator('[data-support-why][value="' + value + '"]');
    const groups = page.locator('[data-point-materials] .point-material-group');
    const toggleAll = page.locator('[data-point-toggle-all]');
    const nextSlot = page.locator('[data-support-next-slot]');
    const preset = page.locator('[data-point-preset]');
    const place = page.locator('[data-support-place]');
    const preview = page.locator('#pointSentencePreview');
    const checked = () => page.locator('[data-point-material]:checked').evaluateAll(inputs =>
      inputs.map(input => input.dataset.pointMaterial).sort());
    async function checkPanels(openCount) {
      const expectedAction = openCount === 6 ? /收|關|摺疊/ : /開/;
      await toggleAll.filter({ hasText: expectedAction }).waitFor({ state: 'visible' });
      assert.equal(await groups.count(), 6);
      assert.equal(await groups.evaluateAll(panels => panels.filter(panel => panel.open).length), openCount);
      assert.equal(await toggleAll.getAttribute('aria-expanded'), String(openCount === 6));
    }

    await slot(2).click();
    await reason('family').check();
    await preset.click();
    const secondPicks = await checked();
    const secondSentence = await preview.innerText();
    await place.click();
    assert.equal(await nextSlot.isVisible(), false, 'the second point has no onward shortcut to itself');
    await slot(1).click();
    await reason('active').check();
    await checkPanels(0);
    await toggleAll.click();
    await checkPanels(6);
    await toggleAll.click();
    await checkPanels(0);
    await groups.first().locator('summary').click();
    await checkPanels(1);
    await toggleAll.click();
    await checkPanels(6);
    await groups.last().locator('summary').click();
    await checkPanels(5);
    await groups.last().locator('summary').click();
    await checkPanels(6);
    await preset.click();
    await checkPanels(3);
    const firstPicks = await checked();
    await toggleAll.click();
    await checkPanels(6);
    await toggleAll.click();
    await checkPanels(0);
    assert.deepEqual(await checked(), firstPicks, 'expanding and collapsing keeps checked materials');

    assert.equal(await nextSlot.isVisible(), false);
    assert.match(await place.innerText(), /放進漢堡\s*·\s*重點一/);
    await place.click();
    await nextSlot.waitFor({ state: 'visible' });
    assert.match(await nextSlot.innerText(), /重新前進重點二/);
    assert.match(await nextSlot.innerText(), /[➜→]/);
    await nextSlot.click();
    assert.equal(await slot(2).getAttribute('aria-pressed'), 'true');
    assert.equal(await slot(2).evaluate(button => button === document.activeElement), true);
    assert.equal(await reason('family').isChecked(), true);
    assert.deepEqual(await checked(), secondPicks);
    assert.equal(await preview.innerText(), secondSentence);
    assert.equal(await nextSlot.isVisible(), false);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

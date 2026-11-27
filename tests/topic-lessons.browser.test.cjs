'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const homepage = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const steps = ['主架構', '找特點', '組句子', '選立場', '想理由或情境', '結尾', '案例文章'];
const topics = [
  { id: 'robot', title: /機器人/, sentence: 'I sometimes snap at my friend after a difficult math test.' },
  { id: 'marketing', title: /飢餓行銷/, sentence: 'The first shoe store releases only twelve pairs on Friday.' },
  { id: 'disaster', title: /災害/, sentence: 'A woman carries her schoolbag above the muddy water.' }
];

test('each exercise has fifteen distinct openings and two staged comparisons', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  for (const { id } of topics) {
    const sandbox = vm.createContext({ window: {} });
    for (const name of ['topic-material-data', 'topic-' + id, 'topic-support-data', 'topic-second']) {
      const file = path.resolve(__dirname, '..', name + '.js');
      vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox);
    }
    const topic = sandbox.window.sevenLessons[id];
    for (const track of topic.tracks) {
      assert.equal(track.focuses.length, 3);
      assert.equal(track.openings.length, 5);
      const examples = track.openings.flatMap(row => row.examples);
      assert.equal(new Set(examples.map(line => line.en)).size, 15);
      for (const row of track.openings) for (const line of row.examples) {
        assert.equal(line.parts.map(part => part.text).join(''), line.en);
        assert.equal(line.parts.filter(part => part.slot).length, row.template.split('...').length - 1, line.en);
      }
      assert.equal(new Set(examples.map(line => line.zh)).size, 15);
      for (const pattern of track.openings) assert.ok(pattern.label && pattern.template && pattern.examples.length === 3);
      for (const [side, group] of track.groups.entries()) {
        assert.equal(group.materials.length, side ? 17 : 15);
        assert.ok(group.model.en.split(/[.!?]+/).filter(s => s.trim()).length >= 2);
        for (const role of ['Where', 'What']) {
          assert.ok(group.materials.some(item => item.wh === role && group.combined.en.toLowerCase().includes(item.en.toLowerCase())));
        }
        for (const role of ['Where','Who','What','When','Why','How']) {
          const items = group.materials.filter(m => m.wh === role);
          assert.ok(items.length >= 2 && items.length <= 4);
          if (['Where','Who','What','How'].includes(role)) assert.ok(items.some(m => m.original));
        }
        for (const [i, m] of group.materials.entries()) {
          assert.equal(m.id, (side === 0 ? 'A-' : 'B-') + i);
          const term = m.en.toLowerCase();
          assert.ok(m.sentence.en.toLowerCase().includes(term), term);
          assert.ok(m.sentence.zh && m.zh);
          if (m.original) assert.ok(group.model.en.toLowerCase().includes(term), term);
          const scene = sandbox.window.TopicSupportGrammar.scene({ id }, [{ ...m, group: side }]);
          assert.ok(scene.zh && scene.marks.some(mark => mark.id === m.id && scene.en.toLowerCase().includes(mark.en.toLowerCase())), m.id);
        }
      }
      assert.equal(track.bonuses.length, 2);
      for (const bonus of track.bonuses) {
        assert.ok(bonus.why && bonus.en && bonus.zh);
        assert.ok(track.groups[0].model.en.includes(bonus.a.en));
        assert.ok(track.groups[1].model.en.includes(bonus.b.en));
      }
      for (const [stance] of track.stances.entries()) {
        const paragraph = sandbox.window.TopicSecond.basic({ id, topic, track, plan: { stance } });
        assert.equal(paragraph.length, 4);
        for (const line of paragraph) assert.ok(line.en && line.zh && !/undefined|\[object Object\]/.test(line.en + line.zh));
      }
    }
  }
});
async function openEnclosingDetails(control) {
  const closed = control.locator('xpath=ancestor::details[not(@open)]');
  while (await closed.count()) {
    await closed.first().locator(':scope > summary').click();
  }
}

async function openTopic(page, title) {
  await page.locator('#lesson-picker').getByRole('link', { name: title }).click();
  const lesson = page.frameLocator('#learn iframe');
  await lesson.getByRole('heading', { name: title, level: 1 }).waitFor();
  const tabs = lesson.locator('#lessonNav').getByRole('tab');
  assert.equal(await tabs.count(), steps.length);
  for (const [i, label] of steps.entries()) {
    assert.ok((await tabs.nth(i).innerText()).includes(label), label);
  }
  return lesson;
}

async function confirmStep(lesson, index) {
  assert.equal(await lesson.locator('#step-' + index).getAttribute('aria-selected'), 'true');
  await lesson.locator('#confirm').click();
  assert.equal(await lesson.locator('#progress').evaluate(el => el.value), index + 1,
    steps[index] + ' records the completed work');
  if (index < steps.length - 1) await lesson.locator('#next').click();
}

async function completeLesson(lesson, topic) {
  const english = 'p[lang="en"]';
  await lesson.locator('#step-6').click();
  assert.equal(await lesson.locator('#myEssay').locator(english).count(), 0);
  await lesson.locator('#step-0').click();
  assert.equal(await lesson.locator('#progress').evaluate(el => el.value), 0);
  await lesson.locator('input[name="task"][value="0"]').check();
  await confirmStep(lesson, 0);

  const patterns = lesson.locator('[data-opening-choice="pattern"]');
  const focuses = lesson.locator('[data-opening-choice="focus"]');
  assert.equal(await patterns.count(), 5);
  assert.equal(await focuses.count(), 3);
  const preview = lesson.locator('.opening-result p[lang="en"]');
  const openings = new Set();
  for (const i of [0, 1, 2, 3, 4]) {
    await patterns.nth(i).check();
    for (const j of [0, 1, 2]) {
      await focuses.nth(j).check();
      openings.add(await preview.innerText());
    }
  }
  assert.equal(openings.size, 15);
  const opening = await preview.innerText();
  await lesson.locator('[data-opening-place]').click();

  const roles = ['Where', 'What', 'Who', 'When', 'Why', 'How'];
  for (const side of ['A', 'B']) {
    await lesson.locator('[data-switch="picture"][data-value="' + side + '"]').first().click();
    assert.equal(await lesson.locator('[data-category-card]').count(), roles.length);
    assert.equal(await lesson.locator('[data-category-pick]:checked').count(), 0);
    for (const role of roles) {
      const card = lesson.locator('[data-category-card="' + role + '"]');
      await card.locator('[data-category-reveal]').click();
      const pick = card.locator('[data-category-pick]');
      assert.equal(await pick.isChecked(), false, 'looking at a term leaves the selection to the student');
      await pick.check();
      assert.equal(await pick.isChecked(), true);
    }
    await lesson.locator('[data-model-preset]').click();
    assert.equal(await lesson.locator('[data-category-pick]:checked').count(), 4);
    await lesson.locator('[data-category-pick="When"]').check();
    await lesson.locator('[data-category-pick="Why"]').check();
  }
  await confirmStep(lesson, 1);
  const burgerLine = i => lesson.locator('#liveBurger [data-burger-layer="' + i + '"] .user-content');
  let secondModel;
  let sourceIds;
  for (const [index, side] of ['A', 'B'].entries()) {
    await lesson.locator('[data-switch="sentence"][data-value="' + side + '"]').first().click();
    assert.equal(await lesson.locator('[data-sentence-example]').count(), 7);
    const extra = lesson.locator('[data-example-adopt="combined"]').first();
    await openEnclosingDetails(extra);
    await extra.click();
    assert.ok(await burgerLine(index + 1).locator('mark[data-material-category="What"]').count() > 0);
    const selectors = lesson.locator('select[data-fusion-phrase]');
    assert.equal(await selectors.count(), 6);
    const choices = selectors.first().locator('option');
    const choice = await choices.last().getAttribute('value');
    await selectors.first().selectOption(choice);
    await lesson.locator('[data-selected-fuse]').click();
    await lesson.locator('[data-selected-adopt]').click();
    assert.ok(await burgerLine(index + 1).locator('mark[data-material-id="' + choice + '"]').count() > 0);
    const fuse = lesson.locator('[data-model-fuse]');
    await openEnclosingDetails(fuse);
    await fuse.click();
    await lesson.locator('[data-model-adopt]').click();
    const row = burgerLine(index + 1);
    assert.ok((await row.innerText()).length > 35);
    assert.ok(await row.locator('mark[data-material-category]').count() >= 4);
    if (index === 1) {
      secondModel = await row.innerText();
      sourceIds = await row.locator('mark').evaluateAll(marks => marks.map(mark => mark.dataset.materialId));
      assert.ok(sourceIds.length >= 4 && sourceIds.every(id => /^B-\d+$/.test(id)));
    }
  }
  await lesson.locator('#flipBurger').click();
  assert.ok(await lesson.locator('#liveBurger [data-material-category]').count() >= 8);
  await lesson.locator('#flipBurger').click();
  await lesson.locator('[data-switch="sentence"][data-value="A"]').first().click();
  const draft = lesson.locator('#field-group0');
  await openEnclosingDetails(draft);
  await draft.fill(topic.sentence);
  await lesson.locator('[data-custom-adopt]').click();
  assert.equal(await burgerLine(1).innerText(), topic.sentence);
  const bonusToggle = lesson.locator('[data-bonus-toggle]');
  await bonusToggle.click();
  const why = lesson.locator('[data-bonus-reveal]');
  assert.equal(await why.count(), 2);
  await why.first().click();
  await lesson.locator('[data-bonus-adopt]').first().click();
  const bonus = await burgerLine(3).innerText();
  await confirmStep(lesson, 2);
  const layer = i => lesson.locator('#liveBurger [data-burger-layer="' + i + '"] .user-content');
  await lesson.locator('[data-topic-stance]').first().check();
  assert.equal(await lesson.locator('[data-stance-starter]').count(), 3);
  await lesson.locator('[data-stance-material]').first().check();
  await lesson.locator('[data-stance-starter]').last().check();
  assert.equal(await layer(0).getAttribute('lang'), null);
  await lesson.locator('[data-stance-place]').click();
  const stance = await layer(0).innerText();
  await confirmStep(lesson, 3);
  const supports = [];
  for (const slot of [0, 1]) {
    if (slot) await lesson.locator('[data-support-slot="2"]').first().click();
    const reasons = lesson.locator('[data-support-why]');
    assert.equal(await reasons.count(), 5);
    await reasons.nth(slot).check();
    const groups = lesson.locator('#pointMaterialGroups details');
    assert.equal(await groups.count(), 6);
    await lesson.locator('[data-point-toggle-all]').click();
    assert.equal(await lesson.locator('#pointMaterialGroups details[open]').count(), 6);
    await lesson.locator('[data-point-preset]').click();
    await lesson.locator('[data-point-mode="explain"]').check();
    assert.equal(await layer(slot + 1).getAttribute('lang'), null);
    await lesson.locator('[data-support-place]').click();
    supports.push(await layer(slot + 1).innerText());
  }
  assert.notEqual(supports[0], supports[1]);
  await confirmStep(lesson, 4);
  const endingPhrases = [];
  for (const slot of [1, 2]) {
    const options = lesson.locator('[data-ending-phrase="' + slot + '"]');
    assert.equal(await options.count(), 2);
    await options.last().check();
    const chosen = await options.last().locator('xpath=ancestor::label').locator('[lang="en"]').textContent();
    endingPhrases.push(chosen.toLowerCase());
  }
  assert.equal(await layer(3).getAttribute('lang'), null);
  await lesson.locator('[data-ending-place]').click();
  const ending = await layer(3).innerText();
  for (const phrase of endingPhrases) assert.ok(ending.toLowerCase().includes(phrase), phrase);
  await confirmStep(lesson, 5);
  const advanced = lesson.locator('[data-case-version="advanced"]');
  await advanced.locator(':scope > summary').click();
  const paragraphs = await advanced.locator('p[lang="en"]').allTextContents();
  assert.equal(paragraphs.length, 2);
  for (const piece of [opening, topic.sentence, secondModel, bonus]) assert.ok(paragraphs[0].includes(piece));
  assert.ok(await advanced.locator('p[lang="en"] mark[data-material-category]').count() >= 4);
  const essayIds = await advanced.locator('p[lang="en"]').first().locator('mark').evaluateAll(marks =>
    marks.map(mark => mark.dataset.materialId));
  for (const id of sourceIds) assert.ok(essayIds.includes(id), 'selected source ' + id + ' reaches the essay');
  assert.equal(await advanced.locator('p[lang="en"] .essay-point[data-point-tone]').count(), 2);
  for (const piece of [stance, ...supports, ending]) assert.ok(paragraphs[1].includes(piece));
  for (const piece of [stance, ...supports, ending]) assert.ok(paragraphs[1].includes(piece), piece);
  assert.ok(await advanced.locator('mark[data-material-category]').count() > 0);
  assert.ok(await advanced.locator('.essay-point[data-point-tone]').count() >= 2);
  const basic = lesson.locator('[data-case-version="basic"]');
  assert.equal(await basic.locator('p[lang="en"]').count(), 2);
  assert.ok((await basic.locator('p[lang="en"]').allTextContents()).join(' ').split(/\s+/).length >= 120);
  await basic.locator('summary').filter({hasText: '中文對照'}).click();
  assert.equal(await basic.locator('p[lang="zh-Hant"]:visible').count(), 2);
  await confirmStep(lesson, 6);
}

test('all four lessons are reachable and the three new lessons build and retain separate seven-step essays', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 840 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(homepage);
    const picker = page.locator('#lesson-picker');
    assert.equal(await picker.getByRole('link').count(), 4);
    assert.match(await page.frameLocator('#learn iframe').locator('h1').innerText(), /公園/);
    const independent = 'I wrote this opening on my own in the writing workshop.';
    await page.locator('#tab-workshop').click();
    await page.locator('[data-load-topic="marketing"]').click();
    await page.locator('#writingP1').fill(independent);
    await page.locator('#tab-learn').click();
    for (const topic of topics) {
      const lesson = await openTopic(page, topic.title);
      await completeLesson(lesson, topic);
    }

    await page.reload();
    for (const topic of topics) {
      const lesson = await openTopic(page, topic.title);
      assert.equal(await lesson.locator('#progress').evaluate(el => el.value), 7);
      await lesson.locator('#step-6').click();
      const saved = await lesson.locator('#myEssay').textContent();
      assert.ok(saved.includes(topic.sentence));
      for (const other of topics.filter(other => other !== topic)) assert.ok(!saved.includes(other.sentence));
    }
    const robot = await openTopic(page, /機器人/);
    const route = async index => {
      await robot.locator('#step-1').click();
      await robot.locator('input[name="track"][value="' + index + '"]').check();
    };
    const routeOpenings = [];
    for (const index of [1, 2]) {
      await route(index);
      await robot.locator('#step-6').click();
      assert.equal(await robot.locator('#myEssay p[lang="en"]').count(), 0);
      await robot.locator('#step-1').click();
      await robot.locator('[data-opening-choice="pattern"]').nth(index).check();
      await robot.locator('[data-opening-choice="focus"]').first().check();
      const preview = await robot.locator('.opening-result p[lang="en"]').innerText();
      routeOpenings.push(preview);
      await robot.locator('[data-opening-place]').click();
    }
    assert.notEqual(routeOpenings[0], routeOpenings[1]);
    for (const index of [1, 2, 0]) {
      await route(index);
      await robot.locator('#step-6').click();
      const personal = await robot.locator('#myEssay').textContent();
      if (index !== 0) {
        assert.ok(personal.includes(routeOpenings[index - 1]));
        assert.ok(!personal.includes(topics[0].sentence));
      } else {
        assert.ok(personal.includes(topics[0].sentence));
        assert.equal(await robot.locator('#progress').evaluate(el => el.value), 7);
      }
    }
    const park = await openTopic(page, /公園/);
    assert.equal(await park.locator('#progress').evaluate(el => el.value), 0);
    await page.locator('#tab-workshop').click();
    await page.locator('[data-load-topic="marketing"]').click();
    assert.equal(await page.locator('#writingP1').inputValue(), independent);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('a lesson deep link, the picker and seven-step navigation work on a narrow screen', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 760 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(7000);
    await page.goto(homepage + '?lesson=marketing#lesson-picker');
    const lesson = page.frameLocator('#learn iframe');
    await lesson.getByRole('heading', { name: /飢餓行銷/, level: 1 }).waitFor();
    assert.ok(await page.locator('#lesson-picker').getByRole('link').evaluateAll(nodes =>
      nodes.every(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().right <= innerWidth + 1)));
    for (let i = steps.length - 1; i >= 0; i--) {
      await lesson.locator('#step-' + i).click();
      assert.equal(await lesson.locator('#step-' + i).getAttribute('aria-selected'), 'true');
      assert.ok(await lesson.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1), steps[i]);
    }
    await completeLesson(lesson, topics[1]);
    for (const i of [1, 2, 3, 4, 5, 6]) {
      await lesson.locator('#step-' + i).click();
      assert.ok(await lesson.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1), steps[i] + ' after composing');
    }
  } finally {
    await browser.close();
  }
});

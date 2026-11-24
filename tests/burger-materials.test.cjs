'use strict';

// Run with: node --test tests/burger-materials.test.cjs
// Executes the lesson's own script and event handlers. DOM stubs only supply
// browser plumbing; tablet layout and real controls are checked in the browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const KEY = 'stepwrite-burger-lab-b-v1';
const ORIGINAL_MODEL = {
  opening: 'The pictures show two different types of parks.',
  A: 'In Picture A, there is a colorful playground with slides and climbing frames. Children are playing in the playground, and the park looks lively.',
  B: 'In contrast, Picture B shows tall trees and a large green lawn. People can walk or rest under the trees, and the park looks quiet.'
};
const BONUS_SENTENCES = [
  'Overall, Picture A shows a lively park, while Picture B shows a quiet one.',
  'One park provides a place for play, while the other offers space for walking and resting.'
];
const lessonPath = path.join(__dirname, '..', 'burger-lab.html');
const html = fs.readFileSync(lessonPath, 'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(script => script.includes(KEY));
assert.ok(source, 'the standalone lesson contains its teaching script');

function element(tagName = 'div', attributes = {}, onFocus = () => {}) {
  const listeners = new Map();
  const classes = new Set();
  const children = new Map();
  const node = {
    tagName: tagName.toUpperCase(), attributes: { ...attributes }, dataset: {},
    id: attributes.id || '', name: attributes.name || '', type: attributes.type || '', value: attributes.value || '',
    checked: false, hidden: false, disabled: false, textContent: '', innerHTML: '',
    focusCalls: [], scrollCalls: [],
    src: 'data:image/png;base64,test-fixture',
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle(name, force) {
        const enabled = force === undefined ? !classes.has(name) : !!force;
        enabled ? classes.add(name) : classes.delete(name);
        return enabled;
      }
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
    addEventListener(name, listener) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(listener);
    },
    matches(selector) {
      const tag = selector.match(/^[a-z]+/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      const attributesToMatch = [...selector.matchAll(/\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]/g)];
      return attributesToMatch.every(([, name, value]) => this.hasAttribute(name)
        && (value === undefined || this.getAttribute(name) === value));
    },
    closest(selector) { return this.matches(selector) ? this : null; },
    querySelector(selector) {
      if (!children.has(selector)) children.set(selector, element('div', {}, onFocus));
      return children.get(selector);
    },
    querySelectorAll() { return []; },
    focus(options) { this.focusCalls.push(options); onFocus({ id: this.id, options }); },
    scrollIntoView(options) { this.scrollCalls.push(options); },
    dispatch(type, target = this, details = {}) {
      const event = { target, preventDefault() {}, ...details };
      return Promise.all((listeners.get(type) || []).map(listener => listener(event)));
    }
  };
  for (const [name, value] of Object.entries(attributes)) {
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      node.dataset[key] = value;
    }
  }
  return node;
}

function loadLesson(saved) {
  const nodes = new Map();
  const focusEvents = [];
  const recordFocus = event => focusEvents.push(event);
  const store = new Map(saved === undefined ? [] : [[KEY, JSON.stringify(saved)]]);
  const byId = id => {
    if (!nodes.has(id)) nodes.set(id, element('div', { id }, recordFocus));
    return nodes.get(id);
  };
  const context = vm.createContext({
    document: {
      getElementById: byId,
      querySelector: () => element('div', {}, recordFocus),
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value)
    },
    navigator: { clipboard: { writeText: async () => {} } },
    window: {}, console
  });
  const end = source.lastIndexOf('})();');
  assert.ok(end > 0, 'the lesson wraps state in its own closure');
  const exposed = `\nglobalThis.lesson = {
    get state() { return s; },
    qs, names, save, validate, navigate, materialItems, selectedMaterials,
    materialBox, materialSummary, materialList, stage1, stage2, stage3, stage4, handleMaterialAction,
    exampleBank, sentenceExamples, renderSentenceExamples, currentOpeningExample,
    MODEL_EXAMPLE, categoryPicksFor, categoryOpenFor, modelMissingCategories, modelFusionReady, renderSentenceParts,
    renderBonusSources: () => renderBonusSources(), burger, draftText
  };\n`;
  vm.runInContext(source.slice(0, end) + exposed + source.slice(end), context,
    { filename: lessonPath, timeout: 5000 });
  const app = context.lesson;
  const change = async (attributes, checked = true) => {
    const control = element('input', attributes, recordFocus);
    control.checked = checked;
    await byId('stage').dispatch('change', control);
  };
  const click = async attributes => {
    await byId('stage').dispatch('click', element('button', attributes, recordFocus));
  };
  const selectOpening = (group, value) => change({
    type: 'radio', name: group === 'pattern' ? 'openingPattern' : 'openingFocus',
    'data-opening-choice': group, value
  });
  return {
    app, byId, store, change, click, focusEvents,
    selectOpening,
    placeOpening: () => click({ 'data-opening-place': '' }),
    prepareOpening: async () => {
      await selectOpening('pattern', 'contrast');
      await selectOpening('focus', 'features');
      await click({ 'data-opening-place': '' });
    },
    writeField: async (key, value) => {
      const control = element('textarea', { 'data-field': key }, recordFocus);
      control.value = value;
      await byId('stage').dispatch('input', control);
    },
    pick: (category, checked = true) => change({ type: 'checkbox', 'data-category-pick': category,
      'data-picture': app.state.picture }, checked),
    reveal: category => click({ 'data-category-reveal': category, 'data-picture': app.state.picture }),
    revealAll: () => click({ 'data-reveal-all': '' }),
    modelPreset: () => click({ 'data-model-preset': '' }),
    fuse: picture => click({ 'data-model-fuse': '', 'data-picture': picture }),
    adopt: picture => click({ 'data-model-adopt': '', 'data-picture': picture }),
    adoptExample: async (picture, id, index = 0) => {
      const example = app.sentenceExamples(picture).find(item => item.id === id);
      assert.ok(example, `the selected materials offer ${picture}/${id}`);
      const button = [...app.stage2().matchAll(/<button\b[^>]*>/g)].some(([tag]) =>
        tag.includes(`data-example-adopt="${id}"`) && tag.includes(`data-picture="${picture}"`) &&
        tag.includes(`data-example-index="${index}"`));
      assert.ok(button, `the learner can choose ${picture}/${id}/${index}`);
      await click({ 'data-example-adopt': id, 'data-example-index': String(index), 'data-picture': picture });
      return id === 'combined' ? example.sentences.join(' ') : example.sentences[index];
    },
    toggleBonus: () => click({ 'data-bonus-toggle': '' }),
    revealBonus: number => click({ 'data-bonus-reveal': String(number) }),
    adoptBonus: number => click({ 'data-bonus-adopt': String(number) }),
    removeBonus: () => click({ 'data-bonus-remove': '' }),
    picture: value => click({ 'data-switch': 'picture', 'data-value': value }),
    sentencePicture: value => click({ 'data-switch': 'sentence', 'data-value': value }),
    stanceRoute: value => change({ type: 'radio', name: 'route', 'data-route': value, value }),
    stanceStarter: value => change({ type: 'radio', 'data-stance-starter': value, value }),
    stanceMaterial: (picture, value) => change({ type: 'radio', 'data-stance-material': '', 'data-picture': picture, value }),
    supportWhy: value => change({ type: 'radio', 'data-support-why': '', value }),
    pointMode: value => change({ type: 'radio', 'data-point-mode': value, value }),
    pointMaterial: (key, checked = true) => change({ type: 'checkbox', 'data-point-material': key, value: key }, checked),
    pointPreset: () => click({ 'data-point-preset': '' }),
    supportSlot: number => click({ 'data-support-slot': String(number) }),
    placeSupport: () => click({ 'data-support-place': '' }),
    snapshot: () => JSON.parse(store.get(KEY))
  };
}

const plain = value => JSON.parse(JSON.stringify(value));
const readableHtml = value => value
  .replace(/<(?:br|hr)\b[^>]*>|<\/(?:p|div|li|ol|ul|section|h[1-6]|button|label|fieldset|legend|article|aside|details|summary)>/gi, ' ')
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const phraseWords = value => (value.toLowerCase().match(/[a-z]+/g) || [])
  .filter(word => word.length > 2 && !['the', 'and', 'with', 'some', 'can', 'could', 'might',
    'would', 'for', 'from', 'their', 'this', 'that', 'there', 'are'].includes(word))
  .map(word => word.replace(/ies$/, 'y').replace(/s$/, ''));

test('both opening choices are required, and all fifteen pairs preview distinct bilingual sentences', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  const initial = lesson.app.stage1();
  const patterns = {
    contrast: /^Although both pictures depict\b.+,\s*they present two contrasting\b/i,
    activity: /^The two pictures illustrate different ways in which people\b/i,
    approaches: /^When it comes to\b.+,\s*people may have different approaches,\s*as illustrated in the two pictures\./i,
    trend: /^In recent years, .+ has become increasingly common in our daily lives\.$/,
    attitudes: /^In our daily lives, we often encounter situations that reflect different attitudes toward .+\.$/
  };
  const focuses = {
    features: { en: /design|features?|facilit(?:y|ies)|equipment|landscape/i, zh: /設計|特色|設施|景觀/ },
    activities: { en: /spend(?:ing)?|activities|play(?:ing)?|walk(?:ing)?|games?|picnics?/i, zh: /活動|度過|玩|散步|遊戲|野餐/ },
    atmosphere: { en: /atmosphere|lively|peaceful|mood/i, zh: /氛圍|氣氛|熱鬧|寧靜/ }
  };
  const radios = [...initial.matchAll(/<input\b[^>]*>/g)].map(match => match[0])
    .filter(tag => tag.includes('data-opening-choice='));
  assert.equal(radios.length, 8);
  for (const [group, values] of [['pattern', Object.keys(patterns)], ['focus', Object.keys(focuses)]]) {
    const name = group === 'pattern' ? 'openingPattern' : 'openingFocus';
    const inputs = radios.filter(tag => tag.includes('data-opening-choice="' + group + '"'));
    assert.deepEqual(inputs.map(tag => tag.match(/\bvalue="([^"]+)"/)?.[1]), values,
      group + ' choices retain their displayed order');
    for (const radio of inputs) {
      assert.match(radio, /\btype="radio"/);
      assert.ok(radio.includes('name="' + name + '"'));
      assert.doesNotMatch(radio, /\bchecked\b/);
    }
  }
  const initialText = readableHtml(initial);
  assert.ok(initialText.includes('In recent years, [某種現象] has become increasingly common in our daily lives.'));
  assert.ok(initialText.includes('In our daily lives, we often encounter situations that reflect different attitudes toward [主題].'));
  assert.doesNotMatch(initial, /data-opening-reveal|name="common-theme"/);
  assert.equal(lesson.app.currentOpeningExample(), null);
  await lesson.placeOpening();
  assert.equal(lesson.app.state.f.openEn, undefined);
  const partialScreens = [initial];
  for (const [group, value] of [['focus', 'activities'], ['pattern', 'approaches']]) {
    const partial = loadLesson();
    partial.app.navigate(1, false);
    await partial.selectOpening(group, value);
    assert.equal(partial.app.currentOpeningExample(), null);
    await partial.placeOpening();
    assert.equal(partial.app.state.f.openEn, undefined, 'either choice alone cannot place an opening');
    partialScreens.push(partial.app.stage1());
    await partial.selectOpening(group === 'focus' ? 'pattern' : 'focus',
      group === 'focus' ? 'approaches' : 'activities');
    assert.ok(partial.app.currentOpeningExample(), 'either group can be selected first');
  }

  const english = new Set();
  const translations = new Set();
  for (const [pattern, structure] of Object.entries(patterns)) {
    await lesson.selectOpening('pattern', pattern);
    for (const [focus, vocabulary] of Object.entries(focuses)) {
      await lesson.selectOpening('focus', focus);
      const { en, zh } = lesson.app.currentOpeningExample();
      assert.match(en, structure);
      assert.match(en, vocabulary.en);
      assert.match(zh, vocabulary.zh);
      if (pattern === 'trend') assert.match(zh, /近[幾些]?年.*(?:普遍|常見|常有)/);
      if (pattern === 'attitudes') assert.match(zh, /日常.*(?:看法|態度|觀點)/);
      assert.match(en, /\.$/);
      assert.doesNotMatch(en, /[\[\]＿]/, 'all sentence blanks must be filled');
      const shown = readableHtml(lesson.app.stage1());
      assert.ok(shown.includes(en) && shown.includes(zh), pattern + '/' + focus);
      english.add(en);
      translations.add(zh);
    }
  }
  assert.equal(english.size, 15, 'each focus changes the English preview for every structure');
  assert.equal(translations.size, 15, 'the Chinese rendering follows both choices');
  for (const partial of partialScreens) {
    const text = readableHtml(partial);
    for (const sentence of [...english, ...translations]) assert.ok(!text.includes(sentence),
      'a complete example is absent until both inputs have been selected');
  }
  assert.equal(lesson.app.state.f.openEn, undefined, 'previewing every pair leaves the draft blank');
});

test('switching the preview survives reload and leaves the hamburger untouched until placement', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  lesson.app.state.f.endingEn = 'My saved ending.';
  lesson.app.state.placed.endingEn = true;
  lesson.app.state.done = [true, false, false, true, true, false, false];
  lesson.app.state.checks = { support: true };
  const before = plain(lesson.app.state);
  await lesson.selectOpening('pattern', 'activity');
  await lesson.picture('B');
  const restored = loadLesson(lesson.snapshot());
  assert.equal(restored.app.state.openingPattern, 'activity');
  assert.equal(restored.app.currentOpeningExample(), null, 'reload keeps a partial choice partial');
  await restored.selectOpening('focus', 'activities');
  const original = restored.app.currentOpeningExample().en;
  await restored.selectOpening('focus', 'atmosphere');
  const revised = restored.app.currentOpeningExample().en;
  assert.notEqual(original, revised);
  assert.ok(!readableHtml(restored.app.stage1()).includes(original));
  assert.ok(!readableHtml(restored.byId('liveBurger').innerHTML).includes(revised));
  for (const key of ['f', 'placed', 'done', 'checks', 'categoryPicks']) {
    assert.deepEqual(plain(restored.app.state[key]), before[key], 'preview leaves ' + key + ' unchanged');
  }
  for (const picture of ['A', 'B']) for (const [category] of restored.app.qs) {
    assert.equal(!!restored.app.state.categoryOpen[picture][category], !!before.categoryOpen[picture][category]);
  }

  const reloaded = loadLesson(restored.snapshot());
  assert.equal(reloaded.app.currentOpeningExample().en, revised);
  await reloaded.placeOpening();
  assert.equal(reloaded.app.state.f.openEn, revised);
  assert.equal(reloaded.app.state.placed.openEn, true);
  assert.equal(reloaded.app.state.layer, 0);
  assert.ok(readableHtml(reloaded.byId('liveBurger').innerHTML).includes(revised));
  assert.deepEqual(plain(reloaded.app.state.categoryPicks), before.categoryPicks);
  assert.equal(reloaded.app.state.f.endingEn, before.f.endingEn);
  assert.equal(reloaded.app.state.placed.endingEn, true);

  await reloaded.selectOpening('pattern', 'contrast');
  assert.notEqual(reloaded.app.currentOpeningExample().en, revised);
  assert.equal(reloaded.app.state.f.openEn, revised, 'changing a pattern after placement keeps the accepted sentence');
  assert.equal(reloaded.app.state.placed.openEn, true);
  assert.ok(readableHtml(reloaded.byId('liveBurger').innerHTML).includes(revised));
});

function reviewFocusBoxes(screen) {
  const grid = screen.match(/<dl\b[^>]*class="opening-focus-grid"[^>]*>([\s\S]*?)<\/dl>/);
  return grid ? [...grid[1].matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/g)]
    .map(([, label, choice]) => [readableHtml(label), readableHtml(choice)]) : [];
}

test('selection requires a placed opening and both pictures before the sentence step reviews the chosen example', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.pick('Where');
  await lesson.picture('B');
  await lesson.pick('What');
  assert.notEqual(lesson.app.validate(), '', 'both picture selections alone cannot complete this step');
  await lesson.selectOpening('pattern', 'approaches');
  await lesson.selectOpening('focus', 'atmosphere');
  const preview = lesson.app.currentOpeningExample().en;
  assert.notEqual(lesson.app.validate(), '', 'the shown sentence still needs explicit placement');
  await lesson.placeOpening();
  assert.equal(lesson.app.validate(), '', 'an opening plus one category in each picture is sufficient');
  await lesson.pick('What', false);
  assert.notEqual(lesson.app.validate(), '', 'removing the only B category requires choosing materials again');
  await lesson.pick('What');
  await lesson.click({ 'data-material-next': '' });
  assert.equal(lesson.app.state.active, 2);
  assert.equal(lesson.app.state.done[1], true);
  const screen = lesson.app.stage2();
  assert.match(readableHtml(screen), /回頭看第二關描寫開頭/);
  assert.deepEqual(reviewFocusBoxes(screen), [
    ['萬用句型', '先點出主題，再引入兩張圖'], ['比較重點', '公園氛圍']
  ]);
  assert.match(readableHtml(screen), /簡易示範/);
  assert.ok(readableHtml(screen).includes(preview));
  assert.ok(readableHtml(screen).includes(lesson.app.currentOpeningExample().zh));
  assert.doesNotMatch(screen, /data-field="openEn"|data-place="openEn"/);
});

test('the step-two shortcut places the case opening without changing the selected pattern or focus', async () => {
  const lesson=loadLesson();
  lesson.app.navigate(1,false);
  const action=lesson.app.stage1().match(/<button\b[^>]*data-model-opening-adopt[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(action && action.includes('class="btn preset"') && action.includes('第 07 關'));
  await lesson.click({'data-model-opening-adopt':''});
  assert.equal(lesson.app.state.f.openEn,ORIGINAL_MODEL.opening);
  assert.equal(lesson.app.state.placed.openEn,true);
  assert.equal(lesson.app.currentOpeningExample(),null,'the preset does not invent manual selections');
  assert.ok(readableHtml(lesson.byId('openingPreview').innerHTML).includes(ORIGINAL_MODEL.opening));
  assert.ok(readableHtml(lesson.byId('liveBurger').innerHTML).includes(ORIGINAL_MODEL.opening));
  assert.equal(lesson.byId('openingModelPreset').getAttribute('aria-pressed'),'true');
  const basic=lesson.app.stage2().match(/<div id="openingChoiceReview">([\s\S]*?)<details/)[1];
  assert.ok(readableHtml(basic).includes(ORIGINAL_MODEL.opening));
  assert.doesNotMatch(basic, /opening-focus-grid|寫作重點|<dt>/, 'the case opening alone has no selection boxes');
  for (const [group, value, expected] of [
    ['pattern', 'contrast', ['萬用句型', '先找共同點，再帶出對比']],
    ['focus', 'atmosphere', ['比較重點', '公園氛圍']]
  ]) {
    const partial = loadLesson(lesson.snapshot());
    await partial.selectOpening(group, value);
    assert.deepEqual(reviewFocusBoxes(partial.app.stage2()), [expected], 'only the actual choice receives a box');
  }
  await lesson.selectOpening('pattern','contrast');
  await lesson.selectOpening('focus','atmosphere');
  const alternate=lesson.app.currentOpeningExample().en;
  await lesson.placeOpening();
  assert.equal(lesson.app.state.f.openEn,alternate);
  assert.equal(lesson.byId('openingModelPreset').getAttribute('aria-pressed'),'false');
  await lesson.click({'data-model-opening-adopt':''});
  const restored=loadLesson(lesson.snapshot());
  assert.equal(restored.app.state.f.openEn,ORIGINAL_MODEL.opening);
  assert.equal(restored.app.currentOpeningExample().en,alternate);
  restored.app.navigate(2,false);
  const review=restored.app.stage2().match(/<section class="card opening-review">([\s\S]*?)<\/section>/)[1];
  const [visible,simple]=review.split('<details');
  assert.deepEqual(reviewFocusBoxes(visible), [
    ['萬用句型', '先找共同點，再帶出對比'], ['比較重點', '公園氛圍']
  ]);
  assert.ok(visible.includes('開頭例句'));
  assert.ok(readableHtml(visible).includes(alternate));
  assert.doesNotMatch(simple.split('>')[0],/\bopen\b/);
  assert.ok(simple.includes('簡易示範') && simple.includes(ORIGINAL_MODEL.opening));
  await restored.click({'data-reviewed-opening-adopt':''});
  assert.equal(restored.app.state.f.openEn,alternate);
  assert.equal(restored.app.state.placed.openEn,true);
  assert.ok(readableHtml(restored.byId('liveBurger').innerHTML).includes(alternate));
});

test('previous opening sentences survive choices and reloads and can be kept without making new choices', async () => {
  const oldSentence = 'Each park has something special to offer.';
  const oldState = {
    materialVersion: 4, openingRevealed: 3, active: 1, done: [true, true, true, true, true, true],
    f: { openEn: oldSentence, aEn: 'Children can play here.', stanceEn: 'I prefer a natural park.',
      reason1En: 'Trees give me shade.', reason2En: 'I walk by the pond after school.' },
    placed: { openEn: true, aEn: true, stanceEn: true, reason1: true, reason2: true },
    categoryPicks: { A: ['Where', 'What'], B: ['Where'] },
    categoryOpen: { A: { Where: true, What: true }, B: { Where: true } },
    picture: 'A', sentence: 'A', checks: { both: true, support: true, new: true }
  };
  const lesson = loadLesson(oldState);
  assert.equal(lesson.app.currentOpeningExample(), null, 'legacy reveals do not fabricate two new choices');
  assert.deepEqual(plain(lesson.app.state.f), oldState.f);
  assert.deepEqual(plain(lesson.app.state.placed), oldState.placed);
  assert.deepEqual(plain(lesson.app.state.categoryPicks), oldState.categoryPicks);
  assert.equal(lesson.app.validate(), '', 'an already placed personal opening remains valid');
  const before = plain(lesson.app.state);
  await lesson.selectOpening('pattern', 'activity');
  await lesson.selectOpening('focus', 'features');
  const preview = lesson.app.currentOpeningExample().en;
  for (const key of ['f', 'placed', 'done', 'checks', 'categoryPicks', 'categoryOpen']) {
    assert.deepEqual(plain(lesson.app.state[key]), before[key], `selecting preserves existing ${key}`);
  }
  const restored = loadLesson(lesson.snapshot());
  assert.equal(restored.app.state.f.openEn, oldSentence);
  const screen = restored.app.stage1();
  assert.ok(readableHtml(screen).includes(oldSentence), 'the old opening remains visible for comparison');
  const replacement = screen.match(/<button\b[^>]*data-opening-place\b[^>]*>([\s\S]*?)<\/button>/)?.[1];
  assert.ok(replacement && /改用/.test(readableHtml(replacement)),
    'the actual replacement button explicitly says it will change the existing opening');
  await restored.placeOpening();
  assert.equal(restored.app.state.f.openEn, preview);
  assert.equal(restored.app.state.placed.openEn, true);
  assert.equal(restored.app.state.f.aEn, oldState.f.aEn);
  assert.equal(restored.app.state.f.stanceEn, oldState.f.stanceEn);
  assert.deepEqual(plain(restored.app.state.categoryPicks), oldState.categoryPicks);
  assert.deepEqual(plain(restored.app.state.done), [true, false, false, true, true, true, false],
    'placing a replacement in the materials step resets only its dependent confirmations');

  const unplaced = loadLesson({ ...oldState, placed: { ...oldState.placed, openEn: false } });
  assert.equal(unplaced.app.currentOpeningExample(), null);
  assert.match(unplaced.app.stage1(), /data-opening-keep/);
  await unplaced.click({ 'data-opening-keep': '' });
  assert.equal(unplaced.app.state.f.openEn, oldSentence, 'keeping an old draft never substitutes the example');
  assert.equal(unplaced.app.state.placed.openEn, true);
  assert.equal(unplaced.app.validate(), '');

  const staleChoice = loadLesson({ ...oldState, openingPattern: 'retired-pattern', openingFocus: 'activities' });
  assert.equal(staleChoice.app.currentOpeningExample(), null);
  await staleChoice.placeOpening();
  assert.equal(staleChoice.app.state.f.openEn, oldSentence, 'an unrecognized saved choice cannot overwrite a draft');
  assert.equal(staleChoice.app.validate(), '');
});

test('the sentence step explains an empty review and can keep an unplaced opening from a previous draft', async () => {
  const saved = {
    active: 2, materialVersion: 4, supportVersion: 2,
    done: [true, true, false, true, true, true],
    f: { openEn: 'Each park has something special to offer.', aEn: 'A has swings.', bEn: 'B has shade.' },
    placed: { openEn: false, aEn: true, bEn: true },
    categoryPicks: { A: ['Where'], B: ['What'] }
  };
  const lesson = loadLesson(saved);
  const screen = lesson.app.stage2();
  assert.equal(lesson.app.currentOpeningExample(), null);
  assert.match(readableHtml(screen), /(?:還沒|未|沒有)[^。]{0,40}(?:選|試過)|(?:回|到)第\s*[二2]\s*關[^。]{0,35}選/);
  assert.ok(readableHtml(screen).includes(saved.f.openEn));
  assert.doesNotMatch(screen, /data-field="openEn"|data-place="openEn"/);
  assert.match(screen, /<button\b[^>]*\bdata-opening-keep\b/);
  assert.deepEqual(plain(lesson.app.state.f), saved.f);
  assert.equal(lesson.app.state.placed.openEn, false);
  await lesson.click({ 'data-opening-keep': '' });
  assert.equal(lesson.app.state.active, 2);
  assert.equal(lesson.app.state.placed.openEn, true);
  assert.deepEqual(plain(lesson.app.state.f), saved.f);
  assert.deepEqual(plain(lesson.app.state.categoryPicks), saved.categoryPicks);
  assert.deepEqual(plain(lesson.app.state.done), [...saved.done, false]);
  assert.equal(lesson.app.validate(), '');
  const restored = loadLesson(lesson.snapshot());
  assert.equal(restored.app.state.f.openEn, saved.f.openEn);
  assert.equal(restored.app.state.placed.openEn, true);
});

test('each picture has six category controls with fixed bilingual materials and explicit locations', () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  const categories = plain(lesson.app.qs.map(question => question[0]));
  assert.deepEqual([...categories].sort(), ['How', 'What', 'When', 'Where', 'Who', 'Why']);
  assert.equal(lesson.app.state.materialVersion, 4);
  assert.deepEqual(plain(lesson.app.state.categoryPicks), { A: [], B: [] });
  for (const picture of ['A', 'B']) {
    lesson.app.state.picture = picture;
    const items = plain(lesson.app.materialItems(picture));
    const rendered = lesson.app.stage1();
    assert.doesNotMatch(rendered, /<textarea\b|<input\b[^>]*type=["']text["']/i);
    assert.doesNotMatch(rendered, /data-material-option|data-material-place/,
      'there is no per-word checkbox or extra placement action');
    assert.equal((rendered.match(/type="checkbox"/g) || []).length, 6);
    for (const category of categories) {
      const fixed = items.filter(item => item.q === category);
      const max = picture === 'B' && category === 'Where' ? 4 : 3;
      assert.ok(fixed.length >= 2 && fixed.length <= max);
      assert.equal(new Set(fixed.map(item => item.id)).size, fixed.length);
      assert.ok(fixed.every(item => item.en.trim() && item.zh.trim()));
      assert.equal((rendered.match(new RegExp(`data-category-pick="${category}"`, 'g')) || []).length, 1,
        `${picture}/${category} has one checkbox for the entire category`);
      assert.equal((rendered.match(new RegExp(`data-category-reveal="${category}"`, 'g')) || []).length, 1);
    }
    const where = items.filter(item => item.q === 'Where');
    assert.ok(where.some(item => item.kind === '環境／設施'));
    assert.ok(where.some(item => item.kind === '所在位置'));
    assert.ok(items.filter(item => item.q === 'What').every(item => /^(are playing|play|climb|walk|rest|have)\b/.test(item.en)),
      'What consists of activities rather than scenery nouns');
    const how = items.filter(item => item.q === 'How');
    assert.ok(how.some(item => /^looks\b/.test(item.en)), 'How retains the original park atmosphere');
    assert.ok(how.some(item => /^feel\b/.test(item.en)), 'How also provides clearly identified personal feelings');
  }
});

test('revealing an individual category is independent of choosing, while selecting a covered card reveals it', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  assert.equal(!!lesson.app.state.categoryOpen.A.What, false);
  await lesson.reveal('What');
  assert.equal(lesson.app.state.categoryOpen.A.What, true);
  assert.deepEqual(plain(lesson.app.state.categoryPicks.A), []);
  assert.deepEqual(plain(lesson.app.selectedMaterials('A')), [], 'reading materials does not select them');
  await lesson.reveal('What');
  assert.equal(lesson.app.state.categoryOpen.A.What, true, 'a second reveal cannot cover the material again');
  assert.equal(!!lesson.app.state.categoryOpen.A.Where, false);
  await lesson.pick('Where');
  assert.equal(lesson.app.state.categoryOpen.A.Where, true, 'selecting unseen materials reveals their card');
  assert.deepEqual(plain(lesson.app.state.categoryPicks.A), ['Where']);
  const selected = plain(lesson.app.selectedMaterials('A'));
  assert.deepEqual(selected.map(item => item.id),
    plain(lesson.app.materialItems('A').filter(item => item.q === 'Where').map(item => item.id)));
  await lesson.reveal('Where');
  assert.equal(lesson.app.state.categoryOpen.A.Where, true);
  assert.deepEqual(plain(lesson.app.selectedMaterials('A')), selected,
    'repeating the reveal does not change the selection');
  await lesson.pick('Where', false);
  assert.deepEqual(plain(lesson.app.selectedMaterials('A')), []);
  assert.equal(lesson.app.state.categoryOpen.A.Where, true,
    'unchecking removes the selected category but never covers its material again');
});

test('reveal all toggles only the current picture and preserves its selected materials after closing and reloading', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.pick('What');
  assert.equal(lesson.app.categoryOpenFor('A').What, true);
  lesson.app.state.done = [true, false, false, true, true, false, false];
  lesson.app.state.checks = { support: true };
  const before = plain(lesson.app.state);
  const allButton = rendered => rendered.match(/<button\b(?=[^>]*\bdata-reveal-all\b)[^>]*>/)?.[0];
  assert.ok(allButton(lesson.app.stage1()), 'the current picture exposes a reveal-all control');
  assert.doesNotMatch(allButton(lesson.app.stage1()), /\bdisabled\b/);
  await lesson.revealAll();
  for (const [category] of lesson.app.qs) assert.equal(lesson.app.state.categoryOpen.A[category], true);
  assert.deepEqual(plain(lesson.app.state.categoryOpen.B), before.categoryOpen.B,
    'revealing every A card does not reveal any B card');
  for (const key of ['categoryPicks', 'done', 'checks', 'f', 'placed', 'openingPattern', 'openingFocus']) {
    assert.deepEqual(plain(lesson.app.state[key]), before[key], `reveal-all preserves ${key}`);
  }
  assert.match(allButton(lesson.app.stage1()), /aria-expanded="true"/);
  assert.doesNotMatch(allButton(lesson.app.stage1()), /\bdisabled\b/);
  await lesson.picture('B');
  await lesson.revealAll();
  await lesson.picture('A');
  await lesson.revealAll();
  assert.match(allButton(lesson.app.stage1()), /aria-expanded="false"/);
  const restored = loadLesson(lesson.snapshot());
  for (const [category] of lesson.app.qs) {
    assert.equal(restored.app.state.categoryOpen.A[category], false);
    assert.equal(restored.app.state.categoryOpen.B[category], true);
  }
  assert.deepEqual(plain(restored.app.state.categoryPicks), { A: ['What'], B: [] });
  assert.deepEqual(plain(restored.app.state.done), before.done);
  assert.doesNotMatch(restored.app.stage1(), /範例來源備註/);
});

test('category selection immediately reaches the hamburger and sentence stage; unchecking removes only that category', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  await lesson.pick('What');
  const actionItems = plain(lesson.app.selectedMaterials('A'));
  assert.ok(actionItems.length >= 2);
  for (const item of actionItems) {
    assert.ok(lesson.byId('liveBurger').innerHTML.includes(item.en), 'the hamburger updates on the checkbox event');
    assert.ok(lesson.app.materialBox('A').includes(item.en), 'the next stage immediately sees the same material');
  }
  await lesson.pick('Where');
  const both = plain(lesson.app.selectedMaterials('A'));
  assert.deepEqual([...new Set(both.map(item => item.q))].sort(), ['What', 'Where']);
  const whereItems = both.filter(item => item.q === 'Where');
  assert.ok(whereItems.some(item => item.kind === '環境／設施'));
  assert.ok(whereItems.some(item => item.kind === '所在位置'));
  const summary = lesson.app.materialSummary('A');
  const categoryNames = [...summary.matchAll(/<span\b[^>]*class="[^"]*material-category-pill[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]
    .map(match => readableHtml(match[1]));
  assert.deepEqual(categoryNames.sort(), ['What', 'Where'], 'hamburger summaries contain only short category names');
  assert.doesNotMatch(readableHtml(summary), /\d|材料|點這|點此|查看/,
    'the summary does not repeat counts or expand instructions');
  const categoryBody = lesson.app.materialList('A');
  for (const category of ['Where', 'What']) {
    assert.match(categoryBody, new RegExp(`<li\\b[^>]*class="[^"]*material-category[^"]*"[^>]*data-material-category="${category}"`),
      'each category has a separate block for its color treatment');
  }
  await lesson.pick('What', false);
  assert.deepEqual(plain(lesson.app.selectedMaterials('A')), whereItems);
  assert.deepEqual(plain(lesson.app.state.categoryPicks.A), ['Where']);
  for (const item of actionItems) {
    assert.ok(!lesson.app.materialBox('A').includes(item.en), 'unchecking removes the whole activity category');
    assert.ok(!lesson.byId('liveBurger').innerHTML.includes(item.en));
  }
  for (const item of whereItems) assert.ok(lesson.app.materialBox('A').includes(item.en));
  await lesson.pick('What');
  await lesson.picture('B');
  await lesson.pick('What');
  await lesson.pick('Where');
  assert.equal(lesson.app.validate(), '', 'selected categories need no separate placement confirmation');
  await lesson.click({ 'data-material-next': '' });
  assert.equal(lesson.app.state.active, 2);
  assert.equal(lesson.app.state.done[1], true);
  for (const item of actionItems) assert.ok(readableHtml(lesson.app.stage2()).includes(item.en));
  lesson.app.navigate(1, false);
  await lesson.pick('Who');
  assert.equal(lesson.app.state.done[1], false, 'a changed selection invalidates the completed selection step');
  assert.ok(lesson.app.selectedMaterials('B').some(item => item.q === 'Who'));
  assert.equal(lesson.app.validate(), '', 'the new category is already available without re-placing it');
});

test('pictures keep separate category choices and opening state, and switching moves focus to the right layer', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  for (const category of ['What', 'Where', 'Who', 'How']) await lesson.pick(category);
  assert.deepEqual(plain(lesson.app.state.categoryPicks.A), ['What', 'Where', 'Who', 'How'],
    'category choices are not restricted to three');
  await lesson.reveal('When');
  const selectedA = plain(lesson.app.selectedMaterials('A'));
  await lesson.picture('B');
  assert.equal(lesson.app.state.layer, 2);
  assert.deepEqual(plain(lesson.app.state.categoryPicks.B), []);
  assert.equal(!!lesson.app.state.categoryOpen.B.When, false);
  let target = lesson.byId('stage').querySelector('[data-switch="picture"][data-value="B"]');
  assert.ok(target.scrollCalls.length > 0, 'switching scrolls to the selected picture button');
  assert.ok(target.focusCalls.length > 0, 'switching gives the selected picture button keyboard focus');
  await lesson.pick('Where');
  await lesson.reveal('Why');
  assert.deepEqual(plain(lesson.app.selectedMaterials('A')), selectedA);
  assert.deepEqual(plain(lesson.app.state.categoryPicks.B), ['Where']);
  await lesson.picture('A');
  assert.equal(lesson.app.state.layer, 1);
  assert.equal(lesson.app.state.categoryOpen.A.When, true);
  assert.equal(!!lesson.app.state.categoryOpen.A.Why, false);
  target = lesson.byId('stage').querySelector('[data-switch="picture"][data-value="A"]');
  assert.ok(target.scrollCalls.length > 0);
  assert.ok(target.focusCalls.length > 0);
  lesson.app.save();
  const before = lesson.snapshot();
  const restored = loadLesson(before);
  for (const key of ['categoryPicks', 'openingPattern', 'openingFocus', 'picture']) {
    assert.deepEqual(plain(restored.app.state[key]), before[key], `reload preserves ${key}`);
  }
  for (const picture of ['A', 'B']) for (const [category] of lesson.app.qs) {
    assert.equal(!!restored.app.state.categoryOpen[picture][category],
      !!before.categoryOpen[picture][category], `reload preserves ${picture}/${category} open state`);
  }
  assert.deepEqual(plain(restored.app.selectedMaterials('A')), selectedA);
});

test('v1 and v2 migration retain student writing without expanding individual words into whole categories', () => {
  const legacyBase = {
    active: 2, done: [true, true, true, true, true, true],
    f: {
      task: 'describe', themeZh: '我自己的公園主題',
      AWhat: 'My original observation', AWhere: 'under a tree',
      openEn: 'The two pictures show different parks.',
      aEn: 'I wrote this sentence myself.', bEn: 'There are tall trees.',
      stanceEn: 'My ideal park would have both trees and slides.',
      reason1En: 'It would help me relax.', detail1En: 'I could walk after school.',
      reason2En: 'I could spend time with my family.', detail2En: 'We could use the slides together.',
      endingEn: 'This would be my ideal park.'
    },
    picture: 'B', sentence: 'A', route: 'blend', reason: 1,
    methods: { 1: 'example', 2: 'scene' },
    placed: { openEn: true, aEn: true, bEn: true, stanceEn: true, reason1: true, reason2: true, endingEn: true },
    checks: { both: true, support: true, new: true }
  };
  const versions = [
    { ...legacyBase, picks: { A: ['What', 'Where'], B: ['What', 'How'] } },
    { ...legacyBase, materialVersion: 2, themeChoice: 'parks',
      materialPicks: { A: ['where-slides', 'what-slide'], B: ['where-trees', 'what-walk'] },
      materialPlaced: { A: ['where-slides'], B: ['where-trees'] },
      materialOpen: { A: true, B: false } }
  ];
  for (const oldState of versions) {
    const lesson = loadLesson(oldState);
    assert.equal(lesson.app.state.materialVersion, 4);
    const expectedFields = { ...oldState.f };
    for (const n of [1, 2]) {
      expectedFields['reason' + n + 'En'] += ' ' + oldState.f['detail' + n + 'En'];
    }
    assert.deepEqual(plain(lesson.app.state.f), expectedFields, 'both pieces of each old entry survive in the editable English sentence');
    assert.deepEqual(plain(lesson.app.state.placed), oldState.placed, 'placed sentences remain available');
    assert.deepEqual(plain(lesson.app.state.categoryPicks), { A: [], B: [] },
      'old individual selections cannot consent to every item in the new category');
    assert.deepEqual(plain(lesson.app.selectedMaterials('A')), []);
    assert.equal(lesson.app.state.materialMigration, true);
    assert.match(lesson.app.stage1(), /重新|重選/, 'the learner is told to choose the revised categories');
    for (const i of [1, 2]) assert.equal(lesson.app.state.done[i], false);
    for (const i of [0, 3, 4, 5]) assert.equal(lesson.app.state.done[i], true,
      'unrelated reading confirmations survive material migration');
    if (oldState.materialVersion === 2) {
      assert.equal(lesson.app.state.legacyMaterials.version, 2);
      const preservedA = plain(lesson.app.state.legacyMaterials.placed.A);
      assert.deepEqual(preservedA.map(item => item.id), ['where-slides']);
      assert.ok(preservedA.every(item => item.en && item.zh && item.q));
    }
    lesson.app.save();
    const restored = loadLesson(lesson.snapshot());
    assert.deepEqual(plain(restored.app.state.f), expectedFields, 'a second reload does not duplicate old details');
    assert.deepEqual(plain(restored.app.state.categoryPicks), { A: [], B: [] });
  }
});

test('sentence examples follow selected categories and account for their fixed materials', async () => {
  for (const picture of ['A', 'B']) {
    const lesson = loadLesson();
    lesson.app.navigate(1, false);
    await lesson.prepareOpening();
    await lesson.picture(picture);
    const available = new Map(plain(lesson.app.materialItems(picture)).map(item => [item.id, item]));
    assert.deepEqual(plain(lesson.app.sentenceExamples(picture)), [],
      'no category selection means no unrelated example is offered');
    for (const [category] of lesson.app.qs) {
      await lesson.pick(category);
      const examples = plain(lesson.app.sentenceExamples(picture));
      assert.ok(examples.length > 0, `${picture}/${category} has a relevant example`);
      const rendered = readableHtml(lesson.app.renderSentenceExamples(picture));
      const covered = new Set();
      for (const example of examples) {
        assert.ok(example.categories.length > 0);
        assert.ok(example.categories.every(item => item === category),
          'a single selected category cannot expose a different category’s teaching example');
        assert.ok(example.sentences.length > 0);
        assert.equal(example.parts.length, example.sentences.length,
          'each sentence has structured highlight segments');
        for (let index = 0; index < example.sentences.length; index++) {
          const parts = example.parts[index];
          assert.equal(parts.map(part => part.t).join(''), example.sentences[index],
            'structured segments preserve the exact English sentence');
          const colored = lesson.app.renderSentenceParts(picture, parts);
          assert.equal(readableHtml(colored), example.sentences[index],
            'inline highlight markup does not insert spaces or change punctuation');
          for (const mark of colored.matchAll(/<mark\b([^>]*)>([\s\S]*?)<\/mark>/g)) {
            const markedCategory = mark[1].match(/data-material-category="([^"]+)"/)?.[1];
            const markedId = mark[1].match(/data-material-id="([^"]+)"/)?.[1];
            assert.equal(markedCategory, category, 'only the currently selected category gets material color');
            assert.ok(available.has(markedId), 'each colored phrase points to a real material');
          }
        }
        const sentenceWords = new Set(phraseWords(example.sentences.join(' ')));
        for (const id of example.materialIds) {
          const material = available.get(id);
          assert.ok(material, `example reference ${id} belongs to picture ${picture}`);
          assert.equal(material.q, category);
          covered.add(id);
          for (const word of phraseWords(material.en)) {
            assert.ok(sentenceWords.has(word),
              `${picture}/${example.id} actually uses material ${id} (${word}), not just its metadata`);
          }
        }
        for (const sentence of example.sentences) assert.ok(rendered.includes(sentence),
          `${picture}/${category} renders the example sentence supplied by its matching data`);
      }
      const selected = plain(lesson.app.selectedMaterials(picture));
      assert.ok(selected.every(item => covered.has(item.id)),
        `${picture}/${category} examples cover every selectable material across their sentences`);
      await lesson.pick(category, false);
      assert.deepEqual(plain(lesson.app.sentenceExamples(picture)), [],
        'unchecking the category removes its corresponding examples');
    }
    await lesson.pick('Where');
    await lesson.pick('What');
    const examples = plain(lesson.app.sentenceExamples(picture));
    assert.ok(examples.some(example => example.id === 'combined'));
    assert.ok(examples.every(example => example.categories.every(category => ['Where', 'What'].includes(category))));
    const activity = examples.find(example => example.id === 'what');
    const activityHtml = activity.parts.map(parts => lesson.app.renderSentenceParts(picture, parts)).join(' ');
    const skeletonText = [...activityHtml.matchAll(/<span\b[^>]*class="[^"]*sentence-skeleton[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]
      .map(match => readableHtml(match[1])).join(' ');
    assert.match(skeletonText, picture === 'A' ? /children/i : /people|visitors/i,
      'an unselected Who used to complete grammar stays in the neutral sentence skeleton');
  }
});

test('the example preset changes only category choices while the unified pool and all six usable cards stay intact', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  const originalPools = { A: plain(lesson.app.materialItems('A')), B: plain(lesson.app.materialItems('B')) };
  lesson.app.state.f.aEn = 'My first picture sentence.';
  lesson.app.state.f.bEn = 'My second picture sentence.';
  lesson.app.state.f.stanceEn = 'My ideal park is quiet.';
  Object.assign(lesson.app.state.placed, { aEn: true, bEn: true, stanceEn: true });
  lesson.app.state.done.fill(true);
  const originalWriting = plain(lesson.app.state.f);
  await lesson.modelPreset();
  const required = ['How', 'What', 'Where', 'Who'];
  assert.deepEqual(plain(lesson.app.categoryPicksFor('A')).sort(), required);
  assert.deepEqual(plain(lesson.app.state.f), originalWriting,
    'choosing example categories cannot overwrite any student sentence');
  assert.equal(lesson.app.state.placed.aEn, false);
  for (const key of ['openEn', 'bEn', 'stanceEn']) assert.equal(lesson.app.state.placed[key], true);
  assert.deepEqual(plain(lesson.app.state.done), [true, false, false, true, true, true, true]);
  assert.equal(lesson.app.MODEL_EXAMPLE.opening, ORIGINAL_MODEL.opening);
  const expectedExtensions = {
    A: { What: ['are playing', 'play on the slides', 'climb on the climbing frames'],
      How: ['looks lively', 'feel happy', 'feel excited'] },
    B: { What: ['walk', 'rest', 'have a picnic'], Who: ['people', 'visitors', 'families'],
      How: ['looks quiet', 'feel relaxed', 'feel refreshed'] }
  };
  for (const picture of ['A', 'B']) {
    await lesson.picture(picture);
    await lesson.modelPreset();
    assert.equal(lesson.app.MODEL_EXAMPLE[picture].text, ORIGINAL_MODEL[picture]);
    const items = plain(lesson.app.materialItems(picture));
    assert.deepEqual(items, originalPools[picture], 'preset does not swap or narrow the material pool');
    for (const [category, expected] of Object.entries(expectedExtensions[picture])) {
      assert.deepEqual(items.filter(item => item.q === category).map(item => item.en.toLowerCase()), expected,
        `${picture}/${category} keeps original phrases first and extensions in the same card`);
    }
    const originalItems = items.filter(item => item.original);
    assert.ok(originalItems.length > 0);
    assert.ok(items.some(item => !item.original), 'extension materials stay available alongside the original');
    for (const item of originalItems) assert.ok(ORIGINAL_MODEL[picture].toLowerCase().includes(item.en.toLowerCase()),
      `${picture}/${item.id} marked as original must actually occur in the original sentence`);
    for (const part of lesson.app.MODEL_EXAMPLE[picture].parts.filter(part => part.materialId)) {
      assert.ok(originalItems.some(item => item.id === part.materialId && item.q === part.q),
        'the original example uses the very same material ids shown in the unified cards');
    }
    const where = items.filter(item => item.q === 'Where');
    assert.equal(where.length, picture === 'A' ? 3 : 4);
    assert.deepEqual(where.filter(item => item.part === '所在位置').map(item => [item.en, item.original]),
      picture === 'A' ? [['in the playground', true]] : [['under the trees', true], ['on the grass', false]]);
    assert.ok(!where.some(item => item.en === 'there'));
    const rendered = lesson.app.stage1();
    assert.doesNotMatch(rendered, /data-material-free|data-material-source/);
    assert.doesNotMatch(readableHtml(rendered), /回到?自行選材/);
    assert.match(readableHtml(rendered), /原例句/);
    for (const category of ['When', 'Why']) {
      const control = rendered.match(new RegExp(`<input\\b(?=[^>]*data-category-pick="${category}")[^>]*>`))?.[0];
      assert.ok(control && !/\bdisabled\b/.test(control), `${category} remains available after the preset`);
      await lesson.pick(category);
      assert.ok(lesson.app.categoryPicksFor(picture).includes(category));
      assert.ok(lesson.app.selectedMaterials(picture).filter(item => item.q === category).length >= 2);
      assert.deepEqual(plain(lesson.app.materialItems(picture)), originalPools[picture]);
    }
  }
  await lesson.modelPreset();
  lesson.app.state.done.fill(true);
  lesson.app.state.placed.bEn = true;
  const beforeRepeat = plain(lesson.app.state);
  await lesson.modelPreset();
  assert.deepEqual(plain(lesson.app.state), beforeRepeat,
    'repeating the same four-category preset preserves all progress and placement');
});

test('extra categories stay isolated and saved, while old two-source drafts migrate their active choices into the single pool', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  await lesson.modelPreset();
  await lesson.pick('When');
  await lesson.pick('Why');
  const selectedA = plain(lesson.app.categoryPicksFor('A'));
  assert.equal(selectedA.length, 6);
  await lesson.picture('B');
  await lesson.pick('Where');
  await lesson.pick('When');
  await lesson.reveal('Why');
  assert.deepEqual(plain(lesson.app.categoryPicksFor('A')), selectedA);
  assert.deepEqual(plain(lesson.app.categoryPicksFor('B')), ['Where', 'When']);
  const saved = lesson.snapshot();
  const restored = loadLesson(saved);
  assert.equal(restored.app.state.materialVersion, 4);
  assert.deepEqual(plain(restored.app.state.categoryPicks), saved.categoryPicks);
  for (const picture of ['A', 'B']) for (const [category] of lesson.app.qs) {
    assert.equal(!!restored.app.state.categoryOpen[picture][category], !!saved.categoryOpen[picture][category]);
  }
  assert.deepEqual(plain(restored.app.selectedMaterials('A')), plain(lesson.app.selectedMaterials('A')));
  assert.deepEqual(plain(restored.app.selectedMaterials('B')), plain(lesson.app.selectedMaterials('B')));

  const oldV3 = { materialVersion: 3, active: 1, openingRevealed: 3,
    f: { openEn: 'The two parks have different features.', aEn: 'My saved A sentence.', bEn: 'My saved B sentence.',
      stanceEn: 'My saved ideal park.', reason1En: 'Trees keep it cool.', reason2En: 'I can rest under a tree.' },
    placed: { openEn: true, aEn: true, bEn: true, stanceEn: true, reason1: true, reason2: true },
    done: [true, true, true, true, true, true], checks: { both: true, support: true, new: true },
    materialSource: { A: 'model', B: 'free' },
    categoryPicks: { A: ['When', 'Why'], B: ['Where', 'When'] },
    modelPicks: { A: ['Where', 'Who', 'What', 'How'], B: ['How'] },
    categoryOpen: { A: { When: true }, B: { When: true } },
    modelOpen: { A: { Where: true, What: true }, B: { How: true } }, modelFusion: { A: '', B: '' } };
  const migrated = loadLesson(oldV3);
  assert.equal(migrated.app.state.materialVersion, 4);
  assert.deepEqual(plain(migrated.app.state.categoryPicks.A), oldV3.modelPicks.A,
    'an old model picture migrates its active model choices, not the hidden free backup');
  assert.deepEqual(plain(migrated.app.state.categoryPicks.B), oldV3.categoryPicks.B,
    'an old free picture retains its active free choices');
  for (const category of ['When', 'Where', 'What']) assert.equal(migrated.app.state.categoryOpen.A[category], true);
  for (const category of ['When', 'How']) assert.equal(migrated.app.state.categoryOpen.B[category], true);
  assert.deepEqual(plain(migrated.app.state.done), [...oldV3.done, false]);
  for (const key of ['f', 'placed', 'checks']) assert.deepEqual(plain(migrated.app.state[key]), oldV3[key],
    `migration preserves ${key}`);
  assert.doesNotMatch(migrated.app.stage1(), /data-material-free|data-material-source/);
  migrated.app.save();
  const reloaded = loadLesson(migrated.snapshot());
  assert.deepEqual(plain(reloaded.app.state.categoryPicks), plain(migrated.app.state.categoryPicks));
  assert.deepEqual(plain(reloaded.app.state.f), oldV3.f);
});
test('the optional original example keeps exact text, accepts extra categories, and writes only after explicit adoption', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  await lesson.modelPreset();
  await lesson.picture('B');
  await lesson.modelPreset();
  lesson.app.state.f.aEn = 'My own A sentence.';
  lesson.app.state.f.bEn = 'My own B sentence.';
  lesson.app.state.f.stanceEn = 'My personal park preference.';
  lesson.app.state.placed.stanceEn = true;
  await lesson.click({ 'data-material-next': '' });
  for (const picture of ['A', 'B']) {
    await lesson.sentencePicture(picture);
    const field = picture.toLowerCase() + 'En';
    const beforeFusion = plain(lesson.app.state.f);
    assert.equal(lesson.app.modelFusionReady(picture), false);
    assert.ok(!readableHtml(lesson.app.stage2()).includes(ORIGINAL_MODEL[picture]),
      'the complete model is not exposed until the learner requests fusion');
    await lesson.fuse(picture);
    assert.equal(lesson.app.modelFusionReady(picture), true);
    assert.deepEqual(plain(lesson.app.state.f), beforeFusion, 'fusion displays a model without replacing the draft');
    assert.ok(readableHtml(lesson.app.stage2()).includes(ORIGINAL_MODEL[picture]));
    const entry = lesson.app.MODEL_EXAMPLE[picture];
    assert.equal(entry.parts.map(part => part.t).join(''), ORIGINAL_MODEL[picture]);
    const colored = lesson.app.renderSentenceParts(picture, entry.parts);
    assert.equal(readableHtml(colored), ORIGINAL_MODEL[picture],
      'highlight segments reproduce the original paragraph with exact punctuation and spaces');
    const available = new Map(plain(lesson.app.materialItems(picture)).map(item => [item.id, item]));
    const coloredCategories = new Set();
    for (const mark of colored.matchAll(/<mark\b([^>]*)>([\s\S]*?)<\/mark>/g)) {
      const category = mark[1].match(/data-material-category="([^"]+)"/)?.[1];
      const id = mark[1].match(/data-material-id="([^"]+)"/)?.[1];
      assert.ok(lesson.app.categoryPicksFor(picture).includes(category));
      assert.equal(available.get(id)?.q, category, 'each highlight points to its actual selected model material');
      coloredCategories.add(category);
    }
    assert.deepEqual([...coloredCategories].sort(), ['How', 'What', 'Where', 'Who']);

    lesson.app.navigate(1, false);
    await lesson.picture(picture);
    for (const category of ['When', 'Why']) {
      await lesson.pick(category);
      assert.equal(lesson.app.modelFusionReady(picture), true,
        'adding supplementary categories does not invalidate the already fused original example');
    }
    await lesson.click({ 'data-material-next': '' });
    await lesson.sentencePicture(picture);
    assert.ok(readableHtml(lesson.app.stage2()).includes(ORIGINAL_MODEL[picture]));
    for (const category of ['When', 'Why']) {
      assert.ok(lesson.app.sentenceExamples(picture).some(example => example.categories.includes(category)),
        'extra material categories have their own matching supplementary examples');
      assert.match(lesson.app.stage2(), new RegExp(`data-sentence-example="${category.toLowerCase()}"`),
        'supplementary examples stay visible alongside the original example');
    }
    const extraReload = loadLesson(lesson.snapshot());
    assert.equal(extraReload.app.modelFusionReady(picture), true);
    for (const category of ['When', 'Why']) assert.ok(extraReload.app.categoryPicksFor(picture).includes(category));

    lesson.app.navigate(1, false);
    await lesson.picture(picture);
    await lesson.pick('Who', false);
    await lesson.click({ 'data-material-next': '' });
    await lesson.sentencePicture(picture);
    assert.equal(lesson.app.state.done[1], true, 'the remaining selected categories still complete material gathering');
    lesson.app.state.done[3] = true;
    lesson.app.state.done[4] = true;
    assert.equal(lesson.app.modelFusionReady(picture), false);
    assert.ok(lesson.app.modelMissingCategories(picture).includes('Who'));
    await lesson.fuse(picture);
    assert.equal(lesson.app.modelFusionReady(picture), false);
    const incomplete = lesson.app.stage2();
    assert.ok(!readableHtml(incomplete).includes(ORIGINAL_MODEL[picture]),
      'a missing category cannot reveal an intact model that uses unselected materials');
    assert.match(incomplete, new RegExp(`<button\\b(?=[^>]*data-model-preset)(?=[^>]*data-picture="${picture}")[^>]*>`),
      'the missing-category hint provides a preset action for the current sentence picture');
    await lesson.adopt(picture);
    assert.deepEqual(plain(lesson.app.state.f), beforeFusion, 'an unfused incomplete model cannot be adopted');

    const other = picture === 'A' ? 'B' : 'A';
    const otherPicks = plain(lesson.app.categoryPicksFor(other));
    lesson.app.state.picture = other;
    await lesson.click({ 'data-model-preset': '', 'data-picture': picture });
    assert.deepEqual(plain(lesson.app.modelMissingCategories(picture)), []);
    assert.equal(lesson.app.state.done[1], true, 'repairing a valid model in the sentence step keeps its selection confirmation');
    assert.equal(lesson.app.state.done[3], true);
    assert.equal(lesson.app.state.done[4], true);
    assert.deepEqual(plain(lesson.app.categoryPicksFor(other)), otherPicks,
      'repairing the current sentence picture does not apply its preset to the other picture');
    await lesson.fuse(picture);
    assert.equal(lesson.app.modelFusionReady(picture), true);
    const stable = plain(lesson.app.state);
    await lesson.click({ 'data-model-preset': '', 'data-picture': picture });
    assert.deepEqual(plain(lesson.app.state), stable,
      'repeating a matching preset preserves an already fused example');
    const adoptLabel = lesson.app.stage2().match(/<button\b(?=[^>]*data-model-adopt)(?=[^>]*data-picture="[AB]")[^>]*>([\s\S]*?)<\/button>/)?.[1];
    assert.ok(adoptLabel && /改用/.test(readableHtml(adoptLabel)), 'replacing a personal draft is stated on the actual button');
    await lesson.adopt(picture);
    assert.equal(lesson.app.state.f[field], ORIGINAL_MODEL[picture]);
    assert.equal(lesson.app.state.placed[field], true, 'adoption places the full original example immediately');
    await lesson.fuse(picture);
    assert.equal(lesson.app.modelFusionReady(picture), false);
    assert.doesNotMatch(lesson.app.stage2(), /id="modelOutput-|範例來源備註/);
    assert.equal(lesson.app.state.f[field], ORIGINAL_MODEL[picture]);
    assert.equal(lesson.app.state.placed[field], true, 'closing the demonstration preserves its placed sentence');
    await lesson.fuse(picture);
    assert.equal(lesson.app.modelFusionReady(picture), true);
    assert.equal(lesson.app.state.f.openEn, beforeFusion.openEn);
    assert.equal(lesson.app.state.f.stanceEn, beforeFusion.stanceEn);
    assert.equal(lesson.app.state.placed.stanceEn, true);
    assert.equal(lesson.app.state.f[other.toLowerCase() + 'En'], beforeFusion[other.toLowerCase() + 'En']);
    assert.ok(readableHtml(lesson.byId('liveBurger').innerHTML).includes(ORIGINAL_MODEL[picture]));
  }
  const restored = loadLesson(lesson.snapshot());
  for (const picture of ['A', 'B']) {
    assert.equal(restored.app.modelFusionReady(picture), true, 'reload preserves an unchanged fused model');
    assert.equal(restored.app.state.f[picture.toLowerCase() + 'En'], ORIGINAL_MODEL[picture]);
  }
});

test('adopting either opening from the review places it immediately and preserves the other writing', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  const preview = lesson.app.currentOpeningExample().en;
  await lesson.modelPreset();
  await lesson.picture('B');
  await lesson.modelPreset();
  await lesson.click({ 'data-material-next': '' });
  await lesson.fuse('A');
  await lesson.adopt('A');
  await lesson.sentencePicture('B');
  await lesson.adoptExample('B', 'where');
  await lesson.byId('confirm').dispatch('click');
  assert.equal(lesson.app.state.done[2], true);
  assert.equal(lesson.app.state.f.openEn, preview);
  assert.equal(lesson.app.state.placed.openEn, true);
  assert.equal(lesson.app.currentOpeningExample().en, preview);
  const rendered = lesson.app.stage2();
  assert.ok(readableHtml(rendered).includes(ORIGINAL_MODEL.opening));
  const label = rendered.match(/<button\b[^>]*data-model-opening-adopt\b[^>]*>([\s\S]*?)<\/button>/)?.[1];
  assert.ok(label && /採用|改用/.test(readableHtml(label)));
  const before = plain(lesson.app.state);
  await lesson.click({ 'data-model-opening-adopt': '' });
  assert.deepEqual(plain(lesson.app.state.f), { ...before.f, openEn: ORIGINAL_MODEL.opening });
  assert.equal(lesson.app.state.placed.openEn, true);
  assert.equal(lesson.app.currentOpeningExample().en, preview);
  assert.ok(readableHtml(lesson.byId('liveBurger').innerHTML).includes(ORIGINAL_MODEL.opening));
  assert.deepEqual(plain(lesson.app.state.done), before.done.map((done, step) => step === 2 ? false : done));
  const restored = loadLesson(lesson.snapshot());
  const screen = restored.app.stage2();
  assert.ok(readableHtml(screen).includes(preview));
  assert.match(screen, /<button\b[^>]*\bdata-reviewed-opening-adopt\b/);
  await restored.click({ 'data-reviewed-opening-adopt': '' });
  for (const key of ['f', 'placed', 'categoryPicks', 'modelFusion', 'checks', 'openingPattern', 'openingFocus']) {
    assert.deepEqual(plain(restored.app.state[key]), before[key], 'switching back preserves ' + key);
  }
  for (const picture of ['A', 'B']) for (const [category] of restored.app.qs) {
    assert.equal(!!restored.app.state.categoryOpen[picture][category], !!before.categoryOpen[picture][category]);
  }
  assert.ok(readableHtml(restored.byId('liveBurger').innerHTML).includes(preview));
  assert.equal(restored.app.validate(), '');
});

test('picture sentences are chosen from matching examples and a saved sentence can still be placed', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  for (const picture of ['A', 'B']) {
    await lesson.picture(picture);
    await lesson.pick('Where');
    await lesson.pick('What');
  }
  await lesson.click({ 'data-material-next': '' });
  for (const picture of ['A', 'B']) {
    await lesson.sentencePicture(picture);
    const key = picture.toLowerCase() + 'En';
    const screen = lesson.app.stage2();
    assert.doesNotMatch(screen, /<textarea\b[^>]*\bdata-field="[ab]En"|把你選的材料組成一句英文|在輸入格寫自己的句子/);
    assert.doesNotMatch(screen, /data-place="[ab]En"/, 'empty drafts have no standalone placement action');
    assert.doesNotMatch(screen, /data-field="bridgeEn"/, 'the optional comparison uses the two example choices');
    const single = await lesson.adoptExample(picture, 'where', 1);
    assert.equal(lesson.app.state.f[key], single);
    assert.equal(lesson.app.state.placed[key], true);
    const combined = await lesson.adoptExample(picture, 'combined');
    assert.equal(lesson.app.state.f[key], combined, 'the connected sentences stay together');
    assert.equal(lesson.app.state.placed[key], true);
  }
  assert.equal(lesson.app.validate(), '');
  const saved = lesson.snapshot();
  saved.f.aEn = 'My own sentence from an earlier lesson.';
  saved.placed.aEn = false;
  const restored = loadLesson(saved);
  await restored.sentencePicture('A');
  const screen = restored.app.stage2();
  assert.ok(readableHtml(screen).includes(saved.f.aEn));
  assert.match(screen, /<button\b[^>]*data-place="aEn"/);
  assert.doesNotMatch(screen, /<textarea\b[^>]*\bdata-field="aEn"/);
  await restored.click({ 'data-place': 'aEn' });
  assert.equal(restored.app.state.f.aEn, saved.f.aEn);
  assert.equal(restored.app.validate(), '');
});

async function prepareParagraphOne(lesson) {
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  await lesson.pick('Where');
  await lesson.picture('B');
  await lesson.pick('What');
  await lesson.click({ 'data-material-next': '' });
  await lesson.adoptExample('A', 'where');
  await lesson.sentencePicture('B');
  await lesson.adoptExample('B', 'what');
}

test('flipping the sentence-step hamburger shows the selected materials for each picture without changing writing', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  await lesson.pick('When');
  await lesson.pick('Where');
  await lesson.picture('B');
  await lesson.modelPreset();
  assert.doesNotMatch(lesson.app.stage1(), /data-burger-flip/);
  for (const [picture, layer] of [['A', '1'], ['B', '2']]) {
    await lesson.click({ 'data-layer': layer });
    assert.equal(lesson.app.state.layer, Number(layer));
    const workbenchBurger = readableHtml(lesson.byId('liveBurger').innerHTML);
    for (const item of lesson.app.selectedMaterials(picture)) {
      assert.ok(workbenchBurger.includes(item.en) && workbenchBurger.includes(item.zh),
        'the materials step still responds to its individual hamburger layers');
    }
  }

  await lesson.click({ 'data-material-next': '' });
  const opening = lesson.app.state.f.openEn;
  const ownA = await lesson.adoptExample('A', 'when');
  await lesson.sentencePicture('B');
  await lesson.fuse('B');
  await lesson.adopt('B');
  assert.equal(lesson.app.state.placed.bEn, true);

  const sentences = lesson.byId('liveBurger').innerHTML;
  assert.match(sentences, /data-burger-face="sentences"/);
  assert.match(sentences, /<button\b[^>]*data-burger-flip/);
  for (const text of [opening, ownA, ORIGINAL_MODEL.B]) assert.ok(readableHtml(sentences).includes(text),
    'the sentence face includes the opening, the placed sentence, and the adopted example');
  const before = plain(lesson.app.state);
  const saved = lesson.snapshot();
  function pictureSections(burger) {
    assert.match(burger, /data-burger-face="materials"/, 'opening details does not flip the hamburger');
    const sections = [...burger.matchAll(/<section\b[^>]*data-burger-materials="([AB])"[^>]*>([\s\S]*?)<\/section>/g)];
    assert.deepEqual(sections.map(match => match[1]), ['A', 'B']);
    return Object.fromEntries(sections.map(([, picture, content]) => [picture, content]));
  }
  function checkDetails(openPanel = '') {
    const sections = pictureSections(lesson.app.burger(0));
    for (const [picture, section] of Object.entries(sections)) {
      const selected = [...lesson.app.categoryPicksFor(picture)].sort();
      const buttons = [...section.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
      const panels = [...section.matchAll(/<[^<>]*\bid="(burgerDetails-[AB]-[A-Za-z]+)"[^<>]*>/g)];
      const categories = buttons.map(([, attrs, label]) => {
        const category = attrs.match(/\bdata-burger-category="([^"]+)"/)?.[1];
        assert.ok(category, 'each control is a category button');
        assert.ok(attrs.includes('data-picture="' + picture + '"'));
        assert.ok(readableHtml(label).includes(category));
        assert.doesNotMatch(readableHtml(label), /詳細/);
        const id = 'burgerDetails-' + picture + '-' + category;
        assert.ok(attrs.includes('aria-controls="' + id + '"'));
        assert.ok(attrs.includes('aria-expanded="' + (id === openPanel) + '"'));
        return category;
      });
      assert.deepEqual(categories.sort(), selected, 'each selected category has one button and there is no shared toggle');
      const panelIds = selected.map(category => 'burgerDetails-' + picture + '-' + category);
      assert.deepEqual(panels.map(match => match[1]).sort(), panelIds.sort());
      const summary = readableHtml(section.slice(0, panels[0]?.index));
      for (const item of lesson.app.selectedMaterials(picture)) {
        assert.ok(!summary.includes(item.en) && !summary.includes(item.zh), 'individual materials stay inside their category panels');
      }
      panels.forEach((match, index) => {
        const id = match[1];
        assert.equal(/\shidden\b/.test(match[0]), id !== openPanel, id + ' visibility');
        if (id !== openPanel) return;
        const content = section.slice(match.index + match[0].length, panels[index + 1]?.index);
        const category = id.split('-')[2];
        const items = lesson.app.selectedMaterials(picture).filter(item => item.q === category);
        for (const [field, className] of [['en', 'material-english'], ['zh', 'material-translation']]) {
          const rows = new RegExp('<span\\b[^>]*class="[^"]*\\b' + className + '\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/span>', 'g');
          const visible = [...content.matchAll(rows)].map(entry => readableHtml(entry[1]));
          assert.deepEqual(visible, Array.from(items, item => item[field]), id + ' shows just its own bilingual materials');
        }
      });
    }
    assert.deepEqual(plain(lesson.app.state), before, 'inspecting a category preserves the current lesson');
    assert.deepEqual(lesson.snapshot(), saved, 'inspecting a category leaves the saved lesson untouched');
  }
  await lesson.click({ 'data-burger-flip': '' });
  checkDetails();
  for (const [picture, category] of [['A', 'When'], ['A', 'Where'], ['B', 'Where'],
    ['B', 'Who'], ['B', 'What'], ['B', 'How'], ['A', 'Where']]) {
    await lesson.click({ 'data-burger-category': category, 'data-picture': picture });
    checkDetails('burgerDetails-' + picture + '-' + category);
  }
  await lesson.click({ 'data-burger-category': 'Where', 'data-picture': 'A' });
  checkDetails();
  await lesson.click({ 'data-burger-flip': '' });
  const frontAgain = lesson.byId('liveBurger').innerHTML;
  assert.match(frontAgain, /data-burger-face="sentences"/);
  for (const text of [opening, ownA, ORIGINAL_MODEL.B]) assert.ok(readableHtml(frontAgain).includes(text));
  for (const key of ['f', 'placed', 'done', 'checks', 'categoryPicks', 'categoryOpen',
    'modelFusion', 'active', 'picture', 'sentence', 'openingPattern', 'openingFocus']) {
    assert.deepEqual(plain(lesson.app.state[key]), before[key], 'flipping preserves ' + key);
  }
  for (const empty of ['A', 'B']) {
    const legacy = loadLesson({ ...saved, categoryPicks: { ...saved.categoryPicks, [empty]: [] } });
    await legacy.click({ 'data-burger-flip': '' });
    const sections = pictureSections(legacy.app.burger(0));
    assert.doesNotMatch(sections[empty], /<button\b|data-burger-category|id="burgerDetails-/);
    const other = empty === 'A' ? 'B' : 'A';
    for (const category of saved.categoryPicks[other]) {
      assert.ok(sections[other].includes('data-burger-category="' + category + '"'));
    }
  }
});

function stanceInputs(lesson, picture) {
  return [...lesson.byId('stage').innerHTML.matchAll(/<input\b[^>]*\bdata-stance-material\b[^>]*>/g)]
    .map(match => match[0]).filter(tag => tag.includes('data-picture="' + picture + '"'));
}

function stanceSentence(lesson) {
  const sentence = lesson.app.stage3().match(/<(\w+)\b[^>]*\bid="stanceSentence"[^>]*>([\s\S]*?)<\/\1>/);
  return sentence ? readableHtml(sentence[2]) : '';
}

function stanceBun(lesson) {
  const layer = lesson.app.burger(1).match(/<button\b[^>]*\bdata-layer="0"[^>]*>([\s\S]*?)<\/button>/);
  assert.ok(layer, 'the second-paragraph hamburger has an opening layer');
  return readableHtml(layer[1]);
}

test('stance previews use the chosen picture and material, and the hamburger changes only on explicit placement', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(1, false);
  for (const picture of ['A', 'B']) {
    await lesson.picture(picture);
    for (const category of ['Where', 'What', 'When']) await lesson.pick(category);
  }
  lesson.app.navigate(3, false);
  const screen = () => lesson.byId('stage').innerHTML;
  assert.doesNotMatch(screen(), /<input\b(?=[^>]*\bdata-route=)[^>]*\schecked\b/);
  assert.doesNotMatch(stanceSentence(lesson), /^I would prefer a park.+\.$/);
  const writing = plain(lesson.app.state.f);
  const placed = plain(lesson.app.state.placed);
  const picks = plain(lesson.app.state.categoryPicks);

  for (const [route, pictures] of [['A', ['A']], ['B', ['B']], ['blend', ['A', 'B']]]) {
    await lesson.stanceRoute(route);
    for (const picture of ['A', 'B']) {
      const inputs = stanceInputs(lesson, picture);
      const offered = inputs.map(tag => tag.match(/\svalue="([^"]+)"/)?.[1]);
      const expected = pictures.includes(picture) ? Array.from(lesson.app.selectedMaterials(picture))
        .filter(item => item.q === 'What' || (item.q === 'Where' && item.part === '環境／設施'))
        .map(item => item.id) : [];
      assert.deepEqual(offered.sort(), expected.sort(), 'only suitable selected materials appear for ' + route + '/' + picture);
    }
  }
  await lesson.stanceRoute('A');
  const beforeSelection = screen();
  assert.match(beforeSelection, /\bid="stancePreview"/);
  await lesson.stanceMaterial('A', 'model-what-playing');
  const action = stanceSentence(lesson);
  assert.match(action, /^I would prefer a park where I could play\b.*\.$/);
  assert.doesNotMatch(action, /are playing/);
  assert.equal(screen(), beforeSelection, 'selecting a material leaves the stage and the focused radio in place');
  const preview = lesson.byId('stancePreview').innerHTML;
  assert.ok(readableHtml(preview).includes(action), 'the live preview receives the composed sentence on change');
  assert.match(preview, /<button\b[^>]*\bdata-stance-place\b/);
  assert.ok(!stanceBun(lesson).includes(action));
  await lesson.click({ 'data-stance-place': '' });
  assert.ok(stanceBun(lesson).includes(action));

  const restored = loadLesson(lesson.snapshot());
  assert.equal(stanceSentence(restored), action);
  assert.ok(stanceBun(restored).includes(action));
  await restored.stanceRoute('B');
  assert.ok(!stanceBun(restored).includes(action), 'changing the route withdraws the former opening');
  await restored.stanceMaterial('B', 'model-where-trees');
  assert.match(stanceSentence(restored), /^I would prefer a park with tall trees\.$/i);

  await restored.stanceRoute('blend');
  for (const [a, b, expected] of [
    ['model-where-playground', 'model-where-lawn', /\bwith a colorful playground and a large green lawn\.$/],
    ['model-what-playing', 'model-what-walk', /\bwhere I could play and walk\.$/],
    ['model-what-playing', 'model-where-trees', /\bplay\b.+\btall trees\.$/]
  ]) {
    await restored.stanceMaterial('A', a);
    await restored.stanceMaterial('B', b);
    const preview = stanceSentence(restored);
    assert.match(preview, expected);
    assert.doesNotMatch(preview, /with play\b|could tall trees|are playing/);
    assert.ok(readableHtml(restored.byId('stancePreview').innerHTML).includes(preview),
      'changing a material updates the displayed combined sentence immediately');
  }
  await restored.stanceMaterial('A', 'model-where-playground');
  await restored.stanceMaterial('B', 'model-what-walk');
  const combined = stanceSentence(restored);
  assert.match(combined, /^I would prefer a park\b.*a colorful playground.*\bwalk\b.*\.$/);
  assert.doesNotMatch(combined, /with walk|could a colorful playground/);
  assert.ok(!stanceBun(restored).includes(combined));
  await restored.click({ 'data-stance-place': '' });
  assert.ok(stanceBun(restored).includes(combined));
  assert.deepEqual(plain(restored.app.state.f), writing);
  assert.deepEqual(plain(restored.app.state.placed), placed);
  assert.deepEqual(plain(restored.app.state.categoryPicks), picks);

  restored.app.navigate(1, false);
  await restored.picture('A');
  await restored.pick('Where', false);
  restored.app.navigate(3, false);
  assert.ok(!stanceBun(restored).includes(combined), 'deselecting a material withdraws the stale composed sentence');
  assert.ok(!stanceSentence(restored).includes('a colorful playground'));
  assert.deepEqual(plain(restored.app.state.f), writing);
});

test('all three stance starters retain the route materials and require placement before the new opening enters the hamburger', async () => {
  const openings = {
    prefer: park => 'I would prefer ' + park + '.',
    believe: park => 'I firmly believe that ' + park + ' would suit me best.',
    perspective: park => 'From my perspective, ' + park + ' would be ideal.'
  };
  const parks = { A: 'a park where I could play', B: 'a park with tall trees', blend: 'a park that lets me play and has tall trees' };
  const action = { id: 'model-what-playing', category: 'What', text: 'play' };
  const feature = { id: 'model-where-trees', category: 'Where', text: 'tall trees' };
  for (const [route, marks] of [['A', [action]], ['B', [feature]], ['blend', [action, feature]]]) {
    let lesson = loadLesson({
      active: 3, materialVersion: 4, supportVersion: 2, route,
      categoryPicks: { A: ['What'], B: ['Where'] },
      stancePlan: { chosen: true, placed: true, A: action.id, B: feature.id }
    });
    // This saved stance predates starter choices and already belonged to the hamburger.
    assert.equal(lesson.app.state.stancePlan.starter, 'prefer');
    assert.ok(stanceBun(lesson).includes(stanceSentence(lesson)));
    const controls = () => [...lesson.app.stage3().matchAll(/<input\b[^>]*\bdata-stance-starter\b[^>]*>/g)].map(m => m[0]);
    assert.deepEqual(controls().map(tag => tag.match(/\bvalue="([^"]+)"/)[1]).sort(), Object.keys(openings).sort());
    for (const starter of ['believe', 'perspective', 'prefer']) {
      await lesson.stanceStarter(starter);
      const opening = stanceSentence(lesson);
      assert.equal(opening, openings[starter](parks[route]));
      assert.equal(lesson.app.state.stancePlan.placed, false);
      assert.ok(!stanceBun(lesson).includes(opening));
      assert.deepEqual([lesson.app.state.stancePlan.A, lesson.app.state.stancePlan.B], [action.id, feature.id]);
      await lesson.click({ 'data-stance-place': '' });
      assert.ok(stanceBun(lesson).includes(opening));
      assert.deepEqual(pointMarks(supportLayerMarkup(lesson, 0)), marks);
      lesson = loadLesson(lesson.snapshot());
      assert.equal(lesson.app.state.stancePlan.starter, starter);
      assert.equal(stanceSentence(lesson), opening);
      const selected = controls().filter(tag => /\schecked\b/.test(tag)).map(tag => tag.match(/\bvalue="([^"]+)"/)[1]);
      assert.deepEqual(selected, [starter]);
      for (const step of [4, 5]) {
        lesson.app.navigate(step, false);
        assert.ok(stanceBun(lesson).includes(opening));
        assert.deepEqual(pointMarks(supportLayerMarkup(lesson, 0)), marks);
      }
      lesson.app.navigate(3, false);
    }
  }
});

test('a mixed stance needs one choice per picture and marks practice words separately from selected material', async () => {
  const lesson = loadLesson({
    active: 3, materialVersion: 4, supportVersion: 2,
    categoryPicks: { A: ['When'], B: ['Where'] },
    f: { stanceEn: 'My old park would have a pond.', endingEn: 'This is the park I imagine.' },
    placed: { stanceEn: true, endingEn: true }
  });
  const before = plain(lesson.app.state);
  await lesson.stanceRoute('blend');
  const options = stanceInputs(lesson, 'A').map(tag => tag.match(/\svalue="([^"]+)"/)?.[1]);
  assert.ok(options.length > 0 && options.every(id => id.startsWith('sample:')));
  assert.match(readableHtml(lesson.byId('stage').innerHTML), /練習用詞|練習詞/);
  assert.ok(stanceInputs(lesson, 'B').every(tag => !tag.includes('value="sample:')));
  await lesson.stanceMaterial('B', 'model-where-trees');
  assert.doesNotMatch(stanceSentence(lesson), /^I would prefer a park.+\.$/);
  await lesson.click({ 'data-stance-place': '' });
  assert.doesNotMatch(stanceBun(lesson), /I would prefer a park/);
  await lesson.stanceMaterial('A', options[0]);
  const complete = stanceSentence(lesson);
  assert.match(complete, /^I would prefer a park\b.*tall trees.*\.$/);
  await lesson.click({ 'data-stance-place': '' });
  assert.ok(stanceBun(lesson).includes(complete));
  const restored = loadLesson(lesson.snapshot());
  for (const key of ['categoryPicks', 'f', 'placed', 'savedWriting']) {
    assert.deepEqual(plain(restored.app.state[key]), before[key], 'practice and placement preserve ' + key);
  }
});

function supportInputs(lesson, kind) {
  return [...lesson.app.stage4().matchAll(/<input\b[^>]*>/g)].map(m => m[0])
    .filter(tag => tag.includes('data-support-' + kind))
    .map(tag => {
      assert.match(tag, /\btype="radio"/);
      return tag.match(/\bvalue="([^"]+)"/)[1];
    });
}

function pointChecks(lesson) {
  return [...lesson.app.stage4().matchAll(/<input\b[^>]*>/g)].map(match => match[0])
    .filter(tag => tag.includes('data-point-material=') && /\schecked\b/.test(tag))
    .map(tag => tag.match(/data-point-material="([^"]+)"/)[1]).sort();
}

function pointPreviewMarkup(lesson) {
  const match = lesson.app.stage4().match(/<(\w+)\b[^>]*id="pointSentencePreview"[^>]*>([\s\S]*?)<\/\1>/);
  return match ? match[2] : '';
}

function pointPreview(lesson) {
  return readableHtml(pointPreviewMarkup(lesson));
}

function pointTranslation(lesson) {
  const match = lesson.app.stage4().match(/<(\w+)\b[^>]*id="pointSentenceTranslation"[^>]*>([\s\S]*?)<\/\1>/);
  if (match) assert.doesNotMatch(match[2], /<[^>]+>/, 'the translation is plain text');
  return match ? readableHtml(match[2]) : '';
}

function pointMarks(english) {
  return [...english.matchAll(/<mark\b([^>]*)>([\s\S]*?)<\/mark>/g)].map(([, attrs, body]) => {
    const classes = (attrs.match(/\bclass="([^"]*)"/)?.[1] || '').split(/\s+/);
    assert.ok(classes.includes('material-highlight'), 'source phrases use the sentence-building highlight style');
    const id = attrs.match(/\bdata-material-id="([^"]+)"/)?.[1];
    const category = attrs.match(/\bdata-material-category="([^"]+)"/)?.[1];
    assert.ok(id && category, 'the marked phrase identifies its source material and category');
    return { id, category, text: readableHtml(body) };
  });
}

function materialPointTones(markup) {
  return [...markup.matchAll(/<mark\b([^>]*)>/g)].map(([, attributes]) =>
    attributes.match(/\bdata-point-tone="([^"]+)"/)?.[1]);
}

function supportLayerMarkup(lesson, slot) {
  const layer = [...lesson.app.burger(1).matchAll(/<button\b[^>]*\bdata-layer="(\d+)"[^>]*>([\s\S]*?)<\/button>/g)]
    .find(match => match[1] === String(slot));
  assert.ok(layer, 'the second hamburger has support layer ' + slot);
  return layer[2];
}

function supportLayer(lesson, slot) {
  return readableHtml(supportLayerMarkup(lesson, slot));
}

test('both support slots offer five bilingual examples, with a staged source reading for the first two', async () => {
  const lesson = loadLesson();
  const nav = lesson.byId('lessonNav').innerHTML;
  assert.deepEqual([...nav.matchAll(/<span class="name">([^<]+)<\/span>/g)].map(match => match[1]),
    ['主架構', '找特點', '組句子', '選立場', '想理由或情境', '結尾', '案例文章']);
  lesson.app.navigate(4, false);
  const cases = {
    relax: ['First, it helps me relax after a busy school day.', 'For example, I can walk under the trees and listen to birds.',
      'This helps me stop thinking about schoolwork for a while.'],
    family: ['Second, the lawn gives my family a place to spend time together.',
      'On weekends, we can have a picnic on the grass and talk about our week.', 'This gives us time to listen to each other.']
  };
  const reasons = ['relax', 'family', 'active', 'nature', 'friends'];
  const initial = lesson.app.stage4();
  const slots = [...initial.matchAll(/<button\b([^>]*\bdata-support-slot="([12])"[^>]*)>([\s\S]*?)<\/button>/g)];
  assert.deepEqual(slots.map(match => match[2]), ['1', '2']);
  for (const [, , slot, label] of slots) assert.match(readableHtml(label), new RegExp('重點\\s*' + slot));
  for (const slot of [1, 2]) {
    await lesson.supportSlot(slot);
    assert.deepEqual(supportInputs(lesson, 'why'), reasons);
    const unanswered = lesson.app.stage4();
    assert.doesNotMatch(unanswered, /id="supportCaseReading"|data-case-reveal=|data-support-example=/);
    assert.doesNotMatch(unanswered, /<input\b(?=[^>]*\bdata-support-why\b)[^>]*\schecked\b/);
    for (const sentence of Object.values(cases).flat()) assert.ok(!readableHtml(unanswered).includes(sentence));
    for (const why of reasons) {
      await lesson.supportWhy(why);
      const html = lesson.app.stage4();
      const text = readableHtml(html);
      const article = html.match(/<[^<>]+\bid="supportCaseReading"[^>]*>/)?.[0];
      if (cases[why]) {
        assert.ok(article && article.includes('data-support-case="' + why + '"'), 'only the chosen source is displayed');
        assert.match(text, /第\s*0?7\s*關|案例文章/);
        const steps = [...html.matchAll(/<details\b([^>]*\bdata-case-reveal="(scene|benefit)"[^>]*)>/g)];
        assert.deepEqual(steps.map(m => m[2]), ['scene', 'benefit']);
        assert.ok(steps.every(m => !/\sopen\b/.test(m[1])), 'both subsequent steps start closed');
        const [scene, benefit] = steps.map(m => m.index);
        const endOfScene = html.indexOf('</details>', scene);
        assert.ok(benefit < endOfScene, 'the effect can be reached only after the scene is revealed');
        assert.ok(readableHtml(html.slice(0, scene)).includes(cases[why][0]));
        assert.ok(readableHtml(html.slice(scene, benefit)).includes(cases[why][1]));
        assert.match(html.slice(scene, benefit), /data-material-category="What"/);
        assert.match(html.slice(scene, benefit), /data-material-category="Where"/);
        assert.ok(readableHtml(html.slice(benefit, endOfScene)).includes(cases[why][2]));
      } else {
        assert.equal(article, undefined);
        assert.doesNotMatch(html, /data-case-reveal=|id="supportSentence"/);
        const examples = [...html.matchAll(/<(\w+)\b[^>]*\bdata-support-example="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)];
        assert.deepEqual(examples.map(match => match[2]), [why], 'one example matches the selected reason');
        const example = examples[0][3];
        const sentence = example.match(/<p\b[^>]*lang="en"[^>]*>([\s\S]*?)<\/p>/)?.[1] || '';
        const translation = example.match(/<p\b[^>]*lang="zh-Hant"[^>]*>([\s\S]*?)<\/p>/)?.[1] || '';
        assert.match(readableHtml(sentence), /\b[A-Za-z ]+[a-z][.!?]$/);
        assert.match(readableHtml(translation), /[\u4e00-\u9fff]/);
        assert.match(example, /data-material-category="(?:What|When|Where|Who|How)"/);
      }
      for (const [other, sentences] of Object.entries(cases)) {
        if (why !== other) for (const sentence of sentences) assert.ok(!text.includes(sentence));
      }
      assert.doesNotMatch(html, /<textarea\b|data-point-writing\b|data-point-adopt\b/);
      assert.match(html, /<button\b[^>]*\bdata-point-preset\b/);
      await lesson.placeSupport();
      assert.ok(Object.values(cases).flat().every(sentence => !supportLayer(lesson, slot).includes(sentence)));
    }
  }
  assert.deepEqual(plain(lesson.app.state.f), {});
  assert.deepEqual(plain(lesson.app.state.placed), {});
  await lesson.supportWhy('family');
  assert.match(lesson.app.stage4(), /<button\b[^>]*data-support-full-case/);
  await lesson.click({ 'data-support-full-case': '' });
  assert.equal(lesson.app.state.active, 6, 'a matched source links to the full case');
});

test('each support preset selects the materials for the displayed example in the current slot', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(4, false);
  const selectedBefore = plain(lesson.app.state.categoryPicks);
  await lesson.supportWhy('nature');
  await lesson.pointMaterial('B:model-what-walk');
  const firstPreview = pointPreview(lesson);
  await lesson.placeSupport();
  await lesson.supportSlot(2);
  const originals = {
    friends: ['After school, my friends and I could meet by the slides and play tag.', /^(?:the )?slides$/],
    active: ['After school, I could walk two laps around the lawn before heading home.', /^(?:the )?lawn$/],
    relax: ['For example, I can walk under the trees and listen to birds.', /^under the trees$/],
    nature: ['I could rest under the tall trees and watch the birds build their nests.', /^(?:the )?tall trees$/],
    family: ['On weekends, we can have a picnic on the grass and talk about our week.', /^on the grass$/]
  };
  for (const why of ['friends', 'active', 'relax', 'nature', 'family']) {
    await lesson.supportWhy(why);
    const html = lesson.app.stage4();
    const picture = html.match(/取自圖 ([AB]) 的 5W1H/)[1];
    const exampleMaterials = [...html.matchAll(/class="category-legend-item" data-material-category="([^"]+)">[^<]*<span lang="en">([^<]+)<\/span>/g)];
    assert.ok(exampleMaterials.length > 1, why + ' has a combination of materials');
    const expected = exampleMaterials.map(([, category, text]) => {
      const item = lesson.app.materialItems(picture).find(item => item.q === category && item.en === readableHtml(text));
      assert.ok(item, text + ' comes from the earlier material bank');
      return picture + ':' + item.id;
    }).sort();
    const sample = html.match(/data-case-role="scene"[^>]*>([\s\S]*?)<\/div>/)
      || html.match(/data-support-example="[^"]+"[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(sample, 'the selected example provides a sentence to reconstruct');
    const scene = sample[1].match(/<p lang="en"[^>]*>([\s\S]*?)<\/p>/)[1];
    const translation = sample[1].match(/<p lang="zh-Hant"[^>]*>([^<]+)<\/p>/)[1];
    const marks = pointMarks(scene);
    assert.equal(scene.replace(/<\/?mark\b[^>]*>/g, ''), originals[why][0],
      'inserting highlights preserves the exact original spacing and punctuation');
    assert.match(marks.find(mark => mark.category === 'Where')?.text || '', originals[why][1],
      'the marked location reflects the wording actually used in this scene');
    assert.deepEqual([...new Set(marks.map(mark => picture + ':' + mark.id))].sort(), expected,
      'the reference sentence marks the exact materials listed with its example');
    for (const mark of marks) {
      assert.equal(lesson.app.materialItems(picture).find(item => item.id === mark.id).q, mark.category);
    }

    await lesson.pointMode('explain');
    await lesson.pointMaterial('B:how-refreshed');
    await lesson.pointPreset();
    assert.deepEqual(pointChecks(lesson), expected);
    assert.equal(pointPreview(lesson), readableHtml(scene), 'the preset reconstructs the selected example');
    assert.deepEqual(pointMarks(pointPreviewMarkup(lesson)), marks, 'the preset and the reference color the same words');
    assert.equal(pointTranslation(lesson), readableHtml(translation), 'the preview uses the original Chinese translation');
    assert.doesNotMatch(lesson.app.stage4(), /例句把散步的路線寫成|再用 two laps 說明走了幾圈/);
    await lesson.pointPreset();
    assert.deepEqual(pointChecks(lesson), expected, 'reapplying the preset is idempotent');
    assert.ok(supportLayer(lesson, 1).includes(firstPreview), 'the other slot retains its placed text');
    assert.deepEqual(plain(lesson.app.state.categoryPicks), selectedBefore);
  }
  const family = pointPreview(lesson);
  await lesson.placeSupport();
  assert.ok(supportLayer(lesson, 2).includes(family));
  await lesson.supportSlot(1);
  assert.deepEqual(pointChecks(lesson), ['B:model-what-walk']);
  assert.equal(pointPreview(lesson), firstPreview);
  await lesson.byId('confirm').dispatch('click');
  await lesson.byId('next').dispatch('click');
  assert.equal(lesson.app.state.active, 5);
  const recap = readableHtml(lesson.byId('stage').innerHTML);
  assert.ok(recap.includes(firstPreview) && recap.includes(family), 'the ending includes both placed sentences');
});

test('manual 5W1H edits survive reason, slot and route changes and reach the hamburger only on placement', async () => {
  let lesson = loadLesson({
    active: 1, materialVersion: 4, supportVersion: 2,
    categoryPicks: { A: ['What'], B: ['What', 'When', 'Where'] },
    f: { openEn: 'My earlier opening.' }, placed: { openEn: true }
  });
  const originalPicks = plain(lesson.app.state.categoryPicks);
  async function useRoute(route) {
    lesson.app.navigate(3, false);
    await lesson.stanceRoute(route);
    lesson.app.navigate(4, false);
  }
  await useRoute('B');
  await lesson.supportWhy('relax');
  const picker = lesson.app.stage4();
  for (const picture of ['A', 'B']) {
    for (const [category] of lesson.app.qs) {
      const items = lesson.app.materialItems(picture).filter(item => item.q === category);
      assert.ok(items.length >= 2, picture + ' ' + category + ' offers alternatives');
      for (const item of items) {
        assert.ok(picker.includes('data-point-material="' + picture + ':' + item.id + '"'), item.en + ' is selectable');
        assert.ok(readableHtml(picker).includes(item.zh), 'the gloss from the earlier steps is present');
      }
    }
  }
  const walk = 'B:model-what-walk', afterSchool = 'B:when-school', weekends = 'B:when-weekend';
  await lesson.pointMaterial(walk);
  await lesson.pointMaterial(afterSchool);
  const original = pointPreview(lesson);
  assert.match(original, /\bwalk\b/i);
  assert.match(original, /\bafter school\b/i);
  await lesson.placeSupport();
  await lesson.pointMaterial(weekends);
  assert.deepEqual(pointChecks(lesson), [walk, weekends].sort(), 'new choices replace the same category');
  const revised = pointPreview(lesson);
  assert.match(revised, /weekends/i);
  assert.doesNotMatch(revised, /after school/i);
  assert.ok(supportLayer(lesson, 1).includes(original), 'the last placement survives preview changes');
  assert.ok(!supportLayer(lesson, 1).includes(revised));
  await lesson.pointMaterial(weekends, false);
  assert.deepEqual(pointChecks(lesson), [walk]);
  assert.doesNotMatch(pointPreview(lesson), /weekends/i);
  await lesson.pointMaterial(weekends);
  await lesson.pointMode('explain');
  const explanation = pointPreview(lesson);
  assert.notEqual(explanation, revised);
  assert.match(explanation, /walk(?:ing)?\b/i);
  assert.ok(supportLayer(lesson, 1).includes(original));
  await lesson.placeSupport();
  assert.ok(supportLayer(lesson, 1).includes(explanation));
  await lesson.supportWhy('friends');
  assert.deepEqual(pointChecks(lesson), []);
  await lesson.pointPreset();
  await lesson.supportWhy('relax');
  assert.equal(pointPreview(lesson), explanation);
  await lesson.placeSupport();
  await lesson.supportSlot(2);
  await lesson.supportWhy('relax');
  assert.deepEqual(pointChecks(lesson), []);
  await lesson.pointPreset();
  const second = pointPreview(lesson);
  await lesson.placeSupport();
  await useRoute('A');
  await lesson.supportSlot(1);
  await lesson.supportWhy('relax');
  assert.deepEqual(pointChecks(lesson), []);
  await useRoute('B');
  lesson = loadLesson(lesson.snapshot());
  assert.deepEqual(pointChecks(lesson), [walk, weekends].sort());
  assert.equal(pointPreview(lesson), explanation);
  assert.ok(supportLayer(lesson, 1).includes(explanation));
  assert.ok(supportLayer(lesson, 2).includes(second));
  assert.deepEqual(plain(lesson.app.state.categoryPicks), originalPicks);
});

test('Chinese previews track the chosen material and the writing mode, including an empty selection', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(4, false);
  await lesson.supportWhy('relax');
  assert.equal(pointTranslation(lesson), '');
  await lesson.pointMode('explain');
  assert.equal(pointTranslation(lesson), '');
  await lesson.pointMode('example');
  const keys = ['B:when-school', 'B:model-what-walk', 'B:model-where-there',
    'A:who-family', 'B:why-break', 'B:how-relaxed'];
  for (const key of keys) await lesson.pointMaterial(key);
  const example = pointTranslation(lesson);
  for (const detail of [/放學/, /散步/, /樹蔭?下/, /(?:父母|家長).*?(?:孩子|兒童)/, /課業|功課/, /放鬆|輕鬆/]) {
    assert.match(example, detail, 'the translation includes the selected detail');
  }
  await lesson.pointMode('explain');
  const explanation = pointTranslation(lesson);
  assert.notEqual(explanation, example);
  assert.match(explanation, /散步/);
  assert.match(explanation, /課業|功課/);
  await lesson.pointMaterial('B:when-weekend');
  assert.match(pointTranslation(lesson), /週末/);
  assert.doesNotMatch(pointTranslation(lesson), /放學/);
  await lesson.pointMaterial('B:when-weekend', false);
  for (const key of keys.slice(1)) await lesson.pointMaterial(key, false);
  assert.equal(pointTranslation(lesson), '', 'clearing the final material removes the old translation');
});

test('support sentences highlight only the selected source phrases even when their wording changes', async () => {
  const lesson = loadLesson();
  lesson.app.navigate(4, false);
  await lesson.supportWhy('relax');
  const marks = () => pointMarks(pointPreviewMarkup(lesson));
  assert.deepEqual(marks(), []);
  await lesson.pointMaterial('A:model-what-playing');
  assert.equal(pointPreview(lesson), 'I could play.');
  assert.deepEqual(marks(), [{ id: 'model-what-playing', category: 'What', text: 'play' }]);
  for (const key of ['B:when-school', 'A:model-where-slides', 'B:who-visitors', 'B:why-break', 'B:model-how-quiet']) {
    await lesson.pointMaterial(key);
  }
  const common = 'After school, I could play near the slides and climbing frames with other visitors';
  const atmosphere = " and take in the park's quiet atmosphere";
  const purpose = 'take a break from schoolwork';
  const sentences = {
    example: common + ' to ' + purpose + atmosphere + '.',
    explain: common + atmosphere + ', so I could ' + purpose + '.'
  };
  for (const [mode, sentence] of Object.entries(sentences)) {
    await lesson.pointMode(mode);
    assert.equal(pointPreviewMarkup(lesson).replace(/<\/?mark\b[^>]*>/g, '').replace(/&#39;/g, "'"), sentence);
    const expected = [
      ['when-school', 'When', 'After school'], ['model-what-playing', 'What', 'play'],
      ['model-where-slides', 'Where', 'slides and climbing frames'], ['who-visitors', 'Who', 'visitors'],
      ['model-how-quiet', 'How', 'quiet'], ['why-break', 'Why', mode === 'example' ? 'to ' + purpose : purpose]
    ];
    const actual = marks();
    assert.equal(actual.length, expected.length);
    for (const [id, category, text] of expected) {
      assert.deepEqual(actual.find(mark => mark.id === id), { id, category, text });
    }
    assert.ok(pointTranslation(lesson));
    await lesson.placeSupport();
    assert.equal(lesson.snapshot().supportPlans.pending[0].drafts.relax.placedSentence, sentence);
  }
  await lesson.pointMaterial('B:model-how-quiet', false);
  assert.ok(marks().every(mark => mark.category !== 'How'));
  assert.equal(marks().length, 5);
  assert.doesNotMatch(pointPreview(lesson), /quiet atmosphere/);
  await lesson.pointMaterial('A:what-slide');
  assert.ok(marks().every(mark => mark.id !== 'model-what-playing'));
  assert.equal(marks().find(mark => mark.id === 'what-slide').text, 'play on the slides');
  assert.equal(marks().find(mark => mark.id === 'model-where-slides').text, 'climbing frames');
});

test('the hamburger restores the colors of the placed sentence even when the current preview has changed', async () => {
  let lesson = loadLesson();
  lesson.app.navigate(4, false);
  await lesson.supportWhy('family');
  await lesson.pointPreset();
  const original = pointPreview(lesson);
  const originalMarks = pointMarks(pointPreviewMarkup(lesson));
  assert.ok(originalMarks.length > 1);
  function checkPlaced(sentence, marks) {
    assert.ok(supportLayer(lesson, 1).includes(sentence));
    assert.deepEqual(pointMarks(supportLayerMarkup(lesson, 1)), marks);
    assert.equal(lesson.snapshot().supportPlans.pending[0].drafts.family.placedSentence, sentence);
  }
  await lesson.placeSupport();
  checkPlaced(original, originalMarks);
  await lesson.pointMaterial('B:model-what-walk');
  await lesson.pointMode('explain');
  const revised = pointPreview(lesson);
  const revisedMarks = pointMarks(pointPreviewMarkup(lesson));
  assert.notEqual(revised, original);
  assert.notDeepEqual(revisedMarks, originalMarks);
  checkPlaced(original, originalMarks);
  lesson = loadLesson(lesson.snapshot());
  assert.equal(pointPreview(lesson), revised);
  checkPlaced(original, originalMarks);
  await lesson.placeSupport();
  checkPlaced(revised, revisedMarks);
  lesson = loadLesson(lesson.snapshot());
  checkPlaced(revised, revisedMarks);
});

test('the first hamburger colors the chosen picture sentences and Bonus across flips and reloads', async () => {
  let lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.selectOpening('pattern', 'activity');
  await lesson.selectOpening('focus', 'activities');
  await lesson.placeOpening();
  for (const picture of ['A', 'B']) {
    await lesson.picture(picture);
    await lesson.modelPreset();
  }
  await lesson.click({ 'data-material-next': '' });
  function layerMarkup(key) {
    const layer = [...lesson.app.burger(0).matchAll(/data-burger-sentence="([^"]+)"[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/g)]
      .find(match => match[1] === key);
    assert.ok(layer, 'the sentence face contains ' + key);
    return layer[2];
  }
  assert.equal(readableHtml(layerMarkup('openEn')), lesson.snapshot().f.openEn);
  assert.deepEqual(pointMarks(layerMarkup('openEn')).map(mark => mark.id),
    ['what-slide', 'model-what-walk', 'model-where-there']);
  for (const picture of ['A', 'B']) {
    await lesson.sentencePicture(picture);
    await lesson.fuse(picture);
    await lesson.adopt(picture);
    const key = picture.toLowerCase() + 'En';
    const model = lesson.app.MODEL_EXAMPLE[picture];
    assert.equal(readableHtml(layerMarkup(key)), ORIGINAL_MODEL[picture]);
    assert.deepEqual(pointMarks(layerMarkup(key)), pointMarks(lesson.app.renderSentenceParts(picture, model.parts)));
    assert.equal(lesson.snapshot().f[key], ORIGINAL_MODEL[picture]);
  }
  const combined = await lesson.adoptExample('B', 'combined');
  const example = lesson.app.sentenceExamples('B').find(item => item.id === 'combined');
  const exampleMarks = example.parts.flatMap(row => pointMarks(lesson.app.renderSentenceParts('B', row)));
  assert.equal(readableHtml(layerMarkup('bEn')), combined);
  assert.deepEqual(pointMarks(layerMarkup('bEn')), Array.from(exampleMarks));

  await lesson.toggleBonus();
  const colors = [
    [['How', 'lively', 'model-how-lively'], ['How', 'quiet', 'model-how-quiet']],
    [['What', 'play', 'model-what-playing'], ['What', 'walking', 'model-what-walk'], ['What', 'resting', 'model-what-rest']]
  ];
  for (const [index, expected] of colors.entries()) {
    await lesson.revealBonus(index + 1);
    await lesson.adoptBonus(index + 1);
    assert.equal(readableHtml(layerMarkup('bridgeEn')), BONUS_SENTENCES[index]);
    assert.deepEqual(pointMarks(layerMarkup('bridgeEn')).map(mark => [mark.category, mark.text, mark.id]), expected);
    assert.deepEqual(materialPointTones(layerMarkup('bridgeEn')), index === 0 ? ['1', '2'] : ['1', '2', '2']);
    assert.equal(lesson.snapshot().f.bridgeEn, BONUS_SENTENCES[index]);
  }
  const keys = ['openEn', 'aEn', 'bEn', 'bridgeEn'];
  const sentences = keys.map(layerMarkup);
  await lesson.click({ 'data-burger-flip': '' });
  assert.ok(lesson.app.burger(0).includes('data-burger-face="materials"'));
  await lesson.click({ 'data-burger-flip': '' });
  assert.deepEqual(keys.map(layerMarkup), sentences);
  lesson = loadLesson(lesson.snapshot());
  assert.deepEqual(keys.map(layerMarkup), sentences);
  const own = 'After school I watch the quiet ducks from a bench.';
  const oldDraft = lesson.snapshot();
  oldDraft.f.bridgeEn = own;
  oldDraft.placed.bridgeEn = false;
  lesson = loadLesson(oldDraft);
  assert.ok(!readableHtml(layerMarkup('bridgeEn')).includes(own));
  await lesson.click({ 'data-bonus-restore': '' });
  assert.equal(readableHtml(layerMarkup('bridgeEn')), own);
  assert.deepEqual(pointMarks(layerMarkup('bridgeEn')), [], 'coincidental words in a personal sentence have no source');
  lesson.app.navigate(1, false);
  await lesson.picture('B');
  await lesson.pick('Who', false);
  await lesson.click({ 'data-material-next': '' });
  await lesson.sentencePicture('B');
  await lesson.adoptExample('B', 'what', 1);
  assert.ok(readableHtml(layerMarkup('bEn')).includes('Visitors'));
  assert.deepEqual(pointMarks(layerMarkup('bEn')).map(mark => mark.id), ['what-picnic'],
    'a supplied subject without a selected Who material stays uncolored');
});

test('the second hamburger keeps the stance and both placed supports colored in the stance, reasons and ending steps', async () => {
  let lesson = loadLesson();
  lesson.app.navigate(1, false);
  await lesson.pick('What');
  await lesson.picture('B');
  await lesson.pick('Where');
  lesson.app.navigate(3, false);
  await lesson.stanceRoute('blend');
  await lesson.stanceMaterial('A', 'model-what-playing');
  await lesson.stanceMaterial('B', 'model-where-trees');
  const opening = 'I would prefer a park that lets me play and has tall trees.';
  assert.equal(stanceSentence(lesson), opening);
  assert.ok(!supportLayer(lesson, 0).includes(opening));
  await lesson.click({ 'data-stance-place': '' });
  const contents = [opening];
  const marks = [[
    { id: 'model-what-playing', category: 'What', text: 'play' },
    { id: 'model-where-trees', category: 'Where', text: 'tall trees' }
  ]];
  lesson.app.navigate(4, false);
  for (const [index, why] of ['relax', 'family'].entries()) {
    await lesson.supportSlot(index + 1);
    await lesson.supportWhy(why);
    await lesson.pointPreset();
    contents.push(pointPreview(lesson));
    marks.push(pointMarks(pointPreviewMarkup(lesson)));
    await lesson.placeSupport();
  }
  await lesson.pointMode('explain');
  assert.notEqual(pointPreview(lesson), contents[2]);
  for (const step of [3, 4, 5]) {
    lesson.app.navigate(step, false);
    lesson = loadLesson(lesson.snapshot());
    for (const [index, content] of contents.entries()) {
      const markup = supportLayerMarkup(lesson, index);
      assert.ok(readableHtml(markup).includes(content));
      assert.deepEqual(pointMarks(markup), marks[index], 'step ' + (step + 1) + ', layer ' + index);
    }
    assert.deepEqual(pointMarks(supportLayerMarkup(lesson, 3)), [], 'the ending instruction has no material source');
  }
});

test('previously written support remains readable until the learner places a replacement', async () => {
  const english = 'After school I could sit quietly by the pond.';
  const thought = '我可以在池塘邊坐一下。';
  const lesson = loadLesson({
    active: 4, materialVersion: 4, supportVersion: 2,
    supportPlans: { pending: [{ why: 'relax', placed: true, drafts: { relax: { thought, english } } }] }
  });
  assert.ok(readableHtml(lesson.app.stage4()).includes(english));
  assert.doesNotMatch(lesson.app.stage4(), /<textarea\b/);
  assert.ok(supportLayer(lesson, 1).includes(english));
  await lesson.pointPreset();
  const next = pointPreview(lesson);
  assert.ok(next && next !== english);
  const restored = loadLesson(lesson.snapshot());
  assert.ok(supportLayer(restored, 1).includes(english));
  assert.equal(pointPreview(restored), next);
  await restored.placeSupport();
  assert.ok(supportLayer(restored, 1).includes(next));
  assert.ok(!supportLayer(restored, 1).includes(english));
});

test('a previously adopted material-based support keeps its exact passage after upgrading and reloading', async () => {
  const legacy = {
    active: 4, route: 'B', materialVersion: 4, supportVersion: 2, supportSlot: 1,
    stancePlan: { chosen: true, B: 'model-where-trees', placed: false },
    categoryPicks: { A: [], B: ['Where', 'What'] },
    supportPlans: { B: [{ why: 'relax', detail: 'B:model-what-walk', placed: true }, { why: '', detail: '', placed: false }] },
    f: { reason1En: 'An older, separately saved reason.' }, placed: { reason1: true }
  };
  const previous = 'First, this park would help me relax. After school, I could walk under the tall trees and listen to the birds. I would go home feeling calmer and ready to concentrate again.';
  let lesson = loadLesson(legacy);
  for (let visit = 0; visit < 2; visit++) {
    assert.ok(supportLayer(lesson, 1).includes(previous));
    assert.ok(!supportLayer(lesson, 2).includes(previous));
    assert.deepEqual(plain(lesson.app.state.f), legacy.f);
    assert.deepEqual(plain(lesson.app.state.placed), legacy.placed);
    if (visit === 0) {
      lesson.app.save();
      lesson = loadLesson(lesson.snapshot());
    }
  }
});

test('the read-only guide preserves and displays an existing two-paragraph draft in the ending step', async () => {
  const earlier = {
    materialVersion: 4, supportVersion: 2, active: 5, done: Array(6).fill(true), route: 'A',
    categoryPicks: { A: [], B: ['What'] },
    f: { openEn: 'Two parks offer different settings.', aEn: 'One has slides.', bEn: 'The other has trees.',
      stanceEn: 'My park would have a playground.', reason1En: 'Climbing would help me build strength.',
      reason2En: 'On Sundays I could play there with my sister.', endingEn: 'I could exercise and enjoy time with my family.' },
    placed: { openEn: true, aEn: true, bEn: true, stanceEn: true, reason1: true, reason2: true, endingEn: true }
  };
  const lesson = loadLesson(earlier);
  const expected = [earlier.f.openEn, earlier.f.aEn, earlier.f.bEn].join(' ') + '\n\n' +
    [earlier.f.stanceEn, earlier.f.reason1En, earlier.f.reason2En, earlier.f.endingEn].join(' ');
  function checkArchive(view) {
    const rendered = view.byId('stage').innerHTML;
    assert.doesNotMatch(rendered, /<textarea\b|data-place=/);
    assert.match(rendered, /id="draftText"/);
    assert.match(rendered, /id="copyDraft"/);
    assert.ok(rendered.includes(expected) || view.byId('draftText').textContent === expected,
      'the original two paragraphs remain available verbatim');
  }
  checkArchive(lesson);
  lesson.app.navigate(3, false);
  await lesson.stanceRoute('B');
  await lesson.stanceMaterial('B', 'model-what-walk');
  lesson.app.navigate(4, false);
  await lesson.supportWhy('relax');
  await lesson.pointPreset();
  await lesson.placeSupport();
  lesson.app.navigate(5, false);
  checkArchive(loadLesson(lesson.snapshot()));
  assert.deepEqual(plain(lesson.app.state.f), earlier.f);
  assert.deepEqual(plain(lesson.app.state.placed), earlier.placed);
  lesson.app.navigate(2, false);
  await lesson.sentencePicture('B');
  await lesson.adoptExample('B', 'what', 1);
  lesson.app.navigate(5, false);
  checkArchive(loadLesson(lesson.snapshot()));

  const unfinished = loadLesson({ materialVersion: 4, supportVersion: 2, active: 5,
    f: { plan1: '可以一起散步', reason2En: 'On Sundays we meet by the pond.' }, placed: {} });
  const partial = unfinished.byId('stage').innerHTML;
  assert.ok(partial.includes('可以一起散步') && partial.includes('On Sundays we meet by the pond.'));
  assert.doesNotMatch(partial, /<textarea\b|data-place=/, 'an unfinished draft stays readable as notes');
});

test('a six-step save resumes at the ending and can read both case essays without changing either draft', async () => {
  const old = {
    materialVersion: 4, supportVersion: 2, active: 5, done: Array(6).fill(true),
    f: { openEn: 'My revised description.', aEn: 'A has slides.', stanceEn: 'I prefer slides.' },
    placed: { openEn: true, aEn: true, stanceEn: false },
    savedWriting: { f: { openEn: 'My earlier opening.', stanceEn: 'I prefer trees.' },
      placed: { openEn: true, stanceEn: true } },
    categoryPicks: { A: ['What'], B: ['Where'] }, checks: { both: true }
  };
  let lesson = loadLesson(old);
  const stableFields = ['f', 'placed', 'savedWriting', 'categoryPicks', 'checks'];
  const initial = plain(lesson.app.state);
  function checkWriting() {
    const current = plain(lesson.app.state);
    for (const key of stableFields) assert.deepEqual(current[key], initial[key], key);
  }
  function checkCase() {
    assert.equal(lesson.app.state.active, 6);
    const nav = lesson.byId('lessonNav').innerHTML;
    const selected = [...nav.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
      .filter(([, attrs]) => attrs.includes('aria-selected="true"'));
    assert.equal(selected.length, 1);
    assert.equal(readableHtml(selected[0][2]).replace(/\s/g, ''), '07案例文章');
    const screen = lesson.byId('stage').innerHTML;
    assert.match(readableHtml(screen), /STEP 07\s*\/\s*07\s*案例文章/);
    const versions = screen.split(/\bdata-case-version="(?:basic|advanced)"/).slice(1);
    assert.equal(versions.length, 2);
    assert.match(readableHtml(versions[0]), /基礎版/);
    for (const lang of ['en', 'zh-Hant']) {
      const paragraphs = [...versions[0].matchAll(/<p\b[^>]*lang="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)]
        .filter(([, language]) => language === lang);
      assert.equal(paragraphs.length, 2);
      assert.ok(paragraphs.every(([, , body]) => readableHtml(body).length > 0));
    }
    assert.ok(readableHtml(versions[1]).includes(old.f.openEn), 'the previously placed opening is available in the learner’s essay');
    assert.ok(!readableHtml(versions[1]).includes(old.savedWriting.f.openEn), 'the separate archive is not substituted');
    assert.doesNotMatch(screen, /<textarea\b|data-field=|data-place=|id="copyDraft"/);
    assert.equal(lesson.byId('next').hidden, true);
    assert.equal(lesson.byId('prev').disabled, false);
    checkWriting();
  }

  assert.equal(lesson.app.state.active, old.active);
  assert.deepEqual(initial.done, [...old.done, false]);
  assert.deepEqual(initial.f, old.f);
  assert.deepEqual(initial.savedWriting.f, old.savedWriting.f);
  assert.match(lesson.byId('progressText').textContent, /6\s*\/\s*7/);
  assert.equal(lesson.byId('next').hidden, false);
  await lesson.byId('next').dispatch('click');
  checkCase();
  lesson = loadLesson(lesson.snapshot());
  checkCase();
  assert.deepEqual(plain(lesson.app.state.done), [...old.done, false], 'visiting or reloading does not mark it read');
  await lesson.byId('prev').dispatch('click');
  assert.equal(lesson.app.state.active, 5);
  assert.ok(lesson.byId('stage').innerHTML.includes(old.savedWriting.f.openEn), 'the ending still offers the archived draft');

  const nav = lesson.byId('lessonNav');
  await nav.dispatch('click', element('button', { 'data-step': '6' }));
  checkCase();
  for (const [key, expected] of [['ArrowRight', 0], ['End', 6], ['Home', 0], ['ArrowLeft', 6]]) {
    await nav.dispatch('keydown', nav, { key });
    assert.equal(lesson.app.state.active, expected, key + ' reaches the expected tab');
    assert.equal(lesson.focusEvents.at(-1).id, 'step-' + expected);
  }
  await lesson.byId('confirm').dispatch('click');
  lesson = loadLesson(lesson.snapshot());
  checkCase();
  assert.deepEqual(plain(lesson.app.state.done), Array(7).fill(true));
  assert.match(lesson.byId('progressText').textContent, /7\s*\/\s*7/);
});

test('the learner’s case assembles placed sentences, reasons and translations and follows changes of route and draft', async () => {
  let lesson = loadLesson();
  function readCase() {
    lesson.app.navigate(6, false);
    const markup = lesson.byId('stage').innerHTML.split('data-case-version="advanced"')[1];
    const paragraphs = lang => [...markup.matchAll(new RegExp(`<p\\b[^>]*lang="${lang}"[^>]*>([\\s\\S]*?)</p>`, 'g'))]
      .map(([, body]) => readableHtml(body));
    return { text: readableHtml(markup), en: paragraphs('en'), zh: paragraphs('zh-Hant') };
  }
  const empty = readCase();
  assert.deepEqual(empty.en, []);
  assert.deepEqual(empty.zh, []);
  assert.match(empty.text, /(?:選|放進|採用|完成|回到)/);
  for (const missing of ['開頭', '圖 A', '圖 B', '重點一', '重點二', '結尾']) assert.ok(empty.text.includes(missing), missing);
  assert.doesNotMatch(empty.text, /My ideal park would resemble|The pictures show two different types of parks/);

  await prepareParagraphOne(lesson);
  await lesson.toggleBonus();
  await lesson.revealBonus(2);
  await lesson.adoptBonus(2);
  const first = ['openEn', 'aEn', 'bEn', 'bridgeEn'].map(key => lesson.app.state.f[key]).join(' ');
  assert.equal(readCase().en[0], first);
  lesson.app.navigate(3, false);
  await lesson.stanceRoute('blend');
  await lesson.stanceMaterial('A', 'model-where-playground');
  await lesson.stanceMaterial('B', 'model-what-walk');
  await lesson.stanceStarter('believe');
  const opening = stanceSentence(lesson);
  await lesson.click({ 'data-stance-place': '' });
  lesson.app.navigate(4, false);
  const points = [];
  const translations = [];
  for (const [slot, why, mode] of [[1, 'friends', 'example'], [2, 'active', 'explain']]) {
    await lesson.supportSlot(slot);
    await lesson.supportWhy(why);
    await lesson.pointPreset();
    await lesson.pointMode(mode);
    points.push(pointPreview(lesson));
    translations.push(pointTranslation(lesson));
    await lesson.placeSupport();
  }
  lesson.app.navigate(5, false);
  const chooseClosing = (slot, index) => lesson.change({ type: 'radio', 'data-ending-phrase': String(slot), value: String(index) });
  await chooseClosing(1, 1);
  await chooseClosing(2, 1);
  const ending = 'To sum up, my ideal park would offer space to get together with friends and get some exercise by walking.';
  await lesson.click({ 'data-ending-place': '' });
  await chooseClosing(1, 0);
  const complete = readCase();
  assert.equal(complete.en[0], first);
  assert.equal(complete.en.length, 2);
  assert.equal(complete.zh.length, 2);
  assert.ok(complete.zh[0].startsWith(lesson.app.currentOpeningExample().zh));
  assert.ok(complete.zh[0].endsWith('圖 A 中有一座色彩繽紛的遊樂場，裡面有溜滑梯和攀爬架。人們可以散步或休息。一座公園提供玩耍的場所，另一座則提供散步和休息的空間。'));
  const second = complete.en[1];
  assert.ok(second.startsWith(opening));
  assert.ok(second.endsWith(ending));
  assert.ok(second.indexOf(points[0]) >= opening.length && second.indexOf(points[1]) > second.indexOf(points[0]));
  assert.match(second.slice(opening.length, second.indexOf(points[0])), /friend/i);
  assert.match(second.slice(second.indexOf(points[0]) + points[0].length, second.indexOf(points[1])), /exercis|active/i);
  for (const text of translations) assert.ok(text && complete.zh[1].includes(text), text);

  lesson.app.navigate(4, false);
  await lesson.pointMode('example');
  const replacement = pointPreview(lesson);
  assert.notEqual(replacement, points[1]);
  assert.deepEqual(readCase(), complete, 'changing the preview keeps the previously placed support and ending');
  lesson = loadLesson(lesson.snapshot());
  assert.deepEqual(readCase(), complete);
  lesson.app.navigate(4, false);
  await lesson.placeSupport();
  const revised = readCase();
  assert.equal(revised.en[0], first);
  assert.ok(revised.en[1].includes(replacement));
  assert.ok(!revised.en[1].includes(points[1]) && !revised.en[1].includes(ending));
  lesson.app.navigate(3, false);
  await lesson.stanceRoute('A');
  const switched = readCase();
  assert.equal(switched.en[0], first);
  assert.ok(!switched.text.includes(replacement) && !switched.text.includes(points[0]));
  lesson.app.navigate(3, false);
  await lesson.stanceRoute('blend');
  assert.ok(readCase().text.includes(replacement));
  lesson.app.navigate(2, false);
  await lesson.removeBonus();
  assert.equal(readCase().en[0], first.replace(' ' + BONUS_SENTENCES[1], ''));
});

test('the basic essay ends paragraph one with the requested comparison once in each language', () => {
  const lesson = loadLesson();
  lesson.app.navigate(6, false);
  const screen = lesson.byId('stage').innerHTML;
  const basic = screen.match(/<article\b[^>]*data-case-version="basic"[^>]*>([\s\S]*?)<\/article>/)[1];
  const en = 'Overall, Picture A shows a lively playground, while Picture B presents a quiet place to relax.';
  const zh = '整體而言，圖 A 呈現熱鬧的遊樂場，而圖 B 呈現安靜的休憩場所。';
  for (const [language, closing, first, second] of [
    ['en', en, 'a lively playground', 'a quiet place to relax'],
    ['zh-Hant', zh, '熱鬧的遊樂場', '安靜的休憩場所']
  ]) {
    const paragraph = basic.match(new RegExp(`<p lang="${language}">([\\s\\S]*?)</p>`))[1];
    assert.equal(readableHtml(screen).split(closing).length - 1, 1);
    assert.ok(readableHtml(paragraph).endsWith(closing));
    const closingMarkup = paragraph.slice(paragraph.indexOf(closing.split(/[,，]/)[0]));
    const highlights = [...closingMarkup.matchAll(/<(?:span|mark)\b[^>]*data-point-tone="(\d)"[^>]*>([^<]+)<\/(?:span|mark)>/g)];
    assert.deepEqual(highlights.map(([, tone, text]) => [tone, text]), [['1', first], ['2', second]]);
  }
  assert.equal(readableHtml(basic.match(/<p lang="en">([\s\S]*?)<\/p>/)[1]),
    `The pictures show two different types of parks. ${ORIGINAL_MODEL.A} ${ORIGINAL_MODEL.B} ${en}`);
});

test('old full A/B examples regain their location phrases and source marks without rewriting archived or personal sentences', () => {
  const a='In Picture A, there is a colorful playground with slides and climbing frames. Children are playing there, and the park looks lively.';
  const b='In contrast, Picture B shows tall trees and a large green lawn. People can walk or rest there, and the park looks quiet.';
  const saved={active:2,materialVersion:4,supportVersion:2,f:{aEn:a,bEn:b,endingEn:'My old closing.'},
    placed:{aEn:true,bEn:true},pictureSentenceSources:{A:{text:a,categories:['Where','What']}}};
  let lesson=loadLesson(saved);
  assert.equal(lesson.app.state.pictureSentenceSources.A.text,ORIGINAL_MODEL.A);
  for(let visit=0;visit<2;visit++){
    assert.deepEqual(plain(lesson.app.state.savedWriting.f),saved.f);
    const cards=lesson.app.renderBonusSources(),burger=lesson.app.burger(0),excerpts=lesson.app.stage2();
    for(const [picture,place] of [['A','in the playground'],['B','under the trees']]){
      const field=picture.toLowerCase()+'En';
      assert.equal(lesson.app.state.f[field],ORIGINAL_MODEL[picture]);
      assert.equal(lesson.app.state.placed[field],true);
      const quote=new RegExp('data-bonus-evidence="'+picture+'" data-evidence-source="student">[\\s\\S]*?class="bonus-quote"[^>]*>([\\s\\S]*?)</p>','g');
      assert.ok([...excerpts.matchAll(quote)].some(([,html])=>pointMarks(html).some(mark=>mark.text===place)));
      for(const html of [burger,cards])assert.ok(pointMarks(html).some(mark=>mark.category==='Where'&&mark.text===place));
    }
    lesson.app.save();lesson=loadLesson(lesson.snapshot());
  }
  const personal=a.replace('looks lively','looks lively after school');
  const originalArchive={f:{...saved.f,aEn:'My own archived description.'},placed:saved.placed};
  const mixed=loadLesson({...saved,f:{...saved.f,aEn:personal},savedWriting:originalArchive});
  assert.equal(mixed.app.state.f.aEn,personal);
  assert.equal(mixed.app.state.f.bEn,ORIGINAL_MODEL.B);
  assert.deepEqual(plain(mixed.app.state.savedWriting.f),originalArchive.f);
  const row=mixed.app.burger(0).match(/data-burger-sentence="aEn">([\s\S]*?)<\/p>/)[1];
  assert.ok(readableHtml(row).includes(personal));
  assert.deepEqual(pointMarks(row),[]);
});

test('Bonus is optional and its display and reveals never select, place, or invalidate writing', async () => {
  const lesson = loadLesson();
  await prepareParagraphOne(lesson);
  assert.equal(lesson.app.state.bonusOpen, false);
  assert.deepEqual(plain(lesson.app.state.bonusRevealed), [false, false]);
  assert.equal(lesson.app.validate(), '', 'the normal opening and A/B sentences complete the step without Bonus');
  await lesson.byId('confirm').dispatch('click');
  assert.equal(lesson.app.state.done[2], true);
  lesson.app.state.done[3] = true;
  lesson.app.state.done[4] = true;
  lesson.app.state.checks = { support: true };
  const before = plain(lesson.app.state);
  await lesson.toggleBonus();
  assert.equal(lesson.app.state.bonusOpen, true);
  await lesson.adoptBonus(1);
  assert.equal(lesson.app.state.f.bridgeEn, undefined, 'an unrevealed example cannot silently replace the draft');
  await lesson.revealBonus(2);
  assert.deepEqual(plain(lesson.app.state.bonusRevealed), [false, true], 'the second example can be revealed independently');
  await lesson.revealBonus(2);
  assert.deepEqual(plain(lesson.app.state.bonusRevealed), [false, true], 'revealing an example is one way');
  await lesson.revealBonus(1);
  for (const sentence of BONUS_SENTENCES) assert.ok(readableHtml(lesson.app.stage2()).includes(sentence),
    'the revealed examples preserve the requested wording');
  for (const key of ['f', 'placed', 'done', 'checks', 'categoryPicks', 'categoryOpen']) {
    assert.deepEqual(plain(lesson.app.state[key]), before[key], `opening or revealing Bonus leaves ${key} unchanged`);
  }
  assert.equal((lesson.app.burger(0).match(/data-layer="[0-3]"/g) || []).length, 4,
    'the paragraph hamburger retains all four structural layers');
  assert.match(readableHtml(lesson.app.burger(0)), /Bonus.*可選/,
    'the first hamburger identifies the optional comparison layer');
  assert.match(readableHtml(lesson.app.burger(0)), /可略過/);
  assert.doesNotMatch(readableHtml(lesson.app.burger(1)), /Bonus|可略過/,
    'the required ending in the second hamburger is not relabeled as optional');
  assert.match(lesson.app.stage2(), /data-switch="sentence"[^>]*data-value="A"/);
  assert.match(lesson.app.stage2(), /data-switch="sentence"[^>]*data-value="B"/);
  await lesson.toggleBonus();
  assert.equal(lesson.app.state.bonusOpen, false);
  assert.deepEqual(plain(lesson.app.state.done), before.done);
  assert.equal(lesson.app.validate(), '', 'the Bonus section can always be skipped');
});

test('the two Bonus examples trace their own A/B excerpts into a comparison and keep their live source labels accurate', async () => {
  const ownBonus = 'The two parks suit different moods.';
  const lesson = loadLesson({f:{bridgeEn:ownBonus}, bonusOpen:false, materialVersion:4, supportVersion:2});
  lesson.app.navigate(1, false);
  await lesson.prepareOpening();
  await lesson.modelPreset();
  await lesson.picture('B');
  await lesson.modelPreset();
  await lesson.click({ 'data-material-next': '' });
  await lesson.toggleBonus();
  await lesson.revealBonus(1);
  await lesson.revealBonus(2);
  const teaching = [
    { number: 1, aspect: /氣氛|氛圍/,
      A: { excerpt: /looks lively/i, point: /lively|熱鬧|活潑/i },
      B: { excerpt: /looks quiet/i, point: /quiet|安靜|寧靜/i } },
    { number: 2, aspect: /用途|活動|功能/,
      A: { excerpt: /are playing/i, point: /\bplay(?:ing)?\b|玩耍|遊玩/i },
      B: { excerpt: /walk or rest/i, point: /\bwalk(?:ing)?\b|散步/i } }
  ];

  function checkEvidence(markup, card, expected) {
    const entries = [...markup.matchAll(/<[^<>]*\bdata-bonus-evidence="([AB])"[^<>]*>/g)];
    assert.deepEqual(entries.map(match => match[1]), ['A', 'B'], 'each card has both pictures');
    entries.forEach((match, index) => {
      const picture = match[1];
      const source = match[0].match(/\bdata-evidence-source="(student|model)"/)?.[1];
      assert.equal(source, expected[picture], 'card ' + card.number + ', picture ' + picture);
      const rowHtml = markup.slice(match.index + match[0].length, entries[index + 1]?.index);
      const row = readableHtml(rowHtml);
      const quote = rowHtml.match(/class="bonus-quote"[^>]*>([\s\S]*?)<\/p>/)[1];
      const takeaway = rowHtml.match(/class="bonus-takeaway"[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/)[1];
      const activity = card.number === 2;
      const verbs = picture === 'A' ? ['play'] : ['walking','resting'];
      const adjective = picture === 'A' ? 'lively' : 'quiet';
      assert.deepEqual(pointMarks(takeaway).map(mark => mark.text), activity ? verbs : [adjective]);
      const tone = picture === 'A' ? '1' : '2';
      assert.ok(materialPointTones(takeaway).every(value => value === tone));
      assert.doesNotMatch(quote, /data-point-tone=/, 'the quoted source keeps the 5W1H colors');
      const sourceIds = pointMarks(quote).map(mark => mark.id);
      if(activity){
        assert.ok(sourceIds.includes(picture === 'A' ? 'model-what-playing' : 'model-what-walk'));
        assert.ok(sourceIds.includes('model-where-there'));
      }else{
        assert.deepEqual(sourceIds, ['model-how-' + adjective]);
      }
      assert.match(row, card[picture].excerpt, 'the evidence includes wording found in that picture’s original sentence');
      assert.match(row.replace(card[picture].excerpt, ''), card[picture].point, 'the extracted key point is explained separately');
      assert.match(row, source === 'model' ? /示範|範例|參考|範文/ : /你|我的|自己|目前|已帶入/,
        'the source is also identified in the text students can read');
    });
  }

  const screen = lesson.app.stage2();
  for (const card of teaching) {
    const body = screen.split('id="bonusEvidence-' + card.number + '"')[1]
      ?.split('id="bonusEvidence-' + (card.number + 1) + '"')[0];
    assert.ok(body, 'the card shows its own evidence');
    const rationaleAt = body.indexOf('id="bonusRationale-' + card.number + '"');
    assert.ok(rationaleAt > 0, 'the explanation follows the source material');
    checkEvidence(body.slice(0, rationaleAt), card, { A: 'model', B: 'model' });
    const preview = body.match(/class="bonus-example-en"[^>]*>([\s\S]*?)<\/p>/)[1];
    assert.deepEqual(materialPointTones(preview), card.number === 1 ? ['1', '2'] : ['1', '2', '2']);
    assert.doesNotMatch(preview, /<(?!mark\b)\w+\b[^>]*data-point-tone/, 'the comparison frame has no source color');
    const afterEvidence = readableHtml(body.slice(rationaleAt));
    const finalAt = afterEvidence.indexOf(BONUS_SENTENCES[card.number - 1]);
    assert.ok(finalAt > 0, 'the unchanged comparison sentence comes after the explanation');
    const rationale = afterEvidence.slice(0, finalAt);
    assert.match(rationale, card.aspect);
    assert.match(rationale, /\bwhile\b/i);
    assert.match(rationale, /對照|對比|差異|差別|不同|而/);
  }

  const stable = plain(lesson.app.state);
  function checkLive(atmosphereSources, activitySources = atmosphereSources) {
    for (const card of teaching) {
      checkEvidence(lesson.byId('bonusEvidence-' + card.number).innerHTML, card,
        card.number === 1 ? atmosphereSources : activitySources);
    }
    assert.equal(lesson.app.state.f.bridgeEn, ownBonus);
    for (const key of ['bonusOpen', 'bonusRevealed', 'categoryPicks', 'checks']) {
      assert.deepEqual(plain(lesson.app.state[key]), stable[key], 'refreshing evidence preserves ' + key);
    }
  }
  await lesson.fuse('A');
  await lesson.adopt('A');
  checkLive({ A: 'student', B: 'model' });
  await lesson.sentencePicture('B');
  await lesson.fuse('B');
  await lesson.adopt('B');
  checkLive({ A: 'student', B: 'student' });
  const cards = [...lesson.app.renderBonusSources().matchAll(/data-bonus-source="([AB])">([\s\S]*?)<\/section>/g)];
  assert.deepEqual(cards.map(match => match[1]), ['A', 'B']);
  for (const [, picture, card] of cards) {
    const [sentence, materials] = card.split('<details>');
    assert.deepEqual([...new Set(pointMarks(sentence).map(mark => mark.category))].sort(), ['How', 'What', 'Where', 'Who']);
    assert.doesNotMatch(sentence, /data-point-tone=/, `picture ${picture} keeps its 5W1H sentence colors`);
    assert.match(materials, /<ul lang="en"><li>/);
    assert.deepEqual(pointMarks(materials), [], 'the optional word list uses plain text');
  }
  await lesson.sentencePicture('A');
  await lesson.adoptExample('A', 'how');
  checkLive({ A: 'student', B: 'student' }, { A: 'model', B: 'student' });
  const revisedA = await lesson.adoptExample('A', 'how', 1);
  checkLive({ A: 'model', B: 'student' });
  assert.equal(lesson.app.state.f.aEn, revisedA);
  assert.equal(lesson.app.state.f.bEn, ORIGINAL_MODEL.B);
  await lesson.sentencePicture('B');
  const revisedB = await lesson.adoptExample('B', 'who');
  checkLive({ A: 'model', B: 'model' });
  assert.equal(lesson.app.state.f.aEn, revisedA);
  assert.equal(lesson.app.state.f.bEn, revisedB);
});

test('either Bonus example places directly, can replace the other, and remains optional', async () => {
  const lesson = loadLesson();
  await prepareParagraphOne(lesson);
  await lesson.toggleBonus();
  await lesson.revealBonus(1);
  await lesson.revealBonus(2);
  lesson.app.state.done.fill(true);
  const before = plain(lesson.app.state.f);
  await lesson.adoptBonus(2);
  assert.equal(lesson.app.state.f.bridgeEn, BONUS_SENTENCES[1]);
  assert.equal(lesson.app.state.placed.bridgeEn, true);
  assert.deepEqual(plain(lesson.app.state.done), [true, true, false, true, true, true, true],
    'adopting a Bonus changes the writing exercise but preserves all later reading confirmations');
  for (const key of ['openEn', 'aEn', 'bEn']) assert.equal(lesson.app.state.f[key], before[key]);
  assert.doesNotMatch(lesson.app.stage2(), /data-field="bridgeEn"|data-place="bridgeEn"/);
  assert.ok(lesson.app.draftText().includes(BONUS_SENTENCES[1]));
  assert.ok(readableHtml(lesson.byId('liveBurger').innerHTML).includes(BONUS_SENTENCES[1]));
  const placedState = plain(lesson.app.state);
  await lesson.toggleBonus();
  assert.equal(lesson.app.state.bonusOpen, false);
  assert.equal(lesson.app.state.placed.bridgeEn, true, 'closing the optional teaching panel never withdraws a placed sentence');
  assert.equal(lesson.app.state.f.bridgeEn, BONUS_SENTENCES[1]);
  assert.deepEqual(plain(lesson.app.state.done), placedState.done);
  assert.ok(lesson.app.draftText().includes(BONUS_SENTENCES[1]));
  await lesson.toggleBonus();
  await lesson.removeBonus();
  assert.equal(lesson.app.state.placed.bridgeEn, false);
  assert.equal(lesson.app.state.f.bridgeEn, BONUS_SENTENCES[1], 'removal preserves saved writing');
  assert.ok(!lesson.app.draftText().includes(BONUS_SENTENCES[1]));
  assert.ok(!readableHtml(lesson.byId('liveBurger').innerHTML).includes(BONUS_SENTENCES[1]));
  assert.equal(lesson.app.state.placed.aEn, true);
  assert.equal(lesson.app.state.placed.bEn, true);
  assert.equal(lesson.app.validate(), '', 'removing the optional sentence does not make the paragraph incomplete');
  await lesson.adoptBonus(1);
  assert.equal(lesson.app.state.f.bridgeEn, BONUS_SENTENCES[0]);
  assert.equal(lesson.app.state.placed.bridgeEn, true);
  await lesson.adoptBonus(2);
  assert.equal(lesson.app.state.f.bridgeEn, BONUS_SENTENCES[1]);
  assert.ok(!lesson.app.draftText().includes(BONUS_SENTENCES[0]));
});

test('Bonus sources follow current A/B work, and saved visibility, reveals, and older drafts are preserved', async () => {
  let lesson = loadLesson();
  await prepareParagraphOne(lesson);
  await lesson.toggleBonus();
  await lesson.revealBonus(2);
  const initialSources = readableHtml(lesson.app.renderBonusSources());
  assert.ok(initialSources.includes(lesson.app.state.f.aEn));
  assert.ok(initialSources.includes(lesson.app.state.f.bEn));
  for (const picture of ['A', 'B']) for (const material of lesson.app.selectedMaterials(picture)) {
    assert.ok(initialSources.includes(material.en), 'Bonus sources use the actual selected materials from each picture');
  }
  const bonusDraft = 'My own optional comparison.';
  const withPreviousComparison = lesson.snapshot();
  withPreviousComparison.f.bridgeEn = bonusDraft;
  withPreviousComparison.placed.bridgeEn = true;
  lesson = loadLesson(withPreviousComparison);
  assert.equal(lesson.app.state.placed.bridgeEn, true);
  const oldA = lesson.app.state.f.aEn;
  await lesson.sentencePicture('A');
  await lesson.adoptExample('A', 'where');
  assert.equal(lesson.app.state.placed.bridgeEn, true, 'an unchanged A string does not withdraw the existing Bonus');
  const revisedA = await lesson.adoptExample('A', 'where', 1);
  assert.equal(lesson.app.state.placed.bridgeEn, false, 'a changed A sentence requires checking the existing Bonus again');
  assert.equal(lesson.app.state.f.bridgeEn, bonusDraft);
  assert.equal(lesson.app.state.bonusNeedsReview, true);
  const updatedSources = readableHtml(lesson.byId('bonusSources').innerHTML);
  assert.ok(updatedSources.includes(revisedA), 'editing A updates the displayed Bonus source immediately');
  assert.ok(!updatedSources.includes(oldA));
  assert.ok(updatedSources.includes(lesson.app.state.f.bEn));
  assert.equal(lesson.app.state.placed.aEn, true, 'the chosen replacement is placed immediately');
  await lesson.click({ 'data-bonus-restore': '' });
  assert.equal(lesson.app.state.bonusNeedsReview, false);
  await lesson.click({ 'data-model-opening-adopt': '' });
  assert.equal(lesson.app.state.f.openEn, ORIGINAL_MODEL.opening);
  assert.equal(lesson.app.state.placed.bridgeEn, true, 'changing just the opening does not withdraw the Bonus comparison');
  lesson.app.navigate(1, false);
  await lesson.picture('B');
  await lesson.pick('When');
  assert.equal(lesson.app.state.placed.bridgeEn, true, 'changing materials alone leaves the comparison sentence placed');
  lesson.app.navigate(2, false);
  for (const material of lesson.app.selectedMaterials('B').filter(item => item.q === 'When')) {
    assert.ok(readableHtml(lesson.app.renderBonusSources()).includes(material.en),
      'returning after material changes uses the latest B choices');
  }
  await lesson.sentencePicture('B');
  await lesson.click({ 'data-model-preset': '', 'data-picture': 'B' });
  assert.equal(lesson.app.state.placed.bridgeEn, true, 'a category preset does not replace either A/B sentence or the Bonus');
  await lesson.fuse('B');
  await lesson.adopt('B');
  assert.equal(lesson.app.state.placed.bridgeEn, false, 'adopting a different B sentence also withdraws the comparison');
  assert.equal(lesson.app.state.f.bridgeEn, bonusDraft);
  assert.equal(lesson.app.state.bonusNeedsReview, true);
  assert.ok(readableHtml(lesson.app.renderBonusSources()).includes(ORIGINAL_MODEL.B));
  await lesson.click({ 'data-bonus-restore': '' });
  await lesson.adopt('B');
  assert.equal(lesson.app.state.placed.bridgeEn, true, 're-adopting an identical B sentence has no comparison side effect');
  lesson.app.save();
  const restored = loadLesson(lesson.snapshot());
  assert.equal(restored.app.state.bonusOpen, true);
  assert.deepEqual(plain(restored.app.state.bonusRevealed), [false, true]);
  assert.equal(restored.app.state.f.bridgeEn, 'My own optional comparison.');
  await restored.toggleBonus();
  const closed = loadLesson(restored.snapshot());
  assert.equal(closed.app.state.bonusOpen, false, 'an explicitly saved closed state remains closed');
  assert.equal(closed.app.state.f.bridgeEn, 'My own optional comparison.');
  const legacy = lesson.snapshot();
  delete legacy.bonusOpen;
  delete legacy.bonusRevealed;
  legacy.f.bridgeEn = 'My existing comparison must survive.';
  legacy.placed.bridgeEn = true;
  const migrated = loadLesson(legacy);
  assert.equal(migrated.app.state.bonusOpen, true, 'an old optional draft is exposed instead of being hidden without notice');
  assert.deepEqual(plain(migrated.app.state.bonusRevealed), [false, false]);
  assert.equal(migrated.app.state.f.bridgeEn, legacy.f.bridgeEn);
  assert.equal(migrated.app.state.placed.bridgeEn, true);
  await migrated.revealBonus(1);
  await migrated.revealBonus(2);
  assert.equal(migrated.app.state.f.bridgeEn, legacy.f.bridgeEn, 'revealing examples does not overwrite the older personal comparison');
});

test('the closing lesson uses the two placed examples, offers matching phrases and keeps placement separate from preview', async () => {
  const modelClosing='To sum up, my ideal park would offer space to relax and enjoy time with my family.';
  const translation='總結來說，我的理想公園會提供讓我放鬆、享受家人相處時光的空間。';
  const lesson=loadLesson();
  const choose=(slot,choice)=>lesson.change({type:'radio','data-ending-phrase':String(slot),value:String(choice)});
  lesson.app.navigate(5,false);
  assert.match(lesson.byId('stage').innerHTML,/data-ending-support="1"/);
  assert.match(lesson.byId('stage').innerHTML,/data-ending-support="2"/);
  assert.doesNotMatch(lesson.byId('stage').innerHTML,/data-ending-place/);
  const demo=lesson.byId('stage').innerHTML.match(/<details[^>]*><summary>看範文怎麼從兩個例子寫到結尾<\/summary>([\s\S]*?)<\/details>/)[1];
  assert.ok(readableHtml(demo).includes(modelClosing),'the full demonstration is available before both points are written');
  assert.deepEqual([...demo.matchAll(/<mark\b[^>]*data-point-tone="(1|2)"[^>]*>([^<]*)<\/mark>/g)].map(m=>[m[1],m[2]]),
    [['1','relax'],['2','enjoy time with my family'],['1','relax'],['2','enjoy time with my family']]);
  for(const [slot,why] of [[2,'family'],[1,'relax']]){
    await lesson.click({'data-ending-support':String(slot)});
    assert.equal(lesson.app.state.active,4);
    assert.equal(lesson.app.state.supportSlot,slot);
    await lesson.supportWhy(why);
    await lesson.pointPreset();
    await lesson.placeSupport();
    lesson.app.navigate(5,false);
  }
  const recap=readableHtml(lesson.byId('stage').innerHTML);
  assert.ok(recap.includes('For example, I can walk under the trees and listen to birds.'));
  assert.ok(recap.includes('On weekends, we can have a picnic on the grass and talk about our week.'));
  assert.ok(recap.includes('unwind on a walk') && recap.includes('share a picnic with my family'));
  await choose(1,0);
  assert.doesNotMatch(lesson.byId('endingPreview').innerHTML,/data-ending-place/);
  await choose(2,0);
  assert.ok(readableHtml(lesson.byId('endingPreview').innerHTML).includes(modelClosing));
  assert.deepEqual(pointMarks(lesson.byId('endingPreview').innerHTML).map(({id})=>id),['ending-relax-general','ending-family-general']);
  assert.match(lesson.byId('endingPreview').innerHTML,/<mark\b[^>]*data-point-tone="1"[^>]*>relax<\/mark> and <mark\b[^>]*data-point-tone="2"[^>]*>enjoy time with my family<\/mark>/);
  assert.ok(lesson.byId('endingPreview').innerHTML.includes(translation));
  assert.ok(!supportLayer(lesson,3).includes(modelClosing));
  await lesson.click({'data-ending-place':''});
  assert.ok(supportLayer(lesson,3).includes(modelClosing));
  assert.deepEqual([...supportLayerMarkup(lesson,3).matchAll(/data-point-tone="(1|2)"/g)].map(m=>m[1]),['1','2']);
  await choose(1,1);
  assert.ok(readableHtml(lesson.byId('endingPreview').innerHTML).includes('to unwind on a walk and enjoy time with my family.'));
  assert.ok(supportLayer(lesson,3).includes(modelClosing),'choosing another phrase does not replace the adopted closing');
  const restored=loadLesson(lesson.snapshot());
  assert.ok(supportLayer(restored,3).includes(modelClosing));
  assert.ok(readableHtml(restored.byId('stage').innerHTML).includes('to unwind on a walk and enjoy time with my family.'));
  restored.app.navigate(3,false);
  await restored.stanceRoute('B');
  assert.ok(supportLayer(restored,3).includes(modelClosing),'a closing composed before the stance follows the same two points');
  await restored.stanceRoute('A');
  assert.ok(!supportLayer(restored,3).includes(modelClosing));
  await restored.stanceRoute('B');
  assert.ok(supportLayer(restored,3).includes(modelClosing));
  restored.app.navigate(4,false);
  await restored.supportSlot(1);
  await restored.pointMaterial('B:when-school');
  assert.ok(supportLayer(restored,3).includes(modelClosing),'unplaced material changes leave the current closing intact');
  await restored.placeSupport();
  assert.ok(!supportLayer(restored,3).includes(modelClosing),'changing the placed example invalidates its old closing');
  restored.app.navigate(5,false);
  assert.doesNotMatch(restored.byId('stage').innerHTML,/data-ending-place/);
});

test('the closing can summarize two examples with the same benefit without repeating it', async () => {
  const lesson=loadLesson();
  lesson.app.navigate(4,false);
  for(const slot of [1,2]){
    await lesson.supportSlot(slot);
    await lesson.supportWhy('active');
    await lesson.pointPreset();
    if(slot===2)await lesson.pointMaterial('B:what-picnic');
    await lesson.placeSupport();
  }
  lesson.app.navigate(5,false);
  for(const slot of [1,2])await lesson.change({type:'radio','data-ending-phrase':String(slot),value:'0'});
  const closing='To sum up, this would be my ideal park because it would give me more than one way to stay active.';
  assert.ok(readableHtml(lesson.byId('endingPreview').innerHTML).includes(closing));
  assert.deepEqual(pointMarks(lesson.byId('endingPreview').innerHTML).map(({id})=>id),['ending-active-general']);
  assert.match(lesson.byId('endingPreview').innerHTML,/<mark\b[^>]*data-point-tone="both"[^>]*>stay active<\/mark>/);
  await lesson.click({'data-ending-place':''});
  assert.ok(supportLayer(lesson,3).includes(closing));
  assert.match(supportLayerMarkup(lesson,3),/data-point-tone="both"/);
  await lesson.change({type:'radio','data-ending-phrase':'1',value:'1'});
  assert.deepEqual([...lesson.byId('endingPreview').innerHTML.matchAll(/<mark\b[^>]*data-point-tone="(1|2|both)"[^>]*>([^<]*)<\/mark>/g)].map(m=>[m[1],m[2]]),
    [['1','get some exercise by walking'],['2','stay active']],'different choices from the same Why retain their separate point identity');
  assert.deepEqual(plain(lesson.app.state.f),{},'the closing does not overwrite archived writing fields');
});

test('identical reasons and examples lead back to the second point even if the two summary phrasings differ', async () => {
  const lesson=loadLesson();
  lesson.app.navigate(4,false);
  for(const slot of [1,2]){
    await lesson.supportSlot(slot);
    await lesson.supportWhy('relax');
    await lesson.pointPreset();
    await lesson.placeSupport();
  }
  lesson.app.navigate(5,false);
  assert.match(lesson.byId('stage').innerHTML,/data-ending-support="2"/);
  for(const slot of [1,2])await lesson.change({type:'radio','data-ending-phrase':String(slot),value:String(slot-1)});
  assert.doesNotMatch(lesson.byId('endingPreview').innerHTML,/data-ending-place|more than one way/);
  await lesson.click({'data-ending-place':''});
  assert.doesNotMatch(supportLayer(lesson,3),/To sum up/);
  await lesson.click({'data-ending-support':'2'});
  assert.equal(lesson.app.state.active,4);
  assert.equal(lesson.app.state.supportSlot,2);
});

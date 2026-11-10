'use strict';

// Run from the project root:
// node -e "require('vm').runInThisContext(require('fs').readFileSync('tests/sentence-builder.test.cjs','utf8'),{filename:'tests/sentence-builder.test.cjs'})"
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const builderSource = script.slice(script.indexOf('    const topicSeeds ='), script.indexOf('    function assembleDraft()'));
const labelSource = script.slice(script.indexOf('    const materialIds ='), script.indexOf('    function loadTopic('));
const completionSource = script.slice(script.indexOf('    function hasCompletedContent('), script.indexOf('    function updateProgress('));
let confirmAnswer = true;
let confirmCount = 0;
const fields = new Map();
function field(id) {
  if (!fields.has(id)) {
    const classes = new Set();
    fields.set(id, {
      id, value: '', type: 'text', textContent: '', placeholder: '',
      attributes: {},
      classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }, contains(name) { return classes.has(name); } },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name] ?? null; }
    });
  }
  return fields.get(id);
}
const context = vm.createContext({
  document: { getElementById: field, querySelector: () => field('stanceLabel') },
  confirm: () => { confirmCount += 1; return confirmAnswer; },
  afterProgrammaticChange: () => {}
});
vm.runInContext(`${builderSource}\n${labelSource}\n${completionSource}\nglobalThis.subject = { topicSeeds, buildParagraphOne, buildParagraphTwo, applyTopicLabels, hasCompletedContent, migrateLegacyDraftNotes, draftFeedback };`, context);
const subject = context.subject;
const paragraphOne = ['p1s1', 'p1s2', 'p1s3', 'p1s4'];
const paragraphTwo = ['p2s1', 'p2s2', 'p2s3', 'p2s4', 'p2s5', 'p2s6'];
function reset(topic = 'park') {
  fields.clear();
  Object.keys(subject.draftFeedback).forEach(id => delete subject.draftFeedback[id]);
  confirmAnswer = true;
  confirmCount = 0;
  field('selectedTopic').value = topic;
  Object.entries(subject.topicSeeds[topic]).forEach(([id, value]) => { field(id).value = value; });
}
function combined(ids) { return ids.map(id => field(id).value).join(' '); }
let testCount = 0;
function check(label, run) {
  run();
  testCount += 1;
  console.log(`PASS ${label}`);
}

check('four topic seeds build complete draft fields without unresolved format prompts', () => {
  assert.deepEqual(Object.keys(subject.topicSeeds), ['park', 'robot', 'marketing', 'disaster']);
  for (const topic of Object.keys(subject.topicSeeds)) {
    reset(topic);
    subject.buildParagraphOne();
    subject.buildParagraphTwo();
    for (const id of [...paragraphOne, ...paragraphTwo]) {
      assert.ok(field(id).value.trim(), `${topic}/${id} is populated`);
      assert.doesNotMatch(field(id).value, /\[|\.\.|\bwho\s+(?:families|people)\b/i, `${topic}/${id} has no unsafe template construction`);
    }
    assert.doesNotMatch(field('buildP1Notice').textContent, /請補/);
    assert.doesNotMatch(field('buildP2Notice').textContent, /請補/);
    assert.equal(confirmCount, 0, 'empty draft needs no overwrite confirmation');
  }
});

check('park scenery and a full action clause remain separate sentences', () => {
  reset();
  field('b1').value = 'tall trees and a wide green field';
  field('b2').value = 'families enjoy a quiet picnic.';
  subject.buildParagraphOne();
  assert.equal(field('p1s3').value, 'By contrast, Picture B shows tall trees and a wide green field. Families enjoy a quiet picnic. The park feels quiet and peaceful.');
  assert.doesNotMatch(combined(paragraphOne), /\bwho\b/);
});

check('park noun phrase, full preference sentence, and a relative noun phrase do not duplicate I prefer', () => {
  for (const stance of ['a natural park with trees and open space', 'I prefer a natural park with trees and open space.', 'Personally, I prefer a natural park.', 'a park that helps me relax']) {
    reset();
    field('stance').value = stance;
    subject.buildParagraphTwo();
    assert.equal((field('p2s1').value.match(/I prefer/g) || []).length, 1);
    assert.doesNotMatch(field('p2s1').value, /\[|\.\./);
    assert.equal(field('p2s6').value, 'For these reasons, this would be my ideal park.');
  }
});

check('uncertain action and reason fragments keep English editable and show guidance outside the draft', () => {
  reset();
  field('a2').value = 'play on colorful equipment';
  field('reason1').value = 'relax after school';
  subject.buildParagraphOne();
  subject.buildParagraphTwo();
  assert.match(field('p1s2').value, /Play on colorful equipment\./);
  assert.equal(field('p2s2').value, 'Relax after school.');
  assert.doesNotMatch(combined([...paragraphOne, ...paragraphTwo]), /[\u3400-\u9fff]|\[/);
  assert.match(field('p1s2Note').textContent, /圖 A 的動作/);
  assert.match(field('p2s2Note').textContent, /理由一/);
  assert.equal(subject.hasCompletedContent(field('p1s2')), false);
  assert.equal(subject.hasCompletedContent(field('p2s2')), false);
});

check('subject-led free writing retains verbs outside the scaffold vocabulary', () => {
  for (const original of ['I sit under the trees.', 'I read a book after school.', 'My family visits the park.']) {
    reset();
    field('detail2').value = original;
    subject.buildParagraphTwo();
    assert.equal(field('p2s5').value, original);
    assert.doesNotMatch(field('buildP2Notice').textContent, /請補|無法確認/);
  }
});

check('example transitions lowercase initial time prepositions while preserving I and proper names', () => {
  const examples = [
    ['After an exam, I can read a story under the trees. This helps me stop worrying about my grades.', 'For example, after an exam, I can read a story under the trees. This helps me stop worrying about my grades.'],
    ['On weekends, I can walk under the trees.', 'For example, on weekends, I can walk under the trees.'],
    ['Before dinner, I can walk in the park.', 'For example, before dinner, I can walk in the park.'],
    ['During summer, I can relax in the park.', 'For example, during summer, I can relax in the park.'],
    ['At sunset, I can walk with Mary.', 'For example, at sunset, I can walk with Mary.'],
    ['In the morning, Mary can walk with me.', 'For example, in the morning, Mary can walk with me.'],
    ['I can walk with Mary.', 'For example, I can walk with Mary.'],
    ['Mary can walk with me.', 'For example, Mary can walk with me.']
  ];
  for (const [original, expected] of examples) {
    reset();
    field('detail1').value = original;
    subject.buildParagraphTwo();
    assert.equal(field('p2s3').value, expected);
  }
});

check('uncertain free writing receives neutral guidance rather than a grammar judgment', () => {
  reset();
  field('detail2').value = 'Sarah reads a book under the tree.';
  subject.buildParagraphTwo();
  assert.match(field('p2s5Note').textContent, /系統無法確認/);
  assert.doesNotMatch(field('p2s5Note').textContent, /缺少|缺主詞|缺動詞/);
  assert.equal(field('p2s5').value, 'Sarah reads a book under the tree.');
  assert.equal(subject.hasCompletedContent(field('p2s5')), false);
});

check('the reported children action becomes a complete English sentence using the supplied subject', () => {
  reset();
  field('a1').value = 'many children';
  field('a2').value = 'play on colorful equipment';
  field('a3').value = 'lively and exciting';
  subject.buildParagraphOne();
  assert.equal(field('p1s2').value, 'Picture A shows many children. Children play on colorful equipment. The park feels lively and exciting.');
  assert.equal(field('p1s2Note').hidden, true);
  assert.equal(subject.hasCompletedContent(field('p1s2')), true);
  assert.equal(field('a2').value, 'play on colorful equipment', 'source material is preserved');
});

check('picture action scaffolds only use explicit plural people in the matching picture', () => {
  for (const [subjectText, action, expected] of [
    ['families', 'enjoy a quiet picnic', 'Families enjoy a quiet picnic.'],
    ['some visitors', 'walk under the trees', 'Visitors walk under the trees.'],
    ['volunteers at a temporary shelter', 'distribute hot meals', 'Volunteers distribute hot meals.']
  ]) {
    reset();
    field('b1').value = subjectText;
    field('b2').value = action;
    subject.buildParagraphOne();
    assert.ok(field('p1s3').value.includes(expected));
    assert.equal(field('p1s3Note').hidden, true);
  }
  for (const subjectText of ['trees and grass', 'a child', 'a park with many children']) {
    reset();
    field('a1').value = subjectText;
    field('a2').value = 'play on colorful equipment';
    subject.buildParagraphOne();
    assert.equal(subject.hasCompletedContent(field('p1s2')), false);
    assert.doesNotMatch(field('p1s2').value, /Children play|A child play|Trees.* play/);
  }
});

check('empty and Chinese material never creates Chinese scaffolds in either English paragraph', () => {
  for (const topic of Object.keys(subject.topicSeeds)) {
    for (const input of ['', '我想要一座安靜的公園']) {
      reset(topic);
      for (const id of ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'contrast', 'stance', 'reason1', 'detail1', 'reason2', 'detail2']) field(id).value = input;
      subject.buildParagraphOne();
      subject.buildParagraphTwo();
      assert.doesNotMatch(combined([...paragraphOne, ...paragraphTwo]), /[\u3400-\u9fff]|\[/);
      assert.equal(subject.hasCompletedContent(field('p1s2')), false);
      assert.equal(subject.hasCompletedContent(field('p2s2')), false);
      assert.equal(field('a2').value, input);
    }
  }
});

check('Chinese task planning remains valid while English draft fields require English', () => {
  reset();
  assert.equal(subject.hasCompletedContent(field('prompt')), true);
  assert.equal(subject.hasCompletedContent(field('p1task')), true);
  assert.equal(subject.hasCompletedContent(field('p2task')), true);
  field('p1s2').value = '需要寫成英文';
  assert.equal(subject.hasCompletedContent(field('p1s2')), false);
});

check('regenerating a corrected sentence clears only its resolved field guidance', () => {
  reset();
  field('reason1').value = '';
  field('detail2').value = 'Sarah reads a book under the tree.';
  subject.buildParagraphTwo();
  assert.equal(field('p2s2Note').hidden, false);
  field('reason1').value = 'it helps me relax';
  subject.buildParagraphTwo();
  assert.equal(field('p2s2Note').hidden, true);
  assert.equal(subject.hasCompletedContent(field('p2s2')), true);
  assert.equal(field('p2s5Note').hidden, false);
});

check('legacy system prompts move out of saved drafts while user writing stays intact', () => {
  reset();
  field('a1').value = 'many children';
  const legacy = 'Picture A shows many children. [圖 A 的動作：請確認完整句，原素材：play on colorful equipment] The park feels lively and exciting.';
  const repaired = 'Picture A shows many children. Children play on colorful equipment. The park feels lively and exciting.';
  field('p1s2').value = legacy;
  field('p2s2').value = '[理由一：請補主詞與動詞]';
  field('p2s5').value = '[例子二：請確認完整句，原素材：Sarah reads a book under the tree.]';
  field('p1s4').value = 'My own wording. [我的筆記] [keep this]';
  field('finalDraft').value = `${legacy}\n\nMy own conclusion.`;
  subject.migrateLegacyDraftNotes();
  assert.equal(field('p1s2').value, repaired);
  assert.equal(field('p2s2').value, '');
  assert.equal(field('p2s5').value, 'Sarah reads a book under the tree.');
  assert.equal(field('p1s4').value, 'My own wording. [我的筆記] [keep this]');
  assert.equal(field('finalDraft').value, `${repaired}\n\nMy own conclusion.`);
  assert.match(field('p1s2Note').textContent, /舊版提示/);
  assert.equal(subject.hasCompletedContent(field('p1s2')), false, 'migrated sentence still invites review');
  const once = combined([...paragraphOne, ...paragraphTwo, 'finalDraft']);
  subject.migrateLegacyDraftNotes();
  assert.equal(combined([...paragraphOne, ...paragraphTwo, 'finalDraft']), once, 'migration is idempotent');
});

check('optional park contrast and atmosphere stay blank and do not count as required', () => {
  reset();
  field('contrast').value = '';
  field('a3').value = '';
  field('b3').value = '';
  subject.applyTopicLabels('park');
  subject.buildParagraphOne();
  assert.equal(field('p1s4').value, '');
  assert.doesNotMatch(combined(paragraphOne), /\[/);
  assert.equal(field('contrast').classList.contains('required-1'), false);
  assert.equal(field('p1s4').classList.contains('required-2'), false);
  subject.applyTopicLabels('robot');
  assert.equal(field('contrast').classList.contains('required-1'), true);
  assert.equal(field('p1s4').classList.contains('required-2'), true);
  subject.applyTopicLabels('park');
  assert.equal(field('p1s4').classList.contains('required-2'), false);
});

check('declining regeneration preserves edits and the existing final draft', () => {
  reset();
  subject.buildParagraphOne();
  subject.buildParagraphTwo();
  field('p1s2').value = 'My own revised description.';
  field('p2s3').value = 'My own revised example.';
  field('finalDraft').value = 'My saved final draft.';
  const before = combined([...paragraphOne, ...paragraphTwo, 'finalDraft']);
  confirmAnswer = false;
  subject.buildParagraphOne();
  subject.buildParagraphTwo();
  assert.equal(combined([...paragraphOne, ...paragraphTwo, 'finalDraft']), before);
  assert.equal(confirmCount, 2);
});

check('topic label refresh changes hints without overwriting draft data', () => {
  reset();
  field('a2').value = 'My saved sentence.';
  subject.applyTopicLabels('disaster');
  assert.equal(field('a2').value, 'My saved sentence.');
  assert.match(field('a2').placeholder, /^完整句：/);
  assert.match(field('stanceHint').textContent, /完整句/);
});

check('old robot preference format remains readable without duplicate clauses', () => {
  reset('robot');
  field('stance').value = 'it to help me manage my emotions';
  subject.buildParagraphTwo();
  assert.equal(field('p2s1').value, 'If I had a robot helper, I would like it to help me manage my emotions.');
});

check('quality feedback never equates sentence count with sufficient support', () => {
  assert.doesNotMatch(script, /句子數足以支持兩段內容/);
  assert.match(script, /句數不能判斷支持是否充分/);
});

console.log(`\n${testCount} sentence-builder regression checks passed.`);

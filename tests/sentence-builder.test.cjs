'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { open, countWords, affectsTopic } = require('../workshop-drafts.js');

function memoryStorage(legacy) {
  const items = new Map();
  if (legacy) items.set('stepwrite-draft-v1', JSON.stringify(legacy));
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value)
  };
}

test('starts at the topic chooser and restores four independent drafts, including blank edits', () => {
  const storage = memoryStorage();
  const drafts = open(storage);
  assert.equal(drafts.activeTopic, null);
  for (const topic of ['park', 'robot', 'marketing', 'disaster']) {
    assert.deepEqual(drafts.get(topic), { p1: '', p2: '', notes: [] });
    assert.ok(drafts.select(topic));
    assert.ok(drafts.write(topic, { p1: topic + ' first', p2: topic + ' second' }));
  }
  assert.ok(drafts.write('robot', { p1: '' }));
  const restored = open(storage);
  assert.equal(restored.activeTopic, 'disaster');
  for (const topic of ['park', 'robot', 'marketing', 'disaster']) {
    assert.equal(restored.get(topic).p1, topic === 'robot' ? '' : topic + ' first');
    assert.equal(restored.get(topic).p2, topic + ' second');
  }
});

test('a previously revised final draft takes priority and preserves earlier material and subsequent sentence edits as notes', () => {
  const legacy = {
    selectedTopic: 'robot', prompt: '老師另訂的題目', p1task: '談週一的感受',
    a1: '週一的早晨', reason2: 'I felt tired.', p1s1: 'New separate idea.',
    finalDraft: 'First line.\r\nStill paragraph one.\r\n\r\nSecond paragraph.\r\n\r\nOne extra section.'
  };
  const storage = memoryStorage(legacy);
  const drafts = open(storage);
  assert.equal(drafts.activeTopic, 'robot');
  const draft = drafts.get('robot');
  assert.equal(draft.p1, 'First line.\nStill paragraph one.');
  assert.equal(draft.p2, 'Second paragraph.\n\nOne extra section.');
  assert.deepEqual(draft.notes.map(note => note.text),
    [legacy.prompt, legacy.p1task, legacy.a1, legacy.reason2, legacy.p1s1]);
  assert.deepEqual(drafts.get('park').notes, []);
  assert.ok(drafts.write('robot', { p1: '', p2: '' }));
  const reopened = open(storage).get('robot');
  assert.equal(reopened.p1, '');
  assert.equal(reopened.p2, '');
  assert.deepEqual(reopened.notes, draft.notes);
  assert.equal(storage.getItem('stepwrite-draft-v1'), JSON.stringify(legacy));
});

test('migrates one newline, sentence-only drafts, a second-paragraph-only draft, and planning notes alone', () => {
  const migrate = legacy => open(memoryStorage(legacy)).get('park');
  const two = migrate({ finalDraft: 'One.\nTwo.' });
  assert.equal(two.p1, 'One.');
  assert.equal(two.p2, 'Two.');
  const fromSentences = migrate({ p1s1: 'Hi!', p1s4: 'My words.', p2s2: "I'll help." });
  assert.equal(fromSentences.p1, 'Hi! My words.');
  assert.equal(fromSentences.p2, "I'll help.");
  const second = migrate({ p2s3: 'Try the robot.', finalDraft: 'Try my helpful robot.' });
  assert.equal(second.p1, '');
  assert.equal(second.p2, 'Try my helpful robot.');
  const materialOnly = migrate({ prompt: '自訂題目', b2: 'my detail', p2task: 'my second task' });
  assert.equal(materialOnly.p1, '');
  assert.equal(materialOnly.p2, '');
  assert.deepEqual(materialOnly.notes.map(note => note.text), ['自訂題目', 'my second task', 'my detail']);
});

test('separate sessions preserve edits to different paragraphs of the same topic', () => {
  const storage = memoryStorage({ selectedTopic: 'park', p1s1: 'Old opening.', p2s1: 'Old idea.' });
  const first = open(storage);
  const second = open(storage);
  first.get('park');
  second.get('park');
  // Interleave the writes before the first setItem commits, as independent tabs can do.
  const save = storage.setItem;
  storage.setItem = (key, value) => {
    storage.setItem = save;
    second.write('park', { p2: 'Improved the ending.' });
    save(key, value);
  };
  first.write('park', { p1: 'Changed the opening.' });
  assert.deepEqual(first.get('park'), { p1: 'Changed the opening.', p2: 'Improved the ending.', notes: [] });
  assert.ok(affectsTopic('stepwrite-workshop-v2-park-p2', 'park'));
  assert.ok(affectsTopic(null, 'park'));
  assert.equal(affectsTopic('stepwrite-workshop-v2-disaster-p2', 'park'), false);
  assert.equal(affectsTopic('stepwrite-workshop-v2-active', 'park'), false);
});

test('reads earliest v1 English prose while moving only recognized inline system prompts to notes', () => {
  const action = '[圖 A 的動作：請確認完整句，原素材：play on colorful equipment]';
  const english = 'Picture A shows many children. Children play on colorful equipment. The park feels lively.';
  const old = 'Picture A shows many children. ' + action + ' The park feels lively.';
  const own = 'My own wording. [我的筆記] [keep this]. [請補我的想法]';
  const original = {
    selectedTopic: 'park', a1: 'many children', p1s2: old,
    p2s2: '[理由一：請補主詞與動詞]', p2s3: '[請補例子一]',
    p2s4: '[例子二：請確認格式，原素材：原本的中文]',
    p2s5: '[例子二：請確認完整句，原素材：Sarah reads a book under the tree.]', p2s6: own,
    finalDraft: old + '\n\n' + own
  };
  const storage = memoryStorage(original);
  const draft = open(storage).get('park');
  assert.equal(draft.p1, english);
  assert.equal(draft.p2, own);
  assert.equal(draft.notes.filter(note => note.text.includes('圖 A 的動作')).length, 1);
  assert.ok(draft.notes.some(note => note.text.includes('原本的中文')));
  assert.equal(storage.getItem('stepwrite-draft-v1'), JSON.stringify(original));
  const onlySentences = open(memoryStorage({ ...original, finalDraft: '' })).get('park');
  assert.equal(onlySentences.p1, english);
  assert.equal(onlySentences.p2, 'Sarah reads a book under the tree. ' + own);
  const scenery = open(memoryStorage({ selectedTopic: 'park', a1: 'trees', finalDraft: action })).get('park');
  assert.equal(scenery.p1, 'Play on colorful equipment.');
});

test('legacy field feedback is included only when it matches the originally saved text', () => {
  const draft = open(memoryStorage({
    p1s1: 'New opening.', p2s1: 'My example.', p2s2: '', finalDraft: 'New opening.\n\nMy example.',
    draftFeedback: {
      p1s1: { value: 'Old opening.', message: 'No longer applicable' },
      p2s1: { value: 'My example.', message: 'Check the example' },
      p2s2: { value: '', message: 'Missing a reason' },
      finalDraft: { value: 'New opening.\n\nMy example.', message: 'Read both paragraphs' }
    }
  })).get('park');
  assert.deepEqual(draft.notes.map(note => note.text), ['Read both paragraphs', 'Check the example', 'Missing a reason']);
  assert.equal(draft.p2, 'My example.');
});

test('a retry after a partial save only writes the failed paragraph', () => {
  const storage = memoryStorage();
  const save = storage.setItem;
  storage.setItem = (key, value) => {
    if (key.endsWith('-p2')) throw new Error('Storage full');
    save(key, value);
  };
  const drafts = open(storage);
  assert.equal(drafts.write('robot', { p1: 'First', p2: 'Second' }), false);
  assert.deepEqual(drafts.get('robot'), { p1: 'First', p2: 'Second', notes: [] });
  storage.setItem = save;
  open(storage).write('robot', { p1: 'Changed by a second tab' });
  assert.equal(drafts.write('robot', { p2: 'Second' }), true);
  assert.equal(drafts.get('robot').p1, 'Changed by a second tab');
});

test('temporary write failures preserve editing and can be retried without overwriting another paragraph', () => {
  const storage = memoryStorage();
  const drafts = open(storage);
  const save = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(drafts.select('marketing'), false);
  assert.equal(drafts.activeTopic, 'marketing');
  assert.equal(drafts.write('marketing', { p1: 'My unsaved draft.' }), false);
  drafts.select('robot');
  drafts.select('marketing');
  assert.equal(drafts.get('marketing').p1, 'My unsaved draft.');
  storage.setItem = save;
  const other = open(storage);
  other.write('marketing', { p2: 'Idea in the other tab.' });
  assert.ok(drafts.write('marketing', { p1: 'My revised idea.' }));
  assert.deepEqual(other.get('marketing'), { p1: 'My revised idea.', p2: 'Idea in the other tab.', notes: [] });
});

test('storage blocking and malformed old records still allow typing and switching', () => {
  const local = open(null);
  assert.equal(local.select('robot'), false);
  assert.equal(local.write('robot', { p2: 'I can still write.' }), false);
  assert.equal(local.get('robot').p2, 'I can still write.');
  assert.equal(local.get('park').p2, '');
  const storage = memoryStorage();
  storage.setItem('stepwrite-draft-v1', '[broken');
  assert.equal(open(storage).activeTopic, null);
  assert.equal(storage.getItem('stepwrite-draft-v1'), '[broken');
});

test('counts English words with apostrophes and hyphens in mixed-language drafts', () => {
  assert.equal(countWords("I can't join our school's after-school club."), 7);
  assert.equal(countWords('理由：It’s quiet.\nI read. 123'), 4);
  assert.equal(countWords('只有中文，123！'), 0);
  assert.equal(countWords(''), 0);
});

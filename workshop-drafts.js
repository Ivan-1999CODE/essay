(() => {
  'use strict';

  const topics = ['park', 'robot', 'marketing', 'disaster'];
  const prefix = 'stepwrite-workshop-v2-';
  const legacyKey = 'stepwrite-draft-v1';
  const paragraphs = ['p1', 'p2'];
  const paragraphKey = (topic, paragraph) => prefix + topic + '-' + paragraph;
  const affectsTopic = (key, topic) => key === null || paragraphs.some(id => key === paragraphKey(topic, id));
  const noteLabels = {
    prompt: '原題目', p1task: '第一段任務', p2task: '第二段任務',
    a1: '素材 A（1）', a2: '素材 A（2）', a3: '素材 A（3）',
    b1: '素材 B（1）', b2: '素材 B（2）', b3: '素材 B（3）',
    contrast: '比較或原因', stance: '我的立場', reason1: '理由一', detail1: '例子一',
    reason2: '理由二', detail2: '例子二'
  };
  const legacyLabels = new Set([
    '圖 A 的人物或物品', '圖 A 的動作', '圖 A 的氣氛', '圖 A 的感受',
    '圖 B 的人物或物品', '圖 B 的動作', '圖 B 的氣氛', '圖 B 的感受',
    '問題名稱', '問題影響', '另一個影響', '壓力來源一', '壓力來源二', '常見感受',
    '手法 A 名稱', '手法 A 做法', '手法 A 影響', '手法 B 名稱', '手法 B 做法', '手法 B 影響',
    '問題原因', '兩種手法的差異', '核心差異', '立場', '理由一', '例子一', '理由二', '例子二'
  ]);

  // Older picture scaffolds used a named group from the matching material field.
  function restoreLegacyEnglish(source, label, topic, saved) {
    if (!source || /[\u3400-\u9fff]/.test(source)) return '';
    const picture = /^圖 ([AB]) 的動作$/.exec(label);
    if (picture && ['park', 'disaster'].includes(topic) &&
        /^(?:play|walk|rest|enjoy|sit|run|talk|listen|struggle|distribute)\b/i.test(source)) {
      const companion = saved[picture[1].toLowerCase() + '1'];
      const people = typeof companion === 'string' && companion.trim().replace(/[.!?]+$/, '').trim()
        .match(/^(?:(?:many|some|several|a few|the|these|those)\s+)?(children|people|families|visitors|volunteers|residents|teenagers|students|tourists)(?:\s+(?:in|at|on|near|under|by)\s+[^.!?]+)?$/i);
      if (people) source = people[1].toLowerCase() + ' ' + source.replace(/^\w+/, word => word.toLowerCase());
    }
    const sentence = source.replace(/^[a-z]/, first => first.toUpperCase());
    return /[.!?]$/.test(sentence) ? sentence : sentence + '.';
  }

  function readObject(raw) {
    try {
      const value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  function migrateLegacy(raw) {
    const saved = readObject(raw);
    if (!saved) return null;
    const topic = topics.includes(saved.selectedTopic) ? saved.selectedTopic : 'park';
    const content = key => typeof saved[key] === 'string' ? saved[key].trim() : '';
    const notes = Object.entries(noteLabels).filter(([key]) => content(key))
      .map(([key, label]) => ({ label, text: content(key) }));
    const moved = new Set();
    function recoveredText(key, fieldName) {
      const feedback = saved.draftFeedback?.[key];
      if (typeof saved[key] === 'string' && feedback?.value === saved[key] &&
          typeof feedback.message === 'string' && feedback.message.trim()) {
        notes.push({ label: fieldName + '的舊版提醒', text: feedback.message });
      }
      return content(key).replace(/\[([^\]\r\n]+)\]\.?/g, (whole, body) => {
        const original = /^(.+?)：(?:請確認完整句|請確認格式)，原素材：(.*)$/.exec(body);
        const missing = /^(.+?)：請補主詞與動詞$/.exec(body) || /^請補(.+)$/.exec(body);
        const label = original?.[1] || missing?.[1];
        if (!legacyLabels.has(label)) return whole;
        if (!moved.has(body)) {
          notes.push({ label: '舊版提示', text: body });
          moved.add(body);
        }
        return restoreLegacyEnglish(original?.[2].trim(), label, topic, saved);
      });
    }
    const final = recoveredText('finalDraft', '全文').replace(/\r\n?/g, '\n');
    const sentences = (paragraph, count) => {
      const parts = [];
      for (let i = 1; i <= count; i++) {
        const label = `第${paragraph === 1 ? '一' : '二'}段原句（${i}）`;
        const text = recoveredText(`p${paragraph}s${i}`, label).trim();
        if (!text) continue;
        parts.push(text);
        if (final && !final.includes(text)) {
          notes.push({ label, text });
        }
      }
      return parts.join(' ');
    };
    let p1 = sentences(1, 4);
    let p2 = sentences(2, 6);
    if (final) {
      // Prefer the old editor's blank line. An author may also have used just Enter.
      const boundary = /\n[^\S\n]*\n+/.exec(final) || /\n/.exec(final);
      if (boundary) {
        p1 = final.slice(0, boundary.index).trim();
        p2 = final.slice(boundary.index + boundary[0].length).trim();
      } else if (!p1 && p2) {
        p2 = final;
      } else {
        p1 = final;
        p2 = '';
      }
    }
    if (!p1 && !p2 && !notes.length) return null;
    return { topic, p1, p2, notes };
  }

  function open(storage) {
    if (storage === undefined) {
      try { storage = globalThis.localStorage; } catch { storage = null; }
    }
    const cache = new Map();
    const pending = new Map();
    let legacy = null;
    let activeTopic = null;
    try {
      legacy = migrateLegacy(storage.getItem(legacyKey));
      if (legacy) {
        cache.set(legacy.topic, { p1: legacy.p1, p2: legacy.p2 });
        activeTopic = legacy.topic;
      }
      const active = storage.getItem(prefix + 'active');
      if (topics.includes(active)) activeTopic = active;
    } catch { /* Storage may be disabled. Editing is still available. */ }

    function checkTopic(topic) {
      if (!topics.includes(topic)) throw new RangeError('Unknown workshop topic');
    }

    return {
      get activeTopic() { return activeTopic; },
      select(topic) {
        checkTopic(topic);
        activeTopic = topic;
        try {
          storage.setItem(prefix + 'active', topic);
          return true;
        } catch { return false; }
      },
      get(topic) {
        checkTopic(topic);
        const original = legacy?.topic === topic ? legacy : null;
        const draft = cache.get(topic) || { p1: '', p2: '' };
        try {
          for (const key of paragraphs) {
            draft[key] = storage.getItem(paragraphKey(topic, key)) ?? original?.[key] ?? '';
          }
          cache.set(topic, draft);
        } catch { /* Keep the last readable values if the browser blocks storage. */ }
        return { ...draft, ...pending.get(topic), notes: original?.notes ?? [] };
      },
      write(topic, changes) {
        checkTopic(topic);
        const patch = { ...pending.get(topic) };
        for (const key of paragraphs) {
          if (typeof changes[key] === 'string') patch[key] = changes[key];
        }
        pending.set(topic, patch);
        const draft = cache.get(topic) || { p1: '', p2: '' };
        cache.set(topic, draft);
        try {
          // Each key is independent even when two tabs save at exactly the same time.
          for (const [key, value] of Object.entries(patch)) {
            storage.setItem(paragraphKey(topic, key), value);
            draft[key] = value;
            delete patch[key];
          }
          pending.delete(topic);
          return true;
        } catch { return false; }
      }
    };
  }

  function countWords(text) {
    return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
  }

  const api = { open, countWords, affectsTopic };
  if (typeof window !== 'undefined') window.WorkshopDrafts = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

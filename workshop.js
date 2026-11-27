(() => {
  'use strict';

  const topics = {
    robot: {
      title: '青少年問題與機器人幫手',
      paragraphs: [
        {
          task: '從初次失戀、在意別人的看法、情緒起伏之中選一個，說明你最想解決它的原因。',
          hints: ['想像你遇到這個困擾的某一天。當時發生了什麼事？', '它影響了你原本想做的哪件事？這件事對你為什麼重要？']
        },
        {
          task: '寫出機器人需要的特質或能力，說明你會如何和它合作，解決上一段的困擾。',
          hints: ['如果機器人當時就在你身邊，你希望它先做什麼？它需要什麼能力？', '接下來你自己會做什麼？你怎麼知道情況有改善？']
        }
      ]
    },
    marketing: {
      title: '飢餓行銷與折扣促銷',
      paragraphs: [
        {
          task: '說明飢餓行銷與折扣促銷各怎麼做，比較它們如何影響消費者的購買決定。',
          hints: ['想像同一雙球鞋，一家店只賣十雙，另一家店打七折。你在兩家店分別會注意什麼？', '兩家店都希望你買下球鞋，各自給了你什麼購買理由？']
        },
        {
          task: '選擇你認為較能促使人花錢的手法，用理由和一次購物經驗支持你的判斷。',
          hints: ['哪一次你本來打算只看看，最後卻買了東西？當時讓你改變主意的是什麼？', '如果拿掉那個促銷條件，你還會買嗎？這能怎麼解釋你的選擇？']
        }
      ]
    },
    disaster: {
      title: '災害、互助與志願服務',
      paragraphs: [
        {
          task: '描寫居民帶著物品穿過淹水街道，以及志工在安置所分送物資的情景。用人物的動作帶出兩處氣氛的差別。',
          hints: ['想像一位居民正走在積水中。他手上拿著什麼，走路有多困難？', '把視線移到安置所。一位志工做了什麼？這個動作和街上的情景有什麼不同？']
        },
        {
          task: '說明你對災時互助與志願服務的看法，用你觀察到或能想像的例子說明理由。',
          hints: ['選一個具體的幫忙方式。當下誰最需要它？', '受到幫助的人接下來能做什麼？這個改變如何支持你的看法？']
        }
      ]
    },
    park: {
      title: '不同公園與理想公園',
      paragraphs: [
        {
          task: '描述圖 A 和圖 B 的公園各有哪些特色，用看得到的細節說明兩座公園的差異。',
          hints: ['如果兩張照片各選一個最醒目的細節，你會指給同學看什麼？', '從同一個角度看兩座公園，例如設施或景觀，你注意到什麼差別？']
        },
        {
          task: '描述你理想中的公園會是什麼樣子，並解釋你希望它有這些特色的原因。',
          hints: ['想像放學後或週末去公園。你想和誰一起去，在那裡做什麼？', '這個活動需要怎樣的空間？你希望的公園特色如何滿足這個需要？']
        }
      ]
    }
  };

  const drafts = window.WorkshopDrafts.open();
  const byId = id => document.getElementById(id);
  const editor = byId('writingEditor');
  const title = byId('writingTitle');
  const inputs = [byId('writingP1'), byId('writingP2')];
  const topicButtons = document.querySelectorAll('#workshop [data-load-topic]');
  const copyButton = byId('copyDraft');
  const notice = byId('writingNotice');
  const saveStatus = byId('saveStatus');
  let currentTopic = null;

  function updateSaveStatus(saved) {
    const message = saved ? '寫作草稿已保存在這台裝置' : '寫作草稿暫時無法保存，請複製全文留存。';
    if (saveStatus.textContent !== message) saveStatus.textContent = message;
    saveStatus.classList.toggle('writing-save-error', !saved);
  }

  function clearCopyNotice() {
    notice.textContent = '';
    byId('writingCopyText')?.remove();
  }

  function updateMetrics() {
    const paragraphs = inputs.map(input => input.value.trim()).filter(Boolean);
    byId('wordCount').textContent = window.WorkshopDrafts.countWords(paragraphs.join(' '));
    byId('paragraphCount').textContent = paragraphs.length;
    copyButton.disabled = paragraphs.length === 0;
  }

  function showNotes(notes) {
    const box = byId('writingNotes');
    box.hidden = notes.length === 0;
    const list = box.querySelector('dl');
    list.replaceChildren();
    for (const note of notes) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = note.label;
      description.textContent = note.text;
      list.append(term, description);
    }
  }

  function showExample(example) {
    const body = byId('writingExampleBody');
    body.replaceChildren();
    example.paragraphs.forEach((sentences, index) => {
      const section = document.createElement('section');
      section.className = 'writing-example-paragraph';
      const heading = document.createElement('h4');
      heading.textContent = index === 0 ? '第一段' : '第二段';
      const english = document.createElement('p');
      english.lang = 'en';
      english.textContent = sentences.map(sentence => sentence.en).join(' ');
      const translation = document.createElement('p');
      translation.lang = 'zh-Hant';
      translation.textContent = sentences.map(sentence => sentence.zh).join('');
      section.append(heading, english, translation);
      body.append(section);
    });
    if (example.keywords) {
      const keywords = document.createElement('p');
      keywords.className = 'writing-example-keywords';
      const label = document.createElement('strong');
      label.textContent = '本題關鍵字';
      const words = document.createElement('span');
      words.lang = 'en';
      words.textContent = example.keywords;
      keywords.append(label, ' ', words);
      body.append(keywords);
    }
  }

  function showTopic(key) {
    currentTopic = key;
    const topic = topics[key];
    const draft = drafts.get(key);
    topicButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.loadTopic === key)));
    title.textContent = topic.title;
    byId('writingLessonLink').href = document.querySelector('.lesson-topic-links [data-lesson="' + key + '"]').href;
    editor.querySelectorAll('details').forEach(details => { details.open = false; });
    byId('writingParkReference').hidden = key !== 'park';
    showNotes(draft.notes);
    showExample(window.workshopExamples[key]);
    topic.paragraphs.forEach(({ task, hints }, i) => {
      const number = i + 1;
      byId('writingTask' + number).textContent = task;
      const list = byId('writingHint' + number).querySelector('ul');
      list.replaceChildren();
      for (const hint of hints) {
        const item = document.createElement('li');
        item.textContent = hint;
        list.append(item);
      }
      inputs[i].value = draft['p' + number];
    });
    clearCopyNotice();
    updateMetrics();
    editor.hidden = false;
  }

  function selectTopic(key, focusEditor = true) {
    if (!Object.hasOwn(topics, key)) return;
    const saved = drafts.select(key);
    showTopic(key);
    if (!saved) updateSaveStatus(false);
    if (focusEditor) {
      title.focus({ preventScroll: true });
      title.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }

  topicButtons.forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectTopic(button.dataset.loadTopic));
  });

  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      if (!currentTopic) return;
      clearCopyNotice();
      const saved = drafts.write(currentTopic, { ['p' + (i + 1)]: input.value });
      updateSaveStatus(saved);
      updateMetrics();
    });
  });

  window.addEventListener('storage', event => {
    if (!currentTopic || !window.WorkshopDrafts.affectsTopic(event.key, currentTopic)) return;
    const draft = drafts.get(currentTopic);
    inputs.forEach((input, i) => {
      const updated = draft['p' + (i + 1)];
      if (input.value !== updated) input.value = updated;
    });
    clearCopyNotice();
    updateMetrics();
  });

  copyButton.addEventListener('click', async () => {
    const text = inputs.map(input => input.value.trim()).filter(Boolean).join('\n\n');
    if (!text) return;
    const topic = currentTopic;
    clearCopyNotice();
    try {
      await navigator.clipboard.writeText(text);
      if (topic === currentTopic) notice.textContent = '已複製全文。';
    } catch {
      if (topic !== currentTopic) return;
      const preview = document.createElement('pre');
      preview.id = 'writingCopyText';
      preview.textContent = text;
      preview.tabIndex = -1;
      notice.after(preview);
      preview.focus();
      const range = document.createRange();
      range.selectNodeContents(preview);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      notice.textContent = '下方全文已選取，請使用裝置的複製功能。';
    }
  });

  window.writingWorkshop = { selectTopic };
  const url = new URL(location.href);
  const requestedTopic = url.searchParams.get('write');
  if (url.hash === '#workshop' && Object.hasOwn(topics, requestedTopic)) {
    selectTopic(requestedTopic, false);
    url.searchParams.delete('write');
    history.replaceState(history.state, '', url);
  } else if (Object.hasOwn(topics, drafts.activeTopic)) {
    showTopic(drafts.activeTopic);
  }
})();

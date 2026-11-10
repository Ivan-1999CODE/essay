(() => {
  'use strict';
  const storageKey = 'stepwrite-lesson-v2';
  const tabs = [...document.querySelectorAll('.lesson-tab')];
  const lessonPanels = [...document.querySelectorAll('.lesson-panel')];
  const practices = [...document.querySelectorAll('.micro-practice')];
  const inputIds = ['expWhen', 'expAction', 'expResult', 'expEnglish'];
  const byId = id => document.getElementById(id);
  const values = () => Object.fromEntries(inputIds.map(id => [id, byId(id).value.trim()]));
  const signature = () => JSON.stringify(values());
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { /* Keep the draft separate from lesson progress. */ }
  const state = {
    active: Number.isInteger(saved.active) && saved.active >= 0 && saved.active < tabs.length ? saved.active : 0,
    choices: saved.choices && typeof saved.choices === 'object' ? saved.choices : {},
    reviewed: typeof saved.reviewed === 'string' ? saved.reviewed : '',
    checked: saved.checked === true
  };
  inputIds.forEach(id => { if (typeof saved[id] === 'string') byId(id).value = saved[id]; });

  function saveLesson() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...state, ...values() }));
    } catch (_) {
      byId('lessonProgress').textContent = '暫時無法保存練習，請保持這個分頁開啟。';
    }
  }

  function hasReviewedExpansion() {
    return state.checked && state.reviewed === signature() && inputIds.every(id => byId(id).value.trim());
  }

  function updateLessonProgress() {
    let count = 0;
    practices.forEach((practice, index) => {
      const answer = state.choices[practice.dataset.practice];
      const selected = [...practice.querySelectorAll('.practice-choice')].find(button => button.dataset.choice === answer);
      const complete = selected?.dataset.correct === 'true' && (practice.dataset.practice !== 'expand' || hasReviewedExpansion());
      if (complete) count++;
      tabs[index].classList.toggle('practiced', Boolean(complete));
      tabs[index].setAttribute('aria-label', `${tabs[index].textContent.trim()}${complete ? '，已練習' : ''}`);
    });
    byId('lessonProgress').textContent = `已練習 ${count} / ${practices.length} 個小任務`;
  }

  function showLesson(index, { scroll = false, focusTab = false } = {}) {
    state.active = Math.max(0, Math.min(index, tabs.length - 1));
    tabs.forEach((tab, i) => {
      const active = i === state.active;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    lessonPanels.forEach((panel, i) => {
      panel.classList.toggle('active', i === state.active);
      panel.hidden = i !== state.active;
    });
    if (focusTab) tabs[state.active].focus({ preventScroll: true });
    if (scroll) byId('learn').scrollIntoView({ behavior: 'smooth', block: 'start' });
    saveLesson();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showLesson(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      showLesson(next, { focusTab: true });
    });
  });
  document.querySelectorAll('[data-lesson-go]').forEach(button => {
    button.addEventListener('click', () => showLesson(Number(button.dataset.lessonGo), { scroll: true, focusTab: true }));
  });

  function displayChoice(practice, answer) {
    const buttons = [...practice.querySelectorAll('.practice-choice')];
    const selected = buttons.find(button => button.dataset.choice === answer);
    buttons.forEach(button => {
      const active = button === selected;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-selected', active);
      button.classList.toggle('is-correct', active && button.dataset.correct === 'true');
      button.classList.toggle('is-retry', active && button.dataset.correct !== 'true');
    });
    const feedback = practice.querySelector('.practice-feedback');
    feedback.hidden = !selected;
    if (selected) {
      const correct = selected.dataset.correct === 'true';
      feedback.classList.toggle('is-correct', correct);
      feedback.textContent = `${correct ? '✓ 想法對上了：' : '再想一下：'}${selected.dataset.feedback}`;
      if (correct && practice.dataset.practice === 'expand' && !hasReviewedExpansion()) {
        feedback.textContent += ' 接著完成下方自己的擴寫，並核對它如何支持理由。';
      }
    }
  }
  practices.forEach(practice => {
    displayChoice(practice, state.choices[practice.dataset.practice]);
    practice.querySelectorAll('.practice-choice').forEach(button => {
      button.addEventListener('click', () => {
        state.choices[practice.dataset.practice] = button.dataset.choice;
        displayChoice(practice, button.dataset.choice);
        updateLessonProgress();
        saveLesson();
      });
    });
  });

  const transferBox = document.createElement('div');
  transferBox.className = 'transfer-confirm';
  transferBox.hidden = true;
  transferBox.setAttribute('role', 'region');
  transferBox.setAttribute('aria-label', '確認取代工作桌例子');
  const transferTitle = document.createElement('strong');
  transferTitle.textContent = '工作桌已有例子一，請先比對';
  const oldExample = document.createElement('p');
  const newExample = document.createElement('p');
  const confirmTransfer = document.createElement('button');
  confirmTransfer.type = 'button';
  confirmTransfer.className = 'btn btn-primary btn-small';
  confirmTransfer.textContent = '取代例子一';
  const cancelTransfer = document.createElement('button');
  cancelTransfer.type = 'button';
  cancelTransfer.className = 'btn btn-secondary btn-small';
  cancelTransfer.textContent = '保留原內容';
  const transferActions = document.createElement('div');
  transferActions.className = 'topic-actions';
  transferActions.append(confirmTransfer, cancelTransfer);
  transferBox.append(transferTitle, oldExample, newExample, transferActions);
  byId('transferFeedback').after(transferBox);
  let pendingTransfer = null;

  function invalidateExpansion() {
    state.reviewed = '';
    state.checked = false;
    byId('expansionReviewed').checked = false;
    byId('expansionPreview').hidden = true;
    byId('expansionFeedback').textContent = '改好後，再按「檢查我的擴寫」，核對情境和理由的關係。';
    byId('transferFeedback').textContent = '';
    transferBox.hidden = true;
    pendingTransfer = null;
    updateLessonProgress();
    saveLesson();
  }
  inputIds.forEach(id => byId(id).addEventListener('input', invalidateExpansion));

  byId('reviewExpansion').addEventListener('click', () => {
    const missing = inputIds.find(id => !byId(id).value.trim());
    if (missing) {
      byId('expansionFeedback').textContent = '先補齊「何時、做什麼、帶來什麼好處」，再寫出自己的英文。想法欄可以用中文。';
      byId(missing).focus();
      return;
    }
    const english = byId('expEnglish').value.trim();
    if (/[\u3400-\u9fff]/.test(english) || (english.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length < 5) {
      byId('expansionFeedback').textContent = '想法已經有了。請在英文欄寫出至少一句，交代誰在什麼情境做什麼；可以先用上方的簡單句型。';
      byId('expEnglish').focus();
      return;
    }
    state.reviewed = signature();
    state.checked = false;
    byId('expansionReviewed').checked = false;
    byId('expansionPreviewText').textContent = english;
    byId('expansionPreview').hidden = false;
    byId('expansionFeedback').textContent = '已整理出你的句子。請讀一次：它有具體情境嗎？它如何支持「幫助我放鬆」？下方由你自評，這不是自動文法評分。';
    updateLessonProgress();
    saveLesson();
  });
  byId('expansionReviewed').addEventListener('change', () => {
    state.checked = byId('expansionReviewed').checked && state.reviewed === signature();
    byId('expansionFeedback').textContent = state.checked
      ? '已記下你的自評。你可以帶到工作桌，也可以請老師一起看看這個例子如何支持理由。'
      : '再讀一次，確認情境和理由的關係後再勾選。';
    updateLessonProgress();
    saveLesson();
  });

  function transferExpansion() {
    if (!hasReviewedExpansion()) {
      byId('transferFeedback').textContent = '請先檢查自己的英文，並勾選情境與理由的自評。';
      return;
    }
    if (byId('selectedTopic').value !== 'park') {
      byId('transferFeedback').textContent = '工作桌目前是其他題目。請先保留那份草稿，再到工作桌選擇「111 年公園題」；這裡的擴寫會保留。';
      return;
    }
    const incoming = byId('expEnglish').value.trim();
    const current = byId('detail1').value.trim();
    const confirmed = pendingTransfer && pendingTransfer.current === current && pendingTransfer.incoming === incoming;
    if (current && current !== incoming && !confirmed) {
      pendingTransfer = { current, incoming };
      oldExample.textContent = `原本：${current}`;
      newExample.textContent = `這次：${incoming}`;
      transferBox.hidden = false;
      byId('transferFeedback').textContent = '選擇是否取代素材中的例子一。已寫好的段落與全文會保留。';
      confirmTransfer.focus();
      return;
    }
    byId('detail1').value = incoming;
    if (!byId('reason1').value.trim()) byId('reason1').value = 'it helps me relax after a busy school day';
    ['prompt', 'p1task', 'p2task'].forEach(id => {
      if (!byId(id).value.trim()) byId(id).value = topicSeeds.park[id];
    });
    afterProgrammaticChange('你的擴寫已帶到公園題的例子一；原有句子草稿已保留。');
    byId('transferFeedback').textContent = '已帶到「收集素材」的例子一。請核對工作桌的理由一；若已寫好第二段，再自行更新對應句子。';
    pendingTransfer = null;
    transferBox.hidden = true;
    showStep(1);
    byId('detail1').focus({ preventScroll: true });
  }
  byId('useExpansion').addEventListener('click', () => {
    pendingTransfer = null;
    transferExpansion();
  });
  confirmTransfer.addEventListener('click', transferExpansion);
  cancelTransfer.addEventListener('click', () => {
    pendingTransfer = null;
    transferBox.hidden = true;
    byId('transferFeedback').textContent = '已保留工作桌原本的例子。你的擴寫仍保存在這裡。';
    byId('useExpansion').focus();
  });

  if (state.reviewed === signature()) {
    byId('expansionPreviewText').textContent = byId('expEnglish').value.trim();
    byId('expansionPreview').hidden = false;
    byId('expansionReviewed').checked = state.checked;
    byId('expansionFeedback').textContent = state.checked ? '已恢復你的擴寫與自評。' : '已恢復你的擴寫，請繼續核對情境與理由的關係。';
  } else {
    state.reviewed = '';
    state.checked = false;
  }
  updateLessonProgress();
  showLesson(state.active);
})();

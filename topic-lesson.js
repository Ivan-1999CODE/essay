(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const paragraphNames = ['第一段', '第二段'];
  const layerStyles = ['top', 'meat', 'leaf', 'bottom'];
  const quizOrder = { robot: [1, 0, 2], marketing: [2, 1, 0], disaster: [0, 2, 1] };
  const outlineQuestions = {
    robot: [
      ['我想解決哪一個困擾？', '當時誰在場？發生了什麼事，我怎麼回應？', '這件事怎麼影響我或身邊的人？我為什麼想改變？', '我可以怎麼用一句話連起那件事和它留下的影響？'],
      ['我希望機器人怎麼幫我？', '它先做什麼？我怎麼配合？', '我們還能一起試哪個做法？', '最後，我希望自己能做到什麼？']
    ],
    marketing: [
      ['兩家店都希望顧客做什麼？', '限量販售為什麼會讓人想買？', '同一件商品打折時，顧客會考慮什麼？', '哪兩種不同的動機都能帶來購買？'],
      ['哪一種促銷更能打動我？', '我原本打算買嗎？什麼改變了我的想法？', '還有哪個細節影響我決定花錢？', '回頭看，最後讓我出手的是什麼？']
    ],
    disaster: [
      ['同一場水災裡，兩處現場有什麼關聯？', '居民帶著什麼？他們怎麼穿過街道？', '到了安置所，誰把什麼交給了誰？', '從街上走進安置所，氣氛有什麼改變？'],
      ['我怎麼看災時伸手幫忙這件事？', '誰需要幫助？志工能為他做什麼？', '換一個例子，還有誰因此得到幫助？', '這兩件事讓我看到互助的什麼價值？']
    ]
  };
  const rubricExamples = {
    robot: [
      ['把困擾寫成一件事', '「我很在意別人的看法」可以再寫具體一點。分組討論時，我明明有想法，卻怕同學笑我而沒有開口。'],
      ['把能力接上人的行動', '機器人先陪我練習說出想法。到了小組討論，我就試著提出一個建議。'],
      ['想像中的能力', 'My robot could help me practice.', 'could 後面接原形動詞 help。'],
      ['表達情緒的變化', 'mood swings', '指心情起伏。可以再寫一個讓讀者看見變化的時刻。']
    ],
    marketing: [
      ['交代購買的原因', '鞋店只賣十雙。我本來打算回家想想，看到剩下最後一雙，就走向櫃檯。'],
      ['用相同的商品來比較', '先寫限量球鞋為什麼讓我急著買，再寫同款球鞋打七折時，我怎麼衡量價格。'],
      ['分清楚誰影響誰', 'A lower price makes the shoes more attractive.', '主詞 A lower price 是單數，所以用 makes。'],
      ['說清楚折扣', 'thirty percent off', '原價減少三成，也就是打七折。']
    ],
    disaster: [
      ['從動作寫出氣氛', '居民把袋子舉過水面，小心地往前走。到了安置所，志工遞上一碗熱湯。'],
      ['從例子寫到意義', '志工幫一家人找到乾淨的毯子。孩子終於能休息，家長也鬆了一口氣。'],
      ['用動詞寫出動作', 'A volunteer hands a meal to a resident.', '主詞 A volunteer 指一個人，現在式動詞用 hands。'],
      ['選一個看得見的動作', 'hand out meals', 'hand out 表示分發。寫出分發什麼，讀者就能想像現場。']
    ]
  };

  const wh = ['Where', 'What', 'Who', 'When', 'Why', 'How'];
  const layers = [['opening', 'group0', 'group1', 'bridge'], ['stance', 'support0', 'support1', 'ending']];
  const validIndex = (value, size) => Number.isInteger(value) && value >= 0 && value < size;
  const markId = item => item.id ?? item.en;
  function disclosure(title, html) {
    return '<details class="example"><summary>' + esc(title) + '</summary><div class="example-content">' + html + '</div></details>';
  }
  function button(label, attributes = '') {
    return '<button type="button" class="btn secondary" ' + attributes + '>' + esc(label) + '</button>';
  }
  function card(title, html, kicker = '') {
    return '<section class="card">' + (kicker ? '<p class="question-kicker">' + esc(kicker) + '</p>' : '') +
      '<h3>' + esc(title) + '</h3>' + html + '</section>';
  }
  function choice(name, index, label, selected) {
    return '<label class="choice"><input name="' + name + '" id="' + name + '-' + index + '" value="' + index +
      '" type="radio"' + (selected === index ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }

  function cleanLine(value) {
    if (typeof value === 'string') value = { en: value, zh: '' };
    if (!value || typeof value.en !== 'string' || !value.en.trim()) return null;
    return { ...value, en: value.en.slice(0, 18000), zh: typeof value.zh === 'string' ? value.zh.slice(0, 18000) : '',
      marks: Array.isArray(value.marks) ? value.marks.filter(m => m && typeof m.en === 'string' && m.en.length && (wh.includes(m.wh) || [1, 2, 'both'].includes(m.tone))).slice(0, 120) : [] };
  }

  function makeLine(line, materials = []) {
    if (!line) return null;
    const marks = materials.filter(item => item.en && line.en.toLowerCase().includes(item.en.toLowerCase()))
      .map(item => ({ en: item.en, wh: item.wh, id: markId(item), tone: item.tone }));
    return { ...line, marks: [...(line.marks || []), ...marks] };
  }
  function marked(line) {
    if (!line) return '';
    const text = line.en;
    const matches = [];
    const alpha = char => /[A-Za-z0-9]/.test(char || '');
    for (const mark of line.marks || []) {
      const needle = mark.en?.toLowerCase();
      if (!needle) continue;
      const lower = text.toLowerCase();
      let at = lower.indexOf(needle);
      while (at >= 0) {
        const end = at + needle.length;
        if (!(alpha(needle[0]) && alpha(text[at - 1])) && !(alpha(needle.at(-1)) && alpha(text[end]))) matches.push({ at, end, mark });
        at = lower.indexOf(needle, end);
      }
    }
    matches.sort((a, b) => a.at - b.at || b.end - a.end);
    let cursor = 0, html = '';
    for (const { at, end, mark } of matches) {
      if (at < cursor) continue;
      const category = wh.includes(mark.wh) ? ' data-material-category="' + mark.wh + '"' : '';
      const tone = [1, 2, 'both'].includes(mark.tone) ? ' data-point-tone="' + mark.tone + '"' : '';
      html += esc(text.slice(cursor, at)) + '<mark class="material-highlight"' + category + tone +
        ' data-material-id="' + esc(mark.id || mark.en) + '">' + esc(text.slice(at, end)) + '</mark>';
      cursor = end;
    }
    return html + esc(text.slice(cursor));
  }
  function pair(line) {
    return line ? '<p class="en" lang="en">' + marked(line) + '</p>' +
      (line.zh ? '<p class="line-zh" lang="zh-Hant">' + esc(line.zh) + '</p>' : '') : '';
  }
  const four = values => Array.from({ length: 4 }, (_, i) => cleanLine(values?.[i]));
  const object = data => data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  function restore(topic, data) {
    const old = data?.version === 1;
    const saved = old || data?.version === 2 ? data : {};
    return {
      version: 2, active: validIndex(saved.active, 7) ? saved.active : 0,
      track: validIndex(saved.track, topic.tracks.length) ? saved.track : 0,
      quiz: validIndex(saved.quiz, 3) ? saved.quiz : null,
      plans: topic.tracks.map((track, i) => {
        const plan = object(saved.plans?.[i]);
        const done = Array.from({ length: 7 }, (_, j) => old ? false : plan.done?.[j] === true);
        if (old) { done[0] = saved.identified === true; done[6] = saved.readCase === true; }
        return { ...(old ? {} : plan), done,
          selected: [0, 1].map(gi => wh.filter(q => !old && Array.isArray(plan.selected?.[gi]) && plan.selected[gi].includes(q))),
          placed: four(old ? layers[0].map(key => plan.writing?.[key]) : plan.placed),
          stance: validIndex(plan.stance, track.stances.length) ? plan.stance : null,
          positions: track.stances.map((_, si) => {
            const pos = object(plan.positions?.[si]);
            const previous = old ? [pos.stance, ...[0, 1].map(s => pos.responses?.[pos.picks?.[s]]), pos.ending] : pos.placed;
            return { ...(old ? {} : pos), placed: four(previous) };
          })
        };
      })
    };
  }

  function start({ names, scrollLessonTarget }) {
    const id = new URLSearchParams(location.search).get('lesson');
    if (!Object.hasOwn(quizOrder, id)) return false;
    const topic = window.sevenLessons[id];
    const storageKey = 'stepwrite-seven-v2-' + id;
    let state, readFailed = false;
    function read() {
      let raw;
      try { raw = JSON.parse(localStorage.getItem(storageKey) ?? localStorage.getItem('stepwrite-seven-v1-' + id)); }
      catch { readFailed = true; }
      return restore(topic, raw);
    }
    state = read();
    const track = () => topic.tracks[state.track];
    const plan = () => state.plans[state.track];
    const position = () => plan().positions[plan().stance];
    const placed = (p, i) => (p === 0 ? plan() : position())?.placed[i] || null;
    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        $('saveStatus').textContent = '本題進度已保存在這台裝置';
      } catch { $('saveStatus').textContent = '暫時無法保存，請保留分頁，完成後可複製作文。'; }
    }
    function place(p, i, line) {
      const draft = p === 0 ? plan() : position();
      if (p === 0 && (i === 1 || i === 2) && (draft.placed[i]?.en || '') !== (line?.en || '')) {
        window.TopicBonus.changed(ctx);
      }
      if (draft && validIndex(i, 4)) {
        draft.placed[i] = cleanLine(line);
        if (line) layerIndex = i;
      }
    }

    let face = 'sentences';
    let layerIndex = 0;
    let expandedCategory = '';
    function routeChooser() {
      if (topic.tracks.length === 1) return '';
      const options = topic.tracks.map((item, i) => choice('track', i, item.label, state.track));
      return card(topic.trackLabel, '<div class="choices">' + options.join('') + '</div>');
    }
    function materialPanel(gi) {
      const group = track().groups[gi];
      const selected = plan().selected[gi];
      if (!selected.length) return '<span class="empty">等你勾選素材類別</span>';
      const pills = selected.map(q => {
        const key = gi + '-' + q;
        return '<button type="button" class="material-category-pill" data-burger-category="' + key +
          '" id="pill-' + key + '" data-material-category="' + q + '" aria-expanded="' +
          (expandedCategory === key) + '">' + q + '</button>';
      });
      const current = selected.find(q => expandedCategory === gi + '-' + q);
      if (!current) return '<div class="material-summary">' + pills.join('') + '</div>';
      const list = group.materials.filter(item => item.wh === current).map(item =>
        '<li><span class="material-english" lang="en">' + esc(item.en) +
        '</span><span class="material-translation">' + esc(item.zh) + '</span></li>');
      return '<div class="material-summary">' + pills.join('') +
        '</div><div class="burger-layer-materials" tabindex="0"><ol>' + list.join('') + '</ol></div>';
    }

    function burger(paragraph, initial = false) {
      const active = state.active;
      const materials = !initial && paragraph === 0 && (active === 1 || (active === 2 && face === 'materials'));
      const stack = topic.layers[paragraph].map((label, i) => {
        const line = placed(paragraph, i);
        const cls = 'layer ' + layerStyles[i] + (line && !initial ? ' has-value' : '');
        const title = '<strong>' + esc(label) + '</strong>';
        if (materials && active === 2 && (i === 1 || i === 2)) {
          return '<section class="' + cls + '">' + title + materialPanel(i - 1) + '</section>';
        }
        const hint = outlineQuestions[id][paragraph][i];
        if (initial) return '<div class="' + cls + '">' + title + '<small>' + esc(hint) + '</small></div>';
        const gathering = materials && (i === 1 || i === 2);
        const pills = gathering ? plan().selected[i-1].map(q => '<span class="material-category-pill" data-material-category="' + q + '">' + q + '</span>').join('') : '';
        const content = gathering ? '<span class="material-summary">' + (pills || '等你勾選素材類別') + '</span>' : line ? '<span class="user-content" lang="en">' + marked(line) + '</span>' :
          '<span class="user-content empty">' + (paragraph === 0 && i === 3 ? '可略過' : '這一層等你完成') + '</span>';
        return '<button type="button" class="' + cls + '" data-burger-layer="' + i + '" aria-pressed="' +
          (layerIndex === i) + '">' + title + content + '</button>';
      });
      const flip = !initial && active === 2 ? button(face === 'materials' ? '翻回例句面 ↻' :
        '翻看 5W1H 素材面 ↻', 'id="flipBurger" data-burger-flip') : '';
      const gi = layerIndex - 1;
      const selectedTerms = !initial && active === 1 && (gi === 0 || gi === 1) ?
        track().groups[gi].materials.filter(m => plan().selected[gi].includes(m.wh)) : [];
      const list = selectedTerms.length ? '<div class="burger-layer-materials" tabindex="0"><ul class="burger-material-list">' +
        selectedTerms.map(m => '<li data-material-category="' + m.wh + '"><span lang="en">' + esc(m.en) + '</span>　' + esc(m.zh) + '</li>').join('') + '</ul></div>' : '';
      return '<section class="burger-card"><div class="eyebrow">PARAGRAPH ' + (paragraph + 1) +
        '</div><h3>第' + (paragraph ? '二' : '一') + '個漢堡</h3>' + flip +
        '<div class="burger-stack">' + stack.join('') + '</div>' +
        (initial ? '<div class="burger-legend">這一關先認識結構，下一關開始挑材料。</div>' : '<div class="layer-prompt"><b>這一層的小任務</b><br>' + esc(outlineQuestions[id][paragraph][layerIndex]) + list + '</div>') + '</section>';
    }
    function grid(content) {
      const cls = state.active === 1 ? 'work-grid material-grid' : 'work-grid';
      return '<div class="' + cls + '"><div class="activity">' + content +
        '</div><aside id="liveBurger">' + burger(state.active < 3 ? 0 : 1) + '</aside></div>';
    }
    function structure() {
      const options = quizOrder[id].map(i => choice('task', i, topic.quiz[i], state.quiz));
      return '<div class="static-burgers">' + burger(0, true) + burger(1, true) +
        '</div><div class="note">一個漢堡代表一段。<b>上層麵包提出主題，夾心補具體細節，下層麵包收束。</b>一層可以寫好幾句。</div>' +
        card('這份題目要你完成哪兩個任務？', '<div class="choices">' + options.join('') + '</div>', '換你試一題');
    }

    function paragraph(row, index, lang, own) {
      const english = lang === 'en';
      const title = '<h4 class="case-paragraph-title">' + paragraphNames[index] + '</h4>';
      const pieces = row.filter(Boolean);
      let note = '';
      if (own && english) {
        const missing = topic.layers[index].filter((_, i) => !row[i] && (index === 1 || i < 3));
        if (missing.length) note = '<p class="hint">回到第 ' + (index === 1 ? '4～6' : '2、3') + ' 關，把' + missing.map(esc).join('、') + '放進漢堡。</p>';
      }
      if (!english && pieces.some(line => !line.zh)) return title + '<p class="hint">這一段含有尚無中文對照的句子。</p>';
      const parts = row.map((line, i) => {
        if (!line) return '';
        const content = english ? marked(line) : esc(line.zh);
        if (index === 1 && (i === 1 || i === 2)) {
          return '<span class="essay-point" data-point-tone="' + i + '">' + content + '</span>';
        }
        return content;
      });
      const text = parts.filter(Boolean).join(english ? ' ' : '');
      return title + (text ? '<p lang="' + (english ? 'en' : 'zh-Hant') + '">' + text + '</p>' : '') + note;
    }

    function caseReading() {
      const path = track();
      const models = path.groups.map(group => makeLine(group.model, group.materials.filter(m => m.original)));
      const basic = [[path.opening, ...models, window.TopicBonus.result(ctx,0)], window.TopicSecond.basic(ctx)];
      const personal = [0, 1].map(p => [0, 1, 2, 3].map(i => placed(p, i)));
      const paragraphs = (rows, lang, own) => rows.map((row, i) => paragraph(row, i, lang, own)).join('');
      const text = personal.flat().filter(Boolean).map(line => line.en).join(' ');
      const hasChinese = personal.flat().some(line => line?.zh);
      const studentChinese = hasChinese ? disclosure('進階版中文對照', paragraphs(personal, 'zh', true)) : '';
      const copy = text ? '<p class="hint">目前共 ' + window.WorkshopDrafts.countWords(text) + ' 個英文單字</p>' +
        button('複製我的兩段', 'id="copyTopicEssay"') : '';
      return '<div class="case-reading"><article class="card" data-case-version="basic"><h3>基礎版完整範文</h3>' +
        paragraphs(basic, 'en', false) + disclosure('基礎版中文對照', paragraphs(basic, 'zh', false)) + '</article>' +
        '<details class="example" data-case-version="advanced"><summary>進階版完整範文 · 我的兩段作文</summary>' +
        '<div class="example-content" id="myEssay"><p class="hint">前面放進漢堡的句子會依序出現在這裡。</p>' +
        paragraphs(personal, 'en', true) + studentChinese + copy +
        '</div></details><p><a href="index.html?lesson=' + id + '&amp;write=' + id + '#workshop" target="_top">回到這一題，自己寫 →</a></p></div>';
    }

    const first = window.TopicFirst;
    const second = window.TopicSecond;
    const subtitles = [
      '看懂題目的兩個任務，認識每一段的結構。',
      '選開頭句型和寫作焦點，再替 A、B 分別勾選要用的 5W1H 素材。',
      '看所選材料怎麼組英文句子，再替 A、B 各選一句放進漢堡。',
      '選一個立場、挑前面素材，再組第二段的開頭。',
      '替兩個重點各選一個 Why，用前面的 5W1H 素材寫出一個具體解釋或例子。',
      '從你放進漢堡的兩個例子各取一個短語，寫成結尾。',
      '先讀基礎範文，再打開進階的「我的兩段作文」，回看之前採用的句子。'
    ];
    function setDone(index, value) {
      if (index === 0) state.plans.forEach(p => { p.done[0] = value; });
      else plan().done[index] = value;
    }
    const done = i => plan().done[i] === true;
    function notice(text, error = false) {
      const node = $('feedback');
      node.hidden = false; node.classList.toggle('error', error); node.textContent = text;
    }
    function progress() {
      const count = names.reduce((sum, _, i) => sum + Number(done(i)), 0);
      $('progress').value = count;
      $('progressText').textContent = '已確認 ' + count + ' / 7 關 · 每一關都能回頭調整';
      names.forEach((_, i) => $('step-' + i)?.classList.toggle('done', done(i)));
      $('confirm').textContent = state.active >= 3 ?
        (done(state.active) ? '✓ 已讀完這一關' : '讀完這一關') :
        (done(state.active) ? '✓ 已確認，仍可修改' : '確認這一關');
    }
    function render() {
      const active = state.active;
      $('lessonNav').innerHTML = names.map((name, i) => '<button type="button" class="step-tab" id="step-' + i + '" data-step="' + i + '" role="tab"'
        + ' aria-controls="stage" aria-selected="' + (active === i) + '" tabindex="' + (active === i ? 0 : -1) + '"><span class="num">' +
        String(i + 1).padStart(2, '0') + '</span><span class="name">' + esc(name) + '</span></button>').join('');
      const content = active === 0 ? structure() : active <= 2 ? first.view(ctx, active) : active <= 5 ? second.view(ctx, active) : caseReading();
      $('stage').setAttribute('aria-labelledby', 'step-' + active);
      $('stage').innerHTML = '<div class="stage-heading"><div class="eyebrow">STEP 0' +
        (active + 1) + ' / 07</div><h2 id="stageTitle" tabindex="-1">' + esc(names[active]) +
        '</h2><p>' + esc(subtitles[active]) + '</p></div>' + content +
        '<p class="message" role="status" id="feedback" tabindex="-1" hidden></p>';
      $('prev').disabled = active === 0;
      $('next').hidden = active === 6;
      progress();
    }
    function refresh(control) {
      const focused = typeof control === 'string' ? control : control?.id;
      let selector;
      if (!focused && control?.attributes) {
        const attrs = Array.from(control.attributes).filter(a =>
          a.name.startsWith('data-') || ['name', 'value'].includes(a.name));
        if (attrs.length) selector = control.localName + attrs.map(a =>
          '[' + a.name + '="' + CSS.escape(a.value) + '"]').join('');
      }
      const open = new Set(Array.from($('stage').querySelectorAll('details[open][id]')).map(el => el.id));
      render();
      open.forEach(id => { const el = $(id); if (el?.matches('details')) el.open = true; });
      const materialGroups = Array.from($('stage').querySelectorAll('.point-material-group'));
      const toggleAll = $('pointToggleAll');
      if (toggleAll && materialGroups.length) {
        const allOpen = materialGroups.every(group => group.open);
        toggleAll.setAttribute('aria-expanded', String(allOpen));
        toggleAll.textContent = allOpen ? '全部收合' : '全部展開';
      }
      save();
      const next = focused ? $(focused) : selector ? $('stage').querySelector(selector) : null;
      next?.focus({ preventScroll: true });
    }
    function goTo(step, scroll = true) {
      if (!validIndex(step, 7)) return;
      state.active = step;
      face = 'sentences';
      expandedCategory = '';
      layerIndex = step === 1 ? (plan().first?.picture || 0) + 1 : step === 4 ? (position()?.second?.slot || 0) + 1 : 0;
      render();
      save();
      if (scroll) { $('stageTitle').focus({ preventScroll: true }); scrollLessonTarget($('lessonNav'), 'start'); }
    }
    function confirm(step) {
      const error = step === 0 ? state.quiz !== 0 && '再讀一次題目的兩段任務，選出符合的一組。' :
        step <= 2 ? first.validate(ctx, step) : '';
      if (error) { notice(error, true); return false; }
      setDone(step, true); save(); progress();
      notice(step === 0 ? topic.quiz[0] : '已記下，可以繼續下一關。');
      return true;
    }
    const ctx = {
      id, topic, esc, button, card, grid, pair, marked, makeLine, disclosure,
      get state() { return state; }, get track() { return track(); }, get plan() { return plan(); },
      place, placed, position, refresh, save, goTo, notice, routeChooser, confirm, done,
      go: (i, label) => button(label, 'data-go="' + i + '"'),
      invalidate: i => { for (let step = i; step < 3; step++) setDone(step, false); }
    };
    function setupCover() {
      document.body.classList.add('topic-lesson');
      document.title = topic.title + '｜七關作文';
      document.querySelector('meta[name="description"]').content = topic.intro;
      document.querySelector('.hero .eyebrow').textContent = topic.source;
      $('lessonTitle').textContent = topic.title;
      document.querySelector('.hero-intro').textContent = topic.intro;
      document.querySelector('.brand .edition').textContent = '七關作文';
      document.querySelector('.footnote span:last-child').textContent = topic.title;
      document.querySelector('.lesson-shell').setAttribute('aria-label', topic.title + '七關作文教學');
      $('studyTrail').innerHTML = names.map(name => `<span>${esc(name)}</span>`).join(' → ');
      $('question').innerHTML = `<div class="section-label"><h2 id="questionTitle">先把題目放在眼前</h2><small>${esc(topic.source)} · 題意整理</small></div>
        <div class="topic-tasks">${topic.tasks.map((task, i) => `<div class="prompt"><span class="task"><b>${paragraphNames[i]}</b>${esc(task)}</span></div>`).join('')}</div>`;
      document.querySelectorAll('.score-example').forEach((box, i) => {
        const [label, example, hint] = rubricExamples[id][i];
        box.innerHTML = `<span class="example-label">${esc(label)}</span><p${hint ? ' class="example-en" lang="en"' : ''}>${esc(example)}</p>${hint ? `<p class="example-why">${esc(hint)}</p>` : ''}`;
      });
    }

    $('lessonNav').addEventListener('click', event => {
      const tab = event.target.closest('[data-step]');
      if (tab) goTo(Number(tab.dataset.step));
    });
    $('lessonNav').addEventListener('keydown', event => {
      const steps = { ArrowRight: (state.active + 1) % 7, ArrowLeft: (state.active + 6) % 7, Home: 0, End: 6 };
      if (!Object.hasOwn(steps, event.key)) return;
      event.preventDefault(); goTo(steps[event.key], false); $('step-' + state.active).focus();
    });
    $('prev').addEventListener('click', () => goTo(state.active - 1));
    $('next').addEventListener('click', () => goTo(state.active + 1));
    $('confirm').addEventListener('click', () => {
      confirm(state.active);
      $('feedback').focus({preventScroll:true});
      scrollLessonTarget($('feedback'), 'nearest');
    });
    async function copyEssay() {
      const text = [0,1].map(p => [0,1,2,3].map(i => placed(p,i)?.en).filter(Boolean).join(' ')).filter(Boolean).join('\n\n');
      try { await navigator.clipboard.writeText(text); notice('已複製自己的兩段作文。'); }
      catch {
        const box = document.createElement('textarea');
        box.id = 'manualCopy'; box.readOnly = true; box.value = text;
        box.setAttribute('aria-label','選取全文後複製');
        $('manualCopy')?.remove(); $('copyTopicEssay').after(box); box.focus(); box.select();
      }
    }
    function act(event) {
      const el = event.target.closest('button, input, textarea, select, summary');
      if (!el) return;
      if (event.type === 'change' && el.name === 'task') {
        state.quiz = Number(el.value); ctx.invalidate(0); refresh(el); return;
      }
      if (event.type === 'change' && el.name === 'track') {
        const i = Number(el.value);
        if (validIndex(i, topic.tracks.length)) {
          state.track = i;
          layerIndex = (plan().first?.picture || 0) + 1;
          expandedCategory = '';
          refresh(el);
        }
        return;
      }
      if (state.active === 1 && ((event.type === 'change' && el.hasAttribute('data-category-pick')) ||
          (event.type === 'click' && el.hasAttribute('data-model-preset')))) {
        layerIndex = el.dataset.picture === 'B' ? 2 : 1;
      }
      if (event.type === 'click' && el.matches('button')) {
        if (el.hasAttribute('data-go')) { goTo(Number(el.dataset.go)); return; }
        if (el.hasAttribute('data-burger-flip')) { face = face === 'sentences' ? 'materials' : 'sentences'; refresh(el); return; }
        if (el.hasAttribute('data-burger-layer')) {
          layerIndex = Number(el.dataset.burgerLayer);
          if (state.active === 4 && (layerIndex === 1 || layerIndex === 2) && position()?.second) {
            position().second.slot = layerIndex - 1;
          }
          refresh(el); return;
        }
        if (el.hasAttribute('data-burger-category')) {
          const key = el.dataset.burgerCategory; expandedCategory = expandedCategory === key ? '' : key;
          refresh(el); return;
        }
        if (el.id === 'copyTopicEssay') { copyEssay(); return; }
        if (el.hasAttribute('data-switch')) layerIndex = el.dataset.value === 'A' ? 1 : 2;
        if (el.hasAttribute('data-support-slot')) layerIndex = Number(el.dataset.supportSlot);
      }
      if (window.TopicBonus.handle(ctx, el, event)) return;
      if (state.active === 2 && window.TopicFusion.handle(ctx, el, event)) return;
      if (state.active === 1 || state.active === 2) first.handle(ctx, el, event);
      if (state.active >= 3 && state.active <= 5) second.handle(ctx, el, event);
    }
    for (const name of ['click','input','change']) $('stage').addEventListener(name, act);
    window.addEventListener('storage', event => {
      if (event.key !== storageKey && event.key !== null) return;
      state = read(); render();
    });
    setupCover(); render();
    if (readFailed) $('saveStatus').textContent = '無法讀取先前的保存進度，仍可繼續練習。';
    return true;
  }
  window.TopicLesson = { start };
})();

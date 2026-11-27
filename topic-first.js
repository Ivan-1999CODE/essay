(() => {
  'use strict';
  const categories = ['Where', 'What', 'Who', 'When', 'Why', 'How'];
  const labels = {Where: '場景與位置', What: '行動與事件', Who: '人物', When: '時間', Why: '原因或目的', How: '方式或感受'};
  const categoryHints = {
    Where: '選一個能讓讀者看見場景的位置。',
    What: '看看人物做了什麼，留意動作怎麼寫進句子。',
    Who: '找出這件事跟誰有關，再確認句子的主詞。',
    When: '加上時間，可以交代事情發生的時機。',
    Why: '看看這件事為什麼發生，或人物希望達成什麼。',
    How: '用一個動作的方式、反應或感受，補足這個細節。'
  };
  const modelCategories = ['Where', 'Who', 'What', 'How'];
  const letters = ['A', 'B'];

  function planState(ctx) {
    const plan = ctx.plan;
    plan.selected ||= [[], []];
    if (!plan.first) plan.first = {};
    const first = plan.first;
    if (!Array.isArray(first.open)) first.open = [[], []];
    return first;
  }
  const side = (first, key) => first[key] === 1 ? 1 : 0;
  const materials = (ctx, gi) => ctx.track.groups[gi].materials;
  const selected = (ctx, gi) => materials(ctx, gi).filter(m => ctx.plan.selected[gi].includes(m.wh));
  const prepare = (ctx, line, pool) => ctx.makeLine(line, pool);
  const title = (ctx, gi) => letters[gi] + ' · ' + ctx.track.groups[gi].label;
  const currentOpening = (ctx, first) => ctx.track.openings[first.pattern]?.examples[first.focus] || null;
  const checked = flag => flag ? ' checked' : '';
  const openingSource = ctx => ctx.track.groups.flatMap(group => group.materials);
  const attrs = (ctx, gi) => ' data-picture="' + letters[gi] + '" data-group="' + gi + '"';

  function selector(ctx, first, mode) {
    const gi = side(first, mode);
    return '<div class="mini-switch" role="group" aria-label="選擇素材組">' +
      letters.map((letter, i) =>
        '<button type="button" class="pill" id="switch-' + mode + '-' + letter +
        '" data-first data-switch="' + mode + '" data-value="' + letter + '" aria-pressed="' + (i === gi) + '">' +
        ctx.esc(title(ctx, i)) + '</button>').join('') + '</div>';
  }

  function openingButton(ctx, line, attribute, id, label) {
    const placed = ctx.placed(0, 0)?.en === line.en;
    return '<button type="button" id="' + id + '" class="btn secondary" data-first ' + attribute +
      ' aria-pressed="' + placed + '">' + (placed ? '✓ 已放進漢堡' : label) + '</button>';
  }

  function openingOptions(ctx, first, key, rows) {
    const pattern = key === 'pattern';
    return '<fieldset class="opening-group"><legend>' + (pattern ? '1 · 選一個開頭句型' : '2 · 選一個寫作焦點') +
      '</legend><div class="opening-options' + (pattern ? '' : ' opening-focuses') + '">' +
      rows.map((row, i) => {
        const label = typeof row === 'string' ? row : row.label;
        const template = row.template && ctx.esc(row.template).replaceAll('...', '<mark class="opening-slot">…</mark>');
        return '<label class="opening-option"><input type="radio" data-first data-opening-choice="' + key +
          '" name="opening-' + key + '" id="opening-' + key + '-' + i +
          '" value="' + i + '"' + checked(first[key] === i) + '><span><strong>' +
          ctx.esc(label) + '</strong>' + (template ? '<span class="opening-template" lang="en">' + template + '</span>' : '') +
          (row.cue ? '<small>' + ctx.esc(row.cue) + '</small>' : '') + '</span></label>';
      }).join('') + '</div></fieldset>';
  }

  function opening(ctx, first, review) {
    const sample = currentOpening(ctx, first);
    const simple = ctx.track.opening;
    const preview = sample?.parts.map(part => part.slot ? '<mark class="opening-slot">' + ctx.esc(part.text) + '</mark>' : ctx.esc(part.text)).join('');
    const sampleHtml = sample ? '<p class="opening-complete en" lang="en">' + preview + '</p><p class="line-zh" lang="zh-Hant">' + ctx.esc(sample.zh) + '</p>' +
      openingButton(ctx, sample, review ? 'data-reviewed-opening-adopt' : 'data-opening-place',
        review ? 'use-reviewed-opening' : 'use-opening', '把這句開頭放進漢堡') : '';
    const basicButton = openingButton(ctx, simple, 'data-model-opening-adopt data-adopt="opening"',
      review ? 'review-basic' : 'openingModelPreset', '套用第 7 關簡易開頭');
    const placed = ctx.placed(0, 0);
    const stored = placed ? '<div class="opening-saved"><strong>已放進漢堡的開頭</strong><p class="en" lang="en">' + ctx.marked(placed) + '</p></div>' : '';
    if (review) {
      const pattern = ctx.track.openings[first.pattern];
      const focus = ctx.track.focuses[first.focus];
      const tags = [pattern?.label, typeof focus === 'string' ? focus : focus?.label].filter(Boolean);
      return '<section class="card opening-review"><div class="question-kicker">回看第 2 關的選擇</div><h3>我的第一段開頭</h3>' +
        (tags.length ? '<p>' + tags.map(ctx.esc).join(' · ') + '</p>' : '') +
        (sampleHtml ? '<div class="review-example">' + sampleHtml + '</div>' : ctx.go(1, '回第 2 關選句型與焦點')) +
        '<details class="example" id="basic-opening"><summary>簡易示範 · 第 7 關基礎範文</summary><div class="example-content">' +
        ctx.pair(simple) + basicButton + '</div></details>' + stored + '</section>';
    }
    return '<section class="card opening-workbench"><div class="opening-card-header"><div><div class="question-kicker">第一段 · 上層麵包</div><h3>哪一句最適合帶出這一題？</h3></div>' + basicButton + '</div><p class="lead">先挑句型，再選這一段想帶出的重點。</p>' +
      openingOptions(ctx, first, 'pattern', ctx.track.openings) + openingOptions(ctx, first, 'focus', ctx.track.focuses) +
      '<div class="opening-result"><h4>開頭預覽</h4>' + (sampleHtml || '<p class="opening-pending">選好句型及焦點後，這裡就會顯示對應的完整中英句。</p>') + '</div>' +
      '<details class="example" id="opening-model"><summary>看看簡易開頭</summary><div class="example-content">' + ctx.pair(simple) + '</div></details>' + stored + '</section>';
  }

  function termList(ctx, items) {
    return items.map(m => '<li>' + (m.original ? '<span class="material-original-tag">原例句</span>' : '') +
      '<span class="material-english" lang="en">' + ctx.esc(m.en) + '</span><span class="material-translation">' +
      ctx.esc(m.zh) + '</span></li>').join('');
  }

  function categoryCard(ctx, first, gi, q) {
    const items = materials(ctx,gi).filter(m => m.wh === q);
    const opened = first.open[gi].includes(q);
    const used = ctx.plan.selected[gi].includes(q);
    const id = 'category-' + letters[gi] + '-' + q;
    return '<section class="answer-card" data-category-card="' + q + '" data-material-category="' + q + '">' +
      '<div class="category-header"><h4 id="' + id + '-title"><strong>' + q +
      '</strong><span class="category-title">' + labels[q] + '</span></h4><label class="category-choice">' +
      '<input type="checkbox" data-first data-category-pick="' + q + '" id="' + id + '-pick"' +
      attrs(ctx,gi) + checked(used) + '><span>選用 ' + q + '</span></label></div>' +
      '<div class="category-body"><div class="category-answer" id="' + id + '" tabindex="-1" role="region" aria-labelledby="' +
      id + '-title" aria-hidden="' + !opened + '"' + (opened ? '' : ' inert') + '><p class="category-hint">' +
      categoryHints[q] + '</p><ol class="category-materials">' + termList(ctx,items) + '</ol></div>' +
      '<button class="category-cover" type="button" data-first data-category-reveal="' + q + '" aria-controls="' +
      id + '" aria-label="揭開 ' + q + ' 的材料"' + (opened ? ' hidden' : '') + '><span class="cover-mark" aria-hidden="true">✦</span>' +
      '<strong>點一下揭開材料</strong><span>' + q + ' · ' + items.length + ' 點中英材料</span></button></div></section>';
  }

  function observation(ctx, first) {
    const gi = side(first,'picture');
    const opened = first.open[gi].length === categories.length;
    const group = ctx.track.groups[gi];
    const next = gi === 0 ? ctx.button('接著觀察 B', 'data-first data-switch="picture" data-value="B"') :
      ctx.button('回看 A', 'data-first data-switch="picture" data-value="A"') + ctx.button('確認選材，前往組句', 'data-first data-material-next');
    return '<div class="note"><b>每類可以挑合用的詞組。</b>點開卡片看中英素材，勾選後，這一類就會出現在漢堡裡。</div>' +
      '<section class="card material-workbench" data-picture="' + letters[gi] + '"><h3>找材料 · 5W1H</h3>' +
      selector(ctx,first,'picture') + '<h4>' + ctx.esc(title(ctx,gi)) + '</h4><p class="lead">' + ctx.esc(group.question) + '</p>' +
      '<div class="category-reveal-toolbar"><p>可以從原例句開始，再補進自己想寫的時間或原因。</p><div class="category-toolbar-actions">' +
      ctx.button(opened ? '全部收合' : '全部打開', 'id="revealAll" data-first data-reveal-all aria-expanded="' + opened + '"') +
      ctx.button('依照例句勾選', 'id="modelPreset" data-first data-model-preset' + attrs(ctx,gi)) +
      '</div></div><div class="material-selection-status"><p id="pickCount" class="material-count" role="status">' +
      letters[gi] + ' 已選 ' + ctx.plan.selected[gi].length + ' 類，共 ' + selected(ctx,gi).length + ' 個詞組</p></div>' +
      '<div class="observation-grid">' + categories.map(q => categoryCard(ctx,first,gi,q)).join('') + '</div>' +
      '<div class="note answer-reminder">有「原例句」標記的詞組會出現在第 3 關的原例句。其他詞組也可以拿來寫自己的句子。</div>' +
      '<div class="material-start">' + next + '</div></section>';
  }

  function reviewMaterials(ctx, gi) {
    const picked = ctx.plan.selected[gi];
    const groups = picked.map(q => '<li class="material-category" data-material-category="' + q + '"><b>' + q +
      ' · ' + labels[q] + '</b><ol class="material-category-points">' +
      termList(ctx,materials(ctx,gi).filter(m => m.wh === q)) + '</ol></li>');
    return '<div class="materials" data-selected-materials="' + letters[gi] + '"><strong>' +
      letters[gi] + ' · 上一關選用的材料</strong>' + (groups.length ? '<ul>' + groups.join('') + '</ul>' :
        '<p class="hint">回第 2 關勾選想寫的類別，或在下方依照原例句勾選。</p>') + '</div>';
  }

  function view(ctx, active) {
    const first = planState(ctx);
    if (active === 1) return ctx.grid(ctx.routeChooser() + opening(ctx,first,false) + observation(ctx,first));
    const gi = side(first,'sentence');
    const guidingQuestion = ctx.id === 'robot' && gi === 1 ?
      '<p class="lead">接著讀自己的 A。這件事後來影響了誰、讓什麼事變難了？寫完影響，再用「I want to … because …」或「I hope I can … so that …」說明你為什麼想改變。</p>' :
      '<p class="lead">' + ctx.esc(ctx.track.groups[gi].question) + '</p>';
    return ctx.grid(opening(ctx,first,true) + '<section class="card" data-point-tone="' + (gi+1) + '">' +
      '<p class="question-kicker">第一段 · 漢堡夾心</p><h3>替 A、B 各組一個重點</h3>' +
      selector(ctx,first,'sentence') + guidingQuestion + reviewMaterials(ctx,gi) + window.TopicFusion.view(ctx,gi) + '</section>' + window.TopicBonus.view(ctx));
  }

  function changeSelection(ctx, gi, next) {
    const old = ctx.plan.selected[gi];
    if (old.length === next.length && next.every(q => old.includes(q))) return;
    ctx.plan.selected[gi] = categories.filter(q => next.includes(q));
    window.TopicFusion.invalidate(ctx,gi);
    ctx.invalidate(1);
  }

  function validate(ctx, active) {
    if (!ctx.placed(0,0)) return '先選一個開頭，按「放進漢堡」，或套用簡易開頭。';
    if (active === 1) {
      const missing = letters.filter((_,gi) => !ctx.plan.selected[gi].length);
      return missing.length ? '請替 ' + missing.join(' 和 ') + ' 各勾選至少一類素材。' : '';
    }
    const missing = letters.filter((_,gi) => !ctx.placed(0,gi+1));
    return missing.length ? '還需要把 ' + missing.join(' 和 ') + ' 的句子放進漢堡。' : '';
  }

  function handle(ctx, el, event) {
    if (!el.hasAttribute('data-first')) return false;
    const first = planState(ctx);
    const data = el.dataset;
    const gi = side(first,'picture');
    if (event.type === 'change' && data.openingChoice) {
      first[data.openingChoice] = Number(el.value);
    } else if (event.type === 'change' && data.categoryPick) {
      const q = data.categoryPick;
      const picked = ctx.plan.selected[gi].filter(v => v !== q);
      if (el.checked) {
        picked.push(q);
        if (!first.open[gi].includes(q)) first.open[gi].push(q);
      }
      changeSelection(ctx,gi,picked);
    } else if (event.type === 'click' && el.tagName === 'BUTTON') {
      if (data.switch) first[data.switch] = data.value === 'B' ? 1 : 0;
      else if (data.categoryReveal) {
        if (!first.open[gi].includes(data.categoryReveal)) first.open[gi].push(data.categoryReveal);
        ctx.refresh('category-' + letters[gi] + '-' + data.categoryReveal); return true;
      } else if (el.hasAttribute('data-reveal-all')) {
        first.open[gi] = first.open[gi].length === categories.length ? [] : [...categories];
      } else if (el.hasAttribute('data-model-preset')) {
        changeSelection(ctx,gi,modelCategories);
        first.open[gi] = [...new Set([...first.open[gi], ...modelCategories])];
      } else if (el.hasAttribute('data-material-next')) {
        if (ctx.confirm(1)) ctx.goTo(2);
        else document.getElementById('feedback').focus();
        return true;
      } else {
        const model = el.hasAttribute('data-model-opening-adopt');
        const line = model ? ctx.track.opening : currentOpening(ctx,first);
        if (line && ctx.placed(0,0)?.en !== line.en) {
          ctx.place(0,0,prepare(ctx,line,openingSource(ctx)));
          if (!model && ctx.state.active === 1) ctx.invalidate(1);
          else ctx.invalidate(2);
        }
      }
    } else return false;
    ctx.refresh(el);
    return true;
  }

  window.TopicFirst = { view, handle, validate };
})();

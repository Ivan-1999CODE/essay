(() => {
  'use strict';

  const names = { Where: '地點', What: '動作或事件', Who: '人物', When: '時間', Why: '原因或目的', How: '方式或感受' };
  const frames = {
    Where: '地點詞組可以放在動作旁，也可以放到句首來交代場景。',
    What: '先找出做這件事的人，再看動詞如何交代發生了什麼。',
    Who: '留意人物在句中是主詞還是接受動作的對象。',
    When: '先找出時間詞組，再看它修飾的是哪個動作。',
    Why: '找出事情發生的原因，或人物做這件事的目的。',
    How: '找出一個動作，再看看作者怎麼寫出方式或當事人的感受。'
  };
  const core = ['Where', 'Who', 'What', 'How'];
  const letter = gi => gi === 0 ? 'A' : 'B';
  const available = (ctx, gi) => ctx.track.groups[gi].materials;
  const picked = (ctx, gi) => ctx.plan.selected[gi];
  const list = (ctx, gi) => available(ctx, gi).filter(m => picked(ctx, gi).includes(m.wh));

  function state(ctx) {
    const f = ctx.plan.first ||= {};
    f.fused ||= [false, false];
    f.chosenFusion ||= [false, false];
    f.custom ||= ['', ''];
    f.kept ||= [null, null];
    f.phrases ||= [{}, {}];
    return f;
  }
  function controls(ctx, gi, attribute, text, extra = '') {
    return '<button type="button" class="btn secondary" data-fusion data-group="' + gi + '" data-picture="' +
      letter(gi) + '" ' + attribute + ' ' + extra + '>' + ctx.esc(text) + '</button>';
  }
  function adopt(ctx, gi, attribute, line, label) {
    const current = ctx.placed(0, gi + 1);
    const same = current?.en === line.en;
    return controls(ctx, gi, attribute, same ? '✓ 已放進漢堡' : label, 'aria-pressed="' + same + '"');
  }
  function original(ctx, gi) {
    const group = ctx.track.groups[gi];
    return ctx.makeLine(group.model, group.materials.filter(m => m.original));
  }
  function modelView(ctx, gi, f) {
    const missing = core.filter(wh => !picked(ctx, gi).includes(wh));
    const open = !missing.length && f.fused[gi];
    const line = original(ctx, gi);
    const terms = available(ctx, gi).filter(m => m.original);
    const legend = core.map(wh => {
      const words = terms.filter(m => m.wh === wh).map(m => '<span class="guide-term" data-material-category="' +
        wh + '" data-material-id="' + m.id + '"><span lang="en">' + ctx.esc(m.en) + '</span><small>' +
        ctx.esc(m.zh) + '</small></span>').join(' ');
      return '<div><strong>' + wh + '</strong> ' + words + '</div>';
    }).join('');
    const fix = missing.length ? '<p class="model-fusion-missing">原例句還需要 ' + missing.join('、') + '。</p>' +
      controls(ctx, gi, 'data-model-preset', '依照例句勾選') : '';
    return '<section class="model-fusion"><h3>原例句示範 · ' + letter(gi) + '</h3>' +
      '<p>先找出帶有「原例句」標記的地點、人物、動作和方式，再看看作者怎麼用這四類材料組句。</p>' +
      '<div class="fusion-sources">' + legend + '</div>' + fix +
      controls(ctx, gi, 'data-model-fuse', open ? '收起融合例句' : '依照例句融合',
        'aria-controls="modelAnswer-' + gi + '" aria-expanded="' + Boolean(open) + '"' + (missing.length ? ' disabled' : '')) +
      '<div id="modelAnswer-' + gi + '"' + (open ? '' : ' hidden') + '>' + (open ? ctx.pair(line) +
        adopt(ctx, gi, 'data-model-adopt', line, '把原例句放進漢堡') : '') + '</div></section>';
  }
  function selectedPhrases(ctx, gi, f) {
    const terms = list(ctx, gi);
    return Object.keys(names).filter(q => picked(ctx, gi).includes(q)).map(q => {
      const choices = terms.filter(m => m.wh === q);
      return choices.find(m => m.id === f.phrases[gi][q]) || choices.find(m => m.original) || choices[0];
    }).filter(Boolean);
  }
  function selectedLine(ctx, gi, f) {
    const words = selectedPhrases(ctx, gi, f).map(term => ({...term, group: gi}));
    return window.TopicSupportGrammar.scene(ctx, words);
  }
  function chosenView(ctx, gi, f) {
    const words = selectedPhrases(ctx, gi, f);
    if (!words.length) return '';
    const fields = words.map(term => {
      const rows = available(ctx, gi).filter(m => m.wh === term.wh).map(m =>
        '<option value="' + ctx.esc(m.id) + '"' + (m.id === term.id ? ' selected' : '') + '>' +
        ctx.esc(m.en + ' · ' + m.zh) + '</option>').join('');
      return '<label>' + term.wh + ' · ' + names[term.wh] +
        '<select data-fusion data-fusion-phrase="' + term.wh + '" data-group="' + gi + '">' + rows + '</select></label>';
    }).join('');
    const line = selectedLine(ctx, gi, f);
    const active = f.chosenFusion[gi];
    return '<section class="model-fusion"><h3>用我選的類別融合 · ' + letter(gi) + '</h3>' +
      '<p>每類選一個想寫進去的片語。組句時，有些動詞會隨主詞或時間調整。</p><div class="fusion-terms">' + fields + '</div>' +
      controls(ctx, gi, 'data-selected-fuse', active ? '收起自選融合例句' : '用這些片語融合',
        'aria-expanded="' + Boolean(active) + '" aria-controls="chosenAnswer-' + gi + '"') +
      '<div id="chosenAnswer-' + gi + '"' + (active ? '' : ' hidden') + '>' + (active ? ctx.pair(line) +
      adopt(ctx, gi, 'data-selected-adopt', line, '把自選融合句放進漢堡') : '') + '</div></section>';
  }
  function examples(ctx, gi) {
    const pool = list(ctx, gi);
    const rows = Object.keys(names).filter(wh => picked(ctx,gi).includes(wh)).map(wh => {
      const choices = new Map();
      for (const item of pool.filter(m => m.wh === wh)) choices.set(item.sentence.en, item.sentence);
      return {key:wh, label:wh + ' · ' + names[wh], note:frames[wh], lines:[...choices.values()]};
    });
    if (picked(ctx,gi).includes('Where') && picked(ctx,gi).includes('What')) {
      rows.push({key:'combined', label:'Where ＋ What · 把地點和動作合起來',
        note:'先讀人物做了什麼，再圈出這個動作發生的地點。這兩種材料能放在同一句。', lines:[ctx.track.groups[gi].combined]});
    }
    return rows;
  }
  function supplementary(ctx, gi) {
    const pool = list(ctx, gi);
    const rows = examples(ctx, gi).map(row => {
      const lines = row.lines.map((sample, i) => {
        const line = ctx.makeLine(sample, pool);
        const refs = pool.filter(m => (row.key === 'combined' ? ['Where','What'].includes(m.wh) : m.wh === row.key) &&
          sample.en.toLowerCase().includes(m.en.toLowerCase()));
        const source = refs.map(m => '<span class="material-part" data-material-category="' + m.wh +
          '" data-material-id="' + m.id + '">' + m.wh + ' · ' + ctx.esc(m.en) + '</span>').join(' ');
        return '<div class="topic-sentence"><p class="example-source">使用材料　' + source + '</p>' + ctx.pair(line) +
          adopt(ctx, gi, 'data-example-adopt="' + row.key + '" data-example-index="' + i + '"', line, '把這個示範放進漢堡') + '</div>';
      }).join('');
      return '<section class="sentence-example" data-sentence-example="' + row.key + '"><h4>' + row.label +
        '</h4>' + lines + '<p class="example-frame">' + row.note + '</p></section>';
    }).join('');
    return '<details class="example" id="extra-group-' + gi + '"><summary>看 ' + letter(gi) +
      ' 的補充組句示範</summary><div class="example-content"><p>每個示範使用第 2 關選到的材料。先讀英文找出詞組，再用中文確認意思。</p>' +
      (rows || '<p>回第 2 關勾選類別後，就能打開對應的示範。</p>') + '</div></details>';
  }
  function customView(ctx, gi, f) {
    const old = f.kept[gi];
    const placed = ctx.placed(0, gi+1);
    const text = f.custom[gi];
    return (old && !placed ? '<section class="opening-saved"><h4>上一次放入的句子</h4>' + ctx.pair(old) +
      adopt(ctx, gi, 'data-fusion-restore', old, '沿用原句，放進漢堡') + '</section>' : '') +
      '<details class="example" id="custom-group-' + gi + '"><summary>試著改成自己的句子 · ' + letter(gi) + '</summary>' +
      '<div class="example-content">' + (placed ? controls(ctx, gi, 'data-custom-copy', '用漢堡裡這句作為改寫起點') : '') +
      '<label for="field-group' + gi + '">我的英文句子</label><textarea id="field-group' + gi +
      '" data-fusion data-fusion-custom data-field="group' + gi + '" data-group="' + gi + '" lang="en" rows="3">' +
      ctx.esc(text) + '</textarea>' + controls(ctx, gi, 'data-custom-adopt', '把我的句子放進漢堡', text.trim() ? '' : 'disabled') +
      '</div></details>';
  }
  function view(ctx, gi) {
    const f = state(ctx);
    return modelView(ctx,gi,f) + chosenView(ctx,gi,f) + supplementary(ctx,gi) + customView(ctx,gi,f);
  }
  function invalidate(ctx, gi) {
    const f = state(ctx);
    const placed = ctx.placed(0,gi+1);
    if (placed) f.kept[gi] = placed;
    f.fused[gi] = false;
    f.chosenFusion[gi] = false;
    ctx.place(0,gi+1,null);
    ctx.invalidate(2);
  }
  function handle(ctx, el, event) {
    if (!el.hasAttribute('data-fusion') || ctx.state.active !== 2) return false;
    const gi = Number(el.dataset.group);
    if (gi !== 0 && gi !== 1) return false;
    const f = state(ctx);
    const data = el.dataset;
    if (el.hasAttribute('data-fusion-custom') && event.type === 'input') {
      f.custom[gi] = el.value;
      const adoptButton = el.parentElement.querySelector('[data-custom-adopt]');
      if (adoptButton) adoptButton.disabled = !el.value.trim();
      ctx.save();
      return true;
    }
    if (el.hasAttribute('data-fusion-phrase') && event.type === 'change') {
      f.phrases[gi][data.fusionPhrase] = el.value;
      f.chosenFusion[gi] = false;
      ctx.refresh(el);
      return true;
    }
    if (event.type !== 'click' || el.tagName !== 'BUTTON') return false;
    let line;
    if (el.hasAttribute('data-model-preset')) {
      invalidate(ctx, gi);
      ctx.plan.selected[gi] = [...core];
      if (f.open) f.open[gi] = [...new Set([...(f.open[gi] || []), ...core])];
    } else if (el.hasAttribute('data-model-fuse')) {
      f.fused[gi] = core.every(q => picked(ctx,gi).includes(q)) && !f.fused[gi];
    } else if (el.hasAttribute('data-model-adopt') && f.fused[gi]) {
      line = original(ctx,gi);
    } else if (el.hasAttribute('data-selected-fuse')) {
      f.chosenFusion[gi] = !f.chosenFusion[gi];
    } else if (el.hasAttribute('data-selected-adopt') && f.chosenFusion[gi]) {
      line = selectedLine(ctx,gi,f);
    } else if (el.hasAttribute('data-example-adopt')) {
      const row = examples(ctx,gi).find(choice => choice.key === data.exampleAdopt);
      const sample = row?.lines[Number(data.exampleIndex)];
      if (sample) line = ctx.makeLine(sample, list(ctx,gi));
    } else if (el.hasAttribute('data-fusion-restore')) {
      line = f.kept[gi];
    } else if (el.hasAttribute('data-custom-copy')) {
      f.custom[gi] = ctx.placed(0,gi+1)?.en || f.custom[gi];
    } else if (el.hasAttribute('data-custom-adopt')) {
      const en = f.custom[gi].trim();
      if (!en) return true;
      const sources = [ctx.track.groups[gi].model, ctx.placed(0,gi+1), f.kept[gi], ...list(ctx,gi).map(m => m.sentence)];
      line = ctx.makeLine(sources.find(src => src?.en === en) || {en,zh:''}, list(ctx,gi));
    } else return false;
    if (line) {
      ctx.place(0,gi+1,line);
      f.kept[gi] = null;
      ctx.invalidate(2);
    }
    ctx.refresh(el);
    return true;
  }
  window.TopicFusion = {view, handle, invalidate};
})();

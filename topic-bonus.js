(() => {
  'use strict';
  const cues = {
    robot: [
      [
        [['answered sharply', '語氣很衝地回答', 'How'], ['stayed quiet', '朋友沉默', 'How']],
        [['an offer of help', '朋友提出幫忙', 'What'], ['struggle to finish my work', '功課難以完成', 'What']]
      ], [
        [['Seeing a couple at the bakery', '在麵包店看到一對情侶', 'What'], ['reread old messages', '反覆讀舊訊息', 'What']],
        [['turn away from both familiar places and my friends', '避開熟悉的地方和朋友', 'What'], ['finding my way back to them', '想重新走進生活', 'Why']]
      ], [
        [['asked for my opinion', '同學詢問我的意見', 'What'], ['without ever hearing my idea', '小組沒聽到我的點子', 'What']],
        [['Putting my hand down', '把手放下', 'What'], ['a chance to speak', '錯過發言的機會', 'What']]
      ]
    ],
    marketing: [[
      [['limits the number of pairs', '限制販售數量', 'What'], ['lowers the price', '降低價格', 'What']],
      [['hurry to get a limited pair', '怕買不到而趕快買', 'Why'], ['take time to compare prices', '先比較價格', 'What']]
    ]],
    disaster: [[
      [['struggle to protect their bags', '吃力地護住行李', 'What'], ['offer hot meals', '送上熱食', 'What']],
      [['walks slowly through the water', '在水裡慢慢前進', 'How'], ['a warm welcome', '受到溫暖接待', 'How']]
    ]]
  };
  const side = i => i === 0 ? 'A' : 'B';
  const selected = (ctx, gi) => ctx.track.groups[gi].materials.filter(item => ctx.plan.selected[gi].includes(item.wh));
  function state(ctx) {
    return ctx.plan.bonus || (ctx.plan.bonus = { open: false, revealed: [false,false], review: false });
  }
  function takeaways(ctx, i) {
    return cues[ctx.id][ctx.topic.tracks.indexOf(ctx.track)][i];
  }
  function result(ctx, i) {
    const source = ctx.track.bonuses[i];
    if (!source) return null;
    const marks = takeaways(ctx, i).map(([en, , wh], gi) => ({ en, wh, tone: gi + 1 }));
    return { en: source.en, zh: source.zh, marks };
  }
  function evidence(ctx, i, gi) {
    const quote = ctx.track.bonuses[i][gi ? 'b' : 'a'];
    const own = ctx.placed(0,gi+1);
    const fromStudent = own?.en.toLowerCase().includes(quote.en.toLowerCase());
    const line = ctx.makeLine(quote, ctx.track.groups[gi].materials);
    const [en, zh, wh] = takeaways(ctx,i)[gi];
    return '<div class="bonus-point" data-bonus-evidence="' + side(gi) +
      '" data-evidence-source="' + (fromStudent ? 'student' : 'model') + '"><h5>' +
      side(gi) + ' · ' + (fromStudent ? '我的原句' : '教材示範原句') + '</h5>' +
      '<p class="bonus-quote" lang="en" data-point-tone="' + (gi + 1) + '">' + ctx.marked(line) + '</p>' +
      '<div class="bonus-takeaway"><span aria-hidden="true">→</span><div>' + ctx.esc(zh) +
      '<br><strong lang="en">' + ctx.marked({ en, marks: [{ en, wh, tone: gi+1 }] }) + '</strong></div></div></div>';
  }
  function sources(ctx) {
    return '<div class="bonus-source-grid">' + [0,1].map(gi => {
      const own = ctx.placed(0,gi+1);
      const items = selected(ctx,gi);
      const list = ctx.plan.selected[gi].map(wh => '<div class="bonus-material-row" data-material-category="' + wh + '"><b>' + wh + '</b><ul>' +
        items.filter(item => item.wh === wh).map(item => '<li><span lang="en">' + ctx.esc(item.en) + '</span>　' + ctx.esc(item.zh) + '</li>').join('') + '</ul></div>').join('');
      return '<section class="bonus-source-card" data-bonus-source="' + side(gi) + '"><h4>' +
        side(gi) + ' · ' + ctx.esc(ctx.track.groups[gi].label) + '</h4>' +
        (own ? ctx.pair(own) : '<p>這一側還沒有放進句子。</p>') +
        (list ? ctx.disclosure('回看 ' + side(gi) + ' 已選的素材', '<div class="bonus-materials">' + list + '</div>') : '') + '</section>';
    }).join('') + '</div>';
  }
  function example(ctx, i) {
    const n = i + 1;
    const item = ctx.track.bonuses[i];
    const opened = state(ctx).revealed[i];
    const answer = result(ctx,i);
    const saved = ctx.placed(0,3);
    const label = (saved?.en === answer.en) ? '✓ 已放進漢堡' : saved ? '改用這句，放進漢堡' : '把這句放進漢堡';
    const title = '示範 ' + n + ' · ' + ctx.esc(item.title);
    const content = '<div class="bonus-example-body"><div class="bonus-points">' + evidence(ctx,i,0) + evidence(ctx,i,1) +
      '</div>' + (opened ? '<div class="bonus-rationale"><h5>為什麼可以合成一句？</h5><p>' +
        ctx.esc(item.why) + '</p></div><div class="bonus-result"><h5>合起來的句子</h5>' + ctx.pair(answer) + '</div>' +
        ctx.button(label,'id="bonus-adopt-'+ n +'" data-bonus-adopt="'+ n +'"') :
        ctx.button('揭開合句的理由與例句 ↓','id="bonus-reveal-'+ n +'" data-bonus-reveal="'+ n +'"')) + '</div>';
    if (i) return '<details class="bonus-example-card" id="bonus-card-2"><summary class="bonus-example-header">' + title + '</summary>' + content + '</details>';
    return '<section class="bonus-example-card"><h4 class="bonus-example-header">' + title + '</h4>' + content + '</section>';
  }
  function view(ctx) {
    const b = state(ctx);
    const saved = ctx.placed(0,3);
    return '<section class="bonus-block"><button type="button" id="bonus-toggle" class="bonus-toggle" data-bonus-toggle aria-expanded="' +
      Boolean(b.open) + '" aria-controls="bonusPanel"><span>③ Bonus · 用一句話收束 A 和 B（可選）</span><span class="bonus-toggle-state">' +
      (b.open ? '收起練習區' : '打開練習區') + '</span></button><div class="bonus-summary-row">' +
      '<p class="bonus-summary" role="status">' + (saved ? '這句已放進漢堡。' :
        b.review ? 'A 或 B 的句子已修改，請重新核對收束句。' : '可以在這裡結束第一段，也可以直接進入下一關。') + '</p>' +
      (saved ? ctx.button('不使用這句 Bonus', 'id="removeBonus" data-bonus-remove') :
        b.review && b.previous ? ctx.button('已核對 A、B，重新放入原收束句', 'id="restoreBonus" data-bonus-restore') : '') +
      '</div><div class="bonus-panel" id="bonusPanel"' + (b.open ? '' : ' hidden') +
      '><h3>先並排看自己的 A 和 B</h3>' + sources(ctx) + '<div class="bonus-merge-arrow" aria-hidden="true"><span></span></div><h3>兩邊各取一個重點，連成一句</h3><p class="hint">先看兩句話分別取了哪個重點，再揭開合句的理由。</p><div class="bonus-examples">' +
      ctx.track.bonuses.map((_,i) => example(ctx,i)).join('') + '</div></div></section>';
  }
  function changed(ctx) {
    const line = ctx.placed(0,3);
    if (!line) return;
    const b = state(ctx);
    b.review = true;
    b.previous = line;
    ctx.place(0,3,null);
  }
  function handle(ctx, el, event) {
    if (ctx.state.active !== 2 || event.type !== 'click' || el.tagName !== 'BUTTON') return false;
    const b = state(ctx);
    if (el.hasAttribute('data-bonus-toggle')) b.open = !b.open;
    else if (el.hasAttribute('data-bonus-remove')) {
      ctx.place(0,3,null); b.review = false; b.previous = null;
      ctx.invalidate(2);
    } else if (el.hasAttribute('data-bonus-restore')) {
      if (b.previous) {ctx.place(0,3,b.previous); b.review=false; ctx.invalidate(2);}
    } else if (el.hasAttribute('data-bonus-reveal')) {
      const i = Number(el.dataset.bonusReveal)-1;
      if (b.open && (i === 0 || i === 1)) b.revealed[i] = true;
    } else if (el.hasAttribute('data-bonus-adopt')) {
      const i = Number(el.dataset.bonusAdopt)-1;
      if (b.open && b.revealed[i]) {
        ctx.place(0,3,result(ctx,i));
        ctx.invalidate(2);
        b.review = false;
      }
    } else return false;
    ctx.refresh(el);
    return true;
  }
  window.TopicBonus = { view, handle, result, changed };
})();

(() => {
  'use strict';
  const root = document.getElementById('transitionReference');
  const data = window.transitionReference;
  if (!root || !data) return;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const format = value => escape(value).replace(/\[([^\]]+)\]/g, '<span class="ref-slot" lang="zh-Hant">[$1]</span>');
  const wordCount = value => (value.replace(/\[[^\]]+\]/g, '').match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
  const sourceWei = 'https://cnash-english.weebly.com/101397593116834349327692410723531203162516320874.html';
  const sourceZhao = 'https://rulin23613266.pixnet.net/blog/posts/17295026756';
  const sourceEagle = 'https://broadeagleenglish.com/gsat-english-essay-writing/';
  const sourceCEEC = 'https://www.ceec.edu.tw/xcepaper/cont?sid=0Q111569514236767793&xsmsid=0J066588036013658199';
  const priorityCount = data.rows.filter(row => row[7] === '優先背').length;
  const sequence = [['第一點', 'first'], ['第二點', 'second'], ['第三點', 'third'], ['結論', 'conclusion']]
    .map(([label, category]) => [label, data.rows.find(row => row[0] === category && row[7] === '優先背')]);
  const labels = ['轉承語與意思', '可直接套用的句型', '完整例句與翻譯', '接法與使用提醒'];
  root.classList.add('reference-library');
  root.innerHTML = `
    <div class="ref-intro">
      <p class="ref-eyebrow">TRANSITIONS & SENTENCE FRAMES</p>
      <h3>高中英文作文｜${data.categories.length} 類、${data.rows.length} 組詳細查閱表</h3>
      <p>從第一個理由寫到最後的結論。每一組都有中文意思、可替換空格、完整例句與使用提醒，涵蓋列點、補充、舉例、對比、立場與結論等常用寫作用途。</p>
      <p class="ref-note">每類精選 1–2 組，全表共 ${priorityCount} 組優先背。以自然好套用、能延伸內容的高中長句為優先；長句骨架與例句為本教材編寫，並非老師票選排名。</p>
      <p class="ref-priority-note"><strong>背誦順序：</strong>先背每類上方的<span class="ref-key-primary">綠色「優先背」</span>，下方<span class="ref-key-alternative">橘色「可替換」</span>需要時再查。照完整句型替換灰底 [空格]；同一列的同義開頭選一種，不必全部背。</p>
    </div>
    <div class="ref-sequence" aria-label="先背這組：三點與結論">
      ${sequence.map(([label, row]) => `<article><strong>${label}</strong><p class="ref-en" lang="en">${format(row[3])}</p><p class="ref-zh">${escape(row[2])}</p><span class="ref-fixed-count">固定英文 ${wordCount(row[3])} 字，不含你填入的內容</span></article>`).join('')}
    </div>
    <p class="ref-note">第三點依本教材安排採用 <span lang="en">Last but not least</span>：表示「最後但仍重要的一點」，不代表全文結論。只有兩個理由時，不必硬湊第三點；若後面還有第四點，就不要在第三點使用 Last。</p>
    <details class="ref-sample"><summary>看完整示範：三個理由如何接成一段？</summary><div class="ref-detail-body">
      <p class="ref-note">示範「理想公園」的觀點段，並非整篇作文。固定骨架之外，每個理由都補一項具體行動或細節。</p>
      <p class="ref-en" lang="en">My ideal park would have tall trees, an open lawn, and safe walking paths. <strong>To begin with, one important reason is that</strong> a quiet park gives me a place to relax. After school, I could walk under the trees and take a break from homework. <strong>In addition to this, another point worth considering is that</strong> the lawn allows my family to spend time together. We could have a picnic there and talk about our week. <strong>Last but not least, we should not overlook the importance of</strong> staying active. The walking paths would give me a place to exercise without paying for a gym. <strong>For all the reasons mentioned above, I believe that</strong> such a park would meet my needs for rest, family time, and exercise.</p>
      <p class="ref-zh">我的理想公園會有高樹、開闊的草地和安全步道。首先，一個重要理由是安靜的公園能讓我放鬆。放學後，我能在樹下散步，暫時放下功課。除此之外，另一個值得考慮的重點是，草地讓家人有機會相處。我們可以在那裡野餐，聊聊這一週的生活。最後但同樣重要的是，我們不應忽略保持活動的重要性。步道能讓我有地方運動，不必支付健身房費用。基於上述所有理由，我認為這樣的公園能滿足我休息、家庭相處與運動的需要。</p>
    </div></details>
    <div class="ref-controls">
      <label class="ref-search-label" for="transitionSearch">查英文、中文用途或文法提醒</label>
      <div class="ref-search-row"><input id="transitionSearch" type="search" placeholder="例如：第二點、結論、because、完整理由句" autocomplete="off"><button type="button" class="ref-button" id="transitionReset">清除篩選</button><button type="button" class="ref-button" id="transitionPrint">列印目前結果</button></div>
      <div class="ref-filters" aria-label="快速篩選">
        <button type="button" class="ref-button" data-ref-filter="all" aria-pressed="true">全部句型</button>
        <button type="button" class="ref-button" data-ref-filter="priority" aria-pressed="false">優先背（${priorityCount} 組）</button>
        <button type="button" class="ref-button" data-ref-filter="sequence" aria-pressed="false">第一、第二、第三點</button>
        <button type="button" class="ref-button" data-ref-filter="conclusion" aria-pressed="false">結論</button>
      </div>
      <details class="ref-category-picker"><summary>依 ${data.categories.length} 種用途篩選</summary><div class="ref-detail-body ref-filters">${data.categories.map(([id, title]) => `<button type="button" class="ref-button" data-ref-filter="${id}" aria-pressed="false">${escape(title)}</button>`).join('')}</div></details>
      <div class="ref-actions"><p id="transitionResults" class="ref-results" role="status" aria-live="polite"></p><div><button type="button" class="ref-button" id="transitionExpand">展開目前結果</button><button type="button" class="ref-button" id="transitionCollapse">收合目前結果</button></div></div>
      <p class="ref-copy-status" id="transitionCopyStatus" role="status" aria-live="polite"></p>
    </div>
    <div id="transitionGroups">${data.categories.map(([id, title, purpose], categoryIndex) => {
      const rows = data.rows.map((row, index) => ({ row, index })).filter(item => item.row[0] === id);
      return `<details class="ref-category" data-ref-category="${id}" ${categoryIndex === 0 ? 'open' : ''}><summary>${String(categoryIndex + 1).padStart(2, '0')}. ${escape(title)}<span class="ref-count">${rows.length} 組</span></summary><p class="ref-purpose">${escape(purpose)}</p><table class="ref-table" aria-label="${escape(title)}詳細句型表"><thead><tr>${labels.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map(({row, index}) => `<tr data-ref-row="${index}" data-ref-priority="${row[7] === '優先背' ? 'primary' : 'alternative'}">
        <td data-label="${labels[0]}"><span class="ref-row-tag ${row[7] === '優先背' ? 'primary' : 'alternative'}">${row[7]}</span><div class="ref-en" lang="en">${escape(row[1])}</div><span class="ref-zh">${escape(row[2])}</span></td>
        <td data-label="${labels[1]}"><div class="ref-en" lang="en">${format(row[3])}</div><button type="button" class="ref-button ref-copy" data-ref-copy="${index}" aria-label="複製句型：${escape(row[1])}">複製句型</button></td>
        <td data-label="${labels[2]}"><div class="ref-en" lang="en">${escape(row[4])}</div><span class="ref-zh">${escape(row[5])}</span></td>
        <td data-label="${labels[3]}">${escape(row[6])}</td></tr>`).join('')}</tbody></table></details>`;
    }).join('')}</div>
    <p id="transitionEmpty" class="ref-empty" hidden>找不到符合的句型。試試較短的關鍵字，或按「清除篩選」回到全部內容。</p>
    <details class="ref-grammar"><summary>使用前必看：8 個最常出錯的地方</summary><div class="ref-detail-body"><ul>
      <li><strong>完整句與名詞不同：</strong><span lang="en">because / although / so that</span> 後接主詞與動詞；<span lang="en">because of / despite / such as</span> 後通常接名詞或 V-ing。</li>
      <li><strong>不要只用逗號黏兩句：</strong><span lang="en">I was tired. However, I kept working.</span> 或 <span lang="en">I was tired; however, I kept working.</span> 都可以。</li>
      <li><strong>中文雙連詞不直接照搬：</strong>選 <span lang="en">Because A, B.</span> 或 <span lang="en">A, so B.</span>；選 <span lang="en">Although A, B.</span> 或 <span lang="en">A, but B.</span></li>
      <li><strong>首點不是起初：</strong><span lang="en">First / To begin with</span> 可列理由；<span lang="en">At first</span> 表示起初的情況，常與後來的變化相對。<a href="https://dictionary.cambridge.org/grammar/british-grammar/first-firstly-or-at-first" target="_blank" rel="noopener noreferrer">Cambridge 用法說明</a>。</li>
      <li><strong>最後一點與結論分開：</strong><span lang="en">Last but not least</span> 帶出最後一項理由；<span lang="en">In conclusion</span> 回收全部重點；<span lang="en">Ultimately</span> 多談最終結果或判斷，不直接當 Third 的替代。</li>
      <li><strong>另一方面不等於正好相反：</strong><span lang="en">On the other hand</span> 談另一面向；<span lang="en">On the contrary</span> 反駁前述看法。例如 <span lang="en">The task was not a waste of time. On the contrary, it taught us a useful skill.</span></li>
      <li><strong>長句主詞要對得上：</strong><span lang="en">Taking everything into consideration, I believe …</span> 的思考者是 I。<span lang="en">In order to relax, I …</span> 的放鬆者也是 I。</li>
      <li><strong>不堆同義開頭：</strong>一個位置挑一種句型。強調語如 <span lang="en">foremost / above all</span> 要真的有重要性排序；正式詞和較長句型都不保證比較高分。</li>
    </ul></div></details>
    <details class="ref-evidence"><summary>老師與教學資料怎麼建議？來源與整理方式</summary><div class="ref-detail-body">
      <p class="ref-note">查閱日期：2026 年 11 月 14 日。以下是公開教材與文章的重點整理，不代表所有高中英文老師的一致排名；本表的長句及例句均另外編寫。</p>
      <ul>
        <li><strong>暨大附中英文教學網・魏秀蘭老師寫作手冊：</strong>按順序、例子、結果與結論等功能列出工具，例如 <span lang="en">To begin with / Last but not least / For instance / As a result / In conclusion</span>。本表採用按功能查找的方式，並重新核對易混用項目的分類。<a href="${sourceWei}" target="_blank" rel="noopener noreferrer">閱讀原手冊</a>。</li>
        <li><strong>台北儒林・趙捷老師：</strong>提醒熟悉 <span lang="en">therefore / for example / however / in fact</span> 的語意關係；作文先寫清楚主題，細節要支持主題，結尾回扣。也提醒不為拉長而寫贅句。<a href="${sourceZhao}" target="_blank" rel="noopener noreferrer">閱讀考前叮嚀</a>。</li>
        <li><strong>寬鷹英文・學測寫作教學：</strong>補充理由可用 <span lang="en">In addition / Moreover</span>；結尾可用 <span lang="en">In conclusion</span>，或以 <span lang="en">From this experience, I learned that …</span> 進入反思。這是教學網站建議，未當成具名老師票選。<a href="${sourceEagle}" target="_blank" rel="noopener noreferrer">閱讀學測作文教學</a>。</li>
        <li><strong>大考中心・115 學測英文評分原則：</strong>評量會看內容、組織、文法句構和字彙拼字；轉承的效果在於讓內容連貫，並沒有「長轉折句保證加分」的標準。<a href="${sourceCEEC}" target="_blank" rel="noopener noreferrer">閱讀官方評分說明</a>。</li>
        <li><strong>Cambridge Grammar：</strong>本表另參照第一點與起初的區別，並確認慣用語寫作 <span lang="en">last but not least</span>，前面不加 at。<a href="https://dictionary.cambridge.org/grammar/british-grammar/prepositions-last-but-not-least" target="_blank" rel="noopener noreferrer">閱讀用法提醒</a>。</li>
      </ul>
      <p><strong>建議背誦路線：</strong>先熟悉上方四句主架構，再各選一組舉例、轉折與結果句；能正確填完空格之後，再增加同義替換。</p>
    </div></details>`;

  const search = document.getElementById('transitionSearch');
  const groups = [...root.querySelectorAll('.ref-category')];
  const rowElements = [...root.querySelectorAll('[data-ref-row]')];
  const categoryNames = new Map(data.categories.map(([id, title]) => [id, title]));
  const searchTexts = data.rows.map(row => `${categoryNames.get(row[0])} ${row.join(' ')}`.toLocaleLowerCase());
  let activeFilter = 'all';
  function applyFilter(expand = true) {
    const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    rowElements.forEach((element, index) => {
      const row = data.rows[index];
      const matchesFilter = activeFilter === 'all' ||
        (activeFilter === 'priority' && row[7] === '優先背') ||
        (activeFilter === 'sequence' && ['first', 'second', 'third'].includes(row[0])) ||
        (activeFilter === 'conclusion' && row[0] === 'conclusion') ||
        (activeFilter.startsWith('category:') && row[0] === activeFilter.slice(9));
      element.hidden = !(matchesFilter && words.every(word => searchTexts[index].includes(word)));
      if (!element.hidden) count++;
    });
    let categoryCount = 0;
    groups.forEach(group => {
      const visible = [...group.querySelectorAll('[data-ref-row]')].filter(row => !row.hidden).length;
      group.hidden = visible === 0;
      if (visible) categoryCount++;
      group.querySelector('.ref-count').textContent = `${visible} 組`;
      if (expand && visible) group.open = true;
    });
    document.getElementById('transitionResults').textContent = `顯示 ${categoryCount} 類・${count} / ${data.rows.length} 組句型`;
    document.getElementById('transitionEmpty').hidden = count !== 0;
    root.querySelectorAll('[data-ref-filter]').forEach(button => {
      const filter = button.closest('.ref-category-picker') ? `category:${button.dataset.refFilter}` : button.dataset.refFilter;
      button.setAttribute('aria-pressed', String(filter === activeFilter));
    });
  }
  search.addEventListener('input', () => applyFilter());
  root.querySelectorAll('[data-ref-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.closest('.ref-category-picker') ? `category:${button.dataset.refFilter}` : button.dataset.refFilter;
    applyFilter();
  }));
  document.getElementById('transitionReset').addEventListener('click', () => {
    activeFilter = 'all'; search.value = ''; applyFilter(false); search.focus();
  });
  document.getElementById('transitionExpand').addEventListener('click', () => groups.filter(group => !group.hidden).forEach(group => { group.open = true; }));
  document.getElementById('transitionCollapse').addEventListener('click', () => groups.filter(group => !group.hidden).forEach(group => { group.open = false; }));
  root.querySelectorAll('[data-ref-copy]').forEach(button => button.addEventListener('click', async () => {
    const value = data.rows[Number(button.dataset.refCopy)][3];
    const status = document.getElementById('transitionCopyStatus');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      status.textContent = '句型已複製，記得替換方括號中的內容。';
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(button.previousElementSibling);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      status.textContent = '已選取句型，請按 Ctrl + C，或使用裝置的複製功能。';
    }
  }));
  let printState;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = [...root.querySelectorAll('details')].map(element => [element, element.open]);
    printState.forEach(([element]) => { if (!element.hidden) element.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (printState) printState.forEach(([element, open]) => { element.open = open; });
    printState = null;
  });
  document.getElementById('transitionPrint').addEventListener('click', () => window.print());
  applyFilter(false);
})();

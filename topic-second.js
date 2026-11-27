(() => {
  'use strict';
  const cats=['Where','What','Who','When','Why','How'];
  const labels={Where:'地點',What:'動作或事物',Who:'人物',When:'時間',Why:'原因或目的',How:'方式或感受'};
  const starters=['From my perspective, …','In my experience, …','This experience shows me why …'];
  const starterZh=['從我的角度說起','從自己的經驗說起','先交代我注意到的情境'];
  const side=i=>i===0?'A':'B';
  const pointName=i=>i===0?'重點一':'重點二';
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const lower=s=>s.replace(/^(?!I(?:\b|['’]))[A-Z]/,c=>c.toLowerCase());
  const noEnd=s=>s.trim().replace(/[.!?。！？]+$/u,'');
  const normalize=s=>s.trim().replace(/\s+/g,' ').toLowerCase();
  function options(ctx,index){
    const materials=window.topicSupportData[ctx.id][ctx.topic.tracks.indexOf(ctx.track)][index];
    const stance=ctx.track.stances[index];
    return {...materials,reasons:[...stance.supports,...materials.extras]};
  }
  function pool(ctx){
    return ctx.track.groups.flatMap((group,gi)=>group.materials.map((item,i)=>({...item,group:gi,key:gi+'-'+i,id:side(gi)+'-'+i})));
  }
  function selectedItems(ctx,keys){
    const all=pool(ctx);
    return cats.map(q=>all.find(item=>item.key===keys?.[q] && item.wh===q)).filter(Boolean);
  }
  const keysOf=items=>Object.fromEntries(items.map(item=>[item.wh,item.key]));
  function routeGroup(ctx,index){
    return ctx.id==='marketing'?(index===0?1:0):null;
  }
  function availableTerms(ctx,index){
    const which=routeGroup(ctx,index);
    const nouns=pool(ctx).filter(item=>(which===null||item.group===which)&&['What','Where'].includes(item.wh));
    const chosen=nouns.filter(item=>ctx.plan.selected?.[item.group]?.includes(item.wh));
    const practice=chosen.length===0;
    const samples=[0,1].flatMap(group=>['Where','What'].map(wh=>nouns.find(item=>item.group===group&&item.wh===wh&&item.original))).filter(Boolean);
    return {practice,items:practice?samples:chosen};
  }
  function work(ctx){
    const position=ctx.position();
    if(!position.second) position.second={starter:null,material:null,slot:0,points:[{},{}],ending:{choices:[null,null]}};
    return position.second;
  }
  function radio(ctx,name,value,active,body,attributes){
    return '<label class="opening-option"><input type="radio" name="'+name+'" value="'+ctx.esc(value)+'" '+attributes+(active?' checked':'')+'><span>'+body+'</span></label>';
  }
  function area(title,html){
    return '<fieldset class="opening-group"><legend>'+title+'</legend><div class="opening-options stance-options">'+html+'</div></fieldset>';
  }
  const hint=(ctx,t)=>'<p class="hint">'+ctx.esc(t)+'</p>';
  function duo(ctx,line){
    return '<p class="opening-complete" lang="en">'+ctx.marked(line)+'</p><p class="opening-complete-zh" lang="zh-Hant">'+ctx.esc(line.zh)+'</p>';
  }
  function tag(ctx,item,sample=false){
    return '<span class="guide-term" data-material-category="'+item.wh+'" data-material-id="'+item.id+'"><span lang="en">'+ctx.esc(item.en)+'</span><small>'+side(item.group)+' · '+item.wh+' · '+(sample?'練習用詞 · ':'')+ctx.esc(item.zh)+'</small></span>';
  }
  function adopt(attr,label,line,placed){
    const same=line&&placed?.en===line.en&&placed?.zh===line.zh;
    return '<button class="btn soft" type="button" '+attr+(line?'':' disabled')+' aria-disabled="'+!!(same||!line)+'">'+(same?'✓ 已放進漢堡':label)+'</button>';
  }
  function stanceLine(ctx,index,item,starter){
    const claim=options(ctx,index).claim;
    const scene=window.TopicSupportGrammar.scene(ctx,[item]);
    let observation=lower(noEnd(scene.en));
    const atStart=item.wh==='Where'&&observation.startsWith(item.en+', ');
    if(atStart)observation=observation.slice(item.en.length+2)+' '+item.en;
    if(claim.en.startsWith('volunteers ')&&observation.startsWith('volunteers '))observation='they '+observation.slice('volunteers '.length);
    const samples=[
      ['From my perspective, '+claim.en+' because '+observation+'.','依我看，'+claim.zh+'，因為'+noEnd(scene.zh)+'。'],
      ['In my experience, '+claim.en+'. For example, '+lower(scene.en),'以我的經驗來說，'+claim.zh+'。舉例來說，'+scene.zh],
      [scene.en+' This experience shows me why '+claim.en+'.',scene.zh+'這段經驗讓我體會到，'+claim.zh+'。']
    ];
    return {en:samples[starter][0],zh:samples[starter][1],marks:scene.marks};
  }
  function stanceView(ctx){
    const index=ctx.plan.stance;
    const choices=ctx.track.stances.map((s,i)=>radio(ctx,'stanceRoute',i,index===i,'<strong>'+ctx.esc(s.label)+'</strong>','data-topic-stance data-route="'+i+'"')).join('');
    let html=ctx.card(ctx.topic.layers[1][0],hint(ctx,ctx.topic.tasks[1])+area('我的立場',choices),'1 · 選立場');
    if(index==null)return ctx.grid(html);
    const state=work(ctx), available=availableTerms(ctx,index);
    const item=available.items.find(term=>term.key===state.material);
    const inputs=available.items.map(term=>radio(ctx,'stanceMaterial',term.key,state.material===term.key,tag(ctx,term,available.practice),'data-stance-material data-picture="'+side(term.group)+'"')).join('');
    html+=ctx.card('哪個細節能說清楚我的選擇？',hint(ctx,available.practice?'這條路線尚未選到地點或動作。先試用下方的練習用詞，也可以回第 2 關選材。':'這些素材取自你在第 2 關勾選的類別。挑一項，試著連回你的立場。')+area('我想帶入句子的素材',inputs)+ctx.button('回第 2 關選材','data-go="1"'),'2 · 選素材');
    const patterns=starters.map((text,i)=>radio(ctx,'stanceStarter',i,state.starter===i,'<strong lang="en">'+text+'</strong><small>'+starterZh[i]+'</small>','data-stance-starter="'+i+'"')).join('');
    const line=item&&Number.isInteger(state.starter)?stanceLine(ctx,index,item,state.starter):null;
    let preview=hint(ctx,'先選一項素材和一種起手式，就能預覽你的觀點句。');
    if(line){
      const part=(label,en)=>'<span class="stance-part"><small>'+label+'</small><b lang="en">'+ctx.esc(en)+'</b></span>';
      const start=part('起手式',starters[state.starter]);
      const claim=part('這個觀察支持的立場',options(ctx,index).claim.en);
      const term=tag(ctx,item,available.practice);
      const pieces=[[start,claim,part('支持這個觀點的原因','because'),term],[start,claim,part('舉例','For example'),term],[term,start,claim]][state.starter];
      const structure=['先用 From my perspective 表達觀點，再用 because 加上主詞與動詞，交代促使你這樣想的觀察。','先用 In my experience 引入判斷，再用 For example 接完整情境句。','先交代觀察，再用 why 接主詞與動詞，說出從經驗得到的結論。'][state.starter];
      const usage=item.wh==='Where'?'地點片語交代情境，還需要用主詞和動詞寫出在那裡發生的事。':'注意原來的動作由誰做。把動作放回完整句子時，要配合那個人的人稱和事件的時間。';
      preview='<div class="guide-frame" data-guide-frame="opening">'+pieces.join(' ')+'</div>'+hint(ctx,structure+usage)+duo(ctx,line)+adopt('data-stance-place','把觀點句放進第二個漢堡',line,ctx.placed(1,0));
    }
    html+=ctx.card('選擇想用的起手式',area('我的第二段開頭',patterns)+'<div id="stancePreview">'+preview+'</div>','3 · 組觀點句');
    return ctx.grid(html);
  }
  // In each route the opening and five examples refer back to specific picture details.
  const sourceChoices={
    robot:[[
      [[0,'pushed my chair back'],[0,'I answered','sharply'],[1,'at my desk','lose track of what I am reading'],[1,'because I cannot explain how I feel'],[0,'during the lunch break','pushed my chair back'],[1,'in the hallway','felt sorry about my reply']],
      [[1,'kept replaying the conversation'],[0,'at the dinner table','after a long school day'],[1,'at my desk','distracted'],[1,'because I cannot explain how I feel'],[0,'because I was already upset about a test'],[1,'felt sorry about my reply']]
    ],[
      [[0,'pause outside the bakery'],[0,'on the way home','sharing a cake'],[1,'in the cafeteria','alone'],[0,'a classmate','without knowing about the breakup'],[1,'a close friend','alone'],[1,'at my desk','keep checking my phone']],
      [[1,'check old messages'],[1,'at my desk','keep checking my phone'],[0,'outside the bakery','because the smell of bread would remind me of our Saturdays there'],[1,'during the lunch break','leave my food untouched'],[1,'less often than usual'],[1,'at my desk','again and again']]
    ],[
      [[0,'nod along'],[0,'in a group discussion','put my hand down'],[1,'at our table','chose another topic'],[0,'near the board','nervously'],[0,'the teacher','put my hand down'],[1,'back at my desk','less sure of myself']],
      [[1,'miss chances to share'],[0,'at the club meeting','nod along'],[1,'after the meeting','felt disappointed'],[0,'because I would not want anyone to laugh'],[1,'make my own choices'],[1,'a close friend','so I need to tell her what I have in mind']]
    ]],
    marketing:[[
      [[1,'at the checkout counter'],[1,'during the weekend sale','cuts the price'],[1,'compare the two prices','carefully'],[1,'across the street','compare the two prices'],[1,'during the weekend sale','to save money'],[1,'inside the store','to stay within their budget']],
      [[0,'count the boxes'],[0,'only ten pairs','for fear of missing out'],[0,'by numbering each pair'],[0,'before the doors open','line up'],[0,'the clerk','to get a pair in their size'],[0,'in the shop window','by numbering each pair']]
    ]],
    disaster:[[
      [[1,'carry water to the tables'],[1,'inside the shelter','hand out hot meals'],[1,'at the door','as families arrive'],[1,'carry water to the tables','so children can drink right away'],[1,'when the doors open'],[1,'at long tables','young volunteers']],
      [[1,'offers them drinking water'],[1,'at the door','with a few kind words'],[1,'at long tables','as families arrive'],[1,'inside the shelter','so families can rest'],[1,'a volunteer','with a smile'],[1,'when the doors open','warmly']]
    ]]
  };
  function sourceItems(ctx,index,row){
    const [group,...names]=sourceChoices[ctx.id][ctx.topic.tracks.indexOf(ctx.track)][index][row];
    const all=pool(ctx);
    return names.map(name=>all.find(item=>item.group===group&&item.en===name)).filter(Boolean);
  }
  function preset(ctx,index,why){return sourceItems(ctx,index,why+1);}
  function passage(ctx,index,why,items,mode,slot){
    if(!items.length)return null;
    const point=options(ctx,index).reasons[why],scene=window.TopicSupportGrammar.scene(ctx,items);
    const actionEn=cap(point.example.en.replace(/^For example,\s*/i,''));
    const actionZh=point.example.zh.replace(/^例如[，、 ]*/,'');
    const detailEn=(mode==='explain'?'This matters because ':'For example, ')+lower(scene.en)+' '+actionEn;
    const detailZh=(mode==='explain'?'這一點很重要，因為':'例如，')+scene.zh+actionZh;
    return {en:(slot===0?'First, ':'Second, ')+lower(point.reason.en)+' '+detailEn+' '+point.benefit.en,
      zh:(slot===0?'首先，':'其次，')+point.reason.zh+detailZh+point.benefit.zh,
      marks:scene.marks,why,exampleText:detailEn,detailZh,exampleCore:scene.en+' '+actionEn,sourceKeys:keysOf(items)};
  }

  function reading(ctx,index,why){
    const point=options(ctx,index).reasons[why];
    const items= preset(ctx,index,why), scene=window.TopicSupportGrammar.scene(ctx,items);
    const sample=passage(ctx,index,why,items,'example',0);
    const used=items.map(item=>tag(ctx,item)).join(' ');
    const sampleLine={en:sample.exampleText,zh:sample.detailZh,marks:sample.marks};
    const generic=why>=2;
    if(generic) return '<section class="card" data-support-example="'+why+'"><h3>參考例句</h3>'+used+duo(ctx,sampleLine)+'</section>';
    return '<section class="card" data-support-case="'+why+'"><h3>'+ (why===0?'理由＋解釋':'情境＋細節')+' · '+ctx.esc(point.label)+'</h3><p class="case-source">原文示範 · 第 7 關基礎版</p>'+
      duo(ctx,point.reason)+'<p class="case-question">讀過理由後，你會用哪一個細節讓讀者看懂它？</p>'+
      '<details class="example" data-case-reveal="scene"><summary>從作者寫的情境找線索</summary><div class="example-content">'+used+
      duo(ctx,sampleLine)+'<p class="case-question">這個做法帶來什麼改變？</p>'+
      '<details class="example" data-case-reveal="benefit"><summary>看這個例子說明了什麼</summary><div class="example-content">'+duo(ctx,point.benefit)+'</div></details></div></details>'+
      ctx.button('讀第 7 關的完整範文','data-go="6"')+'</section>';
  }
  function draftForSlot(state,slot,why){
    const point=state.points[slot];
    if(!point.drafts)point.drafts={};
    if(!point.drafts[why])point.drafts[why]={keys:{},mode:'example'};
    return point.drafts[why];
  }
  function materialPanels(ctx,slot,why,draft){
    const all=pool(ctx), selected=selectedItems(ctx,draft.keys);
    const cards=cats.map(q=>{
      const current=selected.find(item=>item.wh===q);
      const sides=ctx.track.groups.map((group,gi)=>{
        const chosenEarlier=ctx.plan.selected?.[gi]?.includes(q);
        const inputs=all.filter(item=>item.wh===q&&item.group===gi).map(item=>
          '<label class="opening-option"><input type="checkbox" id="support-term-'+slot+'-'+item.key+'" data-point-material="'+item.key+'" data-wh="'+q+'"'+(draft.keys[q]===item.key?' checked':'')+'><span><b lang="en">'+ctx.esc(item.en)+'</b><small>'+ctx.esc(item.zh)+'</small></span></label>').join('');
        return '<fieldset><legend>'+side(gi)+' · '+ctx.esc(group.label)+' · '+(chosenEarlier?'第 2 關已選此類':'可補選的素材')+'</legend><div class="point-material-options">'+inputs+'</div></fieldset>';
      }).join('');
      return '<details class="point-material-group" id="supp-'+slot+'-'+why+'-'+q+'" data-material-category="'+q+'"><summary>'+q+' · '+labels[q]+'<small>'+ (current?side(current.group)+' · '+ctx.esc(current.en):'')+'</small></summary><div class="point-material-body">'+sides+'</div></details>';
    }).join('');
    return '<section data-point-materials><div class="point-material-heading"><h3>用前兩關的 5W1H 組句</h3><div class="point-actions">'+
      ctx.button('依例句勾選','data-point-preset')+ctx.button('全部展開','id="pointToggleAll" data-point-toggle-all aria-controls="pointMaterialGroups" aria-expanded="false"')+
      '</div></div><p>每類可以從 A、B 選一項。按「依例句勾選」可看見上面原句用了哪些材料。</p><div id="pointMaterialGroups" class="point-material-list">'+cards+'</div></section>';
  }
  function reasonView(ctx){
    if(ctx.plan.stance==null)return ctx.grid(ctx.card('先選出要支持的想法',ctx.button('回第 4 關選立場','data-go="3"')));
    const idx=ctx.plan.stance, state=work(ctx), slot=state.slot, why=state.points[slot].why;
    const reasonOptions=options(ctx,idx).reasons;
    const choices=reasonOptions.map((reason,n)=>radio(ctx,'support-why-'+slot,n,n===why,'<strong>'+ctx.esc(reason.label)+'</strong>'+(n<2?'<small>第 7 關原文示範</small>':''),'data-support-why')).join('');
    const switches=[0,1].map(i=>'<button type="button" class="pill" data-support-slot="'+(i+1)+'" aria-pressed="'+(slot===i)+'">'+pointName(i)+'</button>').join('');
    const opening=ctx.placed(1,0);
    let html=ctx.card('第 4 關的立場',opening?duo(ctx,opening):hint(ctx,'已選立場；到第 4 關可把完整觀點句放進漢堡。'));
    html+='<section class="card support-work"><div class="mini-switch support-slots">'+switches+'</div><div id="supportPart" data-point-tone="'+(slot+1)+'">'+area(pointName(slot)+' · Why｜什麼理由能支持你的想法？',choices);
    if(Number.isInteger(why)){
      const draft=draftForSlot(state,slot,why), items=selectedItems(ctx,draft.keys);
      const assembled=passage(ctx,idx,why,items,draft.mode,slot);
      const modes=['example','explain'].map((mode,i)=>radio(ctx,'pointMode',mode,draft.mode===mode,i===0?'舉一個例子':'解釋這個理由','data-point-mode="'+mode+'"')).join('');
      html+=reading(ctx,idx,why)+'<div class="point-practice">'+materialPanels(ctx,slot,why,draft)+area('怎麼接在理由後面？',modes)+
        '<div id="pointSentenceResult" class="point-preview" aria-live="polite">'+(assembled?duo(ctx,assembled):hint(ctx,'先勾選素材，這裡才會出現支持重點的英文和中文。'))+'</div><div class="point-actions">'+
        adopt('data-support-place','把'+pointName(slot)+'放進漢堡',assembled,ctx.placed(1,slot+1))+
        (slot===0&&ctx.placed(1,1)?ctx.button('前往重點二 →','data-support-slot="2"'):'')+'</div></div>';
    }
    return ctx.grid(html+'</div></section>');
  }
  function endings(ctx){
    const placed=[ctx.placed(1,1),ctx.placed(1,2)];
    const index=ctx.plan.stance;
    const bank=options(ctx,index);
    const phrases=placed.map(line=>line&&bank.closing[line.why]);
    const signature=placed.map(line=>line?line.en:'');
    const state=work(ctx).ending;
    const choices=signature.map((s,i)=>state.sources?.[i]===s ? state.choices[i]:null);
    const exampleOf=line=>normalize(line.exampleCore||line.exampleText||line.en);
    const repeated=placed.every(Boolean)&&placed[0].why===placed[1].why&&exampleOf(placed[0])===exampleOf(placed[1]);
    return {placed,phrases,choices,signature,repeated};
  }
  function endLine(ctx,index,picks){
    const common=normalize(picks[0].en)===normalize(picks[1].en);
    if(common){
      const openings={robot:['Both examples show how the robot could help me ','從這兩個例子可以看出，機器人能幫我'],marketing:['Both examples show how '+(index===0?'a discount':'a limited release')+' can help me ','從這兩個例子可以看出，'+(index===0?'折扣':'限量發售')+'能讓我'],disaster:['Both examples show how volunteers can ','從這兩個例子可以看出，志工能']};
      const [en,zh]=openings[ctx.id];
      return {en:en+picks[0].en+'.',zh:zh+picks[0].zh+'。',marks:[{en:picks[0].en,wh:'Why',tone:'both'}]};
    }
    const heads={
      robot:['With this robot’s help, I could ','有了這個機器人的幫助，我能'],
      marketing:['In the end, '+(index===0?'the discount':'the limited release')+' appeals to me because it lets me ',(index===0?'折扣':'限量發售')+'對我更有吸引力，因為它讓我能'],
      disaster:['To sum up, volunteering gives us a way to ','總結來說，志願服務讓我們可以']
    };
    const [en,zh]=heads[ctx.id];
    return {en:en+picks[0].en+' and '+picks[1].en+'.',zh:zh+picks[0].zh+'，也能'+picks[1].zh+'。',marks:picks.map((f,i)=>({en:f.en,wh:'Why',tone:i+1}))};
  }
  function closingView(ctx){
    if(ctx.plan.stance==null)return ctx.grid(ctx.card('先決定第二段的立場',ctx.button('回第 4 關選立場','data-go="3"')));
    const idx=ctx.plan.stance, info=endings(ctx), bank=options(ctx,idx);
    const review=info.placed.map((point,i)=>'<section class="ending-point" data-point-tone="'+(i+1)+'"><h4>'+pointName(i)+'</h4>'+(point?duo(ctx,point):hint(ctx,'這一層還沒有放入句子。'))+ctx.button('回第 5 關調整'+pointName(i),'data-return-support="'+(i+1)+'"')+'</section>').join('');
    const choices=info.phrases.map((phr,i)=>phr?'<section data-point-tone="'+(i+1)+'">'+area(pointName(i)+' · '+ctx.esc(bank.reasons[info.placed[i].why].label),phr.map((f,j)=>radio(ctx,'endingPhrase'+i,j,info.choices[i]===j,'<strong lang="en">'+ctx.esc(f.en)+'</strong><small>'+ctx.esc(f.zh)+'</small>','data-ending-phrase="'+((i+1))+'"')).join(''))+'</section>':'').join('');
    let sample='';
    if(!info.phrases.every(Boolean)){
      const demo=basic(ctx);
      sample='<details class="example"><summary>看看範文怎麼從兩個例子寫到結尾</summary><div class="example-content">'+duo(ctx,demo[3])+'</div></details>';
    }
    let output;
    if(info.repeated)output='<p class="note">兩個重點用了一樣的理由與例句。回到重點二換一個情境或理由，讓結尾有兩個內容可回顧。</p>'+ctx.button('回第 5 關修改重點二','data-return-support="2"');
    else if(info.phrases.every(Boolean)&&info.choices.every(Number.isInteger)){
      const line=endLine(ctx,idx,info.phrases.map((list,i)=>list[info.choices[i]]));
      output=duo(ctx,line)+adopt('data-ending-place','把結尾放進漢堡',line,ctx.placed(1,3));
    }else output=hint(ctx,'先把兩個重點放進漢堡，再分別選出代表兩個例子的短語。');
    return ctx.grid(ctx.card('回看自己放進漢堡的例子',review+sample,'1 · 回看例子')+
      ctx.card('各用一個短語帶出這個例子的意義',choices||hint(ctx,'放入重點後，這裡會展開對應的短語。'),'2 · 整理好處')+ctx.card('用兩個重點寫結尾',output,'3 · 寫成結尾'));
  }
  function basic(ctx){
    const index=ctx.plan.stance??0;
    const bank=options(ctx,index);
    const term=sourceItems(ctx,index,0)[0];
    return [stanceLine(ctx,index,term,0),passage(ctx,index,0,preset(ctx,index,0),'example',0),passage(ctx,index,1,preset(ctx,index,1),'example',1),endLine(ctx,index,[bank.closing[0][0],bank.closing[1][0]])];
  }
  function switches(ctx,el,event){
    const data=el.dataset; if(!data)return false;
    const input=el.matches('input');
    if((input && event.type!=='change')||(!input && (event.type!=='click'||!el.matches('button'))))return false;
    if(Object.hasOwn(data,'topicStance')){
      ctx.plan.stance=Number(el.value);
      ctx.refresh(el);return true;
    }
    if(ctx.plan.stance==null)return false;
    const state=work(ctx), idx=ctx.plan.stance;
    const slot=state.slot, point=state.points[slot];
    if(Object.hasOwn(data,'stanceMaterial'))state.material=el.value;
    else if(Object.hasOwn(data,'stanceStarter'))state.starter=Number(data.stanceStarter);
    else if(Object.hasOwn(data,'stancePlace')){
      const item=availableTerms(ctx,idx).items.find(item=>item.key===state.material);
      if(item&&Number.isInteger(state.starter))ctx.place(1,0,stanceLine(ctx,idx,item,state.starter));
    }else if(Object.hasOwn(data,'returnSupport')){
      state.slot=Number(data.returnSupport)-1; ctx.goTo(4);return true;
    }else if(Object.hasOwn(data,'supportSlot'))state.slot=Number(data.supportSlot)-1;
    else if(Object.hasOwn(data,'supportWhy'))point.why=Number(el.value);
    else if(Object.hasOwn(data,'endingPhrase')){
      const info=endings(ctx), i=Number(data.endingPhrase)-1;
      state.ending={sources:info.signature,choices:info.choices};
      state.ending.choices[i]=Number(el.value);
    }else if(Object.hasOwn(data,'endingPlace')){
      const info=endings(ctx);
      if(!info.repeated&&info.phrases.every(Boolean)&&info.choices.every(Number.isInteger)){
        ctx.place(1,3,endLine(ctx,idx,info.phrases.map((list,i)=>list[info.choices[i]])));
      }
    }else if(Number.isInteger(point.why)){
      const d=draftForSlot(state,slot,point.why);
      if(Object.hasOwn(data,'pointMaterial')){
        if(el.checked)d.keys[data.wh]=data.pointMaterial;else delete d.keys[data.wh];
      }else if(Object.hasOwn(data,'pointPreset')){
        d.keys=keysOf(preset(ctx,idx,point.why));d.mode='example';
      }else if(Object.hasOwn(data,'pointMode'))d.mode=data.pointMode;
      else if(Object.hasOwn(data,'pointToggleAll')){
        const groups=[...document.querySelectorAll('#pointMaterialGroups .point-material-group')];
        const target=groups.some(group=>!group.open);
        groups.forEach(group=>{group.open=target;});
        el.setAttribute('aria-expanded',String(target));el.textContent=target?'全部收合':'全部展開';
        return true;
      }else if(Object.hasOwn(data,'supportPlace')){
        const line=passage(ctx,idx,point.why,selectedItems(ctx,d.keys),d.mode,slot);
        if(line){
          if(ctx.placed(1,slot+1)?.en!==line.en)ctx.place(1,3,null);
          ctx.place(1,slot+1,line);
        }
      }else return false;
    }else return false;
    ctx.refresh(el);
    return true;
  }
  window.TopicSecond={view(ctx,step){return [stanceView,reasonView,closingView][step-3](ctx);},handle:switches,validate:()=>'',basic};
})();

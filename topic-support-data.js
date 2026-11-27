(() => {
  'use strict';
  const line = (en, zh) => ({en, zh: zh });
  function example(label, reason, zhWhy, situation, situationZh, result, resultZh) {
    return {label, reason:line(reason, zhWhy), example:line(situation,situationZh), benefit:line(result,resultZh)};
  }
  function phrases(en,zh,other,otherZh) { return [line(en,zh),line(other,otherZh)]; }
  const route = (claim, zh, closing, extras) => ({claim:line(claim,zh), closing, extras});
  const E = example, F = phrases;
  window.topicSupportData = {
    robot: [
      [
        route('a patient robot could help me calm down before I react','有耐心的機器人能陪我在做出反應前先冷靜下來',[
          F('choose my words with care','仔細決定怎麼說','take a breath before answering','回答前先喘口氣'),
          F('find ways to relax','找出能讓我放鬆的方法','get back to my work calmly','平靜地回到原本的事情'),
          F('explain how I feel','說出我的感受','talk about my feelings honestly','坦誠地談自己的心情'),
          F('recognize an early warning sign','認出情緒變化的徵兆','notice how my body feels','留意身體的感覺'),
          F('make things right after an argument','爭執後修復關係','listen before I reply','回答前先聆聽')
        ],[
          E('留意情緒剛變化的徵兆','Early signs can tell me that I need a break.','剛出現的徵兆能提醒我需要休息。','The robot could ask me to notice my tight shoulders, and I could sit quietly for a minute.','機器人可以提醒我注意緊繃的肩膀，讓我坐下來安靜一分鐘。','I could deal with the feeling before it grew stronger.','我能在情緒變得更強烈前找到紓解的方法。'),
          E('爭執後練習和好','The robot could help me return to a difficult conversation.','機器人可以幫我重新開始一段棘手的對話。','It could invite me to repeat my friend’s words before I offered an apology.','它能請我先複述朋友說過的話，再向對方道歉。','My friend would know I had really listened.','我的朋友就會知道，我確實聽進去了。')
        ]),
        route('a robot that kept a mood diary with me could help me understand my reactions','陪我寫心情日記的機器人能幫我了解自己的反應',[
          F('notice patterns in my moods','注意心情變化的規律','spot difficult times of day','發現每天特別容易煩躁的時刻'),
          F('remember what helps me relax','記住哪些做法能讓我放鬆','choose a response that worked before','選擇曾經有幫助的做法'),
          F('describe a feeling more precisely','更精確地形容感受','name my emotions','說出我的情緒'),
          F('plan breaks before a difficult day','在辛苦的一天來臨前安排休息','prepare for stressful situations','為有壓力的情境事先準備'),
          F('notice small improvements','注意到小小的進步','see how my responses have changed','看見自己反應方式的改變')
        ],[
          E('找到描述心情的字','Naming a feeling can make it easier to discuss.','說出感受的名稱，會比較容易談論它。','The robot could offer two words, such as “hurt” and “angry,” and ask me which one fit.','機器人可以提出「受傷」和「生氣」兩個詞，請我選比較符合的那一個。','I would have clearer words to share with someone I trusted.','我就能用更清楚的詞，把感受告訴信任的人。'),
          E('提前安排休息','A diary could help me prepare for days that look especially busy.','心情日記能幫我為特別忙碌的日子做準備。','Before a test, we could read an earlier entry and plan a short break after class.','考試前，我們可以讀一篇舊紀錄，安排下課後的短暫休息。','I would already have a plan when the pressure returned.','當壓力再出現時，我已經有了因應計畫。'),
          E('看見小進步','Old entries could show me changes that are easy to miss.','舊紀錄讓我看見容易忽略的改變。','On Friday, we could compare two entries about arguments and look for one thing I handled better.','星期五，我們可以比較兩次爭執的紀錄，找出一件我處理得更好的事。','A small success could encourage me to keep practicing.','一次小小的成功就能鼓勵我繼續練習。')
        ])
      ],[
        route('a patient robot could listen and help me reach out to a friend','有耐心的機器人能聽我傾訴，也幫我向朋友開口',[
          F('understand what I miss','了解自己捨不得什麼','talk honestly about my sadness','誠實地說出難過'),
          F('ask a friend for company','開口請朋友陪伴','spend a lonely afternoon with a friend','在孤單的午後和朋友相處'),
          F('choose what to share','決定要分享的事','set limits on personal questions','為私人的問題設界線'),
          F('start a difficult conversation','開啟一段難以啟齒的對話','find the words to ask for support','找到開口求助的話'),
          F('focus on the person in front of me','專心和眼前的人相處','stay present during a conversation','對話時專注當下')
        ],[
          E('決定哪些事願意分享','I could practice deciding how much to tell other people.','我可以練習決定要向別人說多少。','If a classmate asked about the breakup, the robot could help me practice a short answer that felt comfortable.','如果同學問起分手的事，機器人可以陪我練習一個自在的簡短答覆。','I could talk with classmates and still keep some details private.','我能和同學對話，也保留自己的隱私。'),
          E('找出求助的第一句','Starting a conversation can be the hardest part.','開啟對話有時是最困難的一步。','The robot could help me write a message asking a close friend for a few minutes to talk.','機器人能陪我寫一則訊息，問好朋友能不能聊幾分鐘。','A short message could make the first step easier.','一則簡短的訊息就能讓第一步變得容易。'),
          E('把注意力帶回身邊的人','A listener could remind me to pay attention to the company I already have.','有個傾聽者能提醒我注意身邊陪伴我的人。','Before dinner with a friend, the robot could suggest putting my phone away and asking how her day went.','和朋友吃晚餐前，機器人可以建議我收起手機，問問她今天過得如何。','I could enjoy the conversation in front of me.','我可以好好享受眼前的談話。')
        ]),
        route('a robot that could plan small activities with me would help me rebuild my daily routine','能陪我規劃小活動的機器人能幫我重建日常作息',[
          F('get started on difficult tasks','開始處理難以起步的事','take one manageable step at a time','一次完成一個做得到的步驟'),
          F('make room for activities I enjoy','為喜歡的活動留下時間','build new memories','創造新的回憶'),
          F('keep regular mealtimes','維持規律用餐','take better care of myself','好好照顧自己'),
          F('keep in touch with friends','和朋友保持聯絡','put time with friends on my calendar','在行程裡安排與朋友相處的時間'),
          F('choose realistic daily goals','設定做得到的每日目標','adjust my plans on hard days','在難熬的日子調整計畫')
        ],[
          E('維持用餐作息','A regular lunch break could give my day some structure.','規律的午休可以為一天帶來穩定的節奏。','The robot could help me set a lunch reminder and invite me to pick a meal I liked.','機器人可以幫我設定午餐提醒，也請我挑一份喜歡吃的餐點。','I would feel more prepared for afternoon classes.','我就能更有精神上下午的課。'),
          E('留時間給朋友','Putting a visit on my calendar could help me stay in touch.','把見面排入行程能幫我和朋友保持聯絡。','The robot could ask me to choose a time, and I could invite a friend to play badminton.','機器人可以請我挑一個時段，我就能約朋友打羽毛球。','I would have something to look forward to that week.','這一週我就有一件可以期待的事。'),
          E('依照心情調整目標','A small goal is easier to reach on a difficult day.','難熬的一天裡，小目標會比較容易達成。','If I lost focus, the robot could help me shorten a reading task to just one page.','如果我無法專心，機器人可以幫我把閱讀任務縮短為一頁。','Finishing that page could give me the confidence to try another.','完成那一頁，就能給我繼續試下一頁的信心。')
        ])
      ],[
        route('a robot could be a useful partner for practicing what I want to say','機器人能當我的練習夥伴，陪我說出想法',[
          F('express my ideas clearly','清楚表達自己的想法','find my own words','找到自己的說法'),
          F('handle disagreement calmly','平靜面對不同意見','listen without giving up my view','聆聽對方同時保有自己的看法'),
          F('speak at a steady pace','用穩定的速度說話','give myself time to finish my thought','給自己時間說完想法'),
          F('ask questions in class','在課堂上發問','ask for clarification','請對方說明'),
          F('learn from feedback','從回饋中學習','improve my next attempt','讓下一次嘗試更好')
        ],[
          E('把一句話慢慢說完','Speaking slowly can help me feel less rushed.','放慢速度能讓我感覺比較從容。','The robot could record a practice sentence so I could hear where I needed to pause.','機器人可以錄下我試說的一句話，讓我聽出哪裡需要停頓。','I could finish my point before worrying about other people’s reactions.','我可以先把重點說完，再面對其他人的反應。'),
          E('練習提出疑問','Asking a question can be easier after a short rehearsal.','練習過後，提問會容易一些。','Before a lesson, I could ask the robot to help me turn my confusion into one clear question.','上課前，我可以請機器人幫我把不懂的地方轉成一個明確的問題。','I would feel ready to ask my teacher for help.','輪到向老師求助時，我就會比較有準備。'),
          E('從回饋找出改進處','Kind feedback can show me one way to improve.','友善的回饋能讓我找到一個改進方向。','After I practiced, the robot could point out one clear sentence and invite me to try the ending again.','練習後，機器人可以指出一句我說得清楚的地方，再請我試一次結尾。','I could make progress without guessing what every listener thought.','我能逐步進步，也不用一再猜測每個聽者的想法。')
        ]),
        route('a robot that asks thoughtful questions could help me make my own decisions','善於提問的機器人能幫我自己做決定',[
          F('put my interests first','先考慮自己的興趣','choose what matters to me','選擇對自己重要的事'),
          F('trust my own judgment','信任自己的判斷','learn from my past decisions','從過去的選擇中學習'),
          F('check my assumptions','檢查猜測有沒有根據','separate facts from guesses','分清事實和猜測'),
          F('consider more than one option','考慮一個以上的選擇','compare choices for myself','親自比較不同選項'),
          F('ask for helpful opinions','徵詢有幫助的意見','use advice without handing over my choice','參考建議，也保留自己決定的空間')
        ],[
          E('分辨證據和猜測','Questions could help me notice when I was guessing what others thought.','提問能幫我發現，自己是否只是在猜別人的想法。','If someone was quiet, the robot could ask me what I had actually heard that person say.','如果有人沉默，機器人可以問我實際上聽見對方說了什麼。','I might realize that silence does not always mean disapproval.','我也許會發現，沉默不一定代表不贊同。'),
          E('比較兩個選擇','Seeing two options side by side could help me decide for myself.','把兩個選項放在一起，能幫我自主判斷。','The robot could ask me to list one thing I liked about each activity before choosing.','機器人能請我先列出兩個活動各一項喜歡之處，再做選擇。','I could explain my choice in my own words.','我就能用自己的話解釋決定。'),
          E('選擇想參考的意見','I could learn to seek advice that helps me think.','我可以學會尋找能幫我想清楚問題的建議。','The robot could help me prepare one precise question for a person I trusted.','機器人可以陪我準備一個清楚的問題，用來請教我信任的人。','Their answer would inform my decision while leaving the final choice to me.','我能參考他們的回答，最後仍由自己做決定。')
        ])
      ]
    ],
    marketing: [[
      route('a discount is more likely to change my buying decision','折扣更能改變我的購買決定',[
        F('stay within my budget','把花費控制在預算內','afford what I need','買得起需要的東西'),
        F('see exactly how much I can save','確實看出能省多少','recognize a good deal','辨認划算的交易'),
        F('compare prices across stores','比較不同商家的價格','choose the cheaper offer','選到比較便宜的價格'),
        F('buy a needed item sooner','提早買下需要的東西','bring a planned purchase forward','把原本計畫的購買時間提早'),
        F('try a product at a lower cost','用較低的花費嘗試商品','feel more comfortable trying a new brand','更放心嘗試新品牌')
      ],[
        E('把原本計畫的購買提早','A short sale can make me bring forward a purchase I had already planned.','短期優惠能讓我提早進行已經計畫好的購買。','When the price of the shoes fell for one weekend, I bought them before the next practice.','那雙鞋恰好有個週末降價，我就在下一次練習前買下來。','I could use them sooner at a price I could afford.','我能以負擔得起的價格，提早用到它們。'),
        E('願意試試新品牌','A discount makes trying an unfamiliar brand feel less risky.','折扣讓我覺得嘗試不熟悉的品牌比較沒那麼冒險。','I once tried a pair from a new brand because its sale price left money for socks.','我曾試過新品牌的鞋子，因為特價讓我還有錢買襪子。','The lower cost helped me feel comfortable giving the shoes a chance.','花費降低，讓我願意嘗試那雙鞋。')
      ]),
      route('a limited release is more likely to change my buying decision','限量發售更容易改變我的購買決定',[
        F('get the pair before it sells out','在售罄前買到想要的鞋','secure my size in time','趕在自己尺寸售完前買到'),
        F('own a pair with a personal meaning','擁有一雙具有個人意義的鞋','keep a numbered souvenir','留下有編號的紀念品'),
        F('discover items I might otherwise miss','發現原本可能錯過的商品','notice what other buyers want','留意其他買家關注的商品'),
        F('avoid another long wait','避開下一次漫長的等候','take advantage of a brief chance','把握短暫的機會'),
        F('buy a special gift','買到一份特別的禮物','choose a gift with a story behind it','選到背後有故事的禮物')
      ],[
        E('不想再次等待補貨','An uncertain restocking date can make me decide quickly.','無法確定何時會補貨，可能讓我更快做決定。','When the clerk could not tell me when another batch would arrive, I bought my size that day.','店員無法告訴我下一批何時會到，我當天就買下合腳的尺寸。','Buying then meant I could stop checking the shop every week.','當下買下來，我就不用每週留意商店是否補貨。'),
        E('限量款能當特別的禮物','A rare edition can feel like a more thoughtful gift.','少量發售的款式有時會讓禮物顯得更用心。','My sister followed a local artist, so I lined up for a small batch of shoes carrying that artist’s design.','我妹妹很喜歡一位在地藝術家，因此我排隊買了印有該藝術家設計的限量球鞋。','I could give her something that reminded her of a favorite artist.','我就能送她一份會讓她想起喜愛藝術家的禮物。')
      ])
    ]],
    disaster: [[
      route('volunteers can meet practical needs by working together','志工們透過合作能滿足實際需求',[
        F('bring meals to people who cannot stand in line','把餐點送給無法排隊的人','see that everyone gets a hot meal','讓每個人都吃得到熱食'),
        F('help families find basic supplies','幫家庭找到基本物資','make supplies easier to find','讓物資更容易找到'),
        F('keep track of what is needed','掌握所需物資','send supplies where they are needed','把物資送給需要的人'),
        F('keep information clear','讓資訊清楚易懂','help families follow the next step','幫家庭了解下一步該做什麼'),
        F('make sure help continues','確保協助可以持續','share the workload','分擔工作')
      ],[
        E('讓消息傳達得清楚','Clear updates can help families plan the next part of their day.','清楚的消息能協助家庭規畫接下來的行程。','With the coordinator’s permission, I could update the meal times on the noticeboard.','我能在負責人的同意下，更新公告板上的用餐時間。','Residents would know when to return instead of waiting in line all morning.','居民會知道何時回來，不用整個早上都排隊。'),
        E('分工讓協助能持續','Taking turns can help volunteers keep a service running.','輪流分工能使志工持續提供服務。','I could take a turn sorting clean towels while another volunteer took a break.','另一名志工休息時，我可以接手整理乾淨的毛巾。','The desk would stay open for the next family.','下一個家庭抵達時，服務台仍可提供協助。')
      ]),
      route('patient volunteers can make a shelter feel less frightening','有耐心的志工能讓安置所裡的環境更加令人安心',[
        F('help newcomers feel welcome','讓剛抵達的人感到受歡迎','show people where to turn for help','讓人知道該去哪裡獲得協助'),
        F('give residents a chance to talk','讓居民有傾訴的機會','ease the strain of waiting','緩解等待帶來的壓力'),
        F('help children feel at home','讓孩子在陌生環境中感到自在','bring normal moments into a disrupted day','在混亂的一天裡找回熟悉的片刻'),
        F('respect different needs for company','尊重每個人不同的陪伴需求','let people choose how they want to be supported','讓居民自行選擇被陪伴的方式'),
        F('help people connect with one another','幫助人與人建立聯繫','make waiting feel less lonely','讓等待的人比較不孤單')
      ],[
        E('尊重對方想說或安靜的需要','Respecting a person’s wishes can help rebuild a sense of control.','尊重對方的意願，能幫他重新感到事情仍可掌握。','I could ask whether a resident wanted company or preferred a little quiet time.','我可以問居民希望有人陪，還是想安靜一會兒。','The resident could decide what felt most comfortable.','居民可以自己決定怎樣最自在。'),
        E('幫等待的人建立連結','A simple introduction can help people feel less alone.','簡單的介紹能減輕人們的孤單感。','If two families wanted to talk, a volunteer could introduce them while they waited for news.','如果兩個家庭都想聊聊，一位志工能在他們等待消息時介紹彼此認識。','They could share information and keep one another company.','他們可以分享資訊，也能彼此陪伴。')
      ])
    ]]
  };
})();

// Grammar for the selected scene. Each replacement below also supplies its
// Chinese reading and the phrase to highlight after a change of person or tense.
(() => {
  'use strict';
  const forms = {
    'asked if I needed help':['someone asked if I needed help','有人問我需不需要幫忙','asked if I needed help'],
    'I answered':['I answered before I had time to think','我來不及想清楚就回答了','I answered'],
    'pushed my chair back':['I pushed my chair back before my friend had finished speaking','朋友還沒說完，我就把椅子往後推','pushed my chair back'],
    'lose track of what I am reading':['I sometimes lose track of what I am reading','我有時候讀到一半就不知道自己在讀什麼','lose track of what I am reading'],
    'kept replaying the conversation':['I kept replaying the conversation in my head','我一直在腦中回想那段對話','kept replaying the conversation'],
    'left my worksheet unfinished':['I left my worksheet unfinished','我沒有把學習單寫完','left my worksheet unfinished'],
    'sharing a cake':['I noticed two people sharing a cake','我看見兩個人分食蛋糕','sharing a cake'],
    'walk away':['I sometimes feel the need to walk away','有時我覺得需要轉身離開','walk away'],
    'pause outside the bakery':['I sometimes pause outside the bakery where we used to meet','有時我會在以前常和對方見面的麵包店外停下腳步','pause outside the bakery'],
    'keep checking my phone':['I keep checking my phone','我一直查看手機','keep checking my phone'],
    'check old messages':['I check old messages when I should be doing my schoolwork','我該寫作業的時候，卻在查看舊訊息','check old messages'],
    'invite me to lunch':['someone might invite me to lunch even when I feel like being alone','就算我想一個人待著，仍然有人可能會邀我吃午餐','invite me to lunch'],
    'leave my food untouched':['I might leave my food untouched','我可能會把食物放著一口也沒吃','leave my food untouched'],
    'asked me to suggest a topic':['someone asked me to suggest a topic','有人請我建議一個主題','asked me to suggest a topic'],
    'put my hand down':['I sometimes put my hand down before speaking','有時我還沒有開口就把手放下','put my hand down'],
    'nod along':['I often nod along without saying what I think','我往往跟著點頭，沒有說出真正的想法','nod along'],
    'miss chances to share':['I miss chances to share my own ideas when I let others decide for me','讓別人替我決定時，我就錯過了分享自己想法的機會','miss chances to share'],
    'chose another topic':['the group chose another topic before I could speak','小組在我開口前就選了另一個題目','chose another topic'],
    'given up the chance to speak':['I realize I have given up the chance to speak','我意識到自己放棄了發言的機會','given up the chance to speak'],
    'make my own choices':['I want to make my own choices','我希望能自己做選擇','make my own choices'],
    'only ten pairs':['I discover that there are only ten pairs on sale','我發現只有限量十雙鞋發售','only ten pairs'],
    'sets out only ten pairs':['the shop sets out only ten pairs','這家店只擺出十雙鞋','sets out only ten pairs'],
    'line up':['I see people line up to buy the shoes','我看見人們排隊買鞋','line up'],
    'count the boxes':['I stop to count the boxes that are left','我停下來數數有幾個鞋盒','count the boxes'],
    'thirty percent off':['I see that the running shoes are thirty percent off','我看到跑鞋打七折','thirty percent off'],
    'cuts the price':['the second store cuts the price of the same shoes','第二家店調低同款鞋的價格','cuts the price'],
    'compare the two prices':['I compare the two prices before spending my money','我花錢前會先比較原價和特價','compare the two prices'],
    'carry their belongings':['residents carry their belongings away from the flood','居民帶著自己的物品避開洪水','carry their belongings'],
    'lift their bags':['residents lift their bags above the water','居民把袋子舉離水面','lift their bags'],
    'holds his daughter’s hand':['a father holds his daughter’s hand as they walk','一位父親一路牽著女兒的手','holds his daughter’s hand'],
    'hold their bags above their heads':['residents hold their bags above their heads','居民把袋子高高舉在頭頂','hold their bags above their heads'],
    'hand out hot meals':['volunteers hand out hot meals','志工分送熱食','hand out hot meals'],
    'offers them drinking water':['a volunteer welcomes new arrivals and offers them drinking water','一位志工迎接剛抵達的居民，並送上飲用水','offers them drinking water'],
    'carry water to the tables':['volunteers carry water to the tables for people who cannot carry it themselves','志工替不方便拿水的人把水送到桌旁','carry water to the tables']
  };
  const how = {
    'sharply':['my reply comes out sharply','我的回答聽起來很衝','sharply'],
    'kindly':['a friend speaks to me kindly','朋友親切地跟我說話','kindly'],
    'more sharply than I mean to':['I speak more sharply than I mean to','我說話的語氣比本意更衝','more sharply than I mean to'],
    'quiet':['I go quiet','我沉默了下來','quiet'],
    'felt sorry about my reply':['I felt sorry about my reply','我為自己的回話感到懊悔','felt sorry about my reply'],
    'distracted':['I seem distracted','我顯得心不在焉','distracted'],
    'with a heavy heart':['I go on with a heavy heart','我懷著沉重的心情繼續往前走','with a heavy heart'],
    'without knowing about the breakup':['a friend may speak without knowing about the breakup','朋友可能不知道我已分手，就談起我們從前相處的事','without knowing about the breakup'],
    'less often than usual':['I meet friends less often than usual','我與朋友見面的次數比平常少','less often than usual'],
    'again and again':['the same memory comes back again and again','同一個回憶一再湧上心頭','again and again'],
    'alone':['I feel alone','我感覺孤單','alone'],
    'nervously':['I look around nervously','我緊張地環顧四周','nervously'],
    'quietly':['I keep my thoughts to myself and listen quietly','我把想法藏在心裡，安靜聽著','quietly'],
    'less sure of myself':['I feel less sure of myself','我對自己更沒把握','less sure of myself'],
    'felt disappointed':['I felt disappointed afterward','事後我感到失望','felt disappointed'],
    'more openly':['I would like to speak more openly','我希望能更坦率地開口','more openly'],
    'by numbering each pair':['the shop makes the shoes seem special by numbering each pair','店替每雙鞋編號，讓鞋子顯得與眾不同','by numbering each pair'],
    'eager':['the buyers look eager','買家看起來滿心期待','eager'],
    'anxiously':['some customers wait anxiously','顧客焦急地等候','anxiously'],
    'by listing both prices':['the store makes the saving clear by listing both prices','商店以並列原價和特價的方式，讓顧客看見能省多少','by listing both prices'],
    'carefully':['I check the price carefully','我仔細核對價格','carefully'],
    'with their phones in hand':['shoppers check prices with their phones in hand','買家拿著手機查價','with their phones in hand'],
    'one careful step at a time':['the residents move one careful step at a time','居民一步步小心地往前走','one careful step at a time'],
    'slowly':['the residents make their way slowly','居民慢慢地往前走','slowly'],
    'together':['the residents stay together','居民彼此照應，一起行動','together'],
    'with a few kind words':['a volunteer welcomes each person with a few kind words','志工用幾句溫暖的話迎接每一個人','with a few kind words'],
    'warmly':['volunteers welcome families warmly','志工熱情地歡迎居民','warmly'],
    'with a smile':['the volunteers welcome residents with a smile','志工微笑著迎接居民','with a smile']
  };


  const defaults = {
    marketing:[['I consider buying a limited edition','我考慮購買限量款'],['I check how much money I would have left after buying the shoes','我會算算買鞋之後還能剩下多少錢']],
    disaster:[['residents struggle to make their way through the flood','居民在積水中吃力地前進'],['volunteers help families settle in','志工幫家庭在安置所安頓下來']]
  };
  const robotScenes=[
    [['I can feel my frustration building','我能察覺自己越來越煩躁'],['I still worry about what I said','我還是會擔心自己說過的話']],
    [['little things remind me of the person I miss','一些小事會讓我想起掛念的那個人'],['it can be hard to stop thinking about the breakup','我有時很難停止回想分手的事']],
    [['I hesitate to say what I think','我不敢馬上說出自己的想法'],['I wish I had shared my idea','我希望自己當時有把想法說出來']]
  ];
  const purposes = {
    'to stay within their budget':['shoppers want to stay within their budget','購物者希望把花費控制在預算內','stay within their budget'],
    'for fear of missing out':['some people buy the shoes immediately for fear of missing out','有些買家怕錯過機會，當場就把鞋買下來','for fear of missing out'],
    'to keep them dry':['the residents want to keep their belongings dry','居民想讓攜帶的物品保持乾燥','keep their belongings dry'],
    'to protect their clothes':['the residents want to protect their clothes','居民希望保護自己的衣物','protect their clothes'],
    'to get a pair in their size':['shoppers want to get a pair in their size','購物者希望買到適合自己尺寸的鞋','get a pair in their size'],
    'so children can drink right away':['the volunteers want to make sure children can drink right away','志工希望孩子可以立刻喝到水','children can drink right away'],
    'so families can rest':['the volunteers want to make sure families can rest','志工希望每個家庭都能歇口氣','families can rest'],
    'so I need to tell her what I have in mind':['I need to say what I have in mind','我需要說出自己的想法','what I have in mind'],
    'because even small things would remind me':['even small things remind me of the breakup','連小事也會讓我想起分手的事','even small things'],
    'because she could see I was upset':['someone close to me could see I was upset','親近的人可以看出我心情不好','could see I was upset'],
    'so that I could sit with the group again':['I want to sit with the group again','我想重新與大家坐在一起','sit with the group again'],
    'so that our friendship would not suffer':['I want to make sure our friendship does not suffer','我希望我們的友誼能不受影響','our friendship does not suffer']
  };
  function whyClause(item){
    if(purposes[item.en])return purposes[item.en];
    const word=item.en, zh=item.zh;
    if(/^because /i.test(word))return [word.slice(8),zh.replace(/^因為/,''),word.slice(8)];
    if(/^to /i.test(word))return ['I want '+word,'我希望'+zh.replace(/^為了/,''),word.slice(3)];
    if(/^so that /i.test(word))return ['I hope '+word.slice(8),'我希望'+zh.replace(/^(好讓|讓)/,''),word.slice(8)];
    return [item.sentence.en,item.sentence.zh,word];
  }
  function scene(ctx, items) {
    const en = [], zh = [], marks = [];
    function mark(item, english, chinese, term) {
      const source = term || item.en;
      const match = english.toLowerCase().includes(source.toLowerCase()) ? source : english;
      marks.push({ en:match, wh:item.wh, id:item.id });
      return [english,chinese];
    }
    function sentence(enText, zhText) {
      en.push(enText.charAt(0).toUpperCase()+enText.slice(1).replace(/[.!?]+$/,'')+'.');
      zh.push(zhText.replace(/[。！？]+$/,'')+'。');
    }
    for (const group of [0,1]) {
      const chosen=items.filter(i=>i.group===group);
      if(!chosen.length) continue;
      const m=Object.fromEntries(chosen.map(item=>[item.wh,item]));
      const first=[], chinese=[];
      const route=ctx.topic?.tracks.indexOf(ctx.track)??0;
      let base=(ctx.id==='robot'?robotScenes[Math.max(0,route)]:defaults[ctx.id])[group];
      const core=m.What||m.How||m.Why;
      function clause(item){
        const entry=item.wh==='Why'?whyClause(item):(item.wh==='What'?forms:how)[item.en];
        return entry?mark(item,...entry):mark(item,item.sentence.en,item.sentence.zh);
      }
      if(core){
        base=clause(core);
        if(core===m.What && core.en==='I answered' && m.How?.en==='sharply'){
          base=['I answered sharply before I had time to think','我來不及想清楚，便語氣很衝地回答'];
        }
      }
      if(m.Who){
        const sameActor=base[0].toLowerCase().startsWith(m.Who.en.toLowerCase()+' ');
        if(sameActor) mark(m.Who,base[0],base[1]);
        else if(base[0].startsWith('someone ')){
          base=[m.Who.en+base[0].slice(7),base[1].replace('有人',m.Who.zh)];
          mark(m.Who,base[0],base[1]);
        }else if(ctx.id==='disaster' && /^(residents|volunteers) /.test(base[0])){
          const activity=base[0].replace(/^(residents|volunteers) /,'');
          const singular=/^a /.test(m.Who.en);
          base=[m.Who.en+(singular?' may ':' ')+activity,m.Who.zh+base[1].replace(/^(居民|志工)/,'')];
          mark(m.Who,base[0],base[1]);
        }else{
          first.push('with '+m.Who.en+' nearby');chinese.push(m.Who.zh+'也在場');
          mark(m.Who,m.Who.en,m.Who.zh);
        }
      }
      if(m.Where && !base[0].toLowerCase().includes(m.Where.en.toLowerCase())){
        let place=m.Where.en, translation=m.Where.zh, token=place;
        if(place==='through knee-deep water'){place='as people wade through knee-deep water';translation='當人們涉過及膝的水時';}
        if(place==='in the shop window'){place='as I look in the shop window';translation='當我看向店面櫥窗時';}
        first.unshift(place);chinese.unshift(translation);mark(m.Where,place,translation,token);
      }else if(m.Where)mark(m.Where,base[0],base[1]);
      if(m.When){
        let timing=m.When.en, translation=m.When.zh;
        if(timing==='before they decide'){timing='before I decide';translation='在我做決定之前';}
        if(timing==='before I went to sleep' && m.Where){
          sentence('Before I went to sleep, I kept thinking about what had happened earlier','睡覺前，我一直回想稍早發生的事');
        }else{
          first.unshift(timing);chinese.unshift(translation);
        }
        mark(m.When,timing,translation,timing);
      }
      const enText=[...first,base[0]].join(', ');
      const zhText=[...chinese,base[1]].join('，').replace('，，','，');
      sentence(enText,zhText);
      if(m.How && core!==m.How){
        const entry=how[m.How.en];
        const pair = entry || [m.How.sentence.en,m.How.sentence.zh,m.How.en];
        if(!enText.toLowerCase().includes(m.How.en.toLowerCase()))sentence(...mark(m.How,...pair));
        else mark(m.How,enText,zhText);
      }
      if(m.Why && core!==m.Why)sentence(...clause(m.Why));
    }
    return {en:en.join(' '),zh:zh.join(''),marks};
  }
  window.TopicSupportGrammar={scene};
})();

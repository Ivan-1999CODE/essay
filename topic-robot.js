window.sevenLessons = window.sevenLessons || {};

(() => {
  'use strict';

  const line = (en, zh) => ({ en, zh });
  const material = (wh, en, zh, sentenceEn, sentenceZh) => ({
    wh, en, zh, sentence: line(sentenceEn, sentenceZh)
  });

  window.sevenLessons.robot = {
    title: '青少年問題與機器人幫手',
    source: '113 年學測英文作文',
    intro: '從三個困擾裡選一個。想像它怎麼影響你的一天，再寫出你和機器人可以一起做的事。',
    tasks: [
      '從情緒起伏、初次失戀、在意別人的看法中選一個。用生活中的情境說明你最想解決它的原因。',
      '說出你希望機器人具備的特質或能力，寫清楚它怎麼幫忙、你會怎麼配合，以及這樣做會帶來什麼改變。'
    ],
    quiz: [
      '第一段選一個困擾，說明為什麼想解決；第二段介紹機器人的能力，以及我如何跟它合作。',
      '第一段分別介紹三個困擾；第二段比較哪一個最難解決，最後選出一個。',
      '第一段說明我想解決的困擾；第二段介紹機器人的外觀、材質和價格。'
    ],
    layers: [
      ['點出困擾', 'A · 寫一件發生的事', 'B · 說明影響和想解決的原因', '收束事件和影響（可選）'],
      ['我需要的幫手', '合作做法一', '合作做法二', '我期待的改變']
    ],
    trackLabel: '哪一個困擾是你最想解決的？',
    tracks: [
      {
        label: '情緒起伏',
        opening: line('Of the three problems, I would most like to learn how to handle my mood swings.', '在這三個困擾中，我最想學會面對自己的情緒起伏。'),
        bridge: line('I want to notice these changes early enough to decide what to do next.', '我希望能早一點注意到這些情緒變化，好決定下一步要做什麼。'),
        groups: [
          {
            label: '情緒變化的時刻',
            question: '挑一個瞬間，讓讀者看見你的心情怎麼變了。',
            materials: [
              material('When', 'after a long school day', '上完一整天的課後', 'After a long school day, even a small mistake can make me angry.', '上完一整天的課後，即使是個小錯誤也可能讓我生氣。'),
              material('Where', 'at the dinner table', '在餐桌上', 'At the dinner table, a simple question about school can suddenly put me in a bad mood.', '在餐桌上，家人只是問起學校的事，我的心情就可能突然變差。'),
              material('Who', 'my best friend', '我最好的朋友', 'Sometimes my best friend makes a joke, and I get upset even though I know she means well.', '有時我最好的朋友開個玩笑，雖然我知道她沒有惡意，我還是會不高興。')
            ]
          },
          {
            label: '想改善的原因',
            question: '心情突然變差以後，哪一件原本做得到的事變難了？',
            materials: [
              material('What', 'lose track of what I am reading', '讀到一半忘了自己在讀什麼', 'When I feel this way, I often lose track of what I am reading and have to start again.', '有這種感覺時，我常常讀到一半忘了自己在讀什麼，只好從頭再讀。'),
              material('How', 'more sharply than I mean to', '語氣比我原本想的還衝', 'I sometimes speak more sharply than I mean to and hurt someone I care about.', '有時我說話的語氣比原本想的還衝，傷到我在乎的人。'),
              material('Why', 'because I cannot explain how I feel', '因為我說不出自己的感受', 'Because I cannot explain how I feel, people may think I am angry with them.', '因為我說不出自己的感受，別人可能以為我在生他們的氣。')
            ]
          }
        ],
        stances: [
          {
            label: '找一個能陪我冷靜下來的幫手',
            en: 'I would like a patient robot that could help me calm down before I react.',
            zh: '我希望有個有耐心的機器人，幫我在做出反應前先冷靜下來。',
            supports: [
              {
                label: '在氣頭上先停一下',
                reason: line('A gentle reminder could give me time to choose my words.', '溫和的提醒可以給我時間想一想要怎麼說。'),
                example: line('If my voice got louder, the robot could count to ten with me before I answered.', '如果我的聲音變大，機器人可以陪我數到十再回答。'),
                benefit: line('That short pause would help me avoid saying something hurtful.', '這樣停一下，可以幫我避免說出傷人的話。')
              },
              {
                label: '找出適合我的放鬆方法',
                reason: line('The robot could help me find an activity that settles my mind.', '機器人可以幫我找出能讓心情平靜的活動。'),
                example: line('On a stressful evening, it could suggest a song or a short walk, and I could try one.', '壓力大的晚上，它可以建議我聽首歌或散步一下，讓我挑一個試試看。'),
                benefit: line('I would discover which activity helps me get back to what I was doing.', '我會知道哪個活動能幫我回到原本在做的事。')
              },
              {
                label: '練習把感受說出口',
                reason: line('A patient listener could help me put my feelings into words.', '有耐心的聽眾能幫我把感受說出口。'),
                example: line('It could ask what upset me, and I could practice giving an honest answer.', '它可以問我為什麼不高興，讓我練習誠實回答。'),
                benefit: line('Later, I could explain my feelings to a friend more calmly.', '之後我就可以更平靜地向朋友說明自己的感受。')
              }
            ],
            ending: line('With this kind of support, I could make my own choices even on a difficult day.', '有了這樣的支持，即使當天過得不順，我也能自己決定該怎麼反應。')
          },
          {
            label: '用心情紀錄找出規律',
            en: 'I would choose a robot that could keep a mood diary with me.',
            zh: '我會選一個能陪我記錄心情的機器人。',
            supports: [
              {
                label: '找出容易煩躁的時刻',
                reason: line('The diary could show me when I tend to get upset.', '日記可以讓我看出自己通常什麼時候容易煩躁。'),
                example: line('Each night, I could tell the robot about one change in my mood and ask it to record the time.', '每天晚上，我可以跟機器人說一次心情變化，請它記下時間。'),
                benefit: line('After a week, I might notice that my hardest moments come just before dinner.', '一週後，我可能會發現晚餐前是我最容易煩躁的時候。')
              },
              {
                label: '記住真的有幫助的做法',
                reason: line('Our notes could also help me remember what worked.', '我們的紀錄也能幫我記得哪些做法真的有效。'),
                example: line('After trying a short walk, I could ask the robot to save how I felt before and after it.', '試著散步之後，我可以請機器人記下我散步前後的感受。'),
                benefit: line('I could try that idea again the next time I had a rough day.', '下次遇到不順心的一天，我就能再試一次那個方法。')
              }
            ],
            ending: line('By reading my notes and trying small changes, I could learn to manage my mood on my own.', '透過回顧紀錄、嘗試小改變，我可以慢慢學會自己調整心情。')
          }
        ]
      },
      {
        label: '初次失戀',
        opening: line('Of the three problems, dealing with a first breakup would be the hardest for me.', '在這三個困擾中，第一次失戀對我來說最難面對。'),
        bridge: line('I would want some help taking the first steps back to my daily routine.', '我會希望有人幫我踏出第一步，慢慢回到原本的生活。'),
        groups: [
          {
            label: '想起對方的時刻',
            question: '如果剛分手，生活中的哪個小細節會讓你想起對方？',
            materials: [
              material('When', 'before I went to sleep', '在我睡覺前', 'Before I went to sleep, I might miss the goodnight messages we used to send each other.', '在我睡覺前，我可能會想念我們以前互傳的晚安訊息。'),
              material('Where', 'on the way home', '在回家的路上', 'On the way home, passing our favorite bakery might bring back memories of our afternoons together.', '在回家的路上，經過我們最喜歡的麵包店時，我可能會想起以前一起度過的午後。'),
              material('Who', 'a classmate', '一位同學', 'A classmate might ask about my weekend, and I might suddenly miss the person I used to spend it with.', '一位同學可能會問起我的週末，我可能突然很想念以前一起過週末的那個人。')
            ]
          },
          {
            label: '失戀對生活的影響',
            question: '為什麼你想好好面對失戀？想一件受影響的日常小事。',
            materials: [
              material('What', 'keep checking my phone', '一直查看手機', 'I might keep checking my phone for a message and leave my homework unfinished.', '我可能會一直查看手機等訊息，結果作業一直沒寫完。'),
              material('How', 'less often than usual', '比平常少', 'I might talk to my friends less often than usual, even when I really needed their company.', '即使很需要朋友陪伴，我跟他們說話的次數也可能比平常少。'),
              material('Why', 'because even small things would remind me', '因為連小事都會讓我想起', 'Because even small things would remind me of the breakup, it might be hard to enjoy my favorite activities.', '因為連小事都會讓我想起分手，我可能很難享受原本最喜歡的活動。')
            ]
          }
        ],
        stances: [
          {
            label: '先整理心情，再向朋友開口',
            en: 'I would want a robot that could listen patiently and help me reach out to a friend.',
            zh: '我希望機器人能耐心聽我說，也幫我向朋友開口。',
            supports: [
              {
                label: '說清楚自己捨不得什麼',
                reason: line('Talking out loud could help me understand what I missed most.', '把感受說出來，可以幫我了解自己最捨不得的是什麼。'),
                example: line('The robot could ask about one memory, and I could tell it why that moment mattered to me.', '機器人可以問起一段回憶，我可以說說那個時刻為什麼對我很重要。'),
                benefit: line('I could give my sadness a name and decide what I needed that day.', '我能說清楚自己為什麼難過，再決定當天需要什麼。')
              },
              {
                label: '練習向朋友提出邀請',
                reason: line('The robot could help me find the words to ask for company.', '機器人可以陪我想想，要怎麼邀請別人來陪我。'),
                example: line('We could practice a short invitation, and then I could ask a friend to take a walk with me.', '我們可以先練習一句簡短的邀約，接著我就能約朋友陪我去散步。'),
                benefit: line('Having someone to walk with would make a lonely afternoon easier.', '有人一起散步，原本孤單的下午就會好過一些。')
              }
            ],
            ending: line('With a little practice and some company, I could feel less alone after the breakup.', '有了這些練習和陪伴，分手後的我就不會覺得那麼孤單。')
          },
          {
            label: '一起找回自己的生活步調',
            en: 'I would choose a robot that could help me make a simple plan for each day after the breakup.',
            zh: '我會選能幫我安排每天生活的機器人，陪我度過分手後的日子。',
            supports: [
              {
                label: '把難以開始的事拆小',
                reason: line('A small first step would make it easier to get back to schoolwork.', '先做一小步，會讓我更容易回到課業上。'),
                example: line('The robot could set a timer for ten minutes, and I could use that time to finish one math problem.', '機器人可以設定十分鐘的計時器，我則用那段時間完成一道數學題。'),
                benefit: line('Finishing one task could give me the energy to start another.', '完成一件事能讓我有精神開始下一件事。')
              },
              {
                label: '留時間做自己喜歡的事',
                reason: line('Planning something enjoyable would give me a reason to look forward to the weekend.', '安排喜歡的事情，會讓我有一個期待週末的理由。'),
                example: line('I could pick a recipe, and the robot could help me list the ingredients for a Saturday lunch with my sister.', '我可以挑一道食譜，請機器人幫我列出食材，週六和姊姊一起做午餐。'),
                benefit: line('I would have a new memory of a good afternoon to think about.', '我會多一段愉快的午後回憶。')
              }
            ],
            ending: line('One small plan at a time, I could build a daily life that felt like my own again.', '從一個個小計畫開始，我就能慢慢找回自己的生活。')
          }
        ]
      },
      {
        label: '在意別人的看法',
        opening: line('The problem I would most like to solve is worrying too much about what other people think of me.', '我最想解決的困擾，是自己太在意別人怎麼看我。'),
        bridge: line('I would like to feel confident enough to make a choice even when someone else disagrees.', '我希望自己能更有信心，即使別人不同意，也能做出自己的選擇。'),
        groups: [
          {
            label: '在意別人眼光的時刻',
            question: '你原本想做什麼，又是在什麼時候開始猶豫的？',
            materials: [
              material('Where', 'in a group discussion', '在小組討論中', 'In a group discussion, I often keep a good idea to myself because someone might laugh.', '在小組討論中，我常擔心有人會笑，所以把好點子藏在心裡。'),
              material('When', 'before I share a photo', '在我分享照片之前', 'Before I share a photo, I often spend a long time wondering what people will say.', '在我分享照片之前，我常花很多時間猜別人會說什麼。'),
              material('Who', 'my classmates', '我的同學', 'When my classmates disagree with me, I sometimes change my answer just to fit in.', '當同學的看法跟我不同時，我有時候會為了合群而改變自己的答案。')
            ]
          },
          {
            label: '在意眼光的代價',
            question: '把注意力放在別人身上以後，你錯過了什麼？',
            materials: [
              material('What', 'miss chances to share', '錯過分享的機會', 'I miss chances to share what I really think, so even good friends may know little about my interests.', '我錯過了分享真實想法的機會，所以就連好朋友也可能不太了解我的興趣。'),
              material('Why', 'because I want everyone to like me', '因為我希望大家都喜歡我', 'Because I want everyone to like me, I often leave decisions to other people.', '因為我希望大家都喜歡我，所以常常讓別人替我做決定。'),
              material('How', 'less sure of myself', '對自己越來越沒信心', 'Each time I let someone else decide for me, I feel a little less sure of myself.', '每次讓別人替我做決定，我就對自己更沒信心。')
            ]
          }
        ],
        stances: [
          {
            label: '先和機器人練習表達',
            en: 'I would choose a robot that could be my practice partner when I wanted to speak up.',
            zh: '我會選能當我練習夥伴的機器人，在我想表達意見時先陪我練習。',
            supports: [
              {
                label: '先把自己的想法說一遍',
                reason: line('A quiet practice session could help me find my own words.', '先安靜地練習一次，能幫我找到自己的說法。'),
                example: line('Before class, the robot could listen while I explained one idea and then ask me for an example.', '上課前，機器人可以先聽我說一個想法，再請我舉個例子。'),
                benefit: line('I would feel more ready to raise my hand in class.', '這樣一來，我就會比較有把握在課堂上舉手。')
              },
              {
                label: '練習面對不同的意見',
                reason: line('A practice partner could also show me how to handle disagreement.', '一起練習的夥伴也能讓我學會面對不同意見。'),
                example: line('The robot could take a different view, and I could practice saying why I still preferred my idea.', '機器人可以提出不同的看法，讓我練習說出自己仍然喜歡原本想法的理由。'),
                benefit: line('I could listen to another opinion and still speak honestly.', '我可以聆聽其他意見，也能誠實地說出自己的想法。')
              }
            ],
            ending: line('With practice, I could join conversations without letting other people choose my words for me.', '透過練習，我可以參與對話，也用自己的話表達想法。')
          },
          {
            label: '讓機器人提醒我自己的選擇',
            en: 'I would want a robot that could ask good questions and help me make my own decisions.',
            zh: '我希望有個擅長提問的機器人，幫我自己做決定。',
            supports: [
              {
                label: '先問自己在乎什麼',
                reason: line('A simple question could remind me to consider what matters to me.', '一個簡單的問題可以提醒我，想一想自己在意什麼。'),
                example: line('When I chose a school club, the robot could ask what I enjoyed, and I could list my favorite activities.', '選社團時，機器人可以問我喜歡什麼，我則列出自己最愛的活動。'),
                benefit: line('I could choose a club I actually wanted to attend each week.', '這樣我就能選一個自己每週都想去的社團。')
              },
              {
                label: '回頭看自己的決定',
                reason: line('Looking back on a choice could help me learn to trust my judgment.', '回頭想想自己的選擇，能幫我學會相信自己的判斷。'),
                example: line('After I tried something new, the robot could ask what went well, and I could record one thing I enjoyed.', '我嘗試新事物後，機器人可以問我哪些部分很順利，我可以記下一件喜歡的事。'),
                benefit: line('The next time I felt unsure, I could read that note and remember why I had made the choice.', '下次感到不確定時，我可以讀那則紀錄，想起當初做選擇的理由。')
              }
            ],
            ending: line('By asking myself these questions, I could pay more attention to my own voice when making choices.', '學會問自己這些問題之後，我在做選擇時就會更留意自己的想法。')
          }
        ]
      }
    ],
    caseNotes: [
      ['作者用 Among the three problems 點出自己選了情緒起伏。讀者一開始就知道接下來要談哪個困擾。', '第三句分別提到難以專心讀書、難以與人相處。這兩個生活上的影響說明了作者想改善情緒起伏的原因。'],
      ['找出以 First 和 Second 開頭的兩句，看看機器人有哪些能力，再找一個作者自己可以採取的行動。', '結尾的 manage stress 和 stay positive 點出期待的改變，回應第一段提到的壓力與情緒。']
    ]
  };
})();

(() => {
  'use strict';
  const mood = {
    focuses: ['情緒變化的時刻', '我當下的反應', '對日常生活的影響'],
    openings: [
      ['直接選出困擾', 'Of the three problems, I would most like to ...',
        ['Of the three problems, I would most like to understand why my mood can change so quickly.', '在這三個困擾中，我最想弄清楚自己的心情為什麼會變得這麼快。'],
        ['Of the three problems, I would most like to learn how to pause before I speak in anger.', '在這三個困擾中，我最想學會在生氣時，先停一下再開口。'],
        ['Of the three problems, I would most like to keep my mood swings from affecting my schoolwork and friendships.', '在這三個困擾中，我最想學會讓情緒起伏少影響課業和友誼。']],
      ['從日常小事帶入', 'Sometimes, a small ... can ...',
        ['Sometimes, a small disappointment can turn a good afternoon into a difficult one for me.', '有時一點小失望，就足以讓我原本愉快的下午變得難熬。'],
        ['Sometimes, a small comment can make me snap at a friend who is only trying to help.', '有時只是一句話，就讓我對原本想幫忙的朋友發脾氣。'],
        ['Sometimes, a small mistake can change my mood so much that I struggle to finish the next task.', '有時一個小錯誤就能讓我心情變差，連下一件事也很難做完。']],
      ['先問一個自己在意的問題', 'Why do I ...?',
        ['Why do I sometimes go from laughing to feeling angry in a matter of minutes?', '為什麼我有時候前一刻還在笑，幾分鐘後卻生起氣來？'],
        ['Why do I sometimes raise my voice even when nobody is blaming me?', '為什麼明明沒人在責怪我，我有時還是會提高音量？'],
        ['Why do I find it so hard to get back to work after my mood suddenly changes?', '為什麼心情突然變差後，我會這麼難重新專心做事？']],
      ['先寫想做到的事，再寫困難', 'Although I try to ..., ...',
        ['Although I try to stay in a good mood, one careless joke can upset me for the rest of the afternoon.', '雖然我努力保持好心情，但一個無心的玩笑就可能讓我整個下午都不開心。'],
        ['Although I try to be patient, I sometimes answer a simple question in an angry voice.', '雖然我試著保持耐心，有時卻會用很衝的口氣回答一個簡單的問題。'],
        ['Although I try to focus, an argument at lunch can stay on my mind for hours.', '雖然我努力專心，但午餐時的一場爭執可能在我腦中盤旋好幾個鐘頭。']],
      ['先點出原因與結果', 'Because ..., I ...',
        ['Because my mood can change without much warning, I want to learn to recognize the first signs.', '因為情緒有時突然轉變，我想學會早一點看出徵兆。'],
        ['Because I sometimes speak before I understand my feelings, I want to learn to pause.', '因為我有時還沒弄清楚自己的感覺就先開口，我想學會先停一下。'],
        ['Because one bad moment can spoil a whole evening, I would like some help managing my mood.', '因為一時的不愉快就可能影響我整晚的心情，我希望得到一點調整情緒的幫助。']]
    ],
    groups: [
      {
        label: '事件｜心情突然變了',
        question: '想一次原本沒事、心情卻突然變差的時刻。當時誰在哪裡做了什麼？',
        model: [
          ['In the classroom, my friend asked if I needed help with a math problem.', '在教室裡，朋友問我需不需要幫忙解一道數學題。',
            ['Where', 'in the classroom', '在教室裡'], ['Who', 'my friend', '我的朋友'], ['What', 'asked if I needed help', '問我需不需要幫忙']],
          ['My face grew hot, and I answered sharply even though she had spoken kindly.', '我的臉一熱，雖然朋友是好心地問，我的回答卻很衝。', ['What', 'I answered', '我回答了'], ['How', 'sharply', '語氣很衝地'], ['How', 'kindly', '親切地']]
        ],
        extra: [
          ['During the lunch break, I pushed my chair back because I was already upset about a test.', '午休時，我把椅子往後推，因為我原本就為考試考不好而煩躁。', ['When', 'during the lunch break', '午休時'], ['What', 'pushed my chair back', '把椅子往後推'], ['Why', 'because I was already upset about a test', '因為我本來就為考試而煩躁']],
          ['In the hallway, my sister tried to comfort me because she could see I was upset.', '在走廊上，姊姊想安慰我，因為她看出我心情不好。', ['Where', 'in the hallway', '在走廊上'], ['Who', 'my sister', '我的姊姊'], ['Why', 'because she could see I was upset', '因為她看出我心情不好']]
        ]
      },
      {
        label: '影響與原因｜情緒過後，我想改變什麼',
        question: '那次情緒反應後來影響了誰、哪件事？你希望自己下次怎麼做？',
        model: [
          ['At my desk, I kept replaying the conversation and left my worksheet unfinished.', '坐在自己的書桌前，我一直回想剛才的對話，結果沒有寫完學習單。', ['Where', 'at my desk', '在自己的書桌前'], ['What', 'kept replaying the conversation', '一直回想那段對話'], ['What', 'left my worksheet unfinished', '讓學習單沒有寫完']],
          ['My friend stayed quiet for the rest of the lesson, and I felt sorry about my reply.', '朋友在接下來的課堂上一直很安靜，我也為自己的回話感到懊悔。', ['Who', 'my friend', '我的朋友'], ['How', 'quiet', '沉默的'], ['How', 'felt sorry about my reply', '為自己的回答感到懊悔']],
          ['I want to handle my anger better because I want my friend to feel comfortable talking to me again.', '我想學著處理自己的怒氣，希望朋友能再次自在地跟我說話。']
        ],
        extra: [
          ['After class, I looked for my friend in the hallway because I wanted to explain what had happened.', '下課後，我在走廊上找朋友，想跟她解釋剛才發生了什麼事。', ['When', 'after class', '下課後'], ['Where', 'in the hallway', '在走廊上'], ['Why', 'because I wanted to explain what had happened', '因為我想解釋剛才發生了什麼事']],
          ['At home, my brother asked why I seemed distracted that evening.', '晚上回到家，弟弟問我為什麼看起來心不在焉。', ['Where', 'at home', '在家裡'], ['Who', 'my brother', '我的弟弟'], ['How', 'distracted', '心不在焉']],
          ['The next morning, I wanted to start over so that our friendship would not suffer.', '隔天早上，我希望重新好好相處，好讓我們的友誼不受影響。', ['When', 'the next morning', '隔天早上'], ['Why', 'so that our friendship would not suffer', '好讓友誼不受影響']]
        ]
      }
    ],
    bonuses: [
      ['用描述反應的句子接上後果', 1, 1, 'After I answered sharply, my friend stayed quiet for the rest of the lesson.', '我語氣很衝地回答後，朋友在接下來的課堂上一直很安靜。', '從 A 取出我當時的反應，從 B 取出朋友後來的改變。用 after 交代前後順序。'],
      ['從事件收回想改變的原因', 0, 0, 'Even an offer of help can upset me so much that I later struggle to finish my work.', '有時只是別人問我要不要幫忙，就讓我心情起伏，後來連手上的事也難以做完。', 'A 是善意的提問，B 是學習受到的影響。用 so ... that ... 說出我為什麼想改善情緒起伏。']
    ]
  };
  const breakup = {
    focuses: ['突然想起對方', '失戀影響作息', '和朋友疏遠'],
    openings: [
      ['直接說明自己的選擇', 'The problem I would choose is ... because ...',
        ['The problem I would choose is a first breakup because ordinary places might suddenly bring back memories.', '我會選擇初次失戀這個困擾，因為平常經過的地方都可能突然勾起回憶。'],
        ['The problem I would choose is a first breakup because feeling sad might make it hard to keep up with schoolwork.', '我會選擇初次失戀這個困擾，因為難過的心情可能讓我跟不上課業。'],
        ['The problem I would choose is a first breakup because I might pull away from friends just when I needed them most.', '我會選擇初次失戀這個困擾，因為在最需要朋友的時候，我可能反而不想跟他們見面。']],
      ['從一天中的某個時刻切入', 'On the ... after a breakup, I might ...',
        ['On the first walk home after a breakup, I might see familiar places in a completely different way.', '分手後第一次走路回家，我看到熟悉的街景可能會有完全不同的感受。'],
        ['On the first evening after a breakup, I might sit down to study and find that my mind is elsewhere.', '剛分手的那天晚上，我可能坐下來準備讀書，卻發現自己心不在焉。'],
        ['On the first school day after a breakup, I might turn down an invitation to lunch.', '剛分手後第一天到學校，我可能會婉拒一起吃午餐的邀約。']],
      ['用問題引入', 'How could I ... after a breakup ...?',
        ['How could I walk past our favorite shop after a breakup without getting lost in memories?', '分手後經過我們最喜歡去的店，我如何避免陷在回憶裡？'],
        ['How could I get back to everyday tasks after a breakup if my attention kept wandering?', '如果分手後總是分心，我該怎麼回到日常工作上？'],
        ['How could I stay close to my friends after a breakup if I found it hard to talk about my feelings?', '如果分手後很難說出自己的感受，我該怎麼和朋友保持親近？']],
      ['把期待和現實放在一起', 'Although I would want to ..., I might ...',
        ['Although I would want to move on, I might still look for a familiar face on my way home.', '即使我想繼續往前走，回家途中可能還是會尋找那張熟悉的臉。'],
        ['Although I would want to finish my homework, I might spend the evening rereading old messages.', '即使我想把作業寫完，晚上可能還是一直重看以前的訊息。'],
        ['Although I would want to talk to someone, I might find myself eating lunch alone after a breakup.', '即使很想找人說說話，我分手後可能還是會自己一個人吃午餐。']],
      ['先寫可能受到的影響', 'If ..., it would be hard to ...',
        ['If familiar places kept reminding me of my first breakup, it would be hard to enjoy the walk home.', '如果熟悉的地方總讓我想起第一次失戀，回家的路便可能很難再走得輕鬆。'],
        ['If I kept reaching for my phone after a breakup, it would be hard to give my homework my full attention.', '如果分手後一直忍不住拿起手機，我就很難專心做作業。'],
        ['If I turned down every invitation after a breakup, it would be hard to stay close to my friends.', '如果分手後我推掉每個邀約，就很難和朋友保持親近。']]
    ],
    groups: [
      {
        label: '事件｜某個瞬間又想起對方',
        question: '把讀者帶到分手後的一個瞬間。是什麼讓你突然想起對方？',
        model: [
          ['On the way home, I might see a couple sharing a cake outside the bakery we used to visit.', '在回家的路上，我可能會看見一對情侶在我們以前常去的麵包店外分食蛋糕。', ['Where', 'on the way home', '在回家的路上'], ['Who', 'a couple', '一對情侶'], ['What', 'sharing a cake', '分食蛋糕']],
          ['I might pause by the window and walk away with a heavy heart.', '我可能會在櫥窗旁停留一下，然後懷著沉重的心情走開。', ['Where', 'by the window', '在櫥窗旁'], ['What', 'walk away', '轉身離開'], ['How', 'with a heavy heart', '懷著沉重的心情']]
        ],
        extra: [
          ['After school, my sister might mention the bakery without knowing about the breakup.', '放學後，姊姊可能會提起那家麵包店，當時她還不知道我已經分手。', ['When', 'after school', '放學後'], ['Who', 'my sister', '我的姊姊'], ['How', 'without knowing about the breakup', '還不知道分手的事']],
          ['I might pause outside the bakery because the smell of bread would remind me of our Saturdays there.', '我可能會在麵包店外停下腳步，因為麵包香會讓我想起過去一起在那裡度過的星期六。', ['What', 'pause outside the bakery', '在麵包店外停下來'], ['Where', 'outside the bakery', '在麵包店外'], ['Why', 'because the smell of bread would remind me of our Saturdays there', '因為麵包香會讓我想起以前一起度過的星期六']],
          ['I might cross the street to give myself a little space.', '我可能會走到街道另一側，給自己一點空間。', ['Why', 'to give myself a little space', '為了給自己一點空間']]
        ]
      },
      {
        label: '影響與原因｜想找回的生活步調',
        question: '回憶湧上來以後，你本來想做的事受了什麼影響？為什麼希望改善？',
        model: [
          ['At my desk, I might check old messages again and again and forget to finish my homework.', '坐在書桌前，我可能一再查看舊訊息，結果忘了把作業寫完。', ['Where', 'at my desk', '在我的書桌前'], ['What', 'check old messages', '查看以前的訊息'], ['How', 'again and again', '一次又一次地']],
          ['My friends might invite me to lunch, but I might say no and end up eating alone.', '朋友可能邀我吃午餐，我卻可能婉拒，最後一個人吃飯。', ['Who', 'my friends', '我的朋友'], ['What', 'invite me to lunch', '邀我一起吃午餐'], ['How', 'alone', '獨自一人']],
          ['I would want help getting through the breakup so that I could enjoy lunch with my friends again.', '我會想找人陪我走過失戀，因為我希望能再和朋友開心地吃午餐。']
        ],
        extra: [
          ['In the cafeteria, a close friend might leave a seat for me so that I could sit with the group again.', '在學校餐廳，一位好朋友可能會幫我留位子，讓我能重新和大家坐在一起。', ['Where', 'in the cafeteria', '在學校餐廳'], ['Who', 'a close friend', '一位好朋友'], ['Why', 'so that I could sit with the group again', '好讓我能重新和大家坐在一起']],
          ['During the lunch break, I might leave my food untouched even though I was hungry.', '午休時，我可能明明很餓，卻連午餐都沒動。', ['When', 'during the lunch break', '午休時'], ['What', 'leave my food untouched', '沒動面前的食物']],
          ['Later that evening, I might decide to put my phone away to get some sleep.', '那天稍晚，我可能會決定把手機收起來，好讓自己睡一會兒。', ['When', 'later that evening', '那天晚上稍晚'], ['Why', 'to get some sleep', '為了睡一會兒']],
          ['At school, a teacher might notice that I was unusually quiet the next day.', '隔天在學校，老師可能看出我特別安靜。', ['Who', 'a teacher', '一位老師']]
        ]
      }
    ],
    bonuses: [
      ['把觸景生情連到晚上的影響', 0, 0, 'Seeing a couple at the bakery might lead me to reread old messages when I should be doing my homework.', '在麵包店看到那對情侶，可能讓我在該做功課時一直重讀以前的訊息。', 'A 的街上見聞是起點，B 的作業和訊息是後來的影響。用 lead me to 把原因和後果連起來。'],
      ['說出想改變的原因', 1, 1, 'If sadness made me turn away from both familiar places and my friends, I would want help finding my way back to them.', '如果悲傷讓我避開熟悉的地方，也疏遠朋友，我會希望得到幫助，讓我慢慢找回熟悉的生活和朋友的陪伴。', '把 A 的 walk away 和 B 的 eating alone 放在一起，讀者就會明白，作者希望找回日常生活和陪伴。']
    ]
  };
  const opinions = {
    focuses: ['害怕被同學取笑', '把意見藏起來', '希望自己能做主'],
    openings: [
      ['明確點出自己的困擾', 'Of the three problems, ... matters most to me because ...',
        ['Of the three problems, worrying about other people’s opinions matters most to me because I fear being laughed at.', '三個困擾中，我最想解決的是太在意別人眼光的問題，因為我擔心被取笑。'],
        ['Of the three problems, worrying about other people’s opinions matters most to me because it often keeps me silent.', '在這三個困擾中，我最想改善太在意別人看法的問題，因為它常讓我不敢說話。'],
        ['Of the three problems, worrying about other people’s opinions matters most to me because I want to make my own choices.', '三個困擾裡，我最想克服太在意別人眼光的問題，因為我希望自己能替自己做決定。']],
      ['從小組討論的場景帶入', 'During a group discussion, I ...',
        ['During a group discussion, I sometimes wonder whether my classmates will laugh if my answer is wrong.', '小組討論時，我有時會想，如果說錯了，同學會不會笑我。'],
        ['During a group discussion, I sometimes keep an idea to myself even when I think it might help.', '小組討論時，即使我覺得點子有用，有時還是會悶在心裡。'],
        ['During a group discussion, I sometimes agree too quickly and then wish I had made up my own mind.', '小組討論時，我有時太快表示同意，事後又希望自己當時能有主見。']],
      ['用問題呈現心裡的猶豫', 'What stops me from ...?',
        ['What stops me from raising my hand when I know the answer? Sometimes I just fear the reaction of others.', '明明知道答案，為什麼我還是不舉手？有時我只是害怕別人的反應。'],
        ['What stops me from sharing a suggestion with the group? Often I worry more about reactions than about the idea itself.', '是什麼讓我不敢跟小組分享建議？我常常顧慮大家的反應，甚至超過點子本身。'],
        ['What stops me from choosing for myself? I often look at what my classmates are doing first.', '是什麼讓我無法自己做決定？我常常會先看其他同學在做什麼。']],
      ['把內心想法與行為並列', 'Although I ..., I often ...',
        ['Although I know everyone makes mistakes, I often worry that a wrong answer will make me look foolish.', '雖然我知道誰都會犯錯，還是常擔心答錯會讓自己看起來很笨。'],
        ['Although I have ideas of my own, I often keep quiet until someone else speaks.', '雖然有自己的想法，我卻常常安靜地等別人先開口。'],
        ['Although I know what interests me, I often follow other people’s choices.', '雖然知道自己對什麼有興趣，我卻常跟著別人的選擇走。']],
      ['先說出影響與目標', 'I would like to ... without ...',
        ['I would like to try new things without worrying that someone might laugh.', '我希望能嘗試新事物，也能放下別人可能會取笑我的擔心。'],
        ['I would like to share my ideas without waiting for everyone to agree with me first.', '我希望能分享自己的點子，不用先確定每個人都同意才敢開口。'],
        ['I would like to choose a club or an activity without letting other people decide for me.', '我希望可以自己挑社團和活動，不必一直讓別人替我做決定。']]
    ],
    groups: [
      {
        label: '事件｜想表達卻猶豫的當下',
        question: '你在哪裡想說什麼，當時看到誰的反應，又怎麼做？',
        model: [
          ['In a group discussion, my classmates asked me to suggest a topic for our report.', '在小組討論時，同學請我提出一個報告題目。', ['Where', 'in a group discussion', '在小組討論中'], ['Who', 'my classmates', '我的同學'], ['What', 'asked me to suggest a topic', '請我提議一個題目']],
          ['I glanced at the other students and put my hand down nervously.', '我瞄了其他同學一眼，緊張地把手放下。', ['Who', 'the other students', '其他同學'], ['What', 'put my hand down', '把手放下'], ['How', 'nervously', '緊張地']]
        ],
        extra: [
          ['At the club meeting, I might nod along quietly to avoid drawing attention to myself.', '在社團會議上，我可能安靜地跟著點頭，以免引起注意。', ['Where', 'at the club meeting', '在社團會議上'], ['What', 'nod along', '跟著點頭'], ['How', 'quietly', '安靜地'], ['Why', 'to avoid drawing attention to myself', '為了不引起大家特別注意']],
          ['Near the board, the teacher waited for my answer, but I looked away.', '在黑板前，老師等著我回答，我卻移開了視線。', ['Where', 'near the board', '在黑板前'], ['Who', 'the teacher', '老師']],
          ['Before the vote, I might change my answer because I would not want anyone to laugh.', '投票前，我可能會改變答案，因為我不希望有人笑我。', ['When', 'before the vote', '投票前'], ['Why', 'because I would not want anyone to laugh', '因為我不希望有人笑我']]
        ]
      },
      {
        label: '影響與原因｜沒說出口的代價',
        question: '沒說出來之後，別人聽不到什麼？你想找回哪個機會？',
        model: [
          ['At our table, my group chose another topic, and my idea never came up again.', '在我們這桌，小組選了另一個題目，我的點子也再沒被提起。', ['Where', 'at our table', '在我們這桌'], ['Who', 'my group', '我的小組'], ['What', 'chose another topic', '選了另一個題目']],
          ['Back at my desk, I felt disappointed that I had given up the chance to speak.', '回到座位，我很失望，因為自己剛才放棄了發言的機會。', ['Where', 'back at my desk', '回到我的座位上'], ['How', 'felt disappointed', '感到失望'], ['What', 'given up the chance to speak', '放棄發言的機會']],
          ['I want to stop worrying so much about other people’s opinions so I can share my next idea while the group is still deciding.', '我想學著放下對別人眼光的擔心，這樣下次小組還在討論時，我就能及時分享自己的想法。']
        ],
        extra: [
          ['After the meeting, a close friend said she would have liked to hear my suggestion.', '討論結束後，一位好朋友說她其實很想聽聽我的建議。', ['When', 'after the meeting', '會議結束後'], ['Who', 'a close friend', '一位好朋友']],
          ['The next time we meet, I want to speak more openly so that my classmates can hear what I really think.', '下次見面時，我想更坦率地開口，讓同學聽見我的真實想法。', ['When', 'the next time we meet', '下次見面時'], ['How', 'more openly', '更坦率地'], ['Why', 'so that my classmates can hear what I really think', '好讓同學聽見我真正在想什麼']],
          ['At school, I want to make my own choices instead of copying everyone else.', '在學校裡，我希望能自行選擇，不必一直人云亦云。', ['Where', 'at school', '在學校'], ['What', 'make my own choices', '自行做決定']],
          ['My partner cannot guess my plan, so I need to tell her what I have in mind.', '搭檔猜不到我的計畫，所以我要親口告訴她自己的想法。', ['Why', 'so I need to tell her what I have in mind', '所以我必須向她表達自己的想法']]
        ]
      }
    ],
    bonuses: [
      ['把「大家問我」和「大家沒聽到」接起來', 0, 0, 'Although my classmates asked for my opinion, the group picked a topic without ever hearing my idea.', '雖然同學問過我的意見，小組最後仍在沒聽到我的想法之下選定了題目。', 'A 指出我有機會發言，B 說明小組最後怎麼做了決定。用 although 能帶出「被問到」和「沒有說出」之間的落差。'],
      ['從一個動作寫出代價', 1, 1, 'Putting my hand down cost me a chance to speak, and I wished I had been braver.', '放下手的那個動作讓我失去了一次發言機會，我希望自己當時能更勇敢些。', '用 Putting my hand down 把 A 的動作當成主詞，後面接 B 中錯過的發言機會，交代想改善的原因。']
    ]
  };
  window.TopicMaterialData.prepare(window.sevenLessons.robot, [mood, breakup, opinions]);
})();

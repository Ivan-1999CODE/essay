window.sevenLessons = window.sevenLessons || {};
window.sevenLessons.marketing = {
  title: '飢餓行銷與折扣促銷',
  source: '115 年模擬考',
  intro: '同一雙球鞋，一家店限量發售，另一家店打七折。哪一家會讓你掏出錢包？先寫兩家店各怎麼賣，再用一次購物經驗說明你的選擇。',
  tasks: [
    '介紹飢餓行銷與折扣促銷。用同一種商品比較兩家店家的做法，寫出顧客為什麼會想買。',
    '選出你認為更能讓人花錢的手法。回想一次購物經驗，寫出當時看到了什麼、怎麼做決定，以及這怎麼支持你的看法。'
  ],
  quiz: [
    '第一段比較兩種促銷各怎麼影響顧客，第二段表明哪種較有效，並用購物經驗說明理由。',
    '第一段介紹兩種促銷的做法，第二段繼續列出使用這兩種促銷的商店。',
    '第一段寫自己最喜歡哪雙鞋，第二段比較兩家店的鞋子哪雙舒服。'
  ],
  layers: [
    ['兩家店的目標', '限量怎麼賣', '折扣怎麼賣', '顧客為何掏錢'],
    ['我選的手法', '購物當下的理由', '影響決定的細節', '哪種手法更有效']
  ],
  trackLabel: '用哪個購物情境來比較兩種手法？',
  tracks: [{
    label: '逛鞋店，比較限量與折扣',
    opening: {
      en: 'Two stores can sell the same running shoes in very different ways.',
      zh: '兩家店可以用很不一樣的方式賣同一款跑鞋。'
    },
    bridge: {
      en: 'Hunger marketing makes shoppers afraid to wait, while discount promotion gives them a chance to save money.',
      zh: '飢餓行銷讓顧客怕晚點就買不到，折扣促銷則讓他們看到省錢的機會。'
    },
    groups: [
      {
        label: '飢餓行銷',
        question: '第一家店怎麼讓人覺得「再等就買不到了」？選一個可以寫進句子的細節。',
        materials: [
          { wh: 'What', en: 'only ten pairs', zh: '限量十雙', sentence: {
            en: 'The first store puts only ten pairs on sale, so shoppers hurry to get a pair before they sell out.',
            zh: '第一家店只推出十雙，顧客擔心鞋子賣光，於是搶著買。'
          } },
          { wh: 'When', en: 'on Saturday morning only', zh: '只在星期六早上', sentence: {
            en: 'The first store sells the shoes on Saturday morning only, so fans line up before the doors open.',
            zh: '第一家店只在星期六早上販售這款鞋，所以鞋迷在開門前就來排隊。'
          } },
          { wh: 'Who', en: 'the first ten customers', zh: '前十位顧客', sentence: {
            en: 'The first store offers the shoes to the first ten customers, so fans arrive early to get a spot in line.',
            zh: '第一家店只賣給前十位顧客，因此鞋迷提早來排隊卡位。'
          } },
          { wh: 'Where', en: 'in the shop window', zh: '在店面櫥窗裡', sentence: {
            en: 'The first store puts a sign in the shop window announcing a limited release, which makes people stop and ask about the shoes.',
            zh: '第一家店在櫥窗貼出限量發售的告示，讓路過的人停下來打聽這款鞋。'
          } },
          { wh: 'Why', en: 'for fear of missing out', zh: '因為怕錯過', sentence: {
            en: 'The first store releases the shoes in small batches, and some shoppers order a pair immediately for fear of missing out.',
            zh: '第一家店每次只推出少量鞋子，有些顧客怕錯過，馬上就下單。'
          } },
          { wh: 'How', en: 'by numbering each pair', zh: '為每雙鞋編號', sentence: {
            en: 'By numbering each pair in a limited run, the first store makes fans feel that owning the shoes would be special.',
            zh: '第一家店為限量發售的鞋子逐雙編號，讓鞋迷覺得擁有它們是件特別的事。'
          } }
        ]
      },
      {
        label: '折扣促銷',
        question: '第二家店怎麼讓人算出「這樣買比較划算」？用一個細節對照前面的限量做法。',
        materials: [
          { wh: 'What', en: 'thirty percent off', zh: '打七折', sentence: {
            en: 'The second store, by contrast, offers thirty percent off, so the lower price gives shoppers a reason to buy.',
            zh: '相較之下，第二家店打七折，較低的價格給了顧客一個購買理由。'
          } },
          { wh: 'When', en: 'during the weekend sale', zh: '在週末特賣期間', sentence: {
            en: 'The second store cuts the price during the weekend sale, so shoppers can spend less on the same shoes.',
            zh: '第二家店在週末特賣期間降價，讓顧客花更少錢就能買到同款鞋。'
          } },
          { wh: 'Who', en: 'students on a tight budget', zh: '預算有限的學生', sentence: {
            en: 'The second store cuts the price so that students on a tight budget can afford the shoes they need for practice.',
            zh: '第二家店把價格調低，讓預算有限的學生也能買到練習需要的鞋子。'
          } },
          { wh: 'Where', en: 'at the checkout counter', zh: '在結帳櫃檯', sentence: {
            en: 'The second store offers a discount at the checkout counter, and shoppers who hear the final price may decide to buy.',
            zh: '第二家店在結帳櫃檯提供折扣，顧客聽到折扣後的價格就可能決定購買。'
          } },
          { wh: 'Why', en: 'to save money', zh: '為了省錢', sentence: {
            en: 'At the second store, shoppers who want to save money can buy the same shoes for less than the usual price.',
            zh: '在第二家店，想省錢的顧客能用比平常低的價格買到同款鞋。'
          } },
          { wh: 'How', en: 'by listing both prices', zh: '以並列原價和特價的方式', sentence: {
            en: 'By listing both prices, the second store shows customers exactly how much they can save.',
            zh: '第二家店把原價和特價並列，讓顧客看清楚可以省下多少錢。'
          } }
        ]
      }
    ],
    stances: [
      {
        label: '我選折扣促銷',
        en: 'From my experience, a discount is more likely to make me spend money.',
        zh: '就我的經驗來說，折扣更容易讓我花錢。',
        supports: [
          { label: '特價剛好落在預算內',
            reason: { en: 'A lower price can put something I want within my budget.', zh: '價格降下來，我想買的東西就可能剛好落在預算內。' },
            example: { en: 'When I needed shoes for track practice, I had saved NT$1,300, and the sale price was NT$1,200.', zh: '我需要田徑練習用的鞋子時，剛好存了 1,300 元，那雙鞋的特價是 1,200 元。' },
            benefit: { en: 'I could finally buy the shoes with my own savings.', zh: '我終於能用自己的存款買下那雙鞋。' }
          },
          { label: '看得見省下多少',
            reason: { en: 'Seeing the exact amount I can save makes it easier to decide.', zh: '看得到確切能省多少錢，我比較容易做決定。' },
            example: { en: 'The tag on the running shoes showed that the price had dropped from NT$1,600 to NT$1,200.', zh: '跑鞋的標籤寫著，價格從 1,600 元降到了 1,200 元。' },
            benefit: { en: 'Saving four hundred dollars felt like a good enough reason to take the shoes home.', zh: '能省下四百元，讓我覺得有充分的理由把鞋子買回家。' }
          },
          { label: '同款比別家便宜',
            reason: { en: 'A discount can also settle my choice between two stores.', zh: '折扣也能幫我決定要在哪一家店買。' },
            example: { en: 'I checked the same running shoes on my phone and found that the other shop still charged full price.', zh: '我用手機查了同款跑鞋，發現另一家店還是賣原價。' },
            benefit: { en: 'Once I saw the difference, I stopped looking and paid for the cheaper pair.', zh: '看到價差以後，我就沒再繼續找，直接結帳買下比較便宜的那雙。' }
          }
        ],
        ending: {
          en: 'Looking back, the discount was what finally convinced me to buy the shoes.',
          zh: '現在回想起來，最後讓我決定買下那雙鞋的，就是折扣。'
        }
      },
      {
        label: '我選飢餓行銷',
        en: 'I find hunger marketing more persuasive because I pay attention when a store offers only a few pairs.',
        zh: '我覺得飢餓行銷更能打動我，因為只要店家宣布限量幾雙，我就會特別留意。',
        supports: [
          { label: '怕等一下就買不到',
            reason: { en: 'Limited stock makes waiting feel risky.', zh: '數量有限時，晚一點再買就像在冒險。' },
            example: { en: 'At a shoe launch, the clerk told me there was just one pair left in my size.', zh: '有一次新鞋發售，店員跟我說，我的尺寸只剩最後一雙。' },
            benefit: { en: 'I decided to buy it while I still had the chance.', zh: '我決定趁還有機會時買下來。' }
          },
          { label: '編號讓鞋子更有紀念價值',
            reason: { en: 'A limited edition can make an ordinary purchase feel personal.', zh: '限量版能讓一次平常的購物變得更有個人意義。' },
            example: { en: 'The pair I tried on had a small label showing its number in a run of just ten pairs.', zh: '我試穿的那雙鞋有一張小標籤，上面寫著它在限量十雙裡的編號。' },
            benefit: { en: 'I wanted to take that numbered pair home as a souvenir of the launch.', zh: '我想把那雙有編號的鞋帶回家，紀念這次新鞋發售。' }
          },
          { label: '排隊人潮引起好奇',
            reason: { en: 'A line outside a shop can make a limited release hard to ignore.', zh: '店外的排隊人潮會讓人很難不注意到限量發售的商品。' },
            example: { en: 'On my way to the bookstore, I saw a line of students waiting for a shop to release just ten pairs of shoes.', zh: '在去書店的路上，我看見一排學生正在等一家店開賣限量十雙的鞋子。' },
            benefit: { en: 'I joined the line and ended up buying shoes I had never planned to look at.', zh: '我也跟著排隊，最後竟然買了原本連看都沒打算看的鞋。' }
          }
        ],
        ending: {
          en: 'Looking back, I probably would have walked away if those shoes had been available on any ordinary day.',
          zh: '回想起來，如果平常隨時都能買到那雙鞋，我大概就會直接走開。'
        }
      }
    ]
  }],
  caseNotes: [
    [
      '找出 limiting the number of products 和 lowers prices。這兩處各寫出店家的做法；接著看顧客為什麼急著買，或為什麼想多買。',
      '圈出 In contrast，再看第一段末句。作者先對照兩種手法，最後指出兩者都想提高銷量。'
    ],
    [
      '作者用 In my opinion 選擇折扣促銷。接著讀鞋子打五折的經驗，留意 even though 怎麼帶出「沒有實際需要也買了」。',
      '把 getting a good deal 和 price-sensitive 放在一起看。前者解釋作者自己的決定，後者把理由延伸到其他在意價格的顧客。'
    ]
  ]
};

window.TopicMaterialData.prepare(window.sevenLessons.marketing, [{
  focuses: ['店的做法', '顧客的反應', '最後怎麼決定'],
  openings: [
    ['從相同的商品切入', 'Both stores sell ..., but ...',
      ['Both stores sell the same shoes, but one limits the supply while the other lowers the price.', '兩家店賣同款鞋，一家限量，另一家降價。'],
      ['Both stores sell the same shoes, but their signs make shoppers think about different things.', '兩家店賣同款鞋，但兩種告示讓顧客想到不同的事。'],
      ['Both stores sell the same shoes, but each gives shoppers a different reason to buy a pair.', '兩家店賣同款鞋，但各自給顧客不同的購買理由。']],
    ['從顧客的經驗切入', 'When shoppers ..., they ...',
      ['When shoppers look for running shoes, they may see either a limited release or a sale.', '顧客在找跑鞋時，可能看到限量發售，也可能遇到特價。'],
      ['When shoppers see a limited release or a discount, they may feel excited for different reasons.', '顧客遇到限量發售或折扣時，可能因不同的理由而興奮。'],
      ['When shoppers choose a pair of shoes, they may wonder how many pairs are left or how much they could save.', '顧客選購鞋子時，可能會想還剩幾雙，或是能省下多少錢。']],
    ['先向讀者提問', 'What makes ...?',
      ['What makes the same shoes stand out in two different stores?', '是什麼讓同款鞋在兩家店都能引人注目？'],
      ['What makes people feel more excited about a limited release than about a sale?', '什麼會讓顧客對限量發售的興奮感超過特價？'],
      ['What makes a shopper buy a pair today instead of waiting until tomorrow?', '是什麼讓顧客今天就買一雙鞋，而不等到明天？']],
    ['從兩張告示切入', 'One sign ..., while the other ...',
      ['One sign announces a limited release, while the other promises a discount on the same shoes.', '一張告示寫著限量發售，另一張則是同款鞋的折扣訊息。'],
      ['One sign makes shoppers wonder how many pairs are left, while the other makes them check the price.', '一張告示讓顧客在意還剩幾雙，另一張則讓他們查看價格。'],
      ['One sign encourages shoppers to hurry, while the other gives them a reason to reconsider the price.', '一張告示催促顧客趕快下手，另一張則讓他們重新衡量價格。']],
    ['用購物選擇開頭', 'A decision to buy ... may depend on ...',
      ['A decision to buy running shoes may depend on how the store chooses to sell them.', '顧客是否購買跑鞋，可能取決於店家採取的販售方式。'],
      ['A decision to buy running shoes may depend on how shoppers react to scarcity and savings.', '顧客是否購買跑鞋，可能取決於他們看到限量與省錢機會時的反應。'],
      ['A decision to buy running shoes may depend on a fear of missing out or a chance to spend less.', '顧客是否購買跑鞋，可能取決於他們是否怕錯過，或是否有機會少花一點錢。']]
  ],
  groups: [
    {
      model: [
        ['At the first shop, the clerk sets out only ten pairs of the new running shoes.', '在第一家店，店員只擺出十雙新款跑鞋。',
          ['Where', 'at the first shop', '在第一家店'], ['Who', 'the clerk', '店員'], ['What', 'sets out only ten pairs', '只擺出十雙鞋']],
        ['Outside the shop, eager fans line up before the doors open.', '店門外，鞋迷滿懷期待，在開門前就開始排隊。',
          ['Who', 'fans', '鞋迷'], ['What', 'line up', '排隊'], ['How', 'eager', '滿心期待的']]
      ],
      extra: [
        ['Before the doors open, fans wait anxiously to get a pair in their size.', '開門前，鞋迷焦急地等著，希望買到自己的尺寸。',
          ['When', 'before the doors open', '開門前'], ['Why', 'to get a pair in their size', '為了買到自己的尺寸']],
        ['At the front of the line, two friends count the boxes to see how many pairs are left.', '在隊伍前方，兩個朋友數著鞋盒，想知道還剩幾雙。',
          ['What', 'count the boxes', '數鞋盒']]
      ]
    },
    {
      model: [
        ['Across the street, a shop owner cuts the price of the same shoes by thirty percent.', '在街道的另一邊，一名店主替同款鞋降價三成。',
          ['Where', 'across the street', '在街道的另一邊'], ['Who', 'a shop owner', '一名店主'], ['What', 'cuts the price', '降價']],
        ['Inside the store, two students compare the two prices carefully before they decide.', '在店裡，兩個學生仔細比較原價和特價，再做決定。',
          ['Where', 'inside the store', '在店裡'], ['Who', 'two students', '兩個學生'], ['What', 'compare the two prices', '比較原價和特價'], ['How', 'carefully', '仔細地']]
      ],
      extra: [
        ['Before they decide, shoppers check the price tag to stay within their budget.', '做決定之前，顧客會查看價牌，讓花費維持在預算內。',
          ['When', 'before they decide', '在他們決定前'], ['Why', 'to stay within their budget', '為了把花費控制在預算內']],
        ['With their phones in hand, some customers check other prices on the sales floor.', '有些顧客拿著手機，在賣場內查詢別家的價格。',
          ['How', 'with their phones in hand', '拿著手機'], ['Where', 'on the sales floor', '在賣場內']]
      ]
    }
  ],
  bonuses: [
    ['從兩家店的做法歸納差異', 0, 0, 'One store limits the number of pairs, while the other lowers the price of the same shoes.', '一家店限制鞋子的數量，另一家則調低同款鞋的價格。', '先從 A 抽出「供貨量」，再從 B 抽出「價格」。用 while 對照兩家店改變的條件。'],
    ['從兩種反應寫購買動機', 1, 1, 'Fans hurry to get a limited pair, while bargain hunters take time to compare prices.', '搶限量鞋的鞋迷趕緊下手，想撿便宜的顧客則花時間比較價格。', 'A 的排隊讓人讀出急迫感，B 的比價則呈現價格考量。以顧客為主詞，就能比較兩種反應。']
  ]
}]);

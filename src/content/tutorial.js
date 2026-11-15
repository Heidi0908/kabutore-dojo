// チュートリアルの台本
// target: 光らせる場所（画面の部品に付けた data-tut の名前）
// waitFor: 'next'＝「次へ」ボタンで進む / それ以外は、プレイヤーがその操作をしたら自動で進む
//   'running'＝開始を押した 'bought'＝株を買った 'profit'＝含み益が出た 'sold'＝株を売った

export const TUTORIAL_STOCK = 'MIRAI';

// チュートリアルで必ず出すニュース
export const TUTORIAL_NEWS = {
  event: { text: '{company}、決算が予想を上回り好調', scope: 'stock', impact: [6, 6] },
  impact: 6,
};

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    waitFor: 'next',
    text: '株トレ道場へようこそ。案内役の師範です。\nここでは「100万円の練習用のお金」で、株の売り買いを体験できます。本物のお金は使わないので、失敗しても大丈夫ですよ。',
  },
  {
    id: 'equity',
    target: 'equity',
    waitFor: 'next',
    text: 'まず、ここを見てください。これがあなたの「純資産」、つまり今の持ち金です。\nこれをどれだけ増やせるかを目指します。',
  },
  {
    id: 'start',
    target: 'run',
    waitFor: 'running',
    text: '今は市場が止まっています。\n光っている「開始」を押して、株価を動かしてみましょう。',
  },
  {
    id: 'chart',
    target: 'chart',
    waitFor: 'next',
    text: '株価が動き始めました。\n線が上がれば「値上がり」、下がれば「値下がり」です。今見ているのは「ミライ自動車」という会社の株です。',
  },
  {
    id: 'buy',
    target: 'buy',
    waitFor: 'bought',
    text: 'では、買ってみましょう。\n株は100株単位で買うのが基本です。株数は100株のまま、緑の「買う」を押してください。',
  },
  {
    id: 'holding',
    target: 'holding',
    waitFor: 'next',
    text: '買えましたね。ここを見てください。\n「平均取得単価」は買った値段、「含み損益」は今売ったらいくら得か損かを表しています。',
  },
  {
    id: 'news',
    target: 'chart',
    waitFor: 'profit',
    text: 'ニュースが入りました。\n良いニュースが出ると株価は上がりやすく、悪いニュースなら下がりやすくなります。株価と含み損益の動きを見てみましょう。',
  },
  {
    id: 'sell',
    target: 'sell',
    waitFor: 'sold',
    text: '含み益が出ています。ここで売ると、利益が確定します。\n赤い「売る」を押してみましょう。',
  },
  {
    id: 'done',
    waitFor: 'finish',
    text: 'お見事です。初めての利益を確定できました。\n\n大事なことを3つ覚えておきましょう。\n① 安く買って、高く売る\n② 下がり続けたら、早めに売る（損切り）\n③ 借金して買う「レバレッジ」は、慣れてから\n\n修了の記録として、実績「入門」を付けておきます。',
  },
];

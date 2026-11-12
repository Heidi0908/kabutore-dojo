// 株トレ道場に登場する企業・業種・ニュースはすべて架空です。

// 業種
export const SECTORS = {
  auto: { name: '自動車' },
  semi: { name: '半導体・電機' },
  it: { name: 'IT・通信' },
  finance: { name: '銀行・証券' },
  pharma: { name: '医薬品' },
  retail: { name: '小売・食品' },
  realestate: { name: '不動産・建設' },
  energy: { name: 'エネルギー・商社' },
  entertainment: { name: 'ゲーム・エンタメ' },
  shipping: { name: '海運' },
};

// 銘柄
// basePrice: 初期株価（円）
// volatility: その会社だけの値動きの大きさ（1秒あたり%）
// beta: 市場全体の動きにどれだけつられるか（1より大きいと市場より大きく動く）
export const STOCKS = [
  { symbol: 'MIRAI', name: 'ミライ自動車', sector: 'auto', basePrice: 3200, volatility: 0.12, beta: 1.1 },
  { symbol: 'HAYATE', name: 'ハヤテモーターズ', sector: 'auto', basePrice: 1450, volatility: 0.18, beta: 1.3 },
  { symbol: 'SAKURA', name: 'サクラ半導体', sector: 'semi', basePrice: 8600, volatility: 0.26, beta: 1.5 },
  { symbol: 'AZUMA', name: 'アズマ電機', sector: 'semi', basePrice: 2100, volatility: 0.15, beta: 1.1 },
  { symbol: 'KUMO', name: 'クモノスネット', sector: 'it', basePrice: 4300, volatility: 0.2, beta: 1.3 },
  { symbol: 'SORA', name: 'ソラ通信', sector: 'it', basePrice: 2900, volatility: 0.07, beta: 0.6 },
  { symbol: 'OWADA', name: '大和田銀行', sector: 'finance', basePrice: 980, volatility: 0.1, beta: 0.9 },
  { symbol: 'MINATO', name: 'ミナト証券', sector: 'finance', basePrice: 760, volatility: 0.18, beta: 1.4 },
  { symbol: 'AOBA', name: 'アオバ製薬', sector: 'pharma', basePrice: 5200, volatility: 0.1, beta: 0.6 },
  { symbol: 'IYASHI', name: 'イヤシバイオ', sector: 'pharma', basePrice: 640, volatility: 0.32, beta: 0.8 },
  { symbol: 'MARUYAMA', name: 'マルヤマ食品', sector: 'retail', basePrice: 3800, volatility: 0.06, beta: 0.5 },
  { symbol: 'KOMACHI', name: 'コマチ百貨店', sector: 'retail', basePrice: 1720, volatility: 0.11, beta: 0.9 },
  { symbol: 'TSUBAME', name: 'ツバメ不動産', sector: 'realestate', basePrice: 2450, volatility: 0.13, beta: 1.1 },
  { symbol: 'ISHIZUE', name: 'イシズエ建設', sector: 'realestate', basePrice: 1180, volatility: 0.11, beta: 1.0 },
  { symbol: 'KAZAMI', name: 'カザミ商事', sector: 'energy', basePrice: 4100, volatility: 0.12, beta: 1.0 },
  { symbol: 'HOMURA', name: 'ホムラ石油', sector: 'energy', basePrice: 890, volatility: 0.18, beta: 1.1 },
  { symbol: 'HINOMOTO', name: 'ヒノモト電力', sector: 'energy', basePrice: 1650, volatility: 0.05, beta: 0.5 },
  { symbol: 'DRAGON', name: 'ドラゴンアーク', sector: 'entertainment', basePrice: 6900, volatility: 0.28, beta: 1.2 },
  { symbol: 'YUMEMI', name: 'ユメミ映像', sector: 'entertainment', basePrice: 2300, volatility: 0.18, beta: 1.0 },
  { symbol: 'NAMIJI', name: 'ナミジ海運', sector: 'shipping', basePrice: 3400, volatility: 0.24, beta: 1.2 },
];

// 売買の単位（日本株は100株単位）
export const LOT_SIZE = 100;

// 難易度
// feeRate: 売買手数料（取引金額に対する割合） taxRate: 利益にかかる税金
// newsStrength: ニュースの影響の強さ
export const DIFFICULTY_MODES = {
  SAFE: {
    name: 'セーフモード',
    description: '借金なし・手数料なし、初心者向け',
    maxLeverage: 1,
    marginCallThreshold: 0,
    losscutThreshold: 0,
    canGoBankrupt: false,
    feeRate: 0,
    taxRate: 0,
    newsStrength: 0.6,
    color: 'from-emerald-400 to-teal-500',
    icon: '🛡️',
  },
  NORMAL: {
    name: 'ノーマルモード',
    description: 'レバレッジ3倍、追証・手数料あり',
    maxLeverage: 3,
    marginCallThreshold: 0.3,
    losscutThreshold: 0.2,
    canGoBankrupt: false,
    feeRate: 0.001,
    taxRate: 0,
    newsStrength: 1,
    color: 'from-blue-400 to-indigo-500',
    icon: '⚖️',
  },
  HARD: {
    name: 'ハードモード',
    description: 'レバレッジ5倍、税金・自己破産あり',
    maxLeverage: 5,
    marginCallThreshold: 0.35,
    losscutThreshold: 0.25,
    canGoBankrupt: true,
    feeRate: 0.001,
    taxRate: 0.20315,
    newsStrength: 1.3,
    color: 'from-orange-400 to-red-500',
    icon: '⚠️',
  },
  EXTREME: {
    name: 'エクストリームモード',
    description: 'レバレッジ10倍、暴落多発・即破産',
    maxLeverage: 10,
    marginCallThreshold: 0.4,
    losscutThreshold: 0.3,
    canGoBankrupt: true,
    feeRate: 0.001,
    taxRate: 0.20315,
    newsStrength: 1.6,
    color: 'from-red-500 to-rose-600',
    icon: '💀',
  },
};

// ニュース
// scope: 'stock'＝1社だけ / 'sector'＝その業種全体 / 'market'＝市場全体
// impact: 影響の範囲（%）  weight: 出やすさ
// sectorBias: 市場全体ニュースで、業種ごとに影響を変える倍率（マイナスなら逆に動く）
export const NEWS_EVENTS = [
  // 1社だけのニュース
  { text: '{company}、決算が予想を上回り好調', scope: 'stock', impact: [2, 5], weight: 6 },
  { text: '{company}、画期的な新製品を発表', scope: 'stock', impact: [1.5, 4], weight: 5 },
  { text: '{company}、大手企業との業務提携を発表', scope: 'stock', impact: [1, 3], weight: 5 },
  { text: '{company}、自社株買いを発表', scope: 'stock', impact: [1, 2.5], weight: 4 },
  { text: '{company}、増配を発表', scope: 'stock', impact: [1, 2.5], weight: 3 },
  { text: '{company}、決算が予想に届かず売り優勢', scope: 'stock', impact: [-5, -2], weight: 6 },
  { text: '{company}、不正会計の疑いが浮上', scope: 'stock', impact: [-9, -4], weight: 2 },
  { text: '{company}、主力製品のリコールを発表', scope: 'stock', impact: [-5, -2], weight: 3 },
  { text: '{company}、業績予想を下方修正', scope: 'stock', impact: [-4, -1.5], weight: 4 },

  // 業種全体のニュース
  { text: '{sector}業界に追い風、政府が支援策を発表', scope: 'sector', impact: [1.5, 3.5], weight: 4 },
  { text: '{sector}業界の需要が世界的に拡大との予測', scope: 'sector', impact: [1, 3], weight: 4 },
  { text: '{sector}業界に新たな規制の動き', scope: 'sector', impact: [-3.5, -1.5], weight: 4 },
  { text: '{sector}業界で原材料価格が高騰', scope: 'sector', impact: [-3, -1], weight: 3 },

  // 市場全体のニュース
  {
    text: '🏦 中央銀行が利上げを決定', scope: 'market', impact: [-3, -1.5], weight: 2,
    sectorBias: { finance: -1, realestate: 1.8, it: 1.3 },
  },
  {
    text: '🏦 中央銀行が利下げを決定、株式市場が歓迎', scope: 'market', impact: [1.5, 3], weight: 2,
    sectorBias: { finance: -0.5, realestate: 1.5 },
  },
  { text: '📈 GDP成長率が予想を上回る', scope: 'market', impact: [0.8, 2], weight: 4 },
  { text: '🌏 海外投資家の買いが続き、相場が上昇', scope: 'market', impact: [0.8, 2], weight: 3 },
  { text: '📊 企業業績の好調が続き、市場に楽観ムード', scope: 'market', impact: [0.8, 2], weight: 3 },
  { text: '⚠️ 景気後退への懸念が強まる', scope: 'market', impact: [-2.5, -1], weight: 3 },
  {
    text: '💴 急激な円安が進行、輸出企業に追い風', scope: 'market', impact: [0.5, 1.5], weight: 3,
    sectorBias: { auto: 2.5, semi: 2, shipping: 2, retail: -1, energy: -1 },
  },
  {
    text: '💴 急激な円高が進行、輸出企業に逆風', scope: 'market', impact: [-1.5, -0.5], weight: 3,
    sectorBias: { auto: 2.5, semi: 2, shipping: 2, retail: -1, energy: -1 },
  },
  {
    text: '🛢️ 原油価格が急騰', scope: 'market', impact: [-1.5, -0.5], weight: 2,
    sectorBias: { energy: -2.5, shipping: 1.5, auto: 1.3 },
  },
  {
    text: '🌍 地政学的な緊張が高まり、リスク回避の売り', scope: 'market', impact: [-4, -2], weight: 2,
    sectorBias: { energy: -0.5, pharma: 0.4, retail: 0.5 },
  },
  { text: '🕊️ 和平交渉が進展、買い戻しが広がる', scope: 'market', impact: [1.5, 3.5], weight: 3 },
  {
    text: '😷 感染症の再拡大が懸念される', scope: 'market', impact: [-3, -1], weight: 1,
    sectorBias: { pharma: -1.5, entertainment: 1.5, retail: 1.2 },
  },
  {
    text: '🌪️ 大規模な自然災害が発生', scope: 'market', impact: [-3, -1], weight: 1,
    sectorBias: { realestate: -1, energy: 1.5 },
  },
  { text: '⚡ 市場でフラッシュクラッシュが発生！', scope: 'market', impact: [-7, -4], weight: 1, critical: true },
];

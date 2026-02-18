import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Bell, Play, Pause, Zap, AlertTriangle, CheckCircle, Volume2, BarChart3, Skull, AlertOctagon, Menu, X, Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ニュースイベントタイプ（拡張版：世界情勢を追加）
const NEWS_EVENTS = {
  // 企業ニュース
  EARNINGS_BEAT: { text: '{company}、決算好調で株価急騰', impact: [2, 5], prob: 0.05, category: 'corporate' },
  TECH_BREAKTHROUGH: { text: '{company}、革新的技術を発表', impact: [1.5, 4], prob: 0.04, category: 'corporate' },
  PARTNERSHIP: { text: '{company}、大手企業と提携発表', impact: [1, 3], prob: 0.06, category: 'corporate' },
  EARNINGS_MISS: { text: '{company}、決算未達で売り優勢', impact: [-5, -2], prob: 0.05, category: 'corporate' },
  SCANDAL: { text: '{company}、不祥事が発覚', impact: [-6, -3], prob: 0.03, category: 'corporate' },
  
  // マクロ経済
  INTEREST_RATE_HIKE: { text: '🏦 中央銀行が利上げを発表、市場全体に売り圧力', impact: [-8, -3], prob: 0.03, category: 'macro' },
  INTEREST_RATE_CUT: { text: '🏦 中央銀行が利下げを決定、株式市場が歓迎', impact: [3, 8], prob: 0.03, category: 'macro' },
  GDP_GROWTH: { text: '📈 GDP成長率が予想を上回る、経済好調', impact: [2, 5], prob: 0.04, category: 'macro' },
  RECESSION_WARNING: { text: '⚠️ リセッション懸念が高まり、市場が警戒', impact: [-6, -2], prob: 0.02, category: 'macro' },
  UNEMPLOYMENT_DROP: { text: '💼 失業率が低下、雇用市場が堅調', impact: [1, 3], prob: 0.04, category: 'macro' },
  
  // 地政学リスク
  GEOPOLITICAL_TENSION: { text: '🌍 地政学的緊張が高まり、市場が動揺', impact: [-10, -4], prob: 0.02, category: 'geopolitical' },
  PEACE_TALKS: { text: '🕊️ 和平交渉の進展、リスクオフムードが後退', impact: [2, 6], prob: 0.02, category: 'geopolitical' },
  ELECTION_RESULT: { text: '🗳️ 選挙結果が判明、政策期待で市場が反応', impact: [-4, 6], prob: 0.01, category: 'geopolitical' },
  TRADE_DEAL: { text: '🤝 貿易協定が成立、関係国の株価が上昇', impact: [3, 7], prob: 0.02, category: 'geopolitical' },
  
  // 災害・パンデミック
  NATURAL_DISASTER: { text: '🌪️ 大規模自然災害が発生、関連企業に影響', impact: [-8, -3], prob: 0.01, category: 'disaster' },
  PANDEMIC_WAVE: { text: '😷 パンデミック再拡大の懸念、市場が反応', impact: [-7, -2], prob: 0.01, category: 'disaster' },
  VACCINE_BREAKTHROUGH: { text: '💉 新ワクチン開発成功、医薬品株が急騰', impact: [4, 10], prob: 0.01, category: 'disaster' },
  
  // その他
  FLASH_CRASH: { text: '⚡ フラッシュクラッシュ発生！{company}暴落', impact: [-15, -8], prob: 0.01, category: 'market' },
  MARKET_RALLY: { text: '市場全体が上昇、{company}も追随', impact: [0.3, 1.5], prob: 0.1, category: 'market' }
};

// 銘柄データ
const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 180, volatility: 0.8, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 250, volatility: 2.5, sector: 'Automotive' },
  { symbol: 'MSFT', name: 'Microsoft', basePrice: 380, volatility: 0.7, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', basePrice: 140, volatility: 0.9, sector: 'Technology' },
  { symbol: '7203.T', name: 'トヨタ自動車', basePrice: 2800, volatility: 1.2, sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA', basePrice: 480, volatility: 2.0, sector: 'Technology' }
];

// 難易度設定
const DIFFICULTY_MODES = {
  SAFE: {
    name: 'セーフモード',
    description: '借金なし、初心者向け',
    maxLeverage: 1,
    marginCallThreshold: 0,
    losscutThreshold: 0,
    canGoBankrupt: false,
    color: 'from-emerald-400 to-teal-500',
    icon: '🛡️'
  },
  NORMAL: {
    name: 'ノーマルモード',
    description: 'レバレッジ3倍、追証あり',
    maxLeverage: 3,
    marginCallThreshold: 0.3,
    losscutThreshold: 0.2,
    canGoBankrupt: false,
    color: 'from-blue-400 to-indigo-500',
    icon: '⚖️'
  },
  HARD: {
    name: 'ハードモード',
    description: 'レバレッジ5倍、自己破産あり',
    maxLeverage: 5,
    marginCallThreshold: 0.35,
    losscutThreshold: 0.25,
    canGoBankrupt: true,
    color: 'from-orange-400 to-red-500',
    icon: '⚠️'
  },
  EXTREME: {
    name: 'エクストリームモード',
    description: 'レバレッジ10倍、即破産',
    maxLeverage: 10,
    marginCallThreshold: 0.4,
    losscutThreshold: 0.3,
    canGoBankrupt: true,
    color: 'from-red-500 to-rose-600',
    icon: '💀'
  }
};

// リアルタイム株価エンジン
class RealtimeStockEngine {
  constructor(stock) {
    this.stock = stock;
    this.currentPrice = stock.basePrice;
    this.tickData = [];
    this.orderBook = {
      bids: this.generateOrderBook('bid'),
      asks: this.generateOrderBook('ask')
    };
    this.volume = 0;
    this.high = stock.basePrice;
    this.low = stock.basePrice;
    this.open = stock.basePrice;
  }

  generateOrderBook(side) {
    const orders = [];
    const basePrice = this.currentPrice;
    for (let i = 0; i < 10; i++) {
      const offset = side === 'bid' ? -i * 0.1 : i * 0.1;
      const price = basePrice + offset;
      const size = Math.floor(Math.random() * 1000) + 100;
      orders.push({ price: parseFloat(price.toFixed(2)), size });
    }
    return orders;
  }

  tick() {
    const change = (Math.random() - 0.5) * this.stock.volatility;
    const percentChange = change / 100;
    
    this.currentPrice = this.currentPrice * (1 + percentChange);
    this.currentPrice = parseFloat(this.currentPrice.toFixed(2));
    
    if (this.currentPrice > this.high) this.high = this.currentPrice;
    if (this.currentPrice < this.low) this.low = this.currentPrice;
    
    this.volume += Math.floor(Math.random() * 1000) + 100;
    
    const now = new Date();
    this.tickData.push({
      time: now.toLocaleTimeString(),
      price: this.currentPrice,
      timestamp: now.getTime()
    });
    
    if (this.tickData.length > 60) {
      this.tickData.shift();
    }
    
    this.orderBook.bids = this.generateOrderBook('bid');
    this.orderBook.asks = this.generateOrderBook('ask');
    
    return {
      price: this.currentPrice,
      change: percentChange * 100,
      volume: this.volume,
      high: this.high,
      low: this.low,
      open: this.open
    };
  }

  applyNewsImpact(impact) {
    this.currentPrice = this.currentPrice * (1 + impact / 100);
    this.currentPrice = parseFloat(this.currentPrice.toFixed(2));
  }

  reset() {
    this.currentPrice = this.stock.basePrice;
    this.tickData = [];
    this.volume = 0;
    this.high = this.stock.basePrice;
    this.low = this.stock.basePrice;
    this.open = this.stock.basePrice;
  }
}

export default function KabutoredojoSimulator() {
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedStock, setSelectedStock] = useState(STOCKS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentData, setCurrentData] = useState({
    price: selectedStock.basePrice,
    change: 0,
    volume: 0,
    high: selectedStock.basePrice,
    low: selectedStock.basePrice,
    open: selectedStock.basePrice
  });
  const [tickData, setTickData] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [newsHistory, setNewsHistory] = useState([]);
  const [portfolio, setPortfolio] = useState({
    initialCash: 1000000,
    cash: 1000000,
    holdings: {},
    totalValue: 1000000,
    equity: 1000000,
    borrowedAmount: 0,
    marginRatio: 1.0,
    pnl: 0,
    pnlPercent: 0
  });
  const [watchlist, setWatchlist] = useState([STOCKS[0], STOCKS[1], STOCKS[4]]);
  const [allStockData, setAllStockData] = useState({});
  const [tradeAmount, setTradeAmount] = useState(100);
  const [leverage, setLeverage] = useState(1);
  const [marginCallActive, setMarginCallActive] = useState(false);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [lossCutTriggered, setLossCutTriggered] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(true);
  
  const engineRef = useRef(null);
  const enginesRef = useRef({});
  const intervalRef = useRef(null);
  const newsIntervalRef = useRef(null);

  useEffect(() => {
    STOCKS.forEach(stock => {
      enginesRef.current[stock.symbol] = new RealtimeStockEngine(stock);
    });
    
    engineRef.current = enginesRef.current[selectedStock.symbol];
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (newsIntervalRef.current) clearInterval(newsIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedStock) {
      engineRef.current = enginesRef.current[selectedStock.symbol];
      updateDisplay();
    }
  }, [selectedStock]);

  const updateDisplay = () => {
    if (!engineRef.current) return;
    
    const data = {
      price: engineRef.current.currentPrice,
      change: ((engineRef.current.currentPrice - engineRef.current.open) / engineRef.current.open) * 100,
      volume: engineRef.current.volume,
      high: engineRef.current.high,
      low: engineRef.current.low,
      open: engineRef.current.open
    };
    
    setCurrentData(data);
    setTickData([...engineRef.current.tickData]);
    setOrderBook({ ...engineRef.current.orderBook });
    
    updatePortfolio();
  };

  const updatePortfolio = () => {
    if (isBankrupt) return;
    
    let holdingsValue = 0;
    
    Object.entries(portfolio.holdings).forEach(([symbol, shares]) => {
      if (shares > 0 && enginesRef.current[symbol]) {
        holdingsValue += shares * enginesRef.current[symbol].currentPrice;
      }
    });
    
    const totalValue = portfolio.cash + holdingsValue;
    const equity = totalValue - portfolio.borrowedAmount;
    const pnl = equity - portfolio.initialCash;
    const pnlPercent = (pnl / portfolio.initialCash) * 100;
    
    let marginRatio = 1.0;
    if (portfolio.borrowedAmount > 0) {
      marginRatio = equity / portfolio.borrowedAmount;
    }
    
    const mode = DIFFICULTY_MODES[difficulty];
    
    if (mode.marginCallThreshold > 0 && marginRatio < mode.marginCallThreshold && !marginCallActive && !lossCutTriggered) {
      triggerMarginCall();
    }
    
    if (mode.losscutThreshold > 0 && marginRatio < mode.losscutThreshold && !lossCutTriggered) {
      triggerLossCut();
    }
    
    if (mode.canGoBankrupt && equity <= 0 && !isBankrupt) {
      triggerBankruptcy();
    }
    
    setPortfolio(prev => ({
      ...prev,
      totalValue,
      equity,
      marginRatio,
      pnl,
      pnlPercent
    }));
  };

  const triggerMarginCall = () => {
    setMarginCallActive(true);
    addNotification('🚨 追証（マージンコール）発生！3分以内に対応してください', 'critical');
  };

  const triggerLossCut = () => {
    setLossCutTriggered(true);
    setMarginCallActive(false);
    
    const holdings = { ...portfolio.holdings };
    let totalCash = portfolio.cash;
    
    Object.entries(holdings).forEach(([symbol, shares]) => {
      if (shares > 0 && enginesRef.current[symbol]) {
        const price = enginesRef.current[symbol].currentPrice;
        totalCash += shares * price;
      }
    });
    
    const finalEquity = totalCash - portfolio.borrowedAmount;
    
    setPortfolio(prev => ({
      ...prev,
      cash: finalEquity,
      holdings: {},
      borrowedAmount: 0,
      equity: finalEquity,
      marginRatio: 1.0
    }));
    
    addNotification(`⚡ ロスカット発動！全ポジション強制決済 最終資産: ¥${finalEquity.toLocaleString()}`, 'critical');
    
    if (DIFFICULTY_MODES[difficulty].canGoBankrupt && finalEquity <= 0) {
      setTimeout(() => triggerBankruptcy(), 2000);
    }
  };

  const triggerBankruptcy = () => {
    setIsBankrupt(true);
    stopSimulation();
    addNotification('💀 自己破産しました。ゲームオーバー', 'critical');
  };

  const startSimulation = () => {
    if (isBankrupt || lossCutTriggered) {
      addNotification('ゲームをリセットしてください', 'error');
      return;
    }
    
    setIsRunning(true);
    
    intervalRef.current = setInterval(() => {
      Object.values(enginesRef.current).forEach(engine => {
        engine.tick();
      });
      
      const watchData = {};
      watchlist.forEach(stock => {
        const engine = enginesRef.current[stock.symbol];
        watchData[stock.symbol] = {
          price: engine.currentPrice,
          change: ((engine.currentPrice - engine.open) / engine.open) * 100
        };
      });
      setAllStockData(watchData);
      
      updateDisplay();
    }, 1000);
    
    const generateNews = () => {
      const eventKeys = Object.keys(NEWS_EVENTS);
      const eventKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
      const event = NEWS_EVENTS[eventKey];
      
      if (Math.random() < event.prob) {
        const randomStock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
        const impact = event.impact[0] + Math.random() * (event.impact[1] - event.impact[0]);
        const newsText = event.text.replace('{company}', randomStock.name);
        
        const newsItem = {
          id: Date.now(),
          text: newsText,
          impact: impact,
          stock: randomStock.symbol,
          time: new Date().toLocaleTimeString(),
          isPositive: impact > 0,
          isCritical: Math.abs(impact) > 5,
          category: event.category
        };
        
        setNewsHistory(prev => [newsItem, ...prev.slice(0, 19)]);
        
        enginesRef.current[randomStock.symbol].applyNewsImpact(impact);
        
        if (newsItem.isCritical) {
          addNotification(`⚠️ 重大ニュース: ${newsText}`, 'warning');
        }
      }
      
      const nextDelay = 10000 + Math.random() * 20000;
      newsIntervalRef.current = setTimeout(generateNews, nextDelay);
    };
    
    generateNews();
  };

  const stopSimulation = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (newsIntervalRef.current) clearTimeout(newsIntervalRef.current);
  };

  const resetSimulation = () => {
    stopSimulation();
    Object.values(enginesRef.current).forEach(engine => engine.reset());
    setNewsHistory([]);
    setMarginCallActive(false);
    setIsBankrupt(false);
    setLossCutTriggered(false);
    setNotifications([]);
    setPortfolio({
      initialCash: 1000000,
      cash: 1000000,
      holdings: {},
      totalValue: 1000000,
      equity: 1000000,
      borrowedAmount: 0,
      marginRatio: 1.0,
      pnl: 0,
      pnlPercent: 0
    });
    updateDisplay();
  };

  const buyStock = () => {
    if (isBankrupt || lossCutTriggered) {
      addNotification('取引できません', 'error');
      return;
    }
    
    const mode = DIFFICULTY_MODES[difficulty];
    const cost = currentData.price * tradeAmount;
    const maxBuyingPower = portfolio.cash + (portfolio.equity * (leverage - 1));
    
    if (leverage > mode.maxLeverage) {
      addNotification(`このモードの最大レバレッジは${mode.maxLeverage}倍です`, 'error');
      return;
    }
    
    if (cost <= maxBuyingPower) {
      let cashUsed = cost;
      let borrowed = 0;
      
      if (cost > portfolio.cash) {
        borrowed = cost - portfolio.cash;
        cashUsed = portfolio.cash;
      }
      
      setPortfolio(prev => ({
        ...prev,
        cash: prev.cash - cashUsed,
        borrowedAmount: prev.borrowedAmount + borrowed,
        holdings: {
          ...prev.holdings,
          [selectedStock.symbol]: (prev.holdings[selectedStock.symbol] || 0) + tradeAmount
        }
      }));
      
      const msg = borrowed > 0 
        ? `${selectedStock.symbol} ${tradeAmount}株を ¥${currentData.price.toLocaleString()} で買付（信用: ¥${borrowed.toLocaleString()}）`
        : `${selectedStock.symbol} ${tradeAmount}株を ¥${currentData.price.toLocaleString()} で買付`;
      
      addNotification(msg, 'success');
    } else {
      addNotification('買付余力が不足しています', 'error');
    }
  };

  const sellStock = () => {
    if (isBankrupt || lossCutTriggered) {
      addNotification('取引できません', 'error');
      return;
    }
    
    const currentHolding = portfolio.holdings[selectedStock.symbol] || 0;
    if (currentHolding >= tradeAmount) {
      const revenue = currentData.price * tradeAmount;
      
      let newCash = portfolio.cash + revenue;
      let newBorrowed = portfolio.borrowedAmount;
      
      if (newBorrowed > 0) {
        const repayAmount = Math.min(revenue, newBorrowed);
        newBorrowed -= repayAmount;
        newCash = portfolio.cash + (revenue - repayAmount);
      }
      
      setPortfolio(prev => ({
        ...prev,
        cash: newCash,
        borrowedAmount: newBorrowed,
        holdings: {
          ...prev.holdings,
          [selectedStock.symbol]: currentHolding - tradeAmount
        }
      }));
      
      addNotification(`${selectedStock.symbol} ${tradeAmount}株を ¥${currentData.price.toLocaleString()} で売却`, 'success');
    } else {
      addNotification('保有株数が不足しています', 'error');
    }
  };

  const addNotification = (text, type) => {
    const notification = {
      id: Date.now(),
      text,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  };

  const currentHolding = portfolio.holdings[selectedStock.symbol] || 0;
  const holdingValue = currentHolding * currentData.price;
  const mode = DIFFICULTY_MODES[difficulty];

  // 難易度選択画面
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
        {/* 背景装飾 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-5xl w-full relative z-10">
          {/* ヘッダー */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full">
              <span className="text-amber-400 text-sm font-medium tracking-wider">PROFESSIONAL TRADING SIMULATOR</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent tracking-tight">
              株トレ道場
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              プロの取引を学ぶ。信用取引・レバレッジ・追証まで完全再現。
            </p>
          </div>

          {/* 難易度選択カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {Object.entries(DIFFICULTY_MODES).map(([key, diffMode]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                className={`group relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 ${
                  difficulty === key
                    ? 'border-amber-500 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl shadow-amber-500/20'
                    : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{diffMode.icon}</span>
                  {difficulty === key && (
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                  )}
                </div>
                <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${diffMode.color} bg-clip-text text-transparent`}>
                  {diffMode.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{diffMode.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">最大レバレッジ:</span>
                    <span className="font-semibold text-gray-300">{diffMode.maxLeverage}倍</span>
                  </div>
                  {diffMode.marginCallThreshold > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">追証ライン:</span>
                      <span className="font-semibold text-orange-400">{(diffMode.marginCallThreshold * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">自己破産:</span>
                    <span className={diffMode.canGoBankrupt ? 'text-red-400 font-semibold' : 'text-gray-500'}>
                      {diffMode.canGoBankrupt ? 'あり' : 'なし'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* スタートボタン */}
          <button
            onClick={() => setGameStarted(true)}
            className="w-full py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl text-xl font-bold transition-all duration-300 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-[1.02]"
          >
            {mode.name}でスタート
          </button>

          {/* 免責事項 */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">
              ⚠️ 教育用シミュレーター｜実際の投資判断には使用しないでください
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ゲームオーバー画面
  if (isBankrupt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 text-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full text-center">
          <Skull size={120} className="mx-auto mb-6 text-red-500 animate-pulse" />
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-red-500">自己破産</h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-400">Game Over</p>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 text-base sm:text-lg">
              <div>
                <div className="text-gray-500 text-sm mb-1">初期資金</div>
                <div className="font-bold">¥{portfolio.initialCash.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">最終資産</div>
                <div className="font-bold text-red-400">¥{portfolio.equity.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">損失</div>
                <div className="font-bold text-red-400">{portfolio.pnl.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">損失率</div>
                <div className="font-bold text-red-400">{portfolio.pnlPercent.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">💡 教訓</h3>
            <ul className="space-y-2 text-sm sm:text-base text-gray-300">
              <li>• レバレッジは諸刃の剣 - 利益も損失も増幅される</li>
              <li>• 損切りは早めに - 「まだ戻るかも」は危険</li>
              <li>• リスク管理が最重要 - 全資金を投入しない</li>
              <li>• 追証は恐怖 - 期限内に対応できないと強制決済</li>
            </ul>
          </div>

          <button
            onClick={resetSimulation}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl text-lg font-bold transition-all duration-300"
          >
            最初からやり直す
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                株トレ道場
              </h1>
              <span className="hidden sm:inline-block text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-gray-400">
                {mode.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {!isRunning ? (
                <button
                  onClick={startSimulation}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold transition"
                >
                  <Play size={16} />
                  <span className="hidden sm:inline">開始</span>
                </button>
              ) : (
                <button
                  onClick={stopSimulation}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
                >
                  <Pause size={16} />
                  <span className="hidden sm:inline">停止</span>
                </button>
              )}
              <button
                onClick={resetSimulation}
                className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition hidden sm:block"
              >
                リセット
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 bg-slate-800 rounded-lg"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 追証警告バー */}
      {portfolio.borrowedAmount > 0 && (
        <div className={`px-4 sm:px-6 py-3 ${
          marginCallActive 
            ? 'bg-red-900/30 border-b-2 border-red-500 animate-pulse'
            : portfolio.marginRatio < 0.5
            ? 'bg-orange-900/30 border-b-2 border-orange-500'
            : 'bg-yellow-900/20 border-b border-yellow-700/50'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <AlertOctagon size={20} className={marginCallActive ? 'text-red-400' : 'text-yellow-400'} />
              <span className="text-sm font-semibold">
                {marginCallActive ? '🚨 追証発生中' : `⚠️ 信用取引中 - 維持率: ${(portfolio.marginRatio * 100).toFixed(1)}%`}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">借入金:</span>
              <span className="ml-2 font-semibold text-red-400">¥{portfolio.borrowedAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">メニュー</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                <X size={24} />
              </button>
            </div>
            
            {/* モバイル版ポートフォリオ */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">ポートフォリオ</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">現金</span>
                  <span className="font-semibold">¥{portfolio.cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">純資産</span>
                  <span className={`font-bold ${portfolio.equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ¥{portfolio.equity.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-gray-400">損益</span>
                  <span className={`font-bold ${portfolio.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {portfolio.pnl >= 0 ? '+' : ''}¥{portfolio.pnl.toLocaleString()}
                    <span className="text-xs ml-1">
                      ({portfolio.pnlPercent >= 0 ? '+' : ''}{portfolio.pnlPercent.toFixed(2)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* モバイル版ウォッチリスト */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">ウォッチリスト</h3>
              <div className="space-y-2">
                {watchlist.map(stock => {
                  const data = allStockData[stock.symbol];
                  const isSelected = selectedStock.symbol === stock.symbol;
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => {
                        setSelectedStock(stock);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-600 border border-amber-500'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm">{stock.symbol}</div>
                          <div className="text-xs text-gray-400">{stock.name}</div>
                        </div>
                        {data && (
                          <div className="text-right">
                            <div className="font-semibold text-sm">¥{data.price.toLocaleString()}</div>
                            <div className={`text-xs ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左サイドバー（デスクトップのみ） */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            {/* ポートフォリオ */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-400">
                <DollarSign size={16} />
                ポートフォリオ
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">現金</span>
                  <span className="font-semibold">¥{portfolio.cash.toLocaleString()}</span>
                </div>
                {portfolio.borrowedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">借入金</span>
                    <span className="font-semibold text-red-400">-¥{portfolio.borrowedAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">純資産</span>
                  <span className={`font-bold ${portfolio.equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ¥{portfolio.equity.toLocaleString()}
                  </span>
                </div>
                {portfolio.borrowedAmount > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-gray-400">維持率</span>
                    <span className={`font-bold ${
                      portfolio.marginRatio >= mode.marginCallThreshold ? 'text-emerald-400' :
                      portfolio.marginRatio >= mode.losscutThreshold ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {(portfolio.marginRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-gray-400">損益</span>
                  <span className={`font-bold ${portfolio.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {portfolio.pnl >= 0 ? '+' : ''}¥{portfolio.pnl.toLocaleString()}
                    <span className="text-xs ml-1">
                      ({portfolio.pnlPercent >= 0 ? '+' : ''}{portfolio.pnlPercent.toFixed(2)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* ウォッチリスト */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">ウォッチリスト</h3>
              <div className="space-y-2">
                {watchlist.map(stock => {
                  const data = allStockData[stock.symbol];
                  const isSelected = selectedStock.symbol === stock.symbol;
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-600 border border-amber-500'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-xs">{stock.symbol}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[100px]">{stock.name}</div>
                        </div>
                        {data && (
                          <div className="text-right">
                            <div className="font-semibold text-xs">¥{data.price.toLocaleString()}</div>
                            <div className={`text-xs ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {data.change >= 0 ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
                              {Math.abs(data.change).toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 中央カラム */}
          <div className="lg:col-span-6 space-y-4">
            {/* 銘柄情報 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{selectedStock.name}</h2>
                  <p className="text-sm text-gray-400">{selectedStock.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold">
                    ¥{currentData.price.toLocaleString()}
                  </div>
                  <div className={`text-base sm:text-lg font-semibold flex items-center justify-end gap-1 ${currentData.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentData.change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    {currentData.change >= 0 ? '+' : ''}{currentData.change.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-gray-500 mb-1">始値</div>
                  <div className="font-semibold">{currentData.open.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">高値</div>
                  <div className="font-semibold text-emerald-400">{currentData.high.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">安値</div>
                  <div className="font-semibold text-red-400">{currentData.low.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">出来高</div>
                  <div className="font-semibold">{(currentData.volume / 1000).toFixed(1)}K</div>
                </div>
              </div>
            </div>

            {/* チャート */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">リアルタイムチャート（60秒）</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={tickData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 10}} />
                  <YAxis stroke="#64748b" domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 10}} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value) => [`¥${value}`, '価格']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#10B981" fill="url(#colorPrice)" strokeWidth={2} />
                  <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 取引パネル */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-amber-400">取引実行</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-2">株数</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">レバレッジ</label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-sm"
                  >
                    {Array.from({length: mode.maxLeverage}, (_, i) => i + 1).map(lev => (
                      <option key={lev} value={lev}>{lev}倍</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">取引金額</label>
                  <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-300 text-sm flex items-center h-[42px]">
                    ¥{(currentData.price * tradeAmount).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={buyStock}
                  disabled={!isRunning}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold transition text-sm sm:text-base"
                >
                  買い注文
                </button>
                <button
                  onClick={sellStock}
                  disabled={!isRunning}
                  className="py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold transition text-sm sm:text-base"
                >
                  売り注文
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-xs sm:text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">保有株数</span>
                  <span className="font-semibold">{currentHolding}株</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">保有評価額</span>
                  <span className="font-semibold">¥{holdingValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右サイドバー */}
          <div className="lg:col-span-3 space-y-4">
            {/* ニュースフィード */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-400">
                <Globe size={16} />
                ニュース速報
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {newsHistory.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    市場を開始するとニュースが配信されます
                  </p>
                ) : (
                  newsHistory.map(news => (
                    <div
                      key={news.id}
                      className={`p-3 rounded-lg border-l-2 ${
                        news.category === 'macro' ? 'bg-blue-900/20 border-blue-500' :
                        news.category === 'geopolitical' ? 'bg-purple-900/20 border-purple-500' :
                        news.category === 'disaster' ? 'bg-orange-900/20 border-orange-500' :
                        news.isPositive
                          ? 'bg-emerald-900/20 border-emerald-500'
                          : 'bg-red-900/20 border-red-500'
                      } ${news.isCritical ? 'animate-pulse' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {news.isPositive ? (
                          <CheckCircle size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed break-words">{news.text}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">{news.time}</span>
                            <span className={`text-xs font-semibold ${news.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {news.impact > 0 ? '+' : ''}{news.impact.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
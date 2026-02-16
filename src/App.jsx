import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Bell, Play, Pause, Zap, AlertTriangle, CheckCircle, Volume2, BarChart3, Skull, AlertOctagon } from 'lucide-react';

// ニュースイベントタイプ
const NEWS_EVENTS = {
  EARNINGS_BEAT: { text: '{company}、決算好調で株価急騰', impact: [2, 5], prob: 0.05 },
  TECH_BREAKTHROUGH: { text: '{company}、革新的技術を発表', impact: [1.5, 4], prob: 0.04 },
  PARTNERSHIP: { text: '{company}、大手企業と提携発表', impact: [1, 3], prob: 0.06 },
  EARNINGS_MISS: { text: '{company}、決算未達で売り優勢', impact: [-5, -2], prob: 0.05 },
  SCANDAL: { text: '{company}、不祥事が発覚', impact: [-6, -3], prob: 0.03 },
  FLASH_CRASH: { text: '⚡ フラッシュクラッシュ発生！{company}暴落', impact: [-15, -8], prob: 0.01 },
  MARKET_CRASH: { text: '🔴 市場全体が大暴落、パニック売り続出', impact: [-10, -5], prob: 0.02 },
  ANALYST_UPGRADE: { text: 'アナリストが{company}を格上げ', impact: [0.5, 2], prob: 0.08 },
  ANALYST_DOWNGRADE: { text: 'アナリストが{company}を格下げ', impact: [-3, -1], prob: 0.07 },
  MARKET_RALLY: { text: '市場全体が上昇、{company}も追随', impact: [0.3, 1.5], prob: 0.1 },
  PRODUCT_RECALL: { text: '{company}、製品リコールを発表', impact: [-4, -1.5], prob: 0.02 },
  CEO_STATEMENT: { text: '{company}CEO、強気の見通し示す', impact: [0.5, 2], prob: 0.05 }
};

// 銘柄データ
const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 180, volatility: 0.8 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 250, volatility: 2.5 },
  { symbol: 'MSFT', name: 'Microsoft', basePrice: 380, volatility: 0.7 },
  { symbol: 'GOOGL', name: 'Alphabet', basePrice: 140, volatility: 0.9 },
  { symbol: '7203.T', name: 'トヨタ自動車', basePrice: 2800, volatility: 1.2 },
  { symbol: 'NVDA', name: 'NVIDIA', basePrice: 480, volatility: 2.0 }
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
    color: 'text-green-400'
  },
  NORMAL: {
    name: 'ノーマルモード',
    description: 'レバレッジ3倍、追証あり',
    maxLeverage: 3,
    marginCallThreshold: 0.3, // 維持率30%で追証
    losscutThreshold: 0.2, // 維持率20%でロスカット
    canGoBankrupt: false,
    color: 'text-blue-400'
  },
  HARD: {
    name: 'ハードモード',
    description: 'レバレッジ5倍、自己破産あり',
    maxLeverage: 5,
    marginCallThreshold: 0.35,
    losscutThreshold: 0.25,
    canGoBankrupt: true,
    color: 'text-orange-400'
  },
  EXTREME: {
    name: 'エクストリームモード',
    description: 'レバレッジ10倍、即破産',
    maxLeverage: 10,
    marginCallThreshold: 0.4,
    losscutThreshold: 0.3,
    canGoBankrupt: true,
    color: 'text-red-400'
  }
};

// リアルタイム株価エンジン
class RealtimeStockEngine {
  constructor(stock) {
    this.stock = stock;
    this.currentPrice = stock.basePrice;
    this.priceHistory = [];
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
    this.priceHistory = [];
    this.tickData = [];
    this.volume = 0;
    this.high = this.stock.basePrice;
    this.low = this.stock.basePrice;
    this.open = this.stock.basePrice;
  }
}

export default function UltraRealisticStockSimulator() {
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
    maintenanceMargin: 0,
    marginRatio: 1.0,
    pnl: 0,
    pnlPercent: 0
  });
  const [watchlist, setWatchlist] = useState([STOCKS[0], STOCKS[1], STOCKS[4]]);
  const [allStockData, setAllStockData] = useState({});
  const [tradeAmount, setTradeAmount] = useState(100);
  const [leverage, setLeverage] = useState(1);
  const [marginCallActive, setMarginCallActive] = useState(false);
  const [marginCallDeadline, setMarginCallDeadline] = useState(null);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [lossCutTriggered, setLossCutTriggered] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const engineRef = useRef(null);
  const enginesRef = useRef({});
  const intervalRef = useRef(null);
  const newsIntervalRef = useRef(null);
  const marginCallTimerRef = useRef(null);

  useEffect(() => {
    STOCKS.forEach(stock => {
      enginesRef.current[stock.symbol] = new RealtimeStockEngine(stock);
    });
    
    engineRef.current = enginesRef.current[selectedStock.symbol];
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (newsIntervalRef.current) clearInterval(newsIntervalRef.current);
      if (marginCallTimerRef.current) clearTimeout(marginCallTimerRef.current);
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
    
    // 維持率計算
    let marginRatio = 1.0;
    if (portfolio.borrowedAmount > 0) {
      marginRatio = equity / portfolio.borrowedAmount;
    }
    
    const mode = DIFFICULTY_MODES[difficulty];
    
    // 追証チェック
    if (mode.marginCallThreshold > 0 && marginRatio < mode.marginCallThreshold && !marginCallActive && !lossCutTriggered) {
      triggerMarginCall();
    }
    
    // ロスカットチェック
    if (mode.losscutThreshold > 0 && marginRatio < mode.lossCutThreshold && !lossCutTriggered) {
      triggerLossCut();
    }
    
    // 自己破産チェック
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
    const deadline = Date.now() + 180000; // 3分
    setMarginCallDeadline(deadline);
    
    addNotification('🚨 追証（マージンコール）発生！3分以内に対応してください', 'critical');
    playAlertSound();
    
    // 3分後にロスカット
    marginCallTimerRef.current = setTimeout(() => {
      if (marginCallActive) {
        triggerLossCut();
      }
    }, 180000);
  };

  const triggerLossCut = () => {
    setLossCutTriggered(true);
    setMarginCallActive(false);
    
    // 全ポジション強制決済
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
    playAlertSound();
    
    // ロスカット後に破産チェック
    if (DIFFICULTY_MODES[difficulty].canGoBankrupt && finalEquity <= 0) {
      setTimeout(() => triggerBankruptcy(), 2000);
    }
  };

  const triggerBankruptcy = () => {
    setIsBankrupt(true);
    stopSimulation();
    addNotification('💀 自己破産しました。ゲームオーバー', 'critical');
    playAlertSound();
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
          isCritical: Math.abs(impact) > 5
        };
        
        setNewsHistory(prev => [newsItem, ...prev.slice(0, 19)]);
        
        enginesRef.current[randomStock.symbol].applyNewsImpact(impact);
        
        if (newsItem.isCritical) {
          addNotification(`⚠️ 重大ニュース: ${newsText}`, 'warning');
          playAlertSound();
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
    setMarginCallDeadline(null);
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
      maintenanceMargin: 0,
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
      
      // 借入金がある場合は優先返済
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
      
      // 追証解除チェック
      if (marginCallActive) {
        setTimeout(() => {
          const equity = (portfolio.cash + revenue) - newBorrowed;
          const newMarginRatio = newBorrowed > 0 ? equity / newBorrowed : 1.0;
          if (newMarginRatio >= DIFFICULTY_MODES[difficulty].marginCallThreshold) {
            setMarginCallActive(false);
            setMarginCallDeadline(null);
            if (marginCallTimerRef.current) clearTimeout(marginCallTimerRef.current);
            addNotification('✅ 追証解除されました', 'success');
          }
        }, 100);
      }
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

  const playAlertSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltrzxHMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXyy3krBSF1xe/glEIKE1yw6+6qWBUIQ5zd8sFuJActhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPX88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYebL/u5Z5LDQ5Uq+Tvs2EaBDuS1vPKdiwFJ3vK8dyOPgkWYbbq6qVSEwtJouDyvGgfBjOJ1PLRgDEGHmy/7uWeS9FvC6RVtqXXZmEaC0aZ3PLBbiQHLYTP89WFNgYcat7u5pxKDg5TquTvs2AbBjyT1/PKdisGJnvK8dyOPgkWYbbq6qVSEwtJouDyvGgfBjOJ1PLRgDEGHmy/7uWeS9FvC6RVtqXXZmEaC0aZ3PLBbiQHLYTP89WFNgYcat7u5pxKDg5TquTvs2AbBjyT1/PKdisGJnvK8dyOPgkWYbbq6qVSEwtJouDyvGgfBjOJ1PLRgDEGHmy/7uWeS9FvC6RVtqXXZmEaC0aZ3PLBbiQHLYTP89WFNgYcat7u5pxKDg5TquTvs2AbBjyT1/PKdisGJnvK8dyOPgkWYbbq6qVSEwtJouDyvGgfBjOJ1PLRgDEGHmy/7uWeS9FvC6RVtqXXZmEaC0aZ3PLBbiQHLYTP89WFNgYcat7u5pxKDg5TquTvs2AbBjyT1/PKdisGJnvK8dyOPgkWYbbq6qVSEwtJouDyvGgfBjOJ1PLRgDEGHmy/7uWeS9FvC6RVtqXXZmEaC0aZ3PLBbiQHLYTP89WFNgYcat7u5pxKDg5TquTvs2AbBjyT1/PKdisGJnvK8dyOPgkWYbbq6qVSEwtJouDyvGgfBjOJ1PLRgA==');
      audio.play();
    } catch (e) {}
  };

  const currentHolding = portfolio.holdings[selectedStock.symbol] || 0;
  const holdingValue = currentHolding * currentData.price;
  const mode = DIFFICULTY_MODES[difficulty];

  // 難易度選択画面
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              株トレ道場
            </h1>
        
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(DIFFICULTY_MODES).map(([key, mode]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                className={`p-6 rounded-lg border-2 transition ${
                  difficulty === key
                    ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className={`text-2xl font-bold mb-2 ${mode.color}`}>{mode.name}</div>
                <div className="text-sm text-gray-400 mb-4">{mode.description}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">最大レバレッジ:</span>
                    <span className="font-semibold">{mode.maxLeverage}倍</span>
                  </div>
                  {mode.marginCallThreshold > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">追証ライン:</span>
                      <span className="font-semibold">{(mode.marginCallThreshold * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {mode.lossCutThreshold > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ロスカット:</span>
                      <span className="font-semibold">{(mode.lossCutThreshold * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">自己破産:</span>
                    <span className={mode.canGoBankrupt ? 'text-red-400 font-semibold' : 'text-gray-500'}>
                      {mode.canGoBankrupt ? 'あり' : 'なし'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-xl font-bold transition"
          >
            {DIFFICULTY_MODES[difficulty].name}でスタート
          </button>

          <div className="mt-8 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ 警告</h3>
            <p className="text-sm text-gray-300">
              このシミュレーターは信用取引のリスクを学習するための教育ツールです。
              レバレッジ取引は大きな利益を得られる可能性がある一方、大きな損失を被るリスクもあります。
              実際の投資では慎重に判断してください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ゲームオーバー画面
  if (isBankrupt) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <Skull size={120} className="mx-auto mb-6 text-red-500 animate-pulse" />
          <h1 className="text-5xl font-bold mb-4 text-red-500">自己破産</h1>
          <p className="text-2xl mb-8 text-gray-400">Game Over</p>

          <div className="bg-gray-800 rounded-lg p-8 mb-8">
            <div className="grid grid-cols-2 gap-6 text-lg">
              <div>
                <div className="text-gray-500">初期資金</div>
                <div className="font-bold">¥{portfolio.initialCash.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">最終資産</div>
                <div className="font-bold text-red-400">¥{portfolio.equity.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">損失</div>
                <div className="font-bold text-red-400">{portfolio.pnl.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">損失率</div>
                <div className="font-bold text-red-400">{portfolio.pnlPercent.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold mb-4">💡 教訓</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• レバレッジは諸刃の剣 - 利益も損失も増幅される</li>
              <li>• 損切りは早めに - 「まだ戻るかも」は危険</li>
              <li>• リスク管理が最重要 - 全資金を投入しない</li>
              <li>• 追証は恐怖 - 期限内に対応できないと強制決済</li>
              <li>• 感情的にならず冷静な判断を</li>
            </ul>
          </div>

          <button
            onClick={resetSimulation}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold transition"
          >
            最初からやり直す
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* 危険度表示バー */}
        {portfolio.borrowedAmount > 0 && (
          <div className={`mb-4 p-4 rounded-lg border-2 ${
            marginCallActive 
              ? 'bg-red-900 bg-opacity-30 border-red-500 animate-pulse'
              : portfolio.marginRatio < 0.5
              ? 'bg-orange-900 bg-opacity-30 border-orange-500'
              : 'bg-yellow-900 bg-opacity-30 border-yellow-500'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertOctagon size={24} className={marginCallActive ? 'text-red-400' : 'text-yellow-400'} />
                <div>
                  <div className="font-bold">
                    {marginCallActive ? '🚨 追証発生中！' : `⚠️ 信用取引中（維持率: ${(portfolio.marginRatio * 100).toFixed(1)}%）`}
                  </div>
                  {marginCallActive && marginCallDeadline && (
                    <div className="text-sm text-gray-300">
                      残り時間: {Math.max(0, Math.floor((marginCallDeadline - Date.now()) / 1000))}秒
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">借入金</div>
                <div className="text-xl font-bold text-red-400">¥{portfolio.borrowedAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* ヘッダー */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              株トレ道場
            </h1>
            <p className="text-gray-400">
              {mode.name} | レバレッジ最大{mode.maxLeverage}倍
              {mode.canGoBankrupt && <span className="text-red-400 ml-2">⚠️ 自己破産あり</span>}
            </p>
          </div>
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                <Play size={20} />
                市場開始
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                <Pause size={20} />
                市場停止
              </button>
            )}
            <button
              onClick={resetSimulation}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
            >
              リセット
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* 左カラム */}
          <div className="col-span-3 space-y-4">
            {/* ポートフォリオ */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign size={20} className="text-green-400" />
                ポートフォリオ
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">現金</span>
                  <span className="font-semibold">¥{portfolio.cash.toLocaleString()}</span>
                </div>
                {portfolio.borrowedAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">借入金</span>
                    <span className="font-semibold text-red-400">-¥{portfolio.borrowedAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">純資産</span>
                  <span className={`font-bold ${portfolio.equity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ¥{portfolio.equity.toLocaleString()}
                  </span>
                </div>
                {portfolio.borrowedAmount > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-sm text-gray-400">維持率</span>
                    <span className={`font-bold ${
                      portfolio.marginRatio >= mode.marginCallThreshold ? 'text-green-400' :
                      portfolio.marginRatio >= mode.lossCutThreshold ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {(portfolio.marginRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-sm text-gray-400">損益</span>
                  <span className={`font-bold ${portfolio.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.pnl >= 0 ? '+' : ''}¥{portfolio.pnl.toLocaleString()}
                    <span className="text-sm ml-1">
                      ({portfolio.pnlPercent >= 0 ? '+' : ''}{portfolio.pnlPercent.toFixed(2)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* ウォッチリスト */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">ウォッチリスト</h3>
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
                          ? 'bg-blue-600 border border-blue-500'
                          : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">{stock.symbol}</div>
                          <div className="text-xs text-gray-400">{stock.name}</div>
                        </div>
                        {data && (
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              {stock.symbol.includes('.T') ? '¥' : '$'}{data.price.toLocaleString()}
                            </div>
                            <div className={`text-xs ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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

            {/* 通知 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3">通知</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-2 rounded text-xs ${
                      notif.type === 'critical' ? 'bg-red-900 text-red-200' :
                      notif.type === 'warning' ? 'bg-orange-900 text-orange-200' :
                      notif.type === 'success' ? 'bg-green-900 text-green-200' :
                      'bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div>{notif.text}</div>
                    <div className="text-gray-500 mt-1">{notif.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 中央カラム */}
          <div className="col-span-6 space-y-4">
            {/* 銘柄情報 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStock.name}</h2>
                  <p className="text-gray-400">{selectedStock.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {selectedStock.symbol.includes('.T') ? '¥' : '$'}{currentData.price.toLocaleString()}
                  </div>
                  <div className={`text-lg font-semibold ${currentData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {currentData.change >= 0 ? <TrendingUp className="inline" size={20} /> : <TrendingDown className="inline" size={20} />}
                    {currentData.change >= 0 ? '+' : ''}{currentData.change.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-400">始値</div>
                  <div className="font-semibold">{currentData.open.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">高値</div>
                  <div className="font-semibold text-green-400">{currentData.high.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">安値</div>
                  <div className="font-semibold text-red-400">{currentData.low.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">出来高</div>
                  <div className="font-semibold">{(currentData.volume / 1000).toFixed(1)}K</div>
                </div>
              </div>
            </div>

            {/* チャート */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3">リアルタイムチャート（60秒）</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={tickData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" tick={{fontSize: 10}} />
                  <YAxis stroke="#9CA3AF" domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value) => [`¥${value}`, '価格']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 取引パネル */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">取引実行</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">株数</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">レバレッジ</label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  >
                    {Array.from({length: mode.maxLeverage}, (_, i) => i + 1).map(lev => (
                      <option key={lev} value={lev}>{lev}倍</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">取引金額</label>
                  <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-300">
                    ¥{(currentData.price * tradeAmount).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={buyStock}
                  disabled={!isRunning || lossCutTriggered}
                  className="py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                >
                  買い注文
                </button>
                <button
                  onClick={sellStock}
                  disabled={!isRunning || lossCutTriggered}
                  className="py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                >
                  売り注文
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 text-sm">
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

          {/* 右カラム */}
          <div className="col-span-3 space-y-4">
            {/* 板情報 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 size={16} />
                板情報
              </h3>
              <div className="space-y-1">
                <div className="text-xs text-gray-400 mb-1">売り</div>
                {orderBook.asks.slice(0, 5).reverse().map((order, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-red-900 bg-opacity-20 p-1 rounded">
                    <span className="text-red-400">{order.price.toFixed(2)}</span>
                    <span className="text-gray-400">{order.size}</span>
                  </div>
                ))}
                <div className="flex justify-center py-2 border-y border-gray-600">
                  <span className="text-lg font-bold text-yellow-400">
                    {currentData.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">買い</div>
                {orderBook.bids.slice(0, 5).map((order, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-green-900 bg-opacity-20 p-1 rounded">
                    <span className="text-green-400">{order.price.toFixed(2)}</span>
                    <span className="text-gray-400">{order.size}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ニュースフィード */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Volume2 size={16} className="text-blue-400" />
                ニュース速報
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {newsHistory.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    市場を開始するとニュースが配信されます
                  </p>
                ) : (
                  newsHistory.map(news => (
                    <div
                      key={news.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        news.isPositive
                          ? 'bg-green-900 bg-opacity-20 border-green-500'
                          : 'bg-red-900 bg-opacity-20 border-red-500'
                      } ${news.isCritical ? 'animate-pulse' : ''}`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {news.isPositive ? (
                          <CheckCircle size={14} className="text-green-400 mt-0.5" />
                        ) : (
                          <AlertTriangle size={14} className="text-red-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs leading-relaxed">{news.text}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">{news.time}</span>
                            <span className={`text-xs font-semibold ${news.isPositive ? 'text-green-400' : 'text-red-400'}`}>
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

        {/* 免責事項 */}
        <div className="mt-6 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
          <h3 className="text-yellow-400 font-semibold mb-2">⚠️ 教育用シミュレーター</h3>
          <p className="text-sm text-gray-300">
            これは信用取引のリスクを学ぶための教育ツールです。レバレッジ取引は高リスクであり、
            実際の投資では資金を失う可能性があります。十分に理解した上で、慎重に判断してください。
          </p>
        </div>
      </div>
    </div>
  );
}
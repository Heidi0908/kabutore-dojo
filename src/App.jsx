import { useState, useEffect, useRef } from 'react';
import { STOCKS, SECTORS, DIFFICULTY_MODES } from './engine/data';
import { Market } from './engine/market';
import { createPortfolio, summarize, buy, sell, liquidateAll } from './engine/portfolio';
import { Toasts } from './components/parts';
import { MobileLayout, DesktopLayout, useIsDesktop } from './components/layouts';
import { StartScreen, BankruptScreen } from './components/screens';

const NEWS_DELAY = [6000, 15000]; // ニュースが出る間隔（ミリ秒）

export default function KabutoredojoSimulator() {
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(STOCKS[0].symbol);
  const [isRunning, setIsRunning] = useState(false);
  const [, setFrame] = useState(0); // 株価が動いたら画面を描き直すための合図
  const [news, setNews] = useState([]);
  const [portfolio, setPortfolio] = useState(createPortfolio);
  const [tradeAmount, setTradeAmount] = useState(100);
  const [leverage, setLeverage] = useState(1);
  const [marginCallActive, setMarginCallActive] = useState(false);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [toasts, setToasts] = useState([]);
  const isDesktop = useIsDesktop();

  const marketRef = useRef(null);
  if (!marketRef.current) marketRef.current = new Market();
  const market = marketRef.current;

  // 最新の資産状態（タイマーの中や連打時でも最新を使うため）
  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;
  const commitPortfolio = (next) => {
    portfolioRef.current = next;
    setPortfolio(next);
  };

  const tickTimerRef = useRef(null);
  const newsTimerRef = useRef(null);
  const latestTickRef = useRef(null);
  const latestNewsRef = useRef(null);
  const toastIdRef = useRef(0);

  const mode = DIFFICULTY_MODES[difficulty];
  const selectedStock = STOCKS.find((s) => s.symbol === selectedSymbol);
  const prices = market.prices();
  const summary = summarize(portfolio, prices);

  useEffect(() => () => {
    clearInterval(tickTimerRef.current);
    clearTimeout(newsTimerRef.current);
  }, []);

  const notify = (text, type = 'info') => {
    toastIdRef.current += 1;
    const toast = { id: toastIdRef.current, text, type };
    setToasts((prev) => [...prev.slice(-2), toast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), type === 'critical' ? 6000 : 3500);
  };

  // ---------- 1秒ごとの処理 ----------
  latestTickRef.current = () => {
    market.tick();
    const nowPrices = market.prices();
    const p = portfolioRef.current;
    const s = summarize(p, nowPrices);

    if (p.borrowedAmount > 0 && mode.losscutThreshold > 0 && s.marginRatio < mode.losscutThreshold) {
      // ロスカット：全部強制売却
      const next = liquidateAll(p, nowPrices, mode, STOCKS);
      const after = summarize(next, nowPrices);
      setMarginCallActive(false);
      notify(`⚡ ロスカット発動！維持率が${(mode.losscutThreshold * 100).toFixed(0)}%を下回り、全ての株が強制的に売却されました`, 'critical');
      if (after.equity <= 0) {
        if (mode.canGoBankrupt) {
          commitPortfolio(next);
          goBankrupt();
          return;
        }
        commitPortfolio({ ...next, cash: 0 });
        notify('資産がなくなりました。リセットしてやり直してください', 'critical');
      } else {
        commitPortfolio(next);
      }
    } else if (p.borrowedAmount > 0 && mode.marginCallThreshold > 0 && s.marginRatio < mode.marginCallThreshold) {
      if (!marginCallActive) {
        setMarginCallActive(true);
        notify(`🚨 追証発生！維持率が${(mode.marginCallThreshold * 100).toFixed(0)}%を下回りました。株を売って借金を減らさないとロスカットされます`, 'critical');
      }
    } else if (marginCallActive) {
      setMarginCallActive(false);
      notify('追証が解消されました', 'success');
    }

    if (mode.canGoBankrupt && summarize(portfolioRef.current, nowPrices).equity <= 0) {
      goBankrupt();
      return;
    }
    setFrame((f) => f + 1);
  };

  // ---------- ニュース ----------
  latestNewsRef.current = () => {
    const item = market.generateNews(mode.newsStrength);
    toastIdRef.current += 1;
    setNews((prev) => [{ ...item, id: toastIdRef.current }, ...prev].slice(0, 30));

    const heldHit = item.affected.filter((sym) => portfolioRef.current.holdings[sym]);
    if (item.isCritical) {
      notify(`⚠️ 重大ニュース：${item.text}`, 'warning');
    } else if (heldHit.length > 0 && Math.abs(item.impact) >= 1.5) {
      notify(`📰 保有株に関係するニュース：${item.text}`, item.isPositive ? 'success' : 'warning');
    }
  };

  const scheduleNews = () => {
    const delay = NEWS_DELAY[0] + Math.random() * (NEWS_DELAY[1] - NEWS_DELAY[0]);
    newsTimerRef.current = setTimeout(() => {
      latestNewsRef.current?.();
      scheduleNews();
    }, delay);
  };

  // ---------- 操作 ----------
  const startSimulation = () => {
    if (isBankrupt || isRunning) return;
    setIsRunning(true);
    tickTimerRef.current = setInterval(() => latestTickRef.current?.(), 1000);
    scheduleNews();
  };

  const stopSimulation = () => {
    setIsRunning(false);
    clearInterval(tickTimerRef.current);
    clearTimeout(newsTimerRef.current);
  };

  const resetSimulation = () => {
    stopSimulation();
    market.reset();
    commitPortfolio(createPortfolio());
    setNews([]);
    setMarginCallActive(false);
    setIsBankrupt(false);
    setToasts([]);
    setLeverage(1);
    setFrame((f) => f + 1);
  };

  const goBankrupt = () => {
    stopSimulation();
    setIsBankrupt(true);
  };

  const backToStart = () => {
    resetSimulation();
    setGameStarted(false);
  };

  const buyStock = () => {
    const result = buy(portfolioRef.current, {
      stock: selectedStock, price: market.price(selectedSymbol), shares: tradeAmount, leverage, mode, prices: market.prices(),
    });
    if (result.error) return notify(result.error, 'error');
    commitPortfolio(result.portfolio);
    notify(result.message, 'success');
  };

  const sellStock = () => {
    const result = sell(portfolioRef.current, {
      stock: selectedStock, price: market.price(selectedSymbol), shares: tradeAmount, mode,
    });
    if (result.error) return notify(result.error, 'error');
    commitPortfolio(result.portfolio);
    notify(result.message, 'success');
  };

  // ---------- 画面 ----------
  if (!gameStarted) {
    return <StartScreen difficulty={difficulty} setDifficulty={setDifficulty} onStart={() => { resetSimulation(); setGameStarted(true); }} />;
  }

  if (isBankrupt) {
    return <BankruptScreen portfolio={portfolio} summary={summary} onRestart={backToStart} />;
  }

  const quotes = Object.fromEntries(STOCKS.map((s) => [s.symbol, market.quote(s.symbol)]));

  // スマホとPCで共通に渡すデータと操作
  const layoutProps = {
    mode,
    stocks: STOCKS,
    sectors: SECTORS,
    selectedStock,
    setSelectedStock: (stock) => setSelectedSymbol(stock.symbol),
    quote: quotes[selectedSymbol],
    quotes,
    // チャートが変化に気づけるよう、毎回コピーを渡す
    history: [...market.stocks[selectedSymbol].history],
    index: market.indexQuote(),
    portfolio,
    summary,
    marginCallActive,
    news,
    newsCount: news.length,
    isRunning,
    onStart: startSimulation,
    onStop: stopSimulation,
    onReset: resetSimulation,
    onChangeMode: backToStart,
    trade: {
      price: quotes[selectedSymbol].price,
      tradeAmount,
      setTradeAmount,
      leverage,
      setLeverage,
      mode,
      onBuy: buyStock,
      onSell: sellStock,
      isRunning,
      holding: portfolio.holdings[selectedSymbol],
    },
  };

  return (
    <>
      <Toasts toasts={toasts} />
      {isDesktop ? <DesktopLayout {...layoutProps} /> : <MobileLayout {...layoutProps} />}
    </>
  );
}

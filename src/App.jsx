import { useState, useEffect, useRef } from 'react';
import { STOCKS, SECTORS, DIFFICULTY_MODES } from './engine/data';
import { Market } from './engine/market';
import { createPortfolio, summarize, buy, sell, liquidateAll } from './engine/portfolio';
import { loadProgress, saveProgress, checkAchievements, applyAchievements } from './engine/progress';
import { loadSettings, saveSettings } from './engine/settings';
import { TUTORIAL_STEPS, TUTORIAL_STOCK, TUTORIAL_NEWS } from './content/tutorial';
import { Toasts } from './components/parts';
import { MobileLayout, DesktopLayout, useIsDesktop } from './components/layouts';
import { StartScreen, BankruptScreen } from './components/screens';
import { TutorialOverlay } from './components/tutorial';
import { DojoRecord, BigPop } from './components/game';

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
  const [mobileTab, setMobileTabState] = useState('chart');
  const [progress, setProgress] = useState(loadProgress); // 段位・実績（ブラウザに保存）
  const [recordOpen, setRecordOpen] = useState(false);
  const [bigPop, setBigPop] = useState(null);
  const [settings, setSettings] = useState(loadSettings); // 表示の設定（演出オン・オフ）
  const effects = settings.effects;
  const toggleEffects = () => {
    const next = { ...settings, effects: !settings.effects };
    setSettings(next);
    saveSettings(next);
  };
  // チュートリアル：null なら通常プレイ
  const [tutorial, setTutorial] = useState(null); // { step, stepStartedAt, newsShown, note }
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
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const tickTimerRef = useRef(null);
  const newsTimerRef = useRef(null);
  const latestTickRef = useRef(null);
  const latestNewsRef = useRef(null);
  const toastIdRef = useRef(0);

  const tutorialActive = tutorial !== null;
  const mode = DIFFICULTY_MODES[tutorialActive ? 'SAFE' : difficulty];
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
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), type === 'critical' || type === 'achievement' ? 5000 : 3500);
  };

  const showPop = (text, color, sub) => {
    if (!effects) return; // 演出オフなら出さない
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setBigPop({ id, text, color, sub });
    setTimeout(() => setBigPop((p) => (p?.id === id ? null : p)), 1600);
  };

  // ---------- 実績 ----------
  const award = (event, extra = {}) => {
    const p = extra.portfolio ?? portfolioRef.current;
    const ids = checkAchievements(event, {
      ...extra, portfolio: p, summary: summarize(p, market.prices()), mode, stocks: STOCKS, difficulty: tutorialActive ? 'SAFE' : difficulty,
    });
    const result = applyAchievements(progressRef.current, ids);
    if (result.fresh.length === 0) return;
    progressRef.current = result.progress;
    setProgress(result.progress);
    saveProgress(result.progress);
    result.fresh.forEach((a) => notify(`🏅 実績「${a.title}」を達成 +${a.xp} XP`, effects ? 'achievement' : 'success'));
    if (result.rankUp) {
      if (effects) setTimeout(() => showPop(`🥋 ${result.rankUp.name}`, 'text-amber-300', '昇段しました'), 400);
      else notify(`🥋 ${result.rankUp.name}に昇段しました`, 'success');
    }
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
      showPop('ロスカット', 'text-red-400', '全ての株が強制売却されました');
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
      award('marginRecovered');
    }

    if (mode.canGoBankrupt && summarize(portfolioRef.current, nowPrices).equity <= 0) {
      goBankrupt();
      return;
    }
    award('tick');
    setFrame((f) => f + 1);
  };

  // ---------- ニュース ----------
  const publishNews = (item) => {
    toastIdRef.current += 1;
    setNews((prev) => [{ ...item, id: toastIdRef.current }, ...prev].slice(0, 30));
    return item;
  };

  latestNewsRef.current = () => {
    if (tutorialActive) return; // チュートリアル中は決まったニュースだけ
    const item = publishNews(market.generateNews(mode.newsStrength));
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
    setTradeAmount(100);
    setMobileTabState('chart');
    setFrame((f) => f + 1);
  };

  const goBankrupt = () => {
    stopSimulation();
    setIsBankrupt(true);
  };

  const backToStart = () => {
    resetSimulation();
    setTutorial(null);
    setGameStarted(false);
  };

  const startGame = () => {
    resetSimulation();
    setTutorial(null);
    setGameStarted(true);
  };

  const startTutorial = () => {
    resetSimulation();
    setSelectedSymbol(TUTORIAL_STOCK);
    setTutorial({ step: 0, stepStartedAt: Date.now(), newsShown: false, note: null });
    setGameStarted(true);
  };

  const buyStock = () => {
    const result = buy(portfolioRef.current, {
      stock: selectedStock, price: market.price(selectedSymbol), shares: tradeAmount, leverage, mode, prices: market.prices(),
    });
    if (result.error) return notify(result.error, 'error');
    commitPortfolio(result.portfolio);
    notify(result.message, 'success');
    award('buy', { leverage, portfolio: result.portfolio, trade: result.portfolio.trades[0] });
  };

  const sellStock = () => {
    const result = sell(portfolioRef.current, {
      stock: selectedStock, price: market.price(selectedSymbol), shares: tradeAmount, mode,
    });
    if (result.error) return notify(result.error, 'error');
    commitPortfolio(result.portfolio);
    notify(result.message, 'success');
    const trade = result.portfolio.trades[0];
    const amount = `${trade.realized >= 0 ? '+' : '-'}¥${Math.abs(Math.round(trade.realized)).toLocaleString()}`;
    if (trade.realized >= 0) showPop(amount, 'text-emerald-400', '利益確定');
    else showPop(amount, 'text-red-400', '損切り');
    award('sell', { trade, portfolio: result.portfolio });
  };

  // ---------- チュートリアルの進行 ----------
  const tutorialStep = tutorialActive ? TUTORIAL_STEPS[tutorial.step] : null;
  const tutorialHolding = portfolio.holdings[TUTORIAL_STOCK];
  const tutorialGain = tutorialHolding ? (prices[TUTORIAL_STOCK] - tutorialHolding.avgCost) * tutorialHolding.shares : 0;

  const nextTutorialStep = () => {
    setTutorial((t) => (t ? { ...t, step: Math.min(t.step + 1, TUTORIAL_STEPS.length - 1), stepStartedAt: Date.now() } : t));
  };

  useEffect(() => {
    if (!tutorialStep) return;
    const elapsed = Date.now() - tutorial.stepStartedAt;
    const w = tutorialStep.waitFor;
    if (w === 'running' && isRunning) nextTutorialStep();
    if (w === 'bought' && tutorialHolding) nextTutorialStep();
    const sold = portfolio.trades.find((t) => t.side === 'sell');
    if (w === 'sold' && sold) {
      const amount = `${sold.realized >= 0 ? '+' : '-'}¥${Math.abs(Math.round(sold.realized)).toLocaleString()}`;
      setTutorial((t) => ({ ...t, note: `確定した損益：${amount}` }));
      nextTutorialStep();
    }
    if (w === 'profit') {
      if (!tutorial.newsShown && elapsed > 1500) {
        // 決まった良いニュースを出す
        const item = publishNews(market.generateNews(1, { ...TUTORIAL_NEWS, symbol: TUTORIAL_STOCK }));
        setTutorial((t) => ({ ...t, newsShown: true, note: `📰 ${item.text}（${item.impact > 0 ? '+' : ''}${item.impact.toFixed(1)}%）` }));
        setFrame((f) => f + 1);
      } else if (tutorial.newsShown && tutorialGain > 0 && elapsed > 4500) {
        setTutorial((t) => ({ ...t, note: null }));
        nextTutorialStep();
      }
    }
  });

  const finishTutorial = (choice) => {
    if (choice === 'menu') {
      backToStart(); // 先に画面を戻してから実績を出す（リセットで通知が消えないように）
      setTimeout(() => award('tutorial'), 0);
    } else {
      award('tutorial');
      setTutorial(null); // セーフモードのまま続ける
      setDifficulty('SAFE');
    }
  };

  const skipTutorial = () => {
    if (window.confirm('チュートリアルをやめて、最初の画面に戻りますか？')) backToStart();
  };

  // ---------- 画面 ----------
  const recordModal = recordOpen && <DojoRecord progress={progress} onClose={() => setRecordOpen(false)} />;

  if (!gameStarted) {
    return (
      <>
        <Toasts toasts={toasts} />
        <BigPop pop={bigPop} />
        <StartScreen
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={startGame}
          onTutorial={startTutorial}
          progress={progress}
          onOpenRecord={() => setRecordOpen(true)}
          effects={effects}
          onToggleEffects={toggleEffects}
        />
        {recordModal}
      </>
    );
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
    // チュートリアル中は銘柄を固定する
    setSelectedStock: (stock) => { if (!tutorialActive) setSelectedSymbol(stock.symbol); },
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
    mobileTab: tutorialActive ? 'chart' : mobileTab,
    setMobileTab: (t) => { if (!tutorialActive) setMobileTabState(t); },
    progress,
    onOpenRecord: () => setRecordOpen(true),
    tutorialActive,
    effects,
    onToggleEffects: toggleEffects,
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
      <BigPop pop={bigPop} />
      {isDesktop ? <DesktopLayout {...layoutProps} /> : <MobileLayout {...layoutProps} />}
      {tutorialStep && (
        <TutorialOverlay
          step={tutorialStep}
          index={tutorial.step}
          total={TUTORIAL_STEPS.length}
          note={tutorial.note}
          onNext={nextTutorialStep}
          onSkip={skipTutorial}
          onFinish={finishTutorial}
          isDesktop={isDesktop}
        />
      )}
      {recordModal}
    </>
  );
}

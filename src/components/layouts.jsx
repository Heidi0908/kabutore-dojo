import { useEffect, useState } from 'react';
import {
  Play, Pause, RotateCcw, LineChart, List, Newspaper, Wallet, Globe, DollarSign, Briefcase, History, Search, Settings2,
} from 'lucide-react';
import {
  Card, PortfolioSummary, HoldingsList, TradeHistory, StockBrowser, StockHeader, PriceChart, TradePanel, NewsFeed,
  MarginBar, IndexTicker, yen, signedYen, signed, upDown,
} from './parts';

// 画面幅が1024px以上ならPC用レイアウトを使う
export function useIsDesktop() {
  const query = '(min-width: 1024px)';
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

function RunButton({ isRunning, onStart, onStop, large }) {
  const size = large ? 'px-5 py-2.5 text-base' : 'px-4 py-2 text-sm';
  return isRunning ? (
    <button onClick={onStop} className={`flex items-center gap-2 ${size} bg-red-600 hover:bg-red-700 rounded-xl font-bold transition`}>
      <Pause size={18} />停止
    </button>
  ) : (
    <button onClick={onStart} className={`flex items-center gap-2 ${size} bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition`}>
      <Play size={18} />開始
    </button>
  );
}

function confirmReset(onReset) {
  if (window.confirm('最初からやり直しますか？（資産と保有株がリセットされます）')) onReset();
}

function confirmChangeMode(onChangeMode) {
  if (window.confirm('難易度を選び直しますか？（今のゲームはリセットされます）')) onChangeMode();
}

// ================= スマホ・タブレット用 =================

const TABS = [
  { key: 'chart', label: 'チャート', icon: LineChart },
  { key: 'stocks', label: '銘柄', icon: List },
  { key: 'news', label: 'ニュース', icon: Newspaper },
  { key: 'assets', label: '資産', icon: Wallet },
];

export function MobileLayout(g) {
  const [tab, setTab] = useState('chart');
  const [seenNews, setSeenNews] = useState(0);
  const unread = tab === 'news' ? 0 : Math.max(0, g.newsCount - seenNews);

  useEffect(() => {
    if (tab === 'news') setSeenNews(g.newsCount);
  }, [tab, g.newsCount]);
  useEffect(() => {
    if (g.newsCount === 0) setSeenNews(0);
  }, [g.newsCount]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  const selectStock = (stock) => {
    g.setSelectedStock(stock);
    setTab('chart');
  };

  // チャート画面の上に出す銘柄：保有中の銘柄＋今見ている銘柄
  const quickSymbols = [...new Set([g.selectedStock.symbol, ...Object.keys(g.portfolio.holdings)])];
  const quickStocks = quickSymbols.map((sym) => g.stocks.find((s) => s.symbol === sym));

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex justify-between items-center px-4 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent flex-shrink-0">株トレ道場</h1>
            <span className="text-[11px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-gray-400 truncate">
              {g.mode.icon} {g.mode.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => confirmReset(g.onReset)} aria-label="リセット" className="p-2.5 bg-slate-800 rounded-xl text-gray-300">
              <RotateCcw size={18} />
            </button>
            <RunButton isRunning={g.isRunning} onStart={g.onStart} onStop={g.onStop} />
          </div>
        </div>
        <button onClick={() => setTab('assets')} className="w-full flex justify-between items-center px-4 pb-2 text-left tabular-nums">
          <span className="text-xs text-gray-400">純資産 <span className="text-base font-bold text-white ml-1">{yen(g.summary.equity)}</span></span>
          <span className={`text-sm font-bold ${upDown(g.summary.pnl)}`}>
            {signedYen(g.summary.pnl)}（{signed(g.summary.pnlPercent)}%）
          </span>
        </button>
        <MarginBar portfolio={g.portfolio} summary={g.summary} marginCallActive={g.marginCallActive} />
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {tab === 'chart' && (
          <>
            <IndexTicker index={g.index} />
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
              {quickStocks.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => g.setSelectedStock(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                    g.selectedStock.symbol === s.symbol ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-gray-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              <button
                onClick={() => setTab('stocks')}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border border-dashed border-slate-600 text-gray-400"
              >
                <Search size={14} />ほかの銘柄
              </button>
            </div>
            <Card>
              <StockHeader stock={g.selectedStock} sectorName={g.sectors[g.selectedStock.sector].name} data={g.quote} />
              <div className="mt-4 -mx-2">
                <PriceChart history={g.history} height={220} avgCost={g.trade.holding?.avgCost} />
              </div>
            </Card>
            <Card title="取引">
              <TradePanel {...g.trade} />
            </Card>
          </>
        )}

        {tab === 'stocks' && (
          <>
            <div className="flex justify-between items-baseline">
              <h2 className="text-lg font-bold">銘柄一覧</h2>
              <IndexTicker index={g.index} />
            </div>
            <StockBrowser
              stocks={g.stocks}
              sectors={g.sectors}
              quotes={g.quotes}
              holdings={g.portfolio.holdings}
              selectedSymbol={g.selectedStock.symbol}
              onSelect={selectStock}
            />
          </>
        )}

        {tab === 'news' && (
          <>
            <h2 className="text-lg font-bold">ニュース速報</h2>
            <NewsFeed news={g.news} holdings={g.portfolio.holdings} />
          </>
        )}

        {tab === 'assets' && (
          <>
            <Card title="資産" icon={DollarSign}>
              <PortfolioSummary portfolio={g.portfolio} summary={g.summary} mode={g.mode} />
            </Card>
            <Card title="保有株" icon={Briefcase}>
              <HoldingsList portfolio={g.portfolio} quotes={g.quotes} stocks={g.stocks} onSelect={selectStock} />
            </Card>
            <Card title="取引履歴" icon={History}>
              <TradeHistory trades={g.portfolio.trades} />
            </Card>
            <button
              onClick={() => confirmChangeMode(g.onChangeMode)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-sm text-gray-400"
            >
              <Settings2 size={16} />難易度を選び直す
            </button>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 max-w-2xl mx-auto">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${active ? 'text-amber-400' : 'text-gray-500'}`}
              >
                <Icon size={22} />
                {label}
                {key === 'news' && unread > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px]">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ================= PC用 =================

export function DesktopLayout(g) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16 gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">株トレ道場</h1>
            <button
              onClick={() => confirmChangeMode(g.onChangeMode)}
              title="難易度を選び直す"
              className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-gray-400 hover:border-slate-500"
            >
              {g.mode.icon} {g.mode.name}
            </button>
            <IndexTicker index={g.index} className="ml-4" />
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right tabular-nums">
              <div className="text-xs text-gray-400">純資産</div>
              <div className="text-lg font-bold leading-tight">{yen(g.summary.equity)}</div>
            </div>
            <div className="text-right tabular-nums">
              <div className="text-xs text-gray-400">トータル損益</div>
              <div className={`text-lg font-bold leading-tight ${upDown(g.summary.pnl)}`}>{signedYen(g.summary.pnl)}</div>
            </div>
            <div className="flex items-center gap-2">
              <RunButton isRunning={g.isRunning} onStart={g.onStart} onStop={g.onStop} large />
              <button onClick={() => confirmReset(g.onReset)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition">
                <RotateCcw size={16} />リセット
              </button>
            </div>
          </div>
        </div>
        <MarginBar portfolio={g.portfolio} summary={g.summary} marginCallActive={g.marginCallActive} />
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-5">
        <aside className="col-span-3 space-y-4">
          <Card title="資産" icon={DollarSign}>
            <PortfolioSummary portfolio={g.portfolio} summary={g.summary} mode={g.mode} />
          </Card>
          <Card title="銘柄一覧" icon={List}>
            <StockBrowser
              compact
              stocks={g.stocks}
              sectors={g.sectors}
              quotes={g.quotes}
              holdings={g.portfolio.holdings}
              selectedSymbol={g.selectedStock.symbol}
              onSelect={g.setSelectedStock}
              listClassName="max-h-[520px] overflow-y-auto pr-1"
            />
          </Card>
        </aside>

        <main className="col-span-6 space-y-4">
          <Card>
            <StockHeader stock={g.selectedStock} sectorName={g.sectors[g.selectedStock.sector].name} data={g.quote} />
          </Card>
          <Card title="リアルタイムチャート（直近2分）">
            <PriceChart history={g.history} height={300} avgCost={g.trade.holding?.avgCost} />
          </Card>
          <Card title="取引">
            <TradePanel {...g.trade} />
          </Card>
        </main>

        <aside className="col-span-3 space-y-4">
          <Card title="ニュース速報" icon={Globe}>
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <NewsFeed news={g.news} holdings={g.portfolio.holdings} />
            </div>
          </Card>
          <Card title="保有株" icon={Briefcase}>
            <HoldingsList portfolio={g.portfolio} quotes={g.quotes} stocks={g.stocks} onSelect={g.setSelectedStock} />
          </Card>
          <Card title="取引履歴" icon={History}>
            <div className="max-h-[320px] overflow-y-auto pr-1">
              <TradeHistory trades={g.portfolio.trades} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

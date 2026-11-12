import { useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, AlertOctagon, Info, XCircle, Search,
} from 'lucide-react';
import { LOT_SIZE } from '../engine/data';
import { tradeFee } from '../engine/portfolio';
import { Term } from './help';

// ---------- 小さな共通部品 ----------

export const yen = (n) => `${n < 0 ? '-' : ''}¥${Math.abs(Math.round(n)).toLocaleString()}`;
export const signedYen = (n) => `${Math.round(n) > 0 ? '+' : ''}${yen(n)}`;
export const signed = (n, digits = 2) => `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`;
export const upDown = (n) => (n >= 0 ? 'text-emerald-400' : 'text-red-400');

export function Card({ title, icon: Icon, right, children, className = '' }) {
  return (
    <section className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-400">
            {Icon && <Icon size={16} />}
            {title}
          </h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function Row({ label, children, border }) {
  return (
    <div className={`flex justify-between items-baseline ${border ? 'pt-2 mt-1 border-t border-slate-800' : ''}`}>
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold tabular-nums">{children}</span>
    </div>
  );
}

// ---------- 市場指数 ----------

export function IndexTicker({ index, className = '' }) {
  return (
    <div className={`flex items-baseline gap-2 tabular-nums ${className}`}>
      <Term k="index" className="text-xs text-gray-400">道場平均</Term>
      <span className="font-bold">{index.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      <span className={`text-xs font-semibold ${upDown(index.change)}`}>{signed(index.change)}%</span>
    </div>
  );
}

// ---------- 資産 ----------

export function PortfolioSummary({ portfolio, summary, mode }) {
  const ratioColor =
    summary.marginRatio >= mode.marginCallThreshold ? 'text-emerald-400'
      : summary.marginRatio >= mode.losscutThreshold ? 'text-orange-400' : 'text-red-400';
  return (
    <div className="space-y-2 text-sm">
      <Row label={<Term k="equity">純資産</Term>}>
        <span className={`text-base font-bold ${summary.equity >= 0 ? 'text-white' : 'text-red-400'}`}>{yen(summary.equity)}</span>
      </Row>
      <Row label={<Term k="pnl">トータル損益</Term>}>
        <span className={upDown(summary.pnl)}>
          {signedYen(summary.pnl)}
          <span className="text-xs ml-1">({signed(summary.pnlPercent)}%)</span>
        </span>
      </Row>
      <Row label={<Term k="unrealized" className="pl-3">うち含み損益</Term>}><span className={upDown(summary.unrealizedPnl)}>{signedYen(summary.unrealizedPnl)}</span></Row>
      <Row label={<Term k="realized" className="pl-3">うち確定損益</Term>}><span className={upDown(portfolio.realizedPnl)}>{signedYen(portfolio.realizedPnl)}</span></Row>
      <Row label="現金" border>{yen(portfolio.cash)}</Row>
      <Row label={<Term k="holdingsValue">株の評価額</Term>}>{yen(summary.holdingsValue)}</Row>
      {portfolio.borrowedAmount > 0 && (
        <>
          <Row label={<Term k="borrowed">借入金</Term>}><span className="text-red-400">-{yen(portfolio.borrowedAmount)}</span></Row>
          <Row label={<Term k="marginRatio">維持率</Term>}><span className={ratioColor}>{(summary.marginRatio * 100).toFixed(1)}%</span></Row>
        </>
      )}
      {(mode.feeRate > 0 || mode.taxRate > 0) && (
        <div className="pt-2 mt-1 border-t border-slate-800 space-y-1 text-xs">
          {mode.feeRate > 0 && <Row label={<Term k="fee">払った手数料</Term>}>{yen(portfolio.feesPaid)}</Row>}
          {mode.taxRate > 0 && <Row label={<Term k="tax">払った税金</Term>}>{yen(portfolio.taxPaid)}</Row>}
        </div>
      )}
    </div>
  );
}

export function HoldingsList({ portfolio, quotes, stocks, onSelect }) {
  const rows = Object.entries(portfolio.holdings);
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">まだ株を持っていません</p>;
  }
  return (
    <div className="divide-y divide-slate-800">
      {rows.map(([symbol, h]) => {
        const stock = stocks.find((s) => s.symbol === symbol);
        const price = quotes[symbol].price;
        const gain = (price - h.avgCost) * h.shares;
        const gainPct = ((price - h.avgCost) / h.avgCost) * 100;
        return (
          <button key={symbol} onClick={() => onSelect(stock)} className="w-full flex justify-between items-center py-3 text-left gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{stock.name}</div>
              <div className="text-xs text-gray-500 tabular-nums">
                {h.shares.toLocaleString()}株・平均 ¥{Math.round(h.avgCost).toLocaleString()}
              </div>
            </div>
            <div className="text-right tabular-nums flex-shrink-0">
              <div className="font-semibold">{yen(h.shares * price)}</div>
              <div className={`text-xs font-semibold ${upDown(gain)}`}>{signedYen(gain)}（{signed(gainPct, 1)}%）</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function TradeHistory({ trades }) {
  if (trades.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">まだ取引していません</p>;
  }
  return (
    <div className="divide-y divide-slate-800 text-sm">
      {trades.map((t) => (
        <div key={t.id} className="py-2.5 flex justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${t.side === 'buy' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {t.side === 'buy' ? '買' : '売'}
              </span>
              <span className="font-semibold truncate">{t.name}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
              {t.time}・{t.shares.toLocaleString()}株 @¥{t.price.toLocaleString()}
              {t.fee > 0 && `・手数料¥${t.fee.toLocaleString()}`}
              {t.tax !== 0 && `・税¥${t.tax.toLocaleString()}`}
            </div>
          </div>
          <div className="text-right tabular-nums flex-shrink-0">
            <div className="font-semibold">{yen(t.shares * t.price)}</div>
            {t.realized !== null && <div className={`text-xs font-semibold ${upDown(t.realized)}`}>{signedYen(t.realized)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- 銘柄リスト ----------

export function StockBrowser({ stocks, sectors, quotes, holdings, selectedSymbol, onSelect, compact, listClassName = '' }) {
  const [sector, setSector] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = stocks.filter((s) => {
    if (sector === 'held') return holdings[s.symbol];
    if (sector !== 'all' && s.sector !== sector) return false;
    return !query || s.name.includes(query) || s.symbol.toLowerCase().includes(query.toLowerCase());
  });
  const chips = [['all', 'すべて'], ['held', '保有中'], ...Object.entries(sectors).map(([k, v]) => [k, v.name])];
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="銘柄名で探す"
          className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-base"
        />
      </div>
      <div className="-mx-1 px-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {chips.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSector(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              sector === key ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={listClassName}>
        {filtered.length === 0
          ? <p className="text-sm text-gray-500 text-center py-6">該当する銘柄がありません</p>
          : <StockList stocks={filtered} sectors={sectors} quotes={quotes} holdings={holdings} selectedSymbol={selectedSymbol} onSelect={onSelect} compact={compact} />}
      </div>
    </div>
  );
}

export function StockList({ stocks, sectors, quotes, holdings, selectedSymbol, onSelect, compact }) {
  return (
    <div className="space-y-2">
      {stocks.map((stock) => {
        const { price, change } = quotes[stock.symbol];
        const isSelected = selectedSymbol === stock.symbol;
        const held = holdings[stock.symbol]?.shares ?? 0;
        return (
          <button
            key={stock.symbol}
            onClick={() => onSelect(stock)}
            className={`w-full text-left rounded-xl border transition ${compact ? 'p-3' : 'p-4'} ${
              isSelected ? 'bg-amber-500/15 border-amber-500/70' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
            }`}
          >
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className={`font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>{stock.name}</div>
                <div className="text-xs text-gray-500">
                  {sectors[stock.sector].name}
                  {held > 0 && <span className="ml-2 text-amber-400">保有 {held.toLocaleString()}株</span>}
                </div>
              </div>
              <div className="text-right tabular-nums flex-shrink-0">
                <div className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>¥{price.toLocaleString()}</div>
                <div className={`text-xs font-semibold ${upDown(change)}`}>{signed(change)}%</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- 銘柄情報・チャート ----------

export function StockHeader({ stock, sectorName, data }) {
  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold truncate">{stock.name}</h2>
          <p className="text-sm text-gray-500"><Term k="sector">{sectorName}</Term></p>
        </div>
        <div className="text-right tabular-nums flex-shrink-0">
          <div className="text-2xl sm:text-3xl font-bold">¥{data.price.toLocaleString()}</div>
          <div className={`text-base font-semibold flex items-center justify-end gap-1 ${upDown(data.change)}`}>
            {data.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {signed(data.change)}%
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center tabular-nums">
        {[
          ['始値', data.open.toLocaleString(), '', 'open'],
          ['高値', data.high.toLocaleString(), 'text-emerald-400', 'high'],
          ['安値', data.low.toLocaleString(), 'text-red-400', 'low'],
          ['出来高', `${(data.volume / 1000).toFixed(1)}K`, '', 'volume'],
        ].map(([label, value, color, termKey]) => (
          <div key={label} className="bg-slate-800/60 rounded-lg py-2">
            <div className="text-xs text-gray-500 mb-0.5"><Term k={termKey}>{label}</Term></div>
            <div className={`text-sm font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PriceChart({ history, height = 250, avgCost }) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 text-center px-4" style={{ height }}>
        「開始」を押すと株価が動き出します
      </div>
    );
  }
  const first = history[0].price;
  const last = history[history.length - 1].price;
  const color = last >= first ? '#10B981' : '#EF4444';
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={history} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis
          stroke="#64748b"
          domain={[(min) => Math.floor(Math.min(min, avgCost ?? min) * 0.998), (max) => Math.ceil(Math.max(max, avgCost ?? max) * 1.002)]}
          tick={{ fontSize: 11 }}
          width={55}
          tickFormatter={(v) => Math.round(v).toLocaleString()}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          formatter={(value) => [`¥${value.toLocaleString()}`, '株価']}
        />
        <Area type="monotone" dataKey="price" stroke={color} fill="url(#colorPrice)" strokeWidth={2} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---------- 取引パネル ----------

const AMOUNT_PRESETS = [100, 200, 500, 1000];

export function TradePanel({
  price, tradeAmount, setTradeAmount, leverage, setLeverage, mode, onBuy, onSell, isRunning, holding,
}) {
  const amount = price * tradeAmount;
  const fee = tradeFee(amount, mode);
  const step = (d) => setTradeAmount(Math.max(LOT_SIZE, tradeAmount + d));
  const gain = holding ? (price - holding.avgCost) * holding.shares : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-gray-400 mb-2"><Term k="lot">株数（{LOT_SIZE}株単位）</Term></div>
        <div className="flex gap-2">
          <button onClick={() => step(-LOT_SIZE)} className="w-12 bg-slate-800 border border-slate-700 rounded-xl text-xl font-bold" aria-label="100株減らす">−</button>
          <input
            type="number"
            inputMode="numeric"
            min={LOT_SIZE}
            step={LOT_SIZE}
            value={tradeAmount}
            onChange={(e) => setTradeAmount(Math.max(0, parseInt(e.target.value) || 0))}
            onBlur={() => setTradeAmount(Math.max(LOT_SIZE, Math.round(tradeAmount / LOT_SIZE) * LOT_SIZE))}
            className="flex-1 min-w-0 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-lg font-semibold text-center tabular-nums"
          />
          <button onClick={() => step(LOT_SIZE)} className="w-12 bg-slate-800 border border-slate-700 rounded-xl text-xl font-bold" aria-label="100株増やす">＋</button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {AMOUNT_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setTradeAmount(n)}
              className={`py-2 rounded-lg text-sm font-semibold border transition ${
                tradeAmount === n ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-gray-300'
              }`}
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {mode.maxLeverage > 1 && (
        <div>
          <div className="text-xs text-gray-400 mb-2"><Term k="leverage">レバレッジ（借金して何倍まで買うか）</Term></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {Array.from({ length: mode.maxLeverage }, (_, i) => i + 1).map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`min-w-[48px] px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                  leverage === lev
                    ? lev === 1 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-800 border-slate-700 text-gray-300'
                }`}
              >
                {lev}倍
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 rounded-xl px-4 py-3 space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-400">取引金額</span>
          <span className="text-lg font-bold tabular-nums">{yen(amount)}</span>
        </div>
        {mode.feeRate > 0 && (
          <div className="flex justify-between items-baseline text-xs text-gray-400 tabular-nums">
            <Term k="fee">手数料（{(mode.feeRate * 100).toFixed(1)}%）</Term>
            <span>{yen(fee)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBuy}
          disabled={!isRunning || tradeAmount <= 0}
          className="py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl font-bold text-base transition"
        >
          買う
        </button>
        <button
          onClick={onSell}
          disabled={!isRunning || tradeAmount <= 0}
          className="py-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl font-bold text-base transition"
        >
          売る
        </button>
      </div>
      {!isRunning && <p className="text-xs text-center text-gray-500">取引するには上の「開始」を押してください</p>}

      <div className="pt-3 border-t border-slate-800 text-sm space-y-1">
        {holding ? (
          <>
            <Row label="保有株数">{holding.shares.toLocaleString()}株</Row>
            <Row label={<Term k="avgCost">平均取得単価</Term>}>¥{Math.round(holding.avgCost).toLocaleString()}</Row>
            <Row label={<Term k="unrealized">含み損益</Term>}><span className={upDown(gain)}>{signedYen(gain)}</span></Row>
          </>
        ) : (
          <p className="text-xs text-gray-500 text-center">この銘柄はまだ持っていません</p>
        )}
      </div>
    </div>
  );
}

// ---------- ニュース ----------

const NEWS_STYLE = {
  market: 'bg-blue-900/20 border-blue-500',
  sector: 'bg-purple-900/20 border-purple-500',
};
const SCOPE_LABEL = { market: '市場全体', sector: '業界', stock: '個別' };

export function NewsFeed({ news, holdings = {} }) {
  if (news.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-6">市場を開始するとニュースが配信されます</p>;
  }
  return (
    <div className="space-y-2">
      {news.map((item) => {
        const related = item.affected.some((s) => holdings[s]);
        return (
          <div
            key={item.id}
            className={`p-3 rounded-xl border-l-4 ${
              NEWS_STYLE[item.scope] ?? (item.isPositive ? 'bg-emerald-900/20 border-emerald-500' : 'bg-red-900/20 border-red-500')
            }`}
          >
            <div className="flex items-start gap-2">
              {item.isPositive
                ? <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                : <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700/70 text-gray-300">{SCOPE_LABEL[item.scope]}</span>
                  {related && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">保有株に関係</span>}
                </div>
                <p className="text-sm leading-relaxed break-words">{item.text}</p>
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="text-gray-500">{item.time}・{item.targetLabel}</span>
                  <span className={`font-bold tabular-nums ${upDown(item.impact)}`}>{signed(item.impact, 1)}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- 信用取引の警告バー ----------

export function MarginBar({ portfolio, summary, marginCallActive }) {
  if (portfolio.borrowedAmount <= 0) return null;
  const tone = marginCallActive
    ? 'bg-red-900/40 border-red-500 animate-pulse'
    : summary.marginRatio < 0.5 ? 'bg-orange-900/30 border-orange-500' : 'bg-yellow-900/20 border-yellow-700/60';
  return (
    <div className={`px-4 py-2 border-b ${tone}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertOctagon size={18} className={marginCallActive ? 'text-red-400' : 'text-yellow-400'} />
          {marginCallActive ? <Term k="marginCall">追証発生中</Term> : <Term k="leverage">信用取引中</Term>}・<Term k="marginRatio">維持率 {(summary.marginRatio * 100).toFixed(1)}%</Term>
        </div>
        <div className="tabular-nums">
          <span className="text-gray-400">借入</span>
          <span className="ml-1 font-semibold text-red-400">{yen(portfolio.borrowedAmount)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- 通知（トースト） ----------

const TOAST_STYLE = {
  success: ['bg-emerald-900/95 border-emerald-500', CheckCircle, 'text-emerald-300'],
  error: ['bg-slate-800/95 border-slate-500', XCircle, 'text-gray-300'],
  warning: ['bg-orange-900/95 border-orange-500', AlertTriangle, 'text-orange-300'],
  critical: ['bg-red-900/95 border-red-500', AlertOctagon, 'text-red-300'],
  info: ['bg-slate-800/95 border-slate-500', Info, 'text-sky-300'],
};

export function Toasts({ toasts }) {
  return (
    <div className="fixed top-3 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => {
        const [style, Icon, iconColor] = TOAST_STYLE[t.type] ?? TOAST_STYLE.info;
        return (
          <div key={t.id} role="status" className={`w-full max-w-md flex items-start gap-2 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur text-sm ${style}`}>
            <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
            <span className="leading-snug">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

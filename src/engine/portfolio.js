import { LOT_SIZE } from './data';

export const INITIAL_CASH = 1000000;

export function createPortfolio() {
  return {
    initialCash: INITIAL_CASH,
    cash: INITIAL_CASH,
    borrowedAmount: 0,
    holdings: {}, // { symbol: { shares, avgCost } }  avgCost＝平均取得単価
    realizedPnl: 0, // 売って確定した損益の合計（手数料差し引き後・税引き前）
    feesPaid: 0,
    taxPaid: 0, // 支払った税金の合計（損が出ると戻ってくることもある）
    trades: [], // 取引履歴（新しい順）
  };
}

let tradeSeq = 0;

function record(p, trade) {
  tradeSeq += 1;
  return [{ id: tradeSeq, time: new Date().toLocaleTimeString(), ...trade }, ...p.trades].slice(0, 100);
}

// 資産の状況を現在の株価で計算する
export function summarize(p, prices) {
  let holdingsValue = 0;
  let costBasis = 0;
  Object.entries(p.holdings).forEach(([symbol, h]) => {
    holdingsValue += h.shares * (prices[symbol] ?? 0);
    costBasis += h.shares * h.avgCost;
  });
  const totalValue = p.cash + holdingsValue;
  const equity = totalValue - p.borrowedAmount;
  const pnl = equity - p.initialCash;
  return {
    holdingsValue,
    totalValue,
    equity,
    pnl,
    pnlPercent: (pnl / p.initialCash) * 100,
    unrealizedPnl: holdingsValue - costBasis,
    marginRatio: p.borrowedAmount > 0 ? equity / p.borrowedAmount : 1,
  };
}

export const tradeFee = (amount, mode) => Math.round(amount * mode.feeRate);

// 買い注文。成功すれば { portfolio, message }、失敗すれば { error }
export function buy(p, { stock, price, shares, leverage, mode, prices }) {
  if (shares <= 0 || shares % LOT_SIZE !== 0) return { error: `株数は${LOT_SIZE}株単位で指定してください` };
  if (leverage > mode.maxLeverage) return { error: `このモードの最大レバレッジは${mode.maxLeverage}倍です` };

  const { equity } = summarize(p, prices);
  const cost = price * shares;
  const fee = tradeFee(cost, mode);
  const total = cost + fee;
  const buyingPower = p.cash + Math.max(0, equity) * (leverage - 1);
  if (total > buyingPower) return { error: `買付余力が足りません（必要 ¥${total.toLocaleString()}）` };

  const borrowed = Math.max(0, total - p.cash);
  const prev = p.holdings[stock.symbol] ?? { shares: 0, avgCost: 0 };
  const newShares = prev.shares + shares;
  const avgCost = (prev.shares * prev.avgCost + cost) / newShares;

  const next = {
    ...p,
    cash: p.cash - (total - borrowed),
    borrowedAmount: p.borrowedAmount + borrowed,
    holdings: { ...p.holdings, [stock.symbol]: { shares: newShares, avgCost } },
    feesPaid: p.feesPaid + fee,
  };
  next.trades = record(p, { side: 'buy', symbol: stock.symbol, name: stock.name, shares, price, fee, tax: 0, realized: null, borrowed });

  const extra = [fee > 0 && `手数料 ¥${fee.toLocaleString()}`, borrowed > 0 && `借入 ¥${Math.round(borrowed).toLocaleString()}`].filter(Boolean).join('・');
  return { portfolio: next, message: `${stock.name} ${shares.toLocaleString()}株を ¥${price.toLocaleString()} で買いました${extra ? `（${extra}）` : ''}` };
}

// 売り注文
export function sell(p, { stock, price, shares, mode }) {
  if (shares <= 0 || shares % LOT_SIZE !== 0) return { error: `株数は${LOT_SIZE}株単位で指定してください` };
  const prev = p.holdings[stock.symbol];
  if (!prev || prev.shares < shares) return { error: '持っている株数より多くは売れません' };

  const revenue = price * shares;
  const fee = tradeFee(revenue, mode);
  const realized = (price - prev.avgCost) * shares - fee;
  const realizedPnl = p.realizedPnl + realized;
  // 税金は「その年の確定損益の合計」にかかる（損が出たら払いすぎた分が戻る）
  const taxDue = Math.max(0, realizedPnl) * mode.taxRate;
  const tax = Math.round(taxDue - p.taxPaid);

  let cashIn = revenue - fee - tax;
  // 借金があれば先に返す
  const repay = Math.min(Math.max(0, cashIn), p.borrowedAmount);
  cashIn -= repay;

  const holdings = { ...p.holdings };
  const left = prev.shares - shares;
  if (left > 0) holdings[stock.symbol] = { ...prev, shares: left };
  else delete holdings[stock.symbol];

  const next = {
    ...p,
    cash: p.cash + cashIn,
    borrowedAmount: p.borrowedAmount - repay,
    holdings,
    realizedPnl,
    feesPaid: p.feesPaid + fee,
    taxPaid: p.taxPaid + tax,
  };
  next.trades = record(p, { side: 'sell', symbol: stock.symbol, name: stock.name, shares, price, fee, tax, realized, borrowed: 0 });

  const sign = realized >= 0 ? '+' : '-';
  const taxNote = tax > 0 ? `・税金 ¥${tax.toLocaleString()}` : tax < 0 ? `・税金還付 ¥${(-tax).toLocaleString()}` : '';
  return {
    portfolio: next,
    message: `${stock.name} ${shares.toLocaleString()}株を ¥${price.toLocaleString()} で売りました（損益 ${sign}¥${Math.abs(Math.round(realized)).toLocaleString()}${taxNote}）`,
  };
}

// ロスカット：全部の株を今の値段で強制的に売って借金を返す
export function liquidateAll(p, prices, mode, stocks) {
  let next = p;
  Object.entries(p.holdings).forEach(([symbol, h]) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    const result = sell(next, { stock, price: prices[symbol], shares: h.shares, mode });
    if (result.portfolio) next = result.portfolio;
  });
  // 売っても借金が残った場合は現金から返す（足りなければ現金がマイナス＝債務超過）
  if (next.borrowedAmount > 0) {
    next = { ...next, cash: next.cash - next.borrowedAmount, borrowedAmount: 0 };
  }
  return next;
}

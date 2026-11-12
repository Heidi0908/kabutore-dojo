import { STOCKS, SECTORS, NEWS_EVENTS } from './data';

const HISTORY_LENGTH = 120; // チャートに残す点の数（秒）
const INDEX_BASE = 10000;
const REVERSION_SPEED = 0.002; // 本来の価値へ戻る速さ（1秒あたり）
const NEWS_PERMANENCE = 0.5; // ニュースの影響のうち、本来の価値そのものを変える割合（残りは一時的な行き過ぎ）

// 正規分布の乱数（平均0・標準偏差1）
function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const rand = (min, max) => min + Math.random() * (max - min);

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// 株価は1円単位で表示・売買する
export const roundPrice = (p) => Math.max(1, Math.round(p));

/**
 * 市場全体のシミュレーション。
 * 各銘柄の1秒ごとの値動き ＝ 市場全体の動き × beta ＋ 業種の動き ＋ その会社だけの動き
 * ニュースの影響は、半分くらいがすぐ反映され、残りは数十秒かけてじわじわ効く。
 */
export class Market {
  constructor() {
    this.reset();
  }

  reset() {
    this.stocks = {};
    STOCKS.forEach((s) => {
      this.stocks[s.symbol] = {
        price: s.basePrice,
        open: s.basePrice,
        high: s.basePrice,
        low: s.basePrice,
        volume: 0,
        pendingImpact: 0, // まだ反映しきれていないニュースの影響（%）
        fairValue: s.basePrice, // その会社の「本来の価値」。株価は行き過ぎても少しずつここへ戻る
        history: [],
      };
    });
    this.marketMood = 0; // 市場全体の勢い（%/秒）。ニュースで上下し、少しずつ0に戻る
    this.sectorMood = Object.fromEntries(Object.keys(SECTORS).map((k) => [k, 0]));
    this.index = { value: INDEX_BASE, open: INDEX_BASE, history: [] };
  }

  tick() {
    const time = new Date().toLocaleTimeString();
    const marketMove = randn() * 0.05 + this.marketMood;
    const sectorMoves = {};
    Object.keys(SECTORS).forEach((k) => {
      sectorMoves[k] = randn() * 0.05 + this.sectorMood[k];
    });

    STOCKS.forEach((s) => {
      const st = this.stocks[s.symbol];
      // 残っているニュースの影響を少しずつ反映
      const newsPart = st.pendingImpact * 0.08;
      st.pendingImpact -= newsPart;

      // 本来の価値から離れすぎると、少しずつ引き戻される（数分で半分くらい戻る）
      const reversion = Math.log(st.fairValue / st.price) * REVERSION_SPEED * 100;

      const movePct = marketMove * s.beta + sectorMoves[s.sector] + randn() * s.volatility + newsPart + reversion;
      st.price = Math.max(1, st.price * (1 + movePct / 100));
      st.high = Math.max(st.high, st.price);
      st.low = Math.min(st.low, st.price);
      // 大きく動いた時ほど出来高が増える
      st.volume += Math.round((200 + Math.random() * 800) * (1 + Math.abs(movePct) * 4));
      st.history.push({ time, price: roundPrice(st.price) });
      if (st.history.length > HISTORY_LENGTH) st.history.shift();
    });

    // 勢いは少しずつ落ち着く
    this.marketMood *= 0.95;
    Object.keys(this.sectorMood).forEach((k) => { this.sectorMood[k] *= 0.95; });

    this.updateIndex();
    this.index.history.push({ time, price: Math.round(this.index.value) });
    if (this.index.history.length > HISTORY_LENGTH) this.index.history.shift();
  }

  // 市場指数「道場平均」＝ 全銘柄の値上がり率の平均
  updateIndex() {
    const avgRatio = STOCKS.reduce((sum, s) => sum + this.stocks[s.symbol].price / s.basePrice, 0) / STOCKS.length;
    this.index.value = INDEX_BASE * avgRatio;
  }

  // ニュースを1つ発生させて株価に反映し、ニュースの内容を返す
  generateNews(strength = 1) {
    const event = pickWeighted(NEWS_EVENTS);
    const base = rand(event.impact[0], event.impact[1]) * strength;
    let text = event.text;
    let targetLabel = '市場全体';
    const affected = []; // { symbol, impact }

    if (event.scope === 'stock') {
      const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
      text = text.replace('{company}', stock.name);
      targetLabel = stock.name;
      affected.push({ symbol: stock.symbol, impact: base });
    } else if (event.scope === 'sector') {
      const keys = Object.keys(SECTORS);
      const sectorKey = keys[Math.floor(Math.random() * keys.length)];
      text = text.replace('{sector}', SECTORS[sectorKey].name);
      targetLabel = `${SECTORS[sectorKey].name}業界`;
      STOCKS.filter((s) => s.sector === sectorKey).forEach((s) => {
        affected.push({ symbol: s.symbol, impact: base * rand(0.7, 1.3) });
      });
      this.sectorMood[sectorKey] += base * 0.01;
    } else {
      STOCKS.forEach((s) => {
        const bias = event.sectorBias?.[s.sector] ?? 1;
        affected.push({ symbol: s.symbol, impact: base * s.beta * bias * rand(0.8, 1.2) });
      });
      this.marketMood += base * 0.01;
    }

    affected.forEach(({ symbol, impact }) => {
      const st = this.stocks[symbol];
      // 半分はすぐ反映（窓開け）、残りはじわじわ
      st.price = Math.max(1, st.price * (1 + (impact * 0.5) / 100));
      st.high = Math.max(st.high, st.price);
      st.low = Math.min(st.low, st.price);
      st.pendingImpact += impact * 0.5;
      // 影響の一部は会社の価値そのものの変化（決算・規制など）として残る
      st.fairValue *= 1 + (impact * NEWS_PERMANENCE) / 100;
    });
    this.updateIndex();

    return {
      text,
      scope: event.scope,
      targetLabel,
      impact: base,
      isPositive: base > 0,
      isCritical: event.critical || Math.abs(base) > 5,
      time: new Date().toLocaleTimeString(),
      affected: affected.map((a) => a.symbol),
    };
  }

  price(symbol) {
    return roundPrice(this.stocks[symbol].price);
  }

  prices() {
    return Object.fromEntries(STOCKS.map((s) => [s.symbol, this.price(s.symbol)]));
  }

  // 画面表示用のデータ
  quote(symbol) {
    const st = this.stocks[symbol];
    const price = roundPrice(st.price);
    return {
      price,
      change: ((price - st.open) / st.open) * 100,
      open: roundPrice(st.open),
      high: roundPrice(st.high),
      low: roundPrice(st.low),
      volume: st.volume,
    };
  }

  indexQuote() {
    return {
      value: this.index.value,
      change: ((this.index.value - this.index.open) / this.index.open) * 100,
    };
  }
}

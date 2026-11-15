// 段位（帯）と実績。記録はこのブラウザに保存する（別の端末やブラウザには引き継がれない）。

export const RANKS = [
  { name: '白帯', xp: 0, color: 'bg-gray-100 text-slate-900', bar: 'bg-gray-200' },
  { name: '黄帯', xp: 100, color: 'bg-yellow-300 text-slate-900', bar: 'bg-yellow-300' },
  { name: '緑帯', xp: 250, color: 'bg-emerald-500 text-white', bar: 'bg-emerald-500' },
  { name: '茶帯', xp: 500, color: 'bg-amber-800 text-white', bar: 'bg-amber-700' },
  { name: '黒帯', xp: 800, color: 'bg-slate-950 text-amber-300 ring-1 ring-amber-400', bar: 'bg-slate-200' },
  { name: '師範代', xp: 1200, color: 'bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950', bar: 'bg-amber-400' },
];

// 実績は「良い投資の習慣」をほめるものを中心にする。
// 大きく賭けることや、売買しすぎることを勧めるような実績は入れない。
export const ACHIEVEMENTS = [
  // 基本
  { id: 'tutorial', icon: '🔰', title: '入門', desc: 'チュートリアルを修了する', xp: 50 },
  { id: 'firstBuy', icon: '🛒', title: 'はじめの一歩', desc: '初めて株を買う', xp: 20 },
  { id: 'firstWin', icon: '🎯', title: '初めての利益', desc: '利益が出る売りをする', xp: 40 },
  // 良い習慣
  { id: 'cutLoss', icon: '✂️', title: '損切りができた', desc: '損失が3%以内のうちに売る（損を小さく抑える）', xp: 60 },
  { id: 'letProfitRun', icon: '🌱', title: '利益を伸ばす', desc: '+3%以上の利益が出るまで待ってから売る', xp: 60 },
  { id: 'smallPosition', icon: '🧮', title: '少しずつ買う', desc: '純資産の20%以下の金額で買う（一度に全部使わない）', xp: 40 },
  { id: 'diversify', icon: '🧺', title: '分散投資', desc: '3銘柄以上を同時に持つ', xp: 50 },
  { id: 'sectors', icon: '🗂️', title: '業種分散', desc: '4つ以上の業種の株を同時に持つ', xp: 80 },
  { id: 'noLeverageWin', icon: '🛡️', title: '借金なしで勝つ', desc: 'レバレッジを使わずに純資産を+5%にする', xp: 100 },
  // 信用取引
  { id: 'leverage', icon: '⚙️', title: '信用取引デビュー', desc: 'レバレッジ2倍以上で買う', xp: 30 },
  { id: 'marginSurvivor', icon: '🛟', title: '追証から立て直す', desc: '追証を自分の力で解消する', xp: 100 },
  // 成績
  { id: 'up5', icon: '📈', title: '小さな一歩', desc: '純資産を+5%にする', xp: 60 },
  { id: 'up10', icon: '🚀', title: '一人前', desc: '純資産を+10%にする', xp: 120 },
  { id: 'up30', icon: '👑', title: '相場師', desc: '純資産を+30%にする', xp: 250 },
  { id: 'hardWin', icon: '🔥', title: '難しい相場で勝つ', desc: 'ハード以上のモードで純資産を+10%にする', xp: 200 },
];

export const achievementById = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// 達成済みの実績の数（今はもう無い古い実績は数えない）
export const unlockedCount = (progress) => ACHIEVEMENTS.filter((a) => progress.unlocked[a.id]).length;

const STORAGE_KEY = 'kabutore.progress';

export function emptyProgress() {
  return { xp: 0, unlocked: {}, tutorialDone: false, bestPnlPercent: null };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyProgress(), ...JSON.parse(raw) } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 保存できない環境（プライベートモードなど）では、記録はこの画面の間だけになる
  }
}

export function rankInfo(xp) {
  let index = 0;
  RANKS.forEach((r, i) => { if (xp >= r.xp) index = i; });
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? (xp - rank.xp) / (next.xp - rank.xp) : 1;
  return { rank, next, progress, index };
}

/**
 * 出来事ごとに、新しく達成した実績のIDを返す。
 * event: 'buy' | 'sell' | 'tick' | 'marginRecovered' | 'tutorial'
 */
export function checkAchievements(event, { trade, leverage, portfolio, summary, mode, stocks, difficulty }) {
  const earned = [];
  if (event === 'tutorial') earned.push('tutorial');
  if (event === 'marginRecovered') earned.push('marginSurvivor');

  if (event === 'buy') {
    earned.push('firstBuy');
    if (leverage >= 2) earned.push('leverage');
    // 買った金額が、買う前の純資産の20%以下か（summary は買った後の値だが、純資産は手数料分しか変わらない）
    if (trade && summary && trade.shares * trade.price <= summary.equity * 0.2) earned.push('smallPosition');
  }

  if (event === 'sell' && trade) {
    const cost = trade.shares * trade.price - trade.fee - trade.realized;
    const pct = cost > 0 ? (trade.realized / cost) * 100 : 0;
    if (trade.realized > 0) earned.push('firstWin');
    if (pct >= 3) earned.push('letProfitRun');
    if (trade.realized < 0 && pct >= -3) earned.push('cutLoss');
  }

  if (portfolio) {
    const held = Object.keys(portfolio.holdings);
    if (held.length >= 3) earned.push('diversify');
    const sectors = new Set(held.map((sym) => stocks.find((s) => s.symbol === sym)?.sector));
    if (sectors.size >= 4) earned.push('sectors');
  }

  if (summary && portfolio) {
    const everBorrowed = portfolio.borrowedAmount > 0 || portfolio.trades.some((t) => t.borrowed > 0);
    if (summary.pnlPercent >= 5 && !everBorrowed) earned.push('noLeverageWin');
  }

  if (summary) {
    if (summary.pnlPercent >= 5) earned.push('up5');
    if (summary.pnlPercent >= 10) earned.push('up10');
    if (summary.pnlPercent >= 30) earned.push('up30');
    if (summary.pnlPercent >= 10 && mode?.canGoBankrupt && (difficulty === 'HARD' || difficulty === 'EXTREME')) earned.push('hardWin');
  }

  return earned;
}

// 実績を記録に反映する。新しく取れたものと、昇段したかを返す
export function applyAchievements(progress, ids) {
  const fresh = ids.filter((id) => !progress.unlocked[id]);
  if (fresh.length === 0) return { progress, fresh: [], rankUp: null };
  const before = rankInfo(progress.xp).rank;
  const unlocked = { ...progress.unlocked };
  let xp = progress.xp;
  fresh.forEach((id) => {
    unlocked[id] = new Date().toLocaleDateString();
    xp += achievementById[id].xp;
  });
  const after = rankInfo(xp).rank;
  return {
    progress: { ...progress, unlocked, xp, tutorialDone: progress.tutorialDone || fresh.includes('tutorial') },
    fresh: fresh.map((id) => achievementById[id]),
    rankUp: after.name !== before.name ? after : null,
  };
}

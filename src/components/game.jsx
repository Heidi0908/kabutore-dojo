import { useEffect } from 'react';
import { X, Lock } from 'lucide-react';
import { ACHIEVEMENTS, RANKS, rankInfo, unlockedCount } from '../engine/progress';

// 帯のバッジ
export function RankBadge({ xp, onClick, size = 'sm' }) {
  const { rank } = rankInfo(xp);
  const cls = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-[11px]';
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      title="道場の記録を見る"
      className={`inline-flex items-center gap-1 rounded-md font-bold whitespace-nowrap shadow ${cls} ${rank.color}`}
    >
      🥋 {rank.name}
    </Tag>
  );
}

// 次の帯までのバー
export function RankProgress({ xp }) {
  const { rank, next, progress } = rankInfo(xp);
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1 tabular-nums">
        <span className="text-gray-400">{rank.name} ・ {xp} XP</span>
        <span className="text-gray-500">{next ? `${next.name}まで あと ${next.xp - xp} XP` : '最高段位！'}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${next ? next.bar : rank.bar}`} style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </div>
  );
}

// 道場の記録（段位と実績の一覧）
export function DojoRecord({ progress, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const count = unlockedCount(progress);
  return (
    <div className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="道場の記録"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl sm:max-h-[85vh] bg-slate-950 text-gray-100 sm:border sm:border-slate-700 sm:rounded-2xl flex flex-col shadow-2xl"
      >
        <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-amber-300">道場の記録</h2>
          <button onClick={onClose} aria-label="閉じる" className="p-2 -m-2 text-gray-400"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">今の段位</span>
              <RankBadge xp={progress.xp} size="lg" />
            </div>
            <RankProgress xp={progress.xp} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {RANKS.map((r) => (
                <span key={r.name} className={`text-[11px] px-2 py-0.5 rounded font-bold ${progress.xp >= r.xp ? r.color : 'bg-slate-800 text-gray-600'}`}>
                  {r.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500">実績を達成すると XP（経験値）がたまり、帯が上がります。記録はこのブラウザに保存されます。</p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">実績 {count} / {ACHIEVEMENTS.length}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const got = progress.unlocked[a.id];
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${got ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}
                  >
                    <span className={`text-2xl ${got ? '' : 'grayscale opacity-40'}`}>{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className={`font-semibold ${got ? 'text-amber-200' : 'text-gray-400'}`}>{a.title}</span>
                        <span className="text-[11px] text-gray-500 tabular-nums flex-shrink-0">+{a.xp} XP</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
                      <div className="text-[11px] mt-1 flex items-center gap-1 text-gray-500">
                        {got ? `✓ ${got} 達成` : <><Lock size={11} />未達成</>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// 画面の真ん中に短く出る演出（利確・損切り・昇段など）。控えめな大きさにしている
export function BigPop({ pop }) {
  if (!pop) return null;
  return (
    <div className="fixed inset-0 z-[68] flex items-center justify-center pointer-events-none px-6">
      <div key={pop.id} className="animate-big-pop text-center bg-slate-950/80 border border-slate-700 rounded-2xl px-6 py-3 shadow-2xl backdrop-blur-sm">
        <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${pop.color}`}>
          {pop.text}
        </div>
        {pop.sub && <div className="mt-0.5 text-sm sm:text-base text-gray-300">{pop.sub}</div>}
      </div>
    </div>
  );
}

// 演出のオン・オフ切り替え
export function EffectsToggle({ on, onToggle, compact }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      title="大きな表示・株価の光り・実績の金色の通知"
      className={`inline-flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-300`}
    >
      <span className={`relative inline-block w-9 h-5 rounded-full transition ${on ? 'bg-amber-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      演出 {on ? 'オン' : 'オフ'}
    </button>
  );
}

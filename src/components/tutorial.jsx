import { useEffect, useState } from 'react';

// 光らせる部品の位置を追いかける
function useTargetRect(target) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!target) { setRect(null); return undefined; }
    let scrolled = false;
    const update = () => {
      const el = document.querySelector(`[data-tut="${target}"]`);
      if (!el) { setRect(null); return; }
      if (!scrolled) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        scrolled = true;
      }
      const r = el.getBoundingClientRect();
      setRect((prev) => (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
        ? prev : { top: r.top, left: r.left, width: r.width, height: r.height }));
    };
    update();
    const timer = setInterval(update, 150);
    window.addEventListener('resize', update);
    return () => { clearInterval(timer); window.removeEventListener('resize', update); };
  }, [target]);
  return rect;
}

/**
 * チュートリアルの吹き出しとスポットライト。
 * 画面の操作はそのままできる（光っている部品を実際に押してもらう）。
 */
export function TutorialOverlay({ step, index, total, note, onNext, onSkip, onFinish, isDesktop }) {
  const rect = useTargetRect(step.target);
  const pad = 6;

  // 光らせる場所が画面の下半分なら、吹き出しは上に出す
  const targetLow = rect && rect.top + rect.height / 2 > window.innerHeight / 2;
  const bubblePos = targetLow
    ? 'top-[calc(env(safe-area-inset-top)+0.75rem)]'
    : isDesktop ? 'bottom-6' : 'bottom-[calc(5rem+env(safe-area-inset-bottom))]';

  return (
    <>
      {/* まわりを暗くして、操作してほしい場所だけ明るく見せる（クリックは邪魔しない） */}
      {rect ? (
        <div
          className="fixed z-[65] rounded-xl pointer-events-none animate-tut-pulse transition-all duration-200"
          style={{
            top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.6)',
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[65] bg-slate-950/60 pointer-events-none" />
      )}

      <div className={`fixed z-[66] inset-x-0 px-3 flex justify-center pointer-events-none ${bubblePos}`}>
        <div className="pointer-events-auto w-full max-w-md bg-slate-900 text-gray-100 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-4 animate-pop-in">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-2xl shadow-lg" aria-hidden>
              🥋
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-amber-300">師範</span>
                <span className="text-[11px] text-gray-500 tabular-nums">{index + 1} / {total}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{step.text}</p>
              {note && (
                <div className="mt-2 text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-100">{note}</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {step.waitFor === 'finish' ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button onClick={() => onFinish('continue')} className="py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-sm font-semibold">
                  このまま練習を続ける
                </button>
                <button onClick={() => onFinish('menu')} className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-sm font-bold">
                  難易度を選んで本番へ
                </button>
              </div>
            ) : (
              <>
                <button onClick={onSkip} className="text-xs text-gray-500 underline underline-offset-2">チュートリアルをやめる</button>
                {step.waitFor === 'next' ? (
                  <button onClick={onNext} className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold">次へ ▶</button>
                ) : (
                  <span className="text-xs text-amber-300 animate-pulse">▲ 光っているところを操作してね</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

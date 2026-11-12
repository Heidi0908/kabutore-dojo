import { Skull, HelpCircle } from 'lucide-react';
import { Term, useHelp } from './help';
import { DIFFICULTY_MODES } from '../engine/data';
import { yen, signedYen, signed } from './parts';

// 難易度選択画面
export function StartScreen({ difficulty, setDifficulty, onStart }) {
  const mode = DIFFICULTY_MODES[difficulty];
  const { openHelp } = useHelp();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 flex items-center justify-center p-4 sm:p-6 overflow-x-clip relative">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full">
            <span className="text-amber-400 text-sm font-medium tracking-wider">PROFESSIONAL TRADING SIMULATOR</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent tracking-tight">
            株トレ道場
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            プロの取引を学ぶ。信用取引・レバレッジ・追証まで完全再現。
          </p>
          <button
            onClick={() => openHelp()}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-600 text-sm text-gray-300 hover:border-amber-500 hover:text-amber-300 transition"
          >
            <HelpCircle size={16} />はじめての方へ：遊び方・用語集
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {Object.entries(DIFFICULTY_MODES).map(([key, m]) => {
            const selected = difficulty === key;
            return (
              // 中に「？」ボタンがあるので、カード自体は div にしてクリックできるようにする
              <div
                key={key}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => setDifficulty(key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDifficulty(key); } }}
                className={`group relative text-left cursor-pointer p-4 sm:p-8 rounded-2xl border-2 transition-all duration-300 ${
                  selected
                    ? 'border-amber-500 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl shadow-amber-500/20'
                    : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 sm:block mb-2 sm:mb-0">
                  <div className="flex items-start justify-between sm:mb-4">
                    <span className="text-3xl sm:text-4xl">{m.icon}</span>
                    {selected && <div className="hidden sm:block w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl sm:text-2xl font-bold sm:mb-2 bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}>{m.name}</h3>
                    <p className="text-gray-400 text-sm sm:mb-4">{m.description}</p>
                  </div>
                  {selected && <div className="sm:hidden w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>}
                </div>
                <div className={`space-y-1 sm:space-y-2 text-sm ${selected ? '' : 'hidden sm:block'}`}>
                  <Spec label={<Term k="leverage">最大レバレッジ</Term>} value={`${m.maxLeverage}倍`} />
                  {m.marginCallThreshold > 0 && (
                    <Spec label={<Term k="marginCall">追証ライン</Term>} value={`${(m.marginCallThreshold * 100).toFixed(0)}%`} valueClass="text-orange-400" />
                  )}
                  <Spec label={<Term k="fee">売買手数料</Term>} value={m.feeRate > 0 ? `${(m.feeRate * 100).toFixed(1)}%` : 'なし'} />
                  <Spec label={<Term k="tax">利益への税金</Term>} value={m.taxRate > 0 ? `${(m.taxRate * 100).toFixed(3)}%` : 'なし'} />
                  <Spec label={<Term k="bankrupt">自己破産</Term>} value={m.canGoBankrupt ? 'あり' : 'なし'} valueClass={m.canGoBankrupt ? 'text-red-400' : 'text-gray-500'} />
                </div>
              </div>
            );
          })}
        </div>

        {/* スタートボタン（スマホでは画面下に固定） */}
        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent sm:static sm:mx-0 sm:p-0 sm:bg-none">
          <button
            onClick={onStart}
            className="w-full py-4 sm:py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl text-xl font-bold transition-all duration-300 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-[1.02]"
          >
            {mode.name}でスタート
          </button>
        </div>

        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-gray-600">⚠️ 教育用シミュレーター｜実際の投資判断には使用しないでください</p>
          <p className="text-xs text-gray-600">登場する企業・ニュースはすべて架空のものです</p>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value, valueClass = 'text-gray-300' }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

// 自己破産（ゲームオーバー）画面
export function BankruptScreen({ portfolio, summary, onRestart }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 text-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full text-center">
        <Skull size={120} className="mx-auto mb-6 text-red-500 animate-pulse" />
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-red-500">自己破産</h1>
        <p className="text-xl sm:text-2xl mb-8 text-gray-400">Game Over</p>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 text-base sm:text-lg">
            <Stat label="初期資金" value={yen(portfolio.initialCash)} />
            <Stat label="最終資産" value={yen(summary.equity)} red />
            <Stat label="損失" value={signedYen(summary.pnl)} red />
            <Stat label="損失率" value={`${signed(summary.pnlPercent)}%`} red />
            <Stat label="取引回数" value={`${portfolio.trades.length}回`} />
            <Stat label="払った手数料" value={yen(portfolio.feesPaid)} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold mb-4 text-amber-400">💡 教訓</h3>
          <ul className="space-y-2 text-sm sm:text-base text-gray-300">
            <li>• レバレッジは諸刃の剣 - 利益も損失も増幅される</li>
            <li>• 損切りは早めに - 「まだ戻るかも」は危険</li>
            <li>• リスク管理が最重要 - 全資金を投入しない</li>
            <li>• 追証は恐怖 - 対応できないと強制決済</li>
          </ul>
        </div>

        <button
          onClick={onRestart}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl text-lg font-bold transition-all duration-300"
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, red }) {
  return (
    <div>
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className={`font-bold tabular-nums ${red ? 'text-red-400' : ''}`}>{value}</div>
    </div>
  );
}

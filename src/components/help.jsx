import { createContext, useContext, useEffect, useState } from 'react';
import { X, Search, BookOpen, HelpCircle, PlayCircle, Lightbulb, ChevronDown } from 'lucide-react';
import { GLOSSARY, HOW_TO_PLAY, TIPS, FAQ, termByKey } from '../content/help';

const HelpContext = createContext({ openHelp: () => {}, openTerm: () => {} });
export const useHelp = () => useContext(HelpContext);

// アプリ全体を包んで、どこからでもヘルプや用語説明を開けるようにする
export function HelpProvider({ children }) {
  const [helpTab, setHelpTab] = useState(null); // null なら閉じている
  const [termKey, setTermKey] = useState(null);

  const value = {
    openHelp: (tab = 'howto') => { setTermKey(null); setHelpTab(tab); },
    openTerm: (key) => setTermKey(key),
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
      {termKey && (
        <TermSheet
          term={termByKey[termKey]}
          onClose={() => setTermKey(null)}
          onOpenGlossary={() => { setTermKey(null); setHelpTab('glossary'); }}
        />
      )}
      {helpTab && <HelpModal tab={helpTab} setTab={setHelpTab} onClose={() => setHelpTab(null)} />}
    </HelpContext.Provider>
  );
}

// 言葉の横に付ける小さな「？」ボタン
export function Term({ k, children, className = '' }) {
  const { openTerm } = useHelp();
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {children}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); openTerm(k); }}
        aria-label={`「${termByKey[k]?.term}」の説明`}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-500 text-[10px] leading-none text-gray-400 hover:text-amber-300 hover:border-amber-300 flex-shrink-0"
      >
        ?
      </button>
    </span>
  );
}

// Escキーで閉じる
function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

function TermBody({ term }) {
  return (
    <>
      <p className="text-base text-gray-100 leading-relaxed">{term.short}</p>
      <p className="text-sm text-gray-300 leading-relaxed mt-2">{term.detail}</p>
      {term.example && (
        <div className="mt-3 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 leading-relaxed">
          <span className="font-semibold text-amber-300">例：</span>{term.example}
        </div>
      )}
      {term.note && <p className="text-xs text-gray-500 mt-2">※ {term.note}</p>}
    </>
  );
}

// 用語を1つだけ説明する小さな画面（スマホでは下から出る）
function TermSheet({ term, onClose, onOpenGlossary }) {
  useEscape(onClose);
  if (!term) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={term.term}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-slate-900 text-gray-100 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs text-gray-500">{term.group}</div>
            <h3 className="text-lg font-bold text-amber-300">{term.term}</h3>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="p-1.5 -m-1.5 text-gray-400"><X size={22} /></button>
        </div>
        <TermBody term={term} />
        <button onClick={onOpenGlossary} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 text-sm text-gray-300">
          <BookOpen size={16} />用語集をすべて見る
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'howto', label: '遊び方', icon: PlayCircle },
  { key: 'glossary', label: '用語集', icon: BookOpen },
  { key: 'faq', label: 'Q&A', icon: HelpCircle },
];

// ヘルプ画面（遊び方・用語集・Q&A）
function HelpModal({ tab, setTab, onClose }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ヘルプ"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl sm:max-h-[85vh] bg-slate-950 text-gray-100 sm:border sm:border-slate-700 sm:rounded-2xl flex flex-col shadow-2xl"
      >
        <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-amber-300">ヘルプ</h2>
          <button onClick={onClose} aria-label="閉じる" className="p-2 -m-2 text-gray-400"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-3 gap-1 p-2 border-b border-slate-800">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition ${
                tab === key ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {tab === 'howto' && <HowTo onClose={onClose} />}
          {tab === 'glossary' && <Glossary />}
          {tab === 'faq' && <Faq />}
        </div>
      </div>
    </div>
  );
}

function HowTo({ onClose }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-300 leading-relaxed">
        株トレ道場は、<span className="text-amber-300 font-semibold">100万円の架空のお金</span>で株の売り買いを練習するゲームです。
        本物のお金は使わないので、失敗しても大丈夫。安く買って高く売り、お金を増やしましょう。
      </p>
      <ol className="space-y-3">
        {HOW_TO_PLAY.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">{i + 1}</span>
            <div>
              <div className="font-semibold">{step.title}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{step.text}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-semibold text-amber-300 mb-2"><Lightbulb size={16} />勝つためのコツ</h3>
        <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
          {TIPS.map((tip) => <li key={tip} className="flex gap-2"><span className="text-amber-400">•</span><span>{tip}</span></li>)}
        </ul>
      </div>
      <p className="text-sm text-gray-400">
        画面の中の <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-500 text-[10px] text-gray-400 align-middle">?</span> を押すと、その言葉の意味が見られます。
      </p>
      <button onClick={onClose} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold">
        はじめる
      </button>
    </div>
  );
}

function Glossary() {
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState(null);
  const hits = GLOSSARY.filter((t) => !query || t.term.includes(query) || t.short.includes(query) || t.detail.includes(query));
  const groups = [...new Set(hits.map((t) => t.group))];
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="言葉を探す（例：追証）"
          className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-base"
        />
      </div>
      {hits.length === 0 && <p className="text-sm text-gray-500 text-center py-6">見つかりませんでした</p>}
      {groups.map((group) => (
        <section key={group}>
          <h3 className="text-xs font-semibold text-gray-500 mb-2">{group}</h3>
          <div className="space-y-2">
            {hits.filter((t) => t.group === group).map((t) => {
              const open = openKey === t.key || query.length > 0;
              return (
                <div key={t.key} className="bg-slate-900 border border-slate-800 rounded-xl">
                  <button onClick={() => setOpenKey(open && !query ? null : t.key)} className="w-full flex justify-between items-start gap-3 p-3 text-left">
                    <div>
                      <div className="font-semibold text-amber-200">{t.term}</div>
                      {!open && <div className="text-sm text-gray-400 mt-0.5">{t.short}</div>}
                    </div>
                    <ChevronDown size={18} className={`flex-shrink-0 mt-0.5 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <div className="px-3 pb-3"><TermBody term={t} /></div>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Faq() {
  return (
    <div className="space-y-2">
      {FAQ.map(({ q, a }) => (
        <details key={q} className="group bg-slate-900 border border-slate-800 rounded-xl">
          <summary className="flex justify-between items-start gap-3 p-3 cursor-pointer list-none font-semibold">
            <span><span className="text-amber-400 mr-1">Q.</span>{q}</span>
            <ChevronDown size={18} className="flex-shrink-0 mt-0.5 text-gray-500 transition group-open:rotate-180" />
          </summary>
          <p className="px-3 pb-3 text-sm text-gray-300 leading-relaxed"><span className="text-emerald-400 font-semibold mr-1">A.</span>{a}</p>
        </details>
      ))}
    </div>
  );
}

// 表示の設定（このブラウザに保存）
const STORAGE_KEY = 'kabutore.settings';

const DEFAULTS = {
  effects: true, // 演出（大きな表示・株価の光り・実績の金色の通知）
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 保存できない環境では、この画面を開いている間だけ有効
  }
}

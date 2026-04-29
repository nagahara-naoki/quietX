import {
  applyToDocument,
  getMessages,
  formatItemCount as i18nFormatItemCount,
  type MessageDictionary,
  type MessageKey,
  normalizeLanguage,
  t as translate
} from './shared/i18n';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './shared/settings';
import type { BookmarkMap, Settings } from './shared/types';
import { KEYWORD_PATTERN_RE, normalizeCicadaLevel } from './shared/util';

/* ============================================================================
 * 状態
 * ========================================================================= */

let state: Settings = { ...DEFAULT_SETTINGS };
let messages: MessageDictionary = getMessages(state.language);

/* ============================================================================
 * トグル定義
 *
 * チェックボックスは仕様上ほぼ「state[key] = checked → save」を繰り返すため、
 * テーブルに正規化することで重複を排除している。`rerender=true` のものは
 * 保存後に UI 連動更新（キーワード欄の disable など）が必要なため再描画する。
 * ========================================================================= */

type ToggleSetting =
  | 'hideHoverCard'
  | 'hideVideos'
  | 'hideImages'
  | 'hideReposts'
  | 'expandShowMore'
  | 'hideKeywords'
  | 'showDescriptions';

interface ToggleDef {
  id: string;
  setting: ToggleSetting;
  rerender?: boolean;
}

const TOGGLES: ToggleDef[] = [
  { id: 'toggle-hover', setting: 'hideHoverCard' },
  { id: 'toggle-video', setting: 'hideVideos' },
  { id: 'toggle-image', setting: 'hideImages' },
  { id: 'toggle-repost', setting: 'hideReposts' },
  { id: 'toggle-expand-more', setting: 'expandShowMore' },
  { id: 'toggle-keyword', setting: 'hideKeywords', rerender: true },
  { id: 'toggle-descriptions', setting: 'showDescriptions', rerender: true }
];

/* ============================================================================
 * DOM 参照
 *
 * 起動時に一度だけ取得する。getElementById 結果は null 許容なので
 * 「無いと困るもの」は `byId<T>` で投げて素朴に扱う。
 * ========================================================================= */

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} が見つかりません`);
  return el as T;
}

// Record<ToggleSetting, …> にすることで `toggleEls[setting]` の戻り値が
// `HTMLInputElement` に確定し、noUncheckedIndexedAccess に引っかからない。
const toggleEls = TOGGLES.reduce(
  (acc, { id, setting }) => {
    acc[setting] = byId<HTMLInputElement>(id);
    return acc;
  },
  {} as Record<ToggleSetting, HTMLInputElement>
);

const els = {
  ...toggleEls,
  cicadaRadios: document.querySelectorAll<HTMLInputElement>('input[name="cicada-level"]'),
  languageSelect: byId<HTMLSelectElement>('language-select'),
  keywordSection: byId<HTMLElement>('keyword-section'),
  keywordInput: byId<HTMLInputElement>('keyword-input'),
  keywordAdd: byId<HTMLButtonElement>('keyword-add'),
  keywordList: byId<HTMLUListElement>('keyword-list'),
  keywordCount: byId<HTMLElement>('keyword-count'),
  keywordError: byId<HTMLElement>('keyword-error'),
  openBookmarks: byId<HTMLButtonElement>('open-bookmarks'),
  bookmarkCount: byId<HTMLElement>('bookmark-count')
};

/* ============================================================================
 * i18n / 共通ヘルパ
 * ========================================================================= */

function tr(key: MessageKey, values?: Record<string, string | number>): string {
  return translate(messages, key, values);
}

function formatCount(count: number): string {
  return i18nFormatItemCount(normalizeLanguage(state.language), count);
}

function applyLanguage(): void {
  const normalized = normalizeLanguage(state.language);
  state.language = normalized;
  messages = getMessages(normalized);
  applyToDocument(normalized);
  els.languageSelect.value = normalized;
}

/* ============================================================================
 * キーワードバリデーション
 * ========================================================================= */

function isRegexKeyword(kw: string): boolean {
  return KEYWORD_PATTERN_RE.test(kw);
}

/** `null` 返却 = 妥当 / 文字列返却 = エラーメッセージ。 */
function validateRegex(kw: string): string | null {
  const m = kw.match(KEYWORD_PATTERN_RE);
  if (!m) return null;
  try {
    new RegExp(m[1] ?? '', m[2] ?? '');
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/* ============================================================================
 * ストレージ I/O
 * ========================================================================= */

async function loadInitialState(): Promise<void> {
  state = await loadSettings();
}

function persistState(): void {
  // popup は短命なので await せず投げっぱなしで OK
  void saveSettings(state);
}

async function refreshBookmarkCount(): Promise<void> {
  const n = await new Promise<number>((resolve) => {
    chrome.storage.local.get('bookmarks', (result) => {
      const map = (result.bookmarks ?? {}) as BookmarkMap;
      resolve(Object.keys(map).length);
    });
  });
  els.bookmarkCount.textContent = formatCount(n);
}

/* ============================================================================
 * 描画
 * ========================================================================= */

function showError(msg: string): void {
  els.keywordError.textContent = msg;
}

function render(): void {
  applyLanguage();

  // チェックボックス系
  TOGGLES.forEach(({ setting }) => {
    toggleEls[setting].checked = state[setting];
  });

  // 蝉モード（ラジオセグメント）
  els.cicadaRadios.forEach((r) => {
    r.checked = Number(r.value) === state.cicadaMode;
  });

  document.body.classList.toggle('show-descriptions', state.showDescriptions);

  els.keywordSection.classList.toggle('disabled', !state.hideKeywords);
  els.keywordCount.textContent = formatCount(state.keywords.length);

  els.keywordList.innerHTML = '';
  if (state.keywords.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = tr('noHiddenKeywords');
    els.keywordList.appendChild(li);
    return;
  }

  state.keywords.forEach((kw, idx) => {
    const li = document.createElement('li');
    if (isRegexKeyword(kw)) li.classList.add('regex');

    const span = document.createElement('span');
    span.className = 'keyword-text';
    span.textContent = kw;
    li.appendChild(span);

    if (isRegexKeyword(kw)) {
      const badge = document.createElement('span');
      badge.className = 'regex-badge';
      badge.textContent = 'regex';
      li.appendChild(badge);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove-btn';
    btn.title = tr('remove');
    btn.setAttribute('aria-label', tr('remove'));
    btn.textContent = '×';
    btn.addEventListener('click', () => removeKeyword(idx));
    li.appendChild(btn);

    els.keywordList.appendChild(li);
  });
}

/* ============================================================================
 * キーワード追加・削除
 * ========================================================================= */

function addKeyword(): void {
  const value = els.keywordInput.value.trim();
  if (!value) return;
  const err = validateRegex(value);
  if (err) {
    showError(tr('invalidRegex', { error: err }));
    return;
  }
  showError('');
  if (state.keywords.includes(value)) {
    els.keywordInput.value = '';
    return;
  }
  state.keywords.push(value);
  persistState();
  render();
  els.keywordInput.value = '';
  els.keywordInput.focus();
}

function removeKeyword(idx: number): void {
  state.keywords.splice(idx, 1);
  persistState();
  render();
}

/* ============================================================================
 * イベント配線
 * ========================================================================= */

TOGGLES.forEach(({ setting, rerender }) => {
  toggleEls[setting].addEventListener('change', () => {
    state[setting] = toggleEls[setting].checked;
    persistState();
    if (rerender) render();
  });
});

els.cicadaRadios.forEach((r) => {
  r.addEventListener('change', () => {
    if (!r.checked) return;
    state.cicadaMode = normalizeCicadaLevel(r.value);
    persistState();
  });
});

els.languageSelect.addEventListener('change', () => {
  state.language = normalizeLanguage(els.languageSelect.value);
  showError('');
  persistState();
  render();
  void refreshBookmarkCount();
});

els.keywordAdd.addEventListener('click', addKeyword);

els.keywordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addKeyword();
  }
});

els.keywordInput.addEventListener('input', () => {
  // 入力再開でエラー表示をクリア
  if (els.keywordError.textContent) showError('');
});

els.openBookmarks.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/bookmarks.html') });
  window.close();
});

/* ============================================================================
 * 初期化
 * ========================================================================= */

void (async () => {
  await loadInitialState();
  render();
  await refreshBookmarkCount();
})();

import {
  applyToDocument,
  DEFAULT_LANGUAGE,
  getMessages,
  formatItemCount as i18nFormatItemCount,
  type MessageDictionary,
  type MessageKey,
  normalizeLanguage,
  t as translate
} from './shared/i18n';
import type { Bookmark, BookmarkMap, Language } from './shared/types';

/* ============================================================================
 * DOM 参照
 * ========================================================================= */

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} が見つかりません`);
  return el as T;
}

const els = {
  list: byId<HTMLElement>('list'),
  count: byId<HTMLElement>('count'),
  search: byId<HTMLInputElement>('search'),
  sort: byId<HTMLSelectElement>('sort'),
  languageSelect: byId<HTMLSelectElement>('language-select'),
  exportBtn: byId<HTMLButtonElement>('export'),
  clearAllBtn: byId<HTMLButtonElement>('clear-all'),
  empty: byId<HTMLElement>('empty'),
  noResults: byId<HTMLElement>('no-results')
};

/* ============================================================================
 * 状態
 * ========================================================================= */

let bookmarks: BookmarkMap = {};
let language: Language = DEFAULT_LANGUAGE;
let messages: MessageDictionary = getMessages(language);

/* ============================================================================
 * i18n ヘルパ
 * ========================================================================= */

function tr(key: MessageKey, values?: Record<string, string | number>): string {
  return translate(messages, key, values);
}

function formatCount(count: number): string {
  return i18nFormatItemCount(language, count);
}

function applyLanguage(): void {
  language = normalizeLanguage(language);
  messages = getMessages(language);
  applyToDocument(language);
  els.languageSelect.value = language;
}

/* ============================================================================
 * ストレージ I/O
 * ========================================================================= */

function loadLanguage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ language: DEFAULT_LANGUAGE }, (result) => {
      language = normalizeLanguage(result.language);
      resolve();
    });
  });
}

function saveLanguage(): void {
  chrome.storage.sync.set({ language });
}

function loadBookmarks(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get('bookmarks', (result) => {
      bookmarks = (result.bookmarks ?? {}) as BookmarkMap;
      resolve();
    });
  });
}

function saveBookmarks(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ bookmarks }, () => resolve());
  });
}

/* ============================================================================
 * フィルタ・ソート
 * ========================================================================= */

type SortField = keyof Pick<Bookmark, 'savedAt' | 'datetime'>;
type SortDir = 'asc' | 'desc';

function getFilteredSorted(): Bookmark[] {
  const items = Object.values(bookmarks);
  const query = els.search.value.trim().toLowerCase();
  const filtered = query
    ? items.filter((item) => {
        const haystack = [item.text ?? '', item.displayName ?? '', item.handle ?? '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
    : items;

  const [field, dir] = els.sort.value.split('-') as [SortField, SortDir];
  filtered.sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * (dir === 'asc' ? 1 : -1);
  });
  return filtered;
}

/* ============================================================================
 * 1 件分のカードを生成
 * ========================================================================= */

function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function createBookmarkItem(item: Bookmark): HTMLElement {
  const wrapper = document.createElement('article');
  wrapper.className = 'bookmark-item';

  const hasImage = Array.isArray(item.images) && item.images.length > 0;
  if (hasImage) wrapper.classList.add('has-image');

  // メタ情報（投稿者・時刻）
  const meta = document.createElement('div');
  meta.className = 'bookmark-meta';
  const line1 = document.createElement('div');
  line1.className = 'bookmark-meta-line1';
  if (item.displayName) {
    const a = document.createElement('span');
    a.className = 'bookmark-author';
    a.textContent = item.displayName;
    line1.appendChild(a);
  }
  if (item.handle) {
    const h = document.createElement('span');
    h.className = 'bookmark-handle';
    h.textContent = item.handle;
    line1.appendChild(h);
  }
  meta.appendChild(line1);
  if (item.datetime) {
    const time = document.createElement('span');
    time.className = 'bookmark-time';
    time.textContent = formatDate(item.datetime);
    meta.appendChild(time);
  }
  wrapper.appendChild(meta);

  // 添付画像（複数あれば 1 枚目だけ + 残数バッジ）
  if (hasImage) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'bookmark-image-wrapper';
    const img = document.createElement('img');
    img.className = 'bookmark-image';
    img.src = item.images[0] ?? '';
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      // X 側で画像が取得できなかった場合はカード自体から画像領域を消す
      imgWrapper.style.display = 'none';
      wrapper.classList.remove('has-image');
    });
    imgWrapper.appendChild(img);
    if (item.images.length > 1) {
      const count = document.createElement('span');
      count.className = 'bookmark-image-count';
      count.textContent = `+${item.images.length - 1}`;
      imgWrapper.appendChild(count);
    }
    wrapper.appendChild(imgWrapper);
  }

  // 本文
  const p = document.createElement('p');
  p.className = 'bookmark-text';
  if (item.text) {
    p.textContent = item.text;
  } else {
    p.classList.add('empty');
    p.textContent = tr('noText');
  }
  wrapper.appendChild(p);

  // アクション（元投稿リンク・削除）
  const actions = document.createElement('div');
  actions.className = 'bookmark-actions';
  if (item.url) {
    const link = document.createElement('a');
    link.className = 'bookmark-link';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = tr('openOriginal');
    actions.appendChild(link);
  } else {
    const span = document.createElement('span');
    span.className = 'bookmark-link';
    span.style.color = 'var(--text-tertiary)';
    span.textContent = tr('urlUnavailable');
    actions.appendChild(span);
  }
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'bookmark-delete';
  del.textContent = tr('delete');
  del.addEventListener('click', () => removeBookmark(item.id));
  actions.appendChild(del);

  wrapper.appendChild(actions);
  return wrapper;
}

/* ============================================================================
 * 描画
 * ========================================================================= */

function render(): void {
  applyLanguage();
  const items = getFilteredSorted();
  const total = Object.keys(bookmarks).length;
  els.count.textContent = formatCount(total);

  els.list.innerHTML = '';

  // 0 件: 「まだ無い」、検索ヒット 0: 「該当無し」、それ以外: 一覧
  if (total === 0) {
    els.empty.classList.remove('hidden');
    els.noResults.classList.add('hidden');
    return;
  }
  if (items.length === 0) {
    els.empty.classList.add('hidden');
    els.noResults.classList.remove('hidden');
    return;
  }
  els.empty.classList.add('hidden');
  els.noResults.classList.add('hidden');

  // DocumentFragment で一括追加（リフロー回数を抑える）
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.appendChild(createBookmarkItem(item));
  }
  els.list.appendChild(fragment);
}

/* ============================================================================
 * 削除・全削除・エクスポート
 * ========================================================================= */

async function removeBookmark(id: string): Promise<void> {
  if (!bookmarks[id]) return;
  delete bookmarks[id];
  await saveBookmarks();
  render();
}

async function clearAll(): Promise<void> {
  const total = Object.keys(bookmarks).length;
  if (total === 0) return;
  const ok = confirm(tr('deleteAllConfirm', { count: formatCount(total) }));
  if (!ok) return;
  bookmarks = {};
  await saveBookmarks();
  render();
}

function exportJson(): void {
  const data = JSON.stringify(bookmarks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().split('T')[0] ?? 'export';
  a.download = `quiet-x-bookmarks-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Blob URL の解放（次のイベントループで OK）
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ============================================================================
 * イベント配線
 * ========================================================================= */

els.search.addEventListener('input', render);
els.sort.addEventListener('change', render);
els.languageSelect.addEventListener('change', () => {
  language = normalizeLanguage(els.languageSelect.value);
  saveLanguage();
  render();
});
els.exportBtn.addEventListener('click', exportJson);
els.clearAllBtn.addEventListener('click', clearAll);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.bookmarks) {
    bookmarks = (changes.bookmarks.newValue ?? {}) as BookmarkMap;
    render();
  } else if (areaName === 'sync' && changes.language) {
    language = normalizeLanguage(changes.language.newValue);
    render();
  }
});

/* ============================================================================
 * 初期化
 * ========================================================================= */

void Promise.all([loadLanguage(), loadBookmarks()]).then(render);

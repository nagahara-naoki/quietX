import {
  getMessages,
  type MessageDictionary,
  type MessageKey,
  normalizeLanguage,
  t as translate
} from '../shared/i18n';
import { DEFAULT_SETTINGS, loadSettings } from '../shared/settings';
import type { Bookmark, BookmarkMap, Settings } from '../shared/types';
import { KEYWORD_PATTERN_RE, normalizeCicadaLevel } from '../shared/util';

/**
 * 「長文を投稿したアカウントを非表示」機能で、これまでに長文を投稿したと
 * 判定したハンドル（"@name"）の集合。同一セッション中は持ち越して、
 * 後から流れてきた同アカウントの短い投稿も連動して非表示にする。
 */
const longPostBannedHandles = new Set<string>();

/* ============================================================================
 * 状態
 * ========================================================================= */

let settings: Settings = { ...DEFAULT_SETTINGS };
let messages: MessageDictionary = getMessages(settings.language);
let compiledKeywords: CompiledKeyword[] = [];
let bookmarkedIds = new Set<string>();
let lastPath = '';

type CompiledKeyword = { type: 'regex'; pattern: RegExp } | { type: 'plain'; text: string };

/* ============================================================================
 * セレクタ・属性定数
 * ========================================================================= */

const SHOW_MORE_SELECTOR = '[data-testid="tweet-text-show-more-link"]';
const TWEET_CELL_SELECTOR = '[data-testid="cellInnerDiv"]';
const ARTICLE_SELECTOR = 'article[role="article"]';

const ATTR_SHOW_MORE_CLICKED = 'data-xf-showmore-clicked';
const ATTR_BM_BUTTON = 'data-xf-bm-button';
const ATTR_LONGPOST_CHECKED = 'data-xf-longpost-checked';
const ATTR_LONGPOST_HIDDEN = 'data-xf-longpost-hidden';

/** 日本語UIでもリポスト判定が効くよう両言語のラベルを並べる。 */
const REPOST_TEXT_RE = /リポスト|リツイート|reposted|retweeted/i;

/* ============================================================================
 * メディア（動画・画像）非表示
 *
 * `hideMediaContainers` は selector に一致する要素から領域確保のラッパー
 * （aria-labelledby を持つ親、または article/cellInnerDiv 直下）まで遡って
 * `display:none` する。空白も詰めるための処理。
 * ========================================================================= */

interface MediaHider {
  settingKey: keyof Pick<Settings, 'hideVideos' | 'hideImages'>;
  selector: string;
  processedAttr: string;
  hiddenAttr: string;
}

const MEDIA_HIDERS: MediaHider[] = [
  {
    settingKey: 'hideVideos',
    selector:
      '[data-testid="videoPlayer"], [data-testid="videoComponent"], [data-testid="previewInterstitial"]',
    processedAttr: 'data-xf-video-processed',
    hiddenAttr: 'data-xf-video-hidden'
  },
  {
    settingKey: 'hideImages',
    selector:
      '[data-testid="tweetPhoto"], [data-testid="card.wrapper"], [data-testid="card.layoutLarge.media"], [data-testid="card.layoutSmall.media"]',
    processedAttr: 'data-xf-image-processed',
    hiddenAttr: 'data-xf-image-hidden'
  }
];

function hideMediaContainers(cfg: MediaHider): void {
  document.querySelectorAll<HTMLElement>(cfg.selector).forEach((el) => {
    if (el.hasAttribute(cfg.processedAttr)) return;
    let target: HTMLElement = el;
    let cursor: HTMLElement | null = el.parentElement;
    while (cursor) {
      if (cursor.tagName === 'ARTICLE') break;
      const tid = cursor.getAttribute('data-testid');
      if (tid === 'tweet' || tid === 'cellInnerDiv') break;
      target = cursor;
      if (cursor.hasAttribute('aria-labelledby')) break;
      cursor = cursor.parentElement;
    }
    target.style.display = 'none';
    target.setAttribute(cfg.hiddenAttr, '1');
    el.setAttribute(cfg.processedAttr, '1');
  });
}

function unhideMediaContainers(cfg: MediaHider): void {
  document.querySelectorAll<HTMLElement>(`[${cfg.hiddenAttr}]`).forEach((el) => {
    el.style.display = '';
    el.removeAttribute(cfg.hiddenAttr);
  });
  document.querySelectorAll<HTMLElement>(`[${cfg.processedAttr}]`).forEach((el) => {
    el.removeAttribute(cfg.processedAttr);
  });
}

/**
 * `incrementalOnly=true` のときは「設定 ON のみ hide を実行」する。
 * MutationObserver の高頻度コールバックでは false（unhide）の処理が無駄なので回避。
 */
function applyMediaHiders(incrementalOnly = false): void {
  for (const cfg of MEDIA_HIDERS) {
    if (settings[cfg.settingKey]) {
      hideMediaContainers(cfg);
    } else if (!incrementalOnly) {
      unhideMediaContainers(cfg);
    }
  }
}

/* ============================================================================
 * 「もっと見る」自動展開
 *
 * `<a href="...">` 形式は X のツイート詳細へ遷移してしまうため、
 * インライン展開用の `<span>` / `<button>` だけクリック対象にする。
 * ========================================================================= */

function expandShowMoreLinks(): void {
  document.querySelectorAll<HTMLElement>(SHOW_MORE_SELECTOR).forEach((el) => {
    if (el.hasAttribute(ATTR_SHOW_MORE_CLICKED)) return;
    el.setAttribute(ATTR_SHOW_MORE_CLICKED, '1');
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href && href !== '#') return;
    }
    el.click();
  });
}

/* ============================================================================
 * キーワード／リポスト：cell 単位での非表示
 * ========================================================================= */

function compileKeywords(): void {
  compiledKeywords = (settings.keywords ?? [])
    .map<CompiledKeyword | null>((raw) => {
      if (typeof raw !== 'string') return null;
      const kw = raw.trim();
      if (!kw) return null;
      const m = kw.match(KEYWORD_PATTERN_RE);
      if (m?.[1] !== undefined) {
        try {
          return { type: 'regex', pattern: new RegExp(m[1], m[2] ?? '') };
        } catch {
          return null;
        }
      }
      return { type: 'plain', text: kw.toLowerCase() };
    })
    .filter((v): v is CompiledKeyword => v !== null);
}

function tweetMatchesKeyword(text: string): boolean {
  if (!text || compiledKeywords.length === 0) return false;
  const lower = text.toLowerCase();
  return compiledKeywords.some((k) =>
    k.type === 'regex' ? k.pattern.test(text) : lower.includes(k.text)
  );
}

function cellMatchesKeyword(cell: HTMLElement): boolean {
  const tweet = cell.querySelector<HTMLElement>('[data-testid="tweet"], article');
  if (!tweet) return false;
  return tweetMatchesKeyword(tweet.textContent ?? '');
}

/**
 * セル内の article から投稿者ハンドル（"@name"）を取り出す。
 * `extractTweetData` と同じく `data-testid="User-Name"` のテキストを
 * `@` と `·` で分解する単純なパース。リポストの場合は `socialContext` で
 * 表示名が前置されるが、`User-Name` 自体は元投稿者のハンドルを含む。
 */
function getCellHandle(cell: HTMLElement): string | null {
  const userEl = cell.querySelector<HTMLElement>('[data-testid="User-Name"]');
  if (!userEl) return null;
  const fullText = userEl.textContent ?? '';
  const atIdx = fullText.indexOf('@');
  if (atIdx < 0) return null;
  const rest = fullText.substring(atIdx);
  const dotIdx = rest.indexOf('·');
  const handle = (dotIdx > 0 ? rest.substring(0, dotIdx) : rest).trim();
  return handle.length > 1 ? handle : null;
}

/**
 * 投稿本文の文字数を取り出す。「もっと見る」で折り畳まれている投稿は
 * 必ず長文なので、本文の長さに関わらず長文扱いにする。
 */
function getCellPostLength(cell: HTMLElement): number {
  const textEl = cell.querySelector<HTMLElement>('[data-testid="tweetText"]');
  const text = textEl?.textContent ?? '';
  const hasShowMore = !!cell.querySelector(SHOW_MORE_SELECTOR);
  // 折り畳み中の投稿は本文長を Number.MAX_SAFE_INTEGER 扱いとし、
  // 必ずしきい値を超える
  return hasShowMore ? Number.MAX_SAFE_INTEGER : text.length;
}

function cellIsRepost(cell: HTMLElement): boolean {
  const sc = cell.querySelector<HTMLElement>('[data-testid="socialContext"]');
  if (!sc) return false;
  return REPOST_TEXT_RE.test(sc.textContent ?? '');
}

/**
 * 外部URLを含む投稿か判定する。
 * X は本文中の外部リンクを `<a href="https://t.co/...">` で包み、
 * URL プレビューは `[data-testid="card.wrapper"]` として描画する。
 * @mention や #hashtag は `href="/..."` で始まる相対リンクなので除外できる。
 */
function cellHasExternalUrl(cell: HTMLElement): boolean {
  const tweetText = cell.querySelector<HTMLElement>('[data-testid="tweetText"]');
  if (tweetText) {
    for (const a of tweetText.querySelectorAll('a')) {
      const href = a.getAttribute('href') ?? '';
      if (/^https?:\/\//i.test(href)) return true;
    }
  }
  return !!cell.querySelector('[data-testid="card.wrapper"]');
}

interface CellHider {
  settingKey: keyof Pick<Settings, 'hideKeywords' | 'hideReposts' | 'hideUrlPosts'>;
  hiddenAttr: string;
  matches: (cell: HTMLElement) => boolean;
  /** true を返したらヒット判定全体をスキップ（例: コンパイル済みキーワードが空のとき）。 */
  skipWhen?: () => boolean;
}

const CELL_HIDERS: CellHider[] = [
  {
    settingKey: 'hideKeywords',
    hiddenAttr: 'data-xf-keyword-hidden',
    matches: cellMatchesKeyword,
    skipWhen: () => compiledKeywords.length === 0
  },
  {
    settingKey: 'hideReposts',
    hiddenAttr: 'data-xf-repost-hidden',
    matches: cellIsRepost
  },
  {
    settingKey: 'hideUrlPosts',
    hiddenAttr: 'data-xf-url-hidden',
    matches: cellHasExternalUrl
  }
];

function hideMatchingCells(cfg: CellHider): void {
  if (!settings[cfg.settingKey]) return;
  if (cfg.skipWhen?.()) return;
  document.querySelectorAll<HTMLElement>(TWEET_CELL_SELECTOR).forEach((cell) => {
    if (cell.hasAttribute(cfg.hiddenAttr)) return;
    if (cfg.matches(cell)) {
      cell.style.display = 'none';
      cell.setAttribute(cfg.hiddenAttr, '1');
    }
  });
}

/** 設定 OFF か、もう条件にマッチしないセルを表示に戻してから、改めて hide を流す。 */
function refreshCellHides(cfg: CellHider): void {
  document.querySelectorAll<HTMLElement>(`[${cfg.hiddenAttr}]`).forEach((cell) => {
    if (!settings[cfg.settingKey] || !cfg.matches(cell)) {
      cell.style.display = '';
      cell.removeAttribute(cfg.hiddenAttr);
    }
  });
  hideMatchingCells(cfg);
}

/* ============================================================================
 * 長文を投稿したアカウントを非表示
 *
 * 2 段階のスキャン:
 *   1) 未チェックのセルから本文長を取り出し、しきい値を超えるものは
 *      投稿者ハンドルを `longPostBannedHandles` に追加する。
 *   2) ハンドルが BAN セットに入っているセルを `display:none`。
 *
 * `data-xf-longpost-checked` で同じセルを何度も計測しないよう抑止する。
 * しきい値や ON/OFF が変わったときは `resetLongPostState` で全リセット。
 * ========================================================================= */

function resetLongPostState(): void {
  longPostBannedHandles.clear();
  document.querySelectorAll<HTMLElement>(`[${ATTR_LONGPOST_CHECKED}]`).forEach((el) => {
    el.removeAttribute(ATTR_LONGPOST_CHECKED);
  });
  document.querySelectorAll<HTMLElement>(`[${ATTR_LONGPOST_HIDDEN}]`).forEach((el) => {
    el.style.display = '';
    el.removeAttribute(ATTR_LONGPOST_HIDDEN);
  });
}

function applyLongPostHides(): void {
  if (!settings.hideLongPostAccounts) return;
  const threshold = settings.longPostThreshold;
  const cells = document.querySelectorAll<HTMLElement>(TWEET_CELL_SELECTOR);

  // pass 1: 新たに見つかった長文の投稿者をハンドル集合へ追加
  cells.forEach((cell) => {
    if (cell.hasAttribute(ATTR_LONGPOST_CHECKED)) return;
    const handle = getCellHandle(cell);
    if (!handle) return;
    cell.setAttribute(ATTR_LONGPOST_CHECKED, '1');
    if (getCellPostLength(cell) >= threshold) {
      longPostBannedHandles.add(handle);
    }
  });

  // pass 2: BAN リストにあるアカウントの投稿を非表示
  if (longPostBannedHandles.size === 0) return;
  cells.forEach((cell) => {
    if (cell.hasAttribute(ATTR_LONGPOST_HIDDEN)) return;
    const handle = getCellHandle(cell);
    if (handle && longPostBannedHandles.has(handle)) {
      cell.style.display = 'none';
      cell.setAttribute(ATTR_LONGPOST_HIDDEN, '1');
    }
  });
}

/* ============================================================================
 * ページタイプ・<html> クラスの切り替え
 *
 * CSS は `xf-cicada-on` / `xf-cicada-lv2` 等のクラスをトリガに動くため、
 * 設定変更時にここを更新するだけで CSS 側のルールが自動的に効く。
 * ========================================================================= */

function updatePageType(): void {
  const path = location.pathname;
  if (path === lastPath) return;
  lastPath = path;
  document.documentElement?.classList.toggle('xf-detail-page', path.includes('/status/'));
}

function applyClassToggles(): void {
  const html = document.documentElement;
  if (!html) return;
  const lvl = normalizeCicadaLevel(settings.cicadaMode);
  html.classList.toggle('xf-hover-on', settings.hideHoverCard);
  html.classList.toggle('xf-video-on', settings.hideVideos);
  html.classList.toggle('xf-image-on', settings.hideImages);
  html.classList.toggle('xf-cicada-on', lvl >= 1);
  html.classList.toggle('xf-cicada-lv2', lvl >= 2);
}

/* ============================================================================
 * ブックマーク機能（X のアクションバーに⭐ボタンを注入）
 * ========================================================================= */

function loadBookmarkedIds(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get('bookmarks', (result) => {
      const bookmarks = (result.bookmarks ?? {}) as BookmarkMap;
      bookmarkedIds = new Set(Object.keys(bookmarks));
      resolve();
    });
  });
}

/** article 要素から保存に必要な情報を抜き出す。失敗時は null。 */
function extractTweetData(article: HTMLElement): Bookmark | null {
  const timeEl = article.querySelector('time');
  const linkEl = timeEl?.closest('a');
  const url = linkEl?.href ?? '';
  const idMatch = url.match(/\/status\/(\d+)/);
  if (!idMatch?.[1]) return null;
  const id = idMatch[1];

  const textEl = article.querySelector('[data-testid="tweetText"]');
  const text = textEl?.textContent ?? '';

  // X の "User-Name" 要素は「表示名 @handle ・ 時刻」の連結テキストになるため
  // 区切り文字（`@` と `·`）でパースして 2 値に分解している。
  let displayName = '';
  let handle = '';
  const userEl = article.querySelector('[data-testid="User-Name"]');
  if (userEl) {
    const fullText = userEl.textContent ?? '';
    const atIdx = fullText.indexOf('@');
    if (atIdx > 0) {
      displayName = fullText.substring(0, atIdx).trim();
      const rest = fullText.substring(atIdx);
      const dotIdx = rest.indexOf('·');
      handle = (dotIdx > 0 ? rest.substring(0, dotIdx) : rest).trim();
    } else {
      displayName = fullText.trim();
    }
  }

  const datetime = timeEl?.getAttribute('datetime') ?? '';
  const images = Array.from(
    article.querySelectorAll<HTMLImageElement>('[data-testid="tweetPhoto"] img')
  )
    .map((img) => img.src)
    .filter(Boolean);

  return { id, url, text, displayName, handle, datetime, images, savedAt: Date.now() };
}

function createBookmarkIcon(isSaved: boolean): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'xf-bookmark-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M12 2.75l2.84 5.75 6.35.92-4.59 4.47 1.08 6.32L12 17.22l-5.68 2.99 1.08-6.32-4.59-4.47 6.35-.92L12 2.75z'
  );
  path.setAttribute('fill', isSaved ? 'currentColor' : 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.8');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return svg;
}

function tr(key: MessageKey, values?: Record<string, string | number>): string {
  return translate(messages, key, values);
}

function updateBookmarkButtonState(btn: HTMLButtonElement, id: string): void {
  const isSaved = bookmarkedIds.has(id);
  btn.replaceChildren(createBookmarkIcon(isSaved));
  btn.classList.toggle('xf-saved', isSaved);
  btn.title = tr(isSaved ? 'removeFromQuietX' : 'saveToQuietX');
  btn.setAttribute('aria-label', btn.title);
}

function refreshBookmarkButtonLabels(): void {
  document.querySelectorAll<HTMLButtonElement>(`[${ATTR_BM_BUTTON}]`).forEach((btn) => {
    const id = btn.getAttribute(ATTR_BM_BUTTON);
    if (id) updateBookmarkButtonState(btn, id);
  });
}

function toggleBookmark(tweetData: Bookmark): void {
  chrome.storage.local.get('bookmarks', (result) => {
    const bms = (result.bookmarks ?? {}) as BookmarkMap;
    if (bms[tweetData.id]) {
      delete bms[tweetData.id];
      bookmarkedIds.delete(tweetData.id);
    } else {
      bms[tweetData.id] = tweetData;
      bookmarkedIds.add(tweetData.id);
    }
    chrome.storage.local.set({ bookmarks: bms }, () => {
      for (const btn of document.querySelectorAll<HTMLButtonElement>(
        `[${ATTR_BM_BUTTON}="${tweetData.id}"]`
      )) {
        updateBookmarkButtonState(btn, tweetData.id);
      }
    });
  });
}

function createBookmarkButton(tweetData: Bookmark): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'xf-bookmark-btn';
  btn.setAttribute(ATTR_BM_BUTTON, tweetData.id);
  updateBookmarkButtonState(btn, tweetData.id);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    // クリック時点で article から最新データを抽出し直す（編集や時刻表示の変化に追従）
    const article = btn.closest<HTMLElement>('article');
    const fresh = article ? extractTweetData(article) : tweetData;
    toggleBookmark(fresh ?? tweetData);
  });
  return btn;
}

function injectBookmarkButtons(): void {
  document.querySelectorAll<HTMLElement>(ARTICLE_SELECTOR).forEach((article) => {
    const likeBtn = article.querySelector<HTMLElement>(
      '[data-testid="like"], [data-testid="unlike"]'
    );
    const actionBar = likeBtn?.closest<HTMLElement>('[role="group"]');
    if (!actionBar) return;
    const tweetData = extractTweetData(article);
    if (!tweetData) return;
    if (actionBar.querySelector(`[${ATTR_BM_BUTTON}="${tweetData.id}"]`)) return;
    actionBar.appendChild(createBookmarkButton(tweetData));
  });
}

/** トグルが OFF になったとき、注入済みの★ボタンを DOM から取り除く。 */
function removeBookmarkButtons(): void {
  document.querySelectorAll<HTMLElement>(`[${ATTR_BM_BUTTON}]`).forEach((btn) => {
    btn.remove();
  });
}

/* ============================================================================
 * 適用フロー
 *
 * `applyAll`           : 設定変更時。ON→hide / OFF→unhide を両方流す。
 * `scheduleIncremental`: DOM 変更時。requestAnimationFrame でデバウンスし、
 *                        hide のみ実行する（OFF 時の unhide は不要）。
 * ========================================================================= */

function applyAll(): void {
  updatePageType();
  applyClassToggles();
  applyMediaHiders();
  CELL_HIDERS.forEach(refreshCellHides);
  applyLongPostHides();
  if (settings.expandShowMore) expandShowMoreLinks();
  if (settings.enableBookmarks) {
    injectBookmarkButtons();
    refreshBookmarkButtonLabels();
  } else {
    removeBookmarkButtons();
  }
}

let scheduled = false;
function scheduleIncremental(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    updatePageType();
    applyMediaHiders(true);
    CELL_HIDERS.forEach(hideMatchingCells);
    applyLongPostHides();
    if (settings.expandShowMore) expandShowMoreLinks();
    if (settings.enableBookmarks) injectBookmarkButtons();
  });
}

const observer = new MutationObserver(scheduleIncremental);

/* ============================================================================
 * ストレージ変更ハンドラ
 *
 * popup から設定を保存すると `chrome.storage.onChanged` が発火するため、
 * ローカル状態を更新して即座に再適用する（ページリロード不要）。
 * ========================================================================= */

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    // 設定キーが変わったときだけ全件再取得して正規化する
    const touchesSettings = Object.keys(changes).some((key) => key in DEFAULT_SETTINGS);
    if (!touchesSettings) return;
    // 長文 BAN は「これまで観測した本文」に依存するため、関連設定が動いた
    // ときは状態を捨てて再スキャンさせる
    const touchesLongPost =
      'hideLongPostAccounts' in changes || 'longPostThreshold' in changes;
    if (touchesLongPost) resetLongPostState();
    void loadSettings().then((next) => {
      settings = next;
      messages = getMessages(normalizeLanguage(settings.language));
      compileKeywords();
      applyAll();
    });
  } else if (areaName === 'local' && changes.bookmarks) {
    bookmarkedIds = new Set(Object.keys((changes.bookmarks.newValue as BookmarkMap) ?? {}));
    refreshBookmarkButtonLabels();
  }
});

/* ============================================================================
 * 初期化
 *
 * `document_start` で発火するため document.documentElement / body が
 * 揃うまで待つ必要がある。クラス適用だけ早めに行い、観察開始は body 待ち。
 * ========================================================================= */

async function start(): Promise<void> {
  if (!document.documentElement) {
    requestAnimationFrame(start);
    return;
  }
  updatePageType();

  const [loadedSettings] = await Promise.all([loadSettings(), loadBookmarkedIds()]);
  settings = loadedSettings;
  messages = getMessages(normalizeLanguage(settings.language));
  compileKeywords();
  applyClassToggles();

  // body が出揃うまで待ってから DOM 操作・観察開始
  const waitForBody = (): void => {
    if (!document.body) {
      requestAnimationFrame(waitForBody);
      return;
    }
    applyAll();
    observer.observe(document.body, { childList: true, subtree: true });
  };
  waitForBody();
}

void start();

/**
 * 拡張機能全体で共有する型定義。
 */

/** 蝉モードのレベル。0=オフ / 1=サイドメニュー非表示 / 2=ボタン・数値も非表示 */
export type CicadaLevel = 0 | 1 | 2;

/** UI 言語。`_locales/` のキーと一致させる。 */
export type Language = 'ja' | 'en';

/**
 * `chrome.storage.sync` に保存する設定。
 * 旧バージョンとの互換のため、読み込み時は既定値とマージし、
 * `cicadaMode` だけ boolean → number 正規化（`normalizeCicadaLevel`）が必要。
 */
export interface Settings {
  hideHoverCard: boolean;
  hideVideos: boolean;
  hideImages: boolean;
  hideKeywords: boolean;
  keywords: string[];
  hideReposts: boolean;
  expandShowMore: boolean;
  cicadaMode: CicadaLevel;
  showDescriptions: boolean;
  language: Language;
}

/** 保存した投稿（ブックマーク）1 件。`chrome.storage.local.bookmarks` に id → Bookmark で格納。 */
export interface Bookmark {
  id: string;
  url: string;
  text: string;
  displayName: string;
  handle: string;
  datetime: string;
  images: string[];
  savedAt: number;
}

export type BookmarkMap = Record<string, Bookmark>;

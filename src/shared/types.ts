/**
 * 拡張機能全体で共有する型定義。
 */

/** 蝉モードのレベル。0=オフ / 1=サイドメニュー非表示 / 2=ボタン・数値も非表示 */
export type CicadaLevel = 0 | 1 | 2;

/** UI 言語。`_locales/` のキーと一致させる。 */
export type Language = 'ja' | 'en';

/**
 * フィルタ適用範囲。`/home` のタブ単位で挙動を切り替える。
 *  - both     : 両方のタブで通常通り
 *  - foryou   : 「おすすめ」タブのときのみ適用
 *  - following: 「フォロー中」タブのときのみ適用
 *  - 上記以外のページ（プロフィール・検索など）では both と同等に常時適用
 */
export type FilterScope = 'both' | 'foryou' | 'following';

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
  hideUrlPosts: boolean;
  hideLongPostAccounts: boolean;
  longPostThreshold: number;
  expandShowMore: boolean;
  enableBookmarks: boolean;
  cicadaMode: CicadaLevel;
  showDescriptions: boolean;
  language: Language;
  filterScope: FilterScope;
  /**
   * 全機能を一時停止する。true の間は設定値を保ったまま、フィルタ系・UI 抑制系
   * （蝉モード・ホバーカード非表示など）を全停止する。再度 false にすれば
   * 即座に元の動作へ復帰する。
   */
  disableAll: boolean;
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

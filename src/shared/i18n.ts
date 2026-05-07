import type { Language } from './types';

/**
 * UI 文言の辞書。`as const` で値を型レベルに固定し、`MessageKey` を自動導出する。
 * Chrome の `_locales/` は拡張ストアの description 専用に使い、UI 文言はこちらで一元管理する。
 */
export const MESSAGES = {
  ja: {
    appName: 'Quiet X',
    languageLabel: '言語',
    languageJapanese: '日本語',
    languageEnglish: 'English',
    showDescriptions: '説明を表示',
    hideHoverCards: 'ホバーカードを非表示',
    hideHoverCardsDescription: 'プロフィールなどのホバーカードを開かないようにします。',
    removeVideos: '動画をタイムラインから非表示',
    removeVideosDescription: 'タイムライン上の動画枠を非表示にします。',
    removeImages: '画像をタイムラインから非表示',
    removeImagesDescription: '投稿に添付された画像と、URLプレビューのサムネイルを非表示にします。',
    hideReposts: 'リポストを非表示',
    hideRepostsDescription: 'リポストされた投稿をタイムラインから隠します。',
    hideUrlPosts: 'URLを含む投稿を非表示',
    hideUrlPostsDescription:
      '外部リンクやURLプレビューカードを含む投稿（アフィリエイトや誘導投稿など）を隠します。',
    hideLongPostAccounts: '文字数で投稿を非表示',
    hideLongPostAccountsDescription:
      '指定文字数を超える投稿を見つけたら、そのアカウントの投稿をすべてタイムラインから隠します。',
    longPostThresholdSuffix: '文字以上',
    hideKeywordMatches: 'キーワードを含む投稿を非表示',
    hideKeywordMatchesDescription: '登録したキーワードや正規表現に一致する投稿を隠します。',
    expandShowMore: '「もっと見る」を自動展開',
    expandShowMoreDescription: '長い投稿の「もっと見る」を初めから開いた状態にします。',
    enableBookmarks: '投稿の保存を有効化',
    enableBookmarksDescription: '各投稿の右下に★ボタンを表示し、Quiet Xにローカル保存できるようにします。',
    focusTimeline: '蝉モード',
    zennmodeDescription: 'Lv1: サイドメニューを非表示。Lv2: ボタンや数字も含めて全て非表示。',
    cicadaOff: 'オフ',
    cicadaLv1: 'Lv1',
    cicadaLv2: 'Lv2',
    hiddenKeywords: '非表示キーワード',
    hiddenKeywordsDescription: 'キーワードにヒットしたポストは表示されなくなります。',
    keywordPlaceholder: 'キーワードまたは /正規表現/',
    add: '追加',
    savedPosts: '保存した投稿',
    openSavedPosts: '保存した投稿を開く',
    shortcutLabel: 'ショートカット:',
    noHiddenKeywords: 'キーワードはまだ登録されていません',
    remove: '削除',
    invalidRegex: '正規表現が不正です: {error}',
    bookmarksPageTitle: '保存した投稿 - Quiet X',
    searchPlaceholder: '本文・投稿者で検索',
    sortNewestSaved: '保存が新しい順',
    sortOldestSaved: '保存が古い順',
    sortNewestPost: '投稿が新しい順',
    sortOldestPost: '投稿が古い順',
    export: 'エクスポート',
    clearAll: '全削除',
    noSavedPostsTitle: 'まだ保存した投稿はありません',
    noSavedPostsBody: 'Xの各投稿のアクションバーにある星ボタンでローカルに保存できます。',
    noResultsTitle: '検索結果なし',
    noResultsBody: '条件に合う保存済み投稿が見つかりませんでした。',
    noText: '(本文なし)',
    openOriginal: '元の投稿を開く',
    urlUnavailable: 'URL不明',
    delete: '削除',
    deleteAllConfirm:
      '本当に{count}の保存済み投稿をすべて削除しますか？\nこの操作は取り消せません。',
    saveToQuietX: 'Quiet Xに保存',
    removeFromQuietX: 'Quiet Xから削除'
  },
  en: {
    appName: 'Quiet X',
    languageLabel: 'Language',
    languageJapanese: '日本語',
    languageEnglish: 'English',
    showDescriptions: 'Show descriptions',
    hideHoverCards: 'Hide hover cards',
    hideHoverCardsDescription: 'Stops profile hover cards from opening over the timeline.',
    removeVideos: 'Remove videos from timeline',
    removeVideosDescription: 'Hides video blocks and preview interstitials in the timeline.',
    removeImages: 'Remove images from timeline',
    removeImagesDescription: 'Hides attached images and URL preview thumbnails.',
    hideReposts: 'Hide reposts',
    hideRepostsDescription: 'Removes reposted posts from the timeline.',
    hideUrlPosts: 'Hide posts with URLs',
    hideUrlPostsDescription:
      'Hides posts containing external links or URL preview cards (affiliate or referral posts).',
    hideLongPostAccounts: 'Hide posts by character count',
    hideLongPostAccountsDescription:
      'When a post longer than the threshold is found, every post from that account is hidden from the timeline.',
    longPostThresholdSuffix: 'characters or more',
    hideKeywordMatches: 'Hide keyword matches',
    hideKeywordMatchesDescription: 'Hides posts that match your keywords or regular expressions.',
    expandShowMore: 'Auto-expand "Show more"',
    expandShowMoreDescription: 'Expands long posts hidden behind "Show more" automatically.',
    enableBookmarks: 'Enable post saving',
    enableBookmarksDescription: 'Adds a star button to each post so you can save it locally to Quiet X.',
    focusTimeline: 'zennmode',
    zennmodeDescription: 'Lv1: hide side menus. Lv2: also hide buttons, counts, and composer.',
    cicadaOff: 'Off',
    cicadaLv1: 'Lv1',
    cicadaLv2: 'Lv2',
    hiddenKeywords: 'Hidden keywords',
    hiddenKeywordsDescription: 'Posts matching these keywords will be hidden.',
    keywordPlaceholder: 'Keyword or /regex/',
    add: 'Add',
    savedPosts: 'Saved posts',
    openSavedPosts: 'Open saved posts',
    shortcutLabel: 'Shortcut:',
    noHiddenKeywords: 'No hidden keywords yet',
    remove: 'Remove',
    invalidRegex: 'Invalid regular expression: {error}',
    bookmarksPageTitle: 'Saved Posts - Quiet X',
    searchPlaceholder: 'Search text or authors',
    sortNewestSaved: 'Newest saved',
    sortOldestSaved: 'Oldest saved',
    sortNewestPost: 'Newest post',
    sortOldestPost: 'Oldest post',
    export: 'Export',
    clearAll: 'Clear all',
    noSavedPostsTitle: 'No saved posts yet',
    noSavedPostsBody: 'Use the star button in each X post action bar to save posts locally.',
    noResultsTitle: 'No results',
    noResultsBody: 'No saved posts match the current search.',
    noText: '(No text)',
    openOriginal: 'Open original',
    urlUnavailable: 'URL unavailable',
    delete: 'Delete',
    deleteAllConfirm: 'Delete all {count}?\nThis action cannot be undone.',
    saveToQuietX: 'Save to Quiet X',
    removeFromQuietX: 'Remove from Quiet X'
  }
} as const satisfies Record<Language, Record<string, string>>;

/** 既定言語。未設定 / 不正値はこれにフォールバックする。 */
export const DEFAULT_LANGUAGE: Language = 'ja';

/** 全メッセージキーの union 型。`t(key)` の引数を型安全にチェックできる。 */
export type MessageKey = keyof (typeof MESSAGES)[typeof DEFAULT_LANGUAGE];

export type MessageDictionary = (typeof MESSAGES)[Language];

/** 任意値を `Language` に安全に丸める。 */
export function normalizeLanguage(language: unknown): Language {
  return language === 'en' ? 'en' : DEFAULT_LANGUAGE;
}

export function getMessages(language: Language): MessageDictionary {
  return MESSAGES[normalizeLanguage(language)];
}

/** `{name}` 形式のプレースホルダを `values[name]` で置換する。 */
function interpolate(message: string, values: Record<string, string | number> = {}): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : ''
  );
}

/** 翻訳文を取得する。指定言語に該当キーが無いときは既定言語にフォールバック。 */
export function t(
  messages: MessageDictionary,
  key: MessageKey,
  values?: Record<string, string | number>
): string {
  const fallback = MESSAGES[DEFAULT_LANGUAGE][key] ?? key;
  const source = (messages?.[key] ?? fallback) as string;
  return interpolate(source, values);
}

/** アイテム数の表記を言語別に整える（日本語: 「3件」 / 英語: 「3 items」）。 */
export function formatItemCount(language: Language, count: number): string {
  const normalized = normalizeLanguage(language);
  if (normalized === 'ja') return `${count}件`;
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

/**
 * `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` / `data-i18n-aria-label` の
 * 属性を持つ要素を一括で翻訳する。popup.html / bookmarks.html から呼ばれる。
 */
export function applyToDocument(language: Language): void {
  const normalized = normalizeLanguage(language);
  const messages = getMessages(normalized);
  document.documentElement.lang = normalized;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as MessageKey | undefined;
    if (key) el.textContent = t(messages, key);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder as MessageKey | undefined;
    if (key && 'placeholder' in el) {
      (el as HTMLInputElement).placeholder = t(messages, key);
    }
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle as MessageKey | undefined;
    if (key) el.title = t(messages, key);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    const key = el.dataset.i18nAriaLabel as MessageKey | undefined;
    if (key) el.setAttribute('aria-label', t(messages, key));
  });
}

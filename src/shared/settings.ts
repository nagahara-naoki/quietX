import { DEFAULT_LANGUAGE } from './i18n';
import type { Settings } from './types';
import { normalizeCicadaLevel, normalizeFilterScope, normalizeLongPostThreshold } from './util';

/**
 * 設定の既定値。`chrome.storage.sync` から読み出すときに第二引数として渡し、
 * 未保存のキーは既定値で埋まるようにする。
 */
export const DEFAULT_SETTINGS: Settings = {
  hideHoverCard: true,
  hideVideos: true,
  hideImages: false,
  hideKeywords: true,
  keywords: [],
  hideReposts: false,
  hideUrlPosts: false,
  hideLongPostAccounts: false,
  longPostThreshold: 280,
  expandShowMore: false,
  enableBookmarks: false,
  cicadaMode: 0,
  showDescriptions: false,
  language: DEFAULT_LANGUAGE,
  filterScope: 'both',
  disableAll: false
};

/**
 * 旧バージョンのストレージ値（cicadaMode が boolean だった等）を吸収しつつ、
 * 既定値とマージして安全な Settings を返す。
 */
export function normalizeSettings(raw: Partial<Settings> | null | undefined): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  merged.cicadaMode = normalizeCicadaLevel(merged.cicadaMode);
  merged.longPostThreshold = normalizeLongPostThreshold(merged.longPostThreshold);
  merged.filterScope = normalizeFilterScope(merged.filterScope);
  return merged;
}

/**
 * Promise で `chrome.storage.sync.get(DEFAULT_SETTINGS)` をラップする。
 * `chrome` の型定義が `Partial<{ [k: string]: unknown }>` を要求するため、
 * 既定値を一度 unknown 経由で適合させる必要がある。
 */
export function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS as unknown as Record<string, unknown>, (result) => {
      resolve(normalizeSettings(result as Partial<Settings>));
    });
  });
}

export function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings as unknown as Record<string, unknown>, () => resolve());
  });
}

import type { CicadaLevel } from './types';

/**
 * キーワード文字列が `/pattern/flags` 形式かを判定する正規表現。
 * `validateRegex` と `compileKeywords` の両方で使うので 1 箇所に集約している。
 */
export const KEYWORD_PATTERN_RE = /^\/(.+)\/([gimsuy]*)$/;

/**
 * `cicadaMode` を CicadaLevel(0/1/2) に正規化する。
 *
 * 旧バージョン（v4.8 以前）では boolean で保存していたため、
 * 既存ユーザーのストレージから読み出した値を安全に扱うために必要。
 *  - true  → 2 (Lv2 が旧 ON 相当)
 *  - false → 0
 *  - 1     → 1
 *  - その他/不正値 → 0
 */
export function normalizeCicadaLevel(value: unknown): CicadaLevel {
  if (value === true) return 2;
  if (value === false) return 0;
  const n = Number(value);
  if (n === 1) return 1;
  if (n >= 2) return 2;
  return 0;
}

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

/** 長文判定の文字数しきい値の既定値（X 旧無料枠と同じ）。 */
export const DEFAULT_LONG_POST_THRESHOLD = 280;
/** ユーザーが設定可能な下限。これより小さいとほぼ全投稿が長文扱いになるため。 */
export const MIN_LONG_POST_THRESHOLD = 1;
/** 上限。極端に大きな値を入れて事実上の無効化を避ける。 */
export const MAX_LONG_POST_THRESHOLD = 100000;

/**
 * `longPostThreshold` を安全な整数に丸める。
 * 不正値や範囲外は既定値にフォールバックする。
 */
export function normalizeLongPostThreshold(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_LONG_POST_THRESHOLD;
  if (n < MIN_LONG_POST_THRESHOLD) return MIN_LONG_POST_THRESHOLD;
  if (n > MAX_LONG_POST_THRESHOLD) return MAX_LONG_POST_THRESHOLD;
  return n;
}

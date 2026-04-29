import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';
import manifest from './manifest.config';

/**
 * Vite + crxjs の設定。
 * - manifest.config.ts のエントリポイントから依存ツリーを辿ってバンドルする
 * - `_locales/` と `icons/` は public 相当として静的にコピーされる
 * - 開発時は `vite` で HMR、リリース時は `vite build` で `dist/` に出力
 */
export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: 'esnext',
    sourcemap: false,
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Chrome は `_` 始まりのディレクトリ名を予約しているため `chunks/` を使う
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  // _locales と icons をビルド出力にコピーするため public ディレクトリ機能を活用
  publicDir: 'public'
});

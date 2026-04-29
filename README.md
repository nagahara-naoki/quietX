# Quiet X

Quiet Xは、Xのタイムラインを静かに整えるChrome拡張機能です。ホバーカード、動画、リポスト、キーワード一致投稿などを抑制し、必要な投稿だけをローカルに保存できます。

## 主な機能

- ホバーカードを非表示。
- タイムライン上の動画とプレビューを削除。
- リポストを非表示。
- 通常キーワードまたは`/正規表現/`に一致する投稿を非表示。
- 蝉モードで余計なUIを抑制。
- X上の星ボタンから投稿をローカル保存。
- 保存した投稿の検索、並び替え、エクスポート、全削除。
- 日本語/EnglishのUI切替。選択した言語はChrome sync storageに保存されます。

## 権限

- `storage`: 拡張機能の設定、言語設定、保存した投稿を保持します。
- `https://x.com/*` と `https://twitter.com/*`: X上でフィルターとローカル保存ボタンを動作させます。

## ショートカット

`Alt+Shift+X`でポップアップを開けます。

## プライバシー

Quiet Xは分析機能や外部ネットワークサービスを使用しません。設定と言語はChrome sync storage、保存した投稿はブラウザ内のlocal storageに保存されます。

## 開発

このプロジェクトは Vite + TypeScript + Biome でビルド・開発します。

### セットアップ

```sh
npm install
```

### 主なスクリプト

| コマンド             | 役割                                      |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Vite 開発モード（HMR、`dist/` を更新）    |
| `npm run build`      | 本番ビルド（`dist/` に出力）              |
| `npm run typecheck`  | TypeScript の型チェックのみ実行           |
| `npm run check`      | Biome（フォーマット + リンター）を一括適用 |
| `npm run format`     | Biome でフォーマットのみ実行              |
| `npm run lint`       | Biome でリンターのみ実行                  |

### Chrome に読み込む

1. `npm run build` でビルド
2. Chrome の `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」で `dist/` ディレクトリを選択

`npm run dev` 中はファイル変更が `dist/` に反映されるので、拡張機能管理画面でリロードすれば更新が反映されます。

### ディレクトリ構成

```
src/
├── manifest 関連は manifest.config.ts と vite.config.ts
├── background.ts        … service worker
├── popup.html / .ts / .css
├── bookmarks.html / .ts / .css
├── content/
│   └── block.ts / .css  … X タイムラインに注入
└── shared/              … i18n / 設定 / 共通ユーティリティ
public/
├── _locales/            … Chrome Web Store 用ローカライズ
└── icons/               … 拡張機能アイコン
```
# quietX

# Quiet X

[日本語](./README.md) | [English](./README-en.md)

<p align="center">
  <img src="./cat.png" alt="Quiet X — flying cat" width="320">
  <br>
  <sub><em>うちで飼っている猫を AI で飛ばしました。</em></sub>
</p>

Quiet X は、X(旧Twitter) のタイムラインを静かに整える Chrome 拡張機能です。ホバーカード・動画・画像・リポスト・キーワード一致投稿・URL を含む投稿などをまとめて抑制し、★ボタンで気になる投稿をローカルに保存できます。**分析・トラッキングなし、外部送信なし、完全ローカル動作**。

- リポジトリ: https://github.com/nagahara-naoki/quietX
- 不具合報告 / 要望: https://github.com/nagahara-naoki/quietX/issues

## 主な機能

### タイムラインを静かに整える

- ホバーカード(プロフィール吹き出し)を非表示
- タイムライン上の動画 / プレビューを非表示
- タイムライン上の画像 / URL プレビューサムネイルを非表示
- リポストを非表示
- キーワード一致投稿を非表示(通常テキスト / `/正規表現/`)
- URL を含む投稿を非表示(アフィリエイト・誘導投稿の抑制)
- 文字数で投稿を非表示 — 指定文字数を超える投稿を見つけたアカウントを丸ごと非表示(しきい値カスタマイズ可)
- 「もっと見る」を自動展開
- 「蝉モード」(Lv1/Lv2) で余計な UI をまとめて抑制

### 自分だけのブックマーク

- 投稿の保存機能を ON/OFF 切替可能(必要なときだけ★ボタン表示)
- X 上の★ボタンから投稿をワンクリックでローカル保存
- 保存した投稿の検索 / 並び替え / エクスポート / 全削除
- 保存先はブラウザ内のみ。X 公式とは別に管理可能

### UI

- 日本語 / English 切替(Chrome sync storage に保存)
- ポップアップ起動ショートカット: `Alt + Shift + X`

## 権限

- `storage`: 拡張機能の設定、言語設定、保存した投稿の保持
- `https://x.com/*` と `https://twitter.com/*`: X 上でのフィルター動作と★ボタンの注入

## プライバシー

Quiet X は分析機能・トラッキング・外部サーバーへの通信を一切行いません。

- 設定と言語: Chrome sync storage(あなたの Google アカウント内)
- 保存した投稿: ブラウザ内 local storage(端末内のみ)

ソースコードは公開されているため、何が動いているかを自分の目で検証できます。

## 開発

Vite + TypeScript + Biome でビルド・開発します。

### セットアップ

```sh
npm install
```

### 主なスクリプト

| コマンド            | 役割                                     |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Vite 開発モード(HMR、`dist/` を更新)     |
| `npm run build`     | 本番ビルド(`dist/` に出力)               |
| `npm run typecheck` | TypeScript 型チェックのみ実行            |
| `npm run check`     | Biome(フォーマット + リンター)を一括適用 |
| `npm run format`    | Biome でフォーマットのみ実行             |
| `npm run lint`      | Biome でリンターのみ実行                 |

### Chrome に読み込む

1. `npm run build` でビルド
2. Chrome の `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」で `dist/` ディレクトリを選択

`npm run dev` 中はファイル変更が `dist/` に反映されるので、拡張機能管理画面でリロードすれば更新が反映されます。

### ディレクトリ構成

```
src/
├── background.ts          … service worker
├── popup.html / .ts / .css
├── bookmarks.html / .ts / .css
├── content/
│   └── block.ts / .css    … X タイムラインに注入
└── shared/                … i18n / 設定 / 共通ユーティリティ
public/
├── _locales/              … Chrome Web Store 用ローカライズ
└── icons/                 … 拡張機能アイコン
manifest.config.ts         … manifest 定義(vite.config.ts と連携)
```

## ライセンス

リポジトリの LICENSE を参照してください。

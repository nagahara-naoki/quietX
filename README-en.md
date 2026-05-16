# Quiet X

[日本語](./README.md) | [English](./README-en.md)

<p align="center">
  <img src="./public/icons/icon128.png" alt="Quiet X logo" width="128">
</p>

Quiet X is a Chrome extension that quietly tidies up your X (formerly Twitter) timeline. It hides hover cards, videos, images, reposts, keyword matches, posts containing URLs, and more — and lets you save posts you care about locally with a ★ button. **No analytics, no tracking, no external network calls — fully local.**

- Repository: https://github.com/nagahara-naoki/quietX
- Bug reports / feature requests: https://github.com/nagahara-naoki/quietX/issues

## Features

### Quiet your timeline

- Hide profile hover cards
- Hide videos and previews from the timeline
- Hide images and URL preview thumbnails from the timeline
- Hide reposts
- Hide posts matching keywords (plain text or `/regex/`)
- Hide posts containing external URLs (affiliate / referral spam)
- Hide every post from accounts that post above a character threshold (customizable)
- Auto-expand "Show more" so long posts open in full
- "Zen mode" (Lv1 / Lv2) suppresses extra UI in one switch

### Your own bookmarks

- Toggle the post-saving feature on or off (the ★ button appears only when enabled)
- Save posts to your browser with one click via the ★ button on X
- Search, sort, export, and clear saved posts anytime
- Stored locally in your browser — fully separate from X's official bookmarks

### UI

- Switch between 日本語 / English (saved in Chrome sync storage)
- Open the popup with `Alt + Shift + X`

## Permissions

- `storage`: stores settings, language preference, and saved posts
- `https://x.com/*` and `https://twitter.com/*`: powers the timeline filters and the ★ button on X

## Privacy

Quiet X performs no analytics, no tracking, and no external network calls.

- Settings & language: Chrome sync storage (your Google account)
- Saved posts: browser local storage (this device only)

The source is open, so you can verify exactly what runs in your browser.

## Development

Built with Vite + TypeScript + Biome.

### Setup

```sh
npm install
```

### Scripts

| Command             | Purpose                               |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Vite dev mode (HMR, updates `dist/`)  |
| `npm run build`     | Production build (outputs to `dist/`) |
| `npm run typecheck` | TypeScript type-check only            |
| `npm run check`     | Biome format + lint in one shot       |
| `npm run format`    | Biome format only                     |
| `npm run lint`      | Biome lint only                       |

### Load into Chrome

1. Run `npm run build`
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` directory

While `npm run dev` is running, file changes are reflected in `dist/`. Reload the extension from the management page to pick up updates.

### Directory layout

```
src/
├── background.ts          … service worker
├── popup.html / .ts / .css
├── bookmarks.html / .ts / .css
├── content/
│   └── block.ts / .css    … injected into X timeline
└── shared/                … i18n / settings / shared utilities
public/
├── _locales/              … Chrome Web Store localization
└── icons/                 … extension icons
manifest.config.ts         … manifest definition (works with vite.config.ts)
```

## License

See the LICENSE file in the repository.

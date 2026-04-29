import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

/**
 * Chrome 拡張のマニフェスト定義（MV3）。
 * `@crxjs/vite-plugin` がここで指定したエントリポイント（HTML/TS/CSS）を
 * バンドルし、出力先 `dist/` に展開する。
 */
export default defineManifest({
  manifest_version: 3,
  name: '__MSG_appName__',
  short_name: '__MSG_appShortName__',
  version: pkg.version.split('-')[0] || '0.0.0',
  default_locale: 'ja',
  description: '__MSG_appDescription__',
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  permissions: ['storage'],
  host_permissions: ['https://x.com/*', 'https://twitter.com/*'],
  action: {
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    },
    default_popup: 'src/popup.html',
    default_title: '__MSG_actionTitle__'
  },
  background: {
    service_worker: 'src/background.ts'
  },
  commands: {
    _execute_action: {
      suggested_key: { default: 'Alt+Shift+X', mac: 'Alt+Shift+X' },
      description: '__MSG_commandOpenPopup__'
    }
  },
  content_scripts: [
    {
      matches: ['https://x.com/*', 'https://twitter.com/*'],
      js: ['src/content/block.ts'],
      css: ['src/content/block.css'],
      run_at: 'document_start'
    }
  ],
  web_accessible_resources: [
    {
      resources: ['src/bookmarks.html'],
      matches: ['https://x.com/*', 'https://twitter.com/*']
    }
  ]
});

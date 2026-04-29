/**
 * バックグラウンド (service worker) の唯一の役割は「X 以外のタブでツールバー
 * アイコンを無効にする」こと。これにより別サイトでクリックしても何も
 * 起きないことが視覚的に伝わる。
 */

const X_HOST_RE = /^https:\/\/(x\.com|twitter\.com)(\/|$)/;

function isXUrl(url: string | undefined): boolean {
  return typeof url === 'string' && X_HOST_RE.test(url);
}

function updateActionForTab(tab: chrome.tabs.Tab | undefined): void {
  if (!tab || typeof tab.id !== 'number' || tab.id < 0) return;
  const url = tab.url ?? tab.pendingUrl ?? '';
  try {
    if (isXUrl(url)) {
      chrome.action.enable(tab.id);
    } else {
      chrome.action.disable(tab.id);
    }
  } catch {
    // service worker のライフサイクル都合で稀にタブが消えていることがあるため握りつぶす
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  // URL が変わった or 読み込み状態が変わった時だけ更新（無駄な API 呼び出しを避ける）
  if (changeInfo.url || changeInfo.status === 'loading' || changeInfo.status === 'complete') {
    updateActionForTab(tab);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    updateActionForTab(tab);
  } catch {
    // 削除直後のタブにアクセスしたケースを握りつぶす
  }
});

/** インストール直後・ブラウザ起動直後に既存タブの有効/無効を一括同期する。 */
async function initAllTabs(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(updateActionForTab);
  } catch {
    // ignore
  }
}

chrome.runtime.onInstalled.addListener(initAllTabs);
chrome.runtime.onStartup.addListener(initAllTabs);

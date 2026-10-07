// アイコンをクリックしたら、現在のタブを記録して小さなウィンドウで popup.html を開く。
// (通常のポップアップは生体認証ダイアログが出ると閉じてしまうため、別ウィンドウにしている)
let winId = null;

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.storage.session.set({ targetTabId: tab.id });
  if (winId !== null) {
    try { await chrome.windows.update(winId, { focused: true }); return; } catch (_) { winId = null; }
  }
  const w = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup", width: 380, height: 420
  });
  winId = w.id;
});

chrome.windows.onRemoved.addListener((id) => { if (id === winId) winId = null; });

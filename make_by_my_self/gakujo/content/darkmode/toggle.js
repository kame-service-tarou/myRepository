GTP.register({
  id: 'darkmode-toggle',
  defaultOn: true, // ボタン自体の表示ON/OFF
  enable() {
    if (document.getElementById('gtp-theme-btn')) return;

    const add = () => {
      if (document.getElementById('gtp-theme-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'gtp-theme-btn';
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        const { features = {} } = await chrome.storage.sync.get('features');
        features.darkmode = !(features.darkmode ?? false);
        await chrome.storage.sync.set({ features });
      });
      document.body.appendChild(btn);
      refresh();
    };

    // document_start で実行されるので、body ができてから追加する
    if (document.body) add();
    else document.addEventListener('DOMContentLoaded', add, { once: true });
  },
  disable() {
    document.getElementById('gtp-theme-btn')?.remove();
  },
});

// ボタンの表示(🌙 / ☀️)を現在のテーマに合わせる
function refresh() {
  const btn = document.getElementById('gtp-theme-btn');
  if (!btn) return;
  const dark = document.documentElement.dataset.gtpTheme === 'dark';
  btn.textContent = dark ? '☀️' : '🌙';
  btn.title = dark ? 'ライトモードにする' : 'ダークモードにする';
}

new MutationObserver(refresh).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-gtp-theme'],
});
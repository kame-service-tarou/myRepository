window.GTP = { features: [] };

GTP.register = (feature) => GTP.features.push(feature);

GTP.start = async () => {
  const { features: saved = {} } = await chrome.storage.sync.get('features');

  const apply = (settings) => {
    for (const f of GTP.features) {
      const on = settings[f.id] ?? f.defaultOn;
      on ? f.enable() : f.disable();
    }
  };

  apply(saved);

  // ポップアップで切り替えたら、再読み込みなしで反映
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.features) {
      apply(changes.features.newValue || {});
    }
  });
};
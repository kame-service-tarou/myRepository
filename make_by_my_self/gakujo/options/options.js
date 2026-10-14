(async () => {
  const { features = {} } = await chrome.storage.sync.get('features');
  const box = document.getElementById('feature-darkmode');
  box.checked = features.darkmode ?? false;

  box.addEventListener('change', async () => {
    const { features: current = {} } = await chrome.storage.sync.get('features');
    current.darkmode = box.checked;
    await chrome.storage.sync.set({ features: current });
  });
})();
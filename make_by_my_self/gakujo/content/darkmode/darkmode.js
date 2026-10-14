GTP.register({
  id: 'darkmode',
  defaultOn: false,
  enable()  { document.documentElement.dataset.gtpTheme = 'dark'; },
  disable() { delete document.documentElement.dataset.gtpTheme; },
});
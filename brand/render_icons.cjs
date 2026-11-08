// Renders the app's PNG icons (freeform-app-icon.svg for Android/manifest, -ios.svg for Apple and the tab fallback)
// and copies the favicon into public/.
// Needs Playwright (npm i --no-save playwright && npx playwright install chromium). Run from the repo root: node brand/render_icons.cjs
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), pub = path.join(root, 'public');
const svg = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const sizes = { 'apple-touch-icon.png': [180, 'freeform-app-icon-ios.svg'], 'icon-192.png': [192, 'freeform-app-icon.svg'],
  'icon-512.png': [512, 'freeform-app-icon.svg'], 'favicon-32.png': [32, 'freeform-app-icon-ios.svg'] };

(async () => {
  const b = await chromium.launch();
  for (const [file, [px, src]] of Object.entries(sizes)) {
    const p = await b.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
    await p.setContent(`<body style="margin:0">${svg(src).replace('width="200" height="200"', `width="${px}" height="${px}"`)}</body>`);
    await p.screenshot({ path: path.join(pub, file), clip: { x: 0, y: 0, width: px, height: px } });
    await p.close();
  }
  // Link-preview card (iMessage, Slack, email): the FreeFORM Drill logo on field dark, 1200 x 630.
  const og = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await og.setContent(`<body style="margin:0;width:1200px;height:630px;background:#1d2a1f;display:grid;place-items:center">${svg('freeform-drill-logo-dark.svg').replace(/width="\d+" height="\d+"/, 'width="820"')}</body>`);
  await og.screenshot({ path: path.join(pub, 'og-image.png') });
  await b.close();
  const copies = { 'favicon.svg': 'freeform-favicon.svg', 'logo.svg': 'freeform-drill-logo-dark.svg', 'logo-light.svg': 'freeform-drill-logo-light.svg', 'logo-small.svg': 'freeform-drill-logo-small-dark.svg', 'logo-small-light.svg': 'freeform-drill-logo-small-light.svg', 'mark.svg': 'freeform-mark-dark.svg' };
  for (const [to, from] of Object.entries(copies)) fs.copyFileSync(path.join(__dirname, from), path.join(pub, to));
  console.log('wrote', [...Object.keys(sizes), 'og-image.png', ...Object.keys(copies)].join(', '));
})();

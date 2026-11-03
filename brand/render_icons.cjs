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
  await b.close();
  fs.copyFileSync(path.join(__dirname, 'freeform-favicon.svg'), path.join(pub, 'favicon.svg'));
  console.log('wrote', [...Object.keys(sizes), 'favicon.svg'].join(', '));
})();

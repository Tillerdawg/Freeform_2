// Retakes every screenshot in the docs (docs/img/) from the sample show in src/engine/sample.ts.
// Run after a UI change the screenshots show:  node scripts/screenshots.mjs [name...]
// Needs Playwright's Chromium once:  npm i --no-save playwright && npx playwright install chromium
import { createServer } from 'vite';
import { createRequire } from 'node:module';

const { chromium, devices } = createRequire(import.meta.url)('playwright'); // require: also finds a global install

const OUT = new URL('../docs/img/', import.meta.url).pathname;
const only = process.argv.slice(2);
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const URL_ = 'http://localhost:5199/';
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}); // CHROME: use an installed Chrome instead

/** A fresh editor (1440 × 900, at 2× for sharp images) with the sample show loaded. */
async function editor(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, ...opts });
  const page = await ctx.newPage();
  await page.goto(URL_);
  await page.evaluate(async () => {
    const { sampleShow } = await import('/src/engine/sample.ts');
    localStorage.clear();
    localStorage.setItem('freeform:autosave', JSON.stringify(sampleShow()));
  });
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(500);
  return page;
}
/** Screen (CSS px) spot of a field point, from the editor's starting zoom (the field fitted to the canvas). */
const spot = (page, p) => page.evaluate(async (p) => {
  const { fitView, toScreen } = await import('/src/field/drawField.ts');
  const c = document.querySelector('canvas'), r = c.getBoundingClientRect(), d = devicePixelRatio;
  const s = toScreen(fitView(c.width, c.height), p);
  return { x: r.left + s.x / d, y: r.top + s.y / d };
}, p);
const goSet = (page, n) => page.getByRole('button', { name: `Go to set ${n}`, exact: true }).click();
/** Drag a box from field point a to b (selects what's inside). */
async function box(page, a, b) {
  const p = await spot(page, a), q = await spot(page, b);
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(q.x, q.y, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
}
/** Clip around field points (steps), padded in CSS px. */
async function fieldClip(page, a, b, pad = 30) {
  const p = await spot(page, a), q = await spot(page, b);
  return { x: Math.min(p.x, q.x) - pad, y: Math.min(p.y, q.y) - pad, width: Math.abs(q.x - p.x) + 2 * pad, height: Math.abs(q.y - p.y) + 2 * pad };
}
const shots = {};
const shot = (name, f) => { shots[name] = f; };
const save = (page, name, clip) => page.screenshot({ path: `${OUT}${name}.png`, ...(clip ? { clip } : {}) });

const menu = (page, name) => page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click().then(() => page.waitForTimeout(200));
const W = 1440, H = 900;
const sidebar = { x: 1095, y: 125, width: W - 1095, height: 600 };
/** Clip around an element, padded. */
const around = async (loc, pad = 16) => { const b = await loc.boundingBox(); return { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad }; };
/** From an element's top down to the bottom of the window, in the sidebar. */
const fromHere = async (loc) => { const b = await loc.boundingBox(); return { ...sidebar, y: b.y - 12, height: H - b.y + 12 }; };
const bottom = { x: 0, y: 700, width: W, height: H - 700 };

shot('editor', async () => {
  const page = await editor();
  await goSet(page, 2);
  await save(page, 'editor');
});
shot('add-performers', async () => {
  const page = await editor();
  await menu(page, 'Add Performer');
  await save(page, 'add-performers', { x: 0, y: 0, width: 720, height: 520 });
});
shot('select-frame', async () => {
  const page = await editor();
  await goSet(page, 2);
  await box(page, { x: -26, y: 47 }, { x: 26, y: 24 });
  await save(page, 'select-frame', await fieldClip(page, { x: -32, y: 54 }, { x: 32, y: 18 }));
});
shot('shape-arc', async () => {
  const page = await editor();
  await box(page, { x: -13, y: 51 }, { x: 13, y: 29 });
  await menu(page, 'Shape');
  await page.getByRole('radio', { name: 'Arc' }).click();
  await page.waitForTimeout(200);
  await save(page, 'shape-arc', { x: 240, y: 110, width: 660, height: 450 });
});
shot('shape-spiral', async () => {
  const page = await editor();
  await box(page, { x: -13, y: 51 }, { x: 13, y: 29 });
  await page.keyboard.press('s'); // the Spiral shortcut
  await menu(page, 'Shape');
  await page.waitForTimeout(200);
  await save(page, 'shape-spiral', { x: 240, y: 110, width: 700, height: 640 });
});
shot('shape-star', async () => {
  const page = await editor();
  await box(page, { x: -13, y: 51 }, { x: 13, y: 29 });
  await page.keyboard.press('x'); // the Star shortcut
  await page.mouse.move(1000, 600); await page.mouse.wheel(0, -260); // pan down so the top point's handles clear the panel
  await menu(page, 'Shape');
  await page.waitForTimeout(200);
  await save(page, 'shape-star', { x: 240, y: 110, width: 700, height: 640 });
});
shot('coordinates', async () => {
  const page = await editor();
  await goSet(page, 2);
  const g = await spot(page, { x: -20, y: 14 });
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(200);
  await save(page, 'coordinates', sidebar);
});
shot('step-warnings', async () => {
  const page = await editor();
  await goSet(page, 4);
  await save(page, 'step-warnings', await fieldClip(page, { x: -32, y: 54 }, { x: 32, y: 22 }));
});
shot('ftl', async () => {
  const page = await editor();
  await goSet(page, 3);
  await box(page, { x: -24, y: 26 }, { x: 36, y: 6 });
  await menu(page, 'FTL');
  await save(page, 'ftl', { x: 360, y: 110, width: 720, height: 600 });
});
shot('move', async () => {
  // The battery's line gate-turns on its Side 1 end into set 2, marching arcs, and the Move menu shows it.
  const page = await editor();
  await goSet(page, 2);
  await box(page, { x: -17, y: 50 }, { x: 19, y: 54 });
  await menu(page, 'Transform');
  await page.getByRole('combobox', { name: 'Rotate around' }).selectOption({ label: 'S1' });
  await page.getByRole('spinbutton', { name: 'Rotation in degrees' }).fill('90');
  await page.getByRole('spinbutton', { name: 'Rotation in degrees' }).press('Enter');
  await page.getByTitle('Rotate counterclockwise').click();
  await page.keyboard.press('Escape');
  await menu(page, 'Move');
  await page.getByRole('button', { name: 'Turn as a group' }).click();
  await page.getByRole('spinbutton', { name: 'Counts to hold before stepping off' }).fill('4');
  await page.getByRole('spinbutton', { name: 'Counts to hold before stepping off' }).press('Tab');
  await page.getByRole('spinbutton', { name: 'Counts to move' }).fill('12');
  await page.getByRole('spinbutton', { name: 'Counts to move' }).press('Tab');
  await page.getByRole('button', { name: 'Apply', exact: true }).last().click();
  await page.waitForTimeout(200);
  await save(page, 'move', { x: 120, y: 60, width: 1000, height: 560 });
});
shot('sections', async () => {
  const page = await editor();
  const head = page.getByText('Sections', { exact: true });
  await head.click();
  await page.waitForTimeout(200);
  await save(page, 'sections', await fromHere(head));
});
shot('roster', async () => {
  const page = await editor();
  const head = page.getByText('Roster', { exact: true });
  await head.click();
  await page.waitForTimeout(200);
  await save(page, 'roster', await fromHere(head));
});
shot('timeline', async () => {
  const page = await editor();
  await goSet(page, 2);
  await save(page, 'timeline', { x: 0, y: 715, width: 1080, height: H - 715 });
});
shot('music', async () => {
  const page = await editor();
  await menu(page, 'Music');
  await save(page, 'music', { x: 0, y: 430, width: 760, height: H - 430 });
});
shot('movements', async () => {
  const page = await editor();
  await menu(page, 'Movements');
  await save(page, 'movements', { x: 0, y: 430, width: 760, height: H - 430 });
});
shot('print', async () => {
  const page = await editor();
  await page.getByRole('button', { name: 'Print…' }).click();
  await page.waitForTimeout(400);
  await save(page, 'print', await around(page.locator('[role=dialog] > div').first()));
});
shot('share', async () => {
  const page = await editor();
  await page.getByRole('button', { name: 'Share…' }).click();
  await page.waitForTimeout(800);
  // Show the published app's address in the link box, not this local test server's.
  await page.evaluate(async () => {
    const { qrSvg } = await import('/src/engine/qr.ts');
    const t = document.querySelector('[role=dialog] textarea');
    t.value = t.value.replace(location.origin + '/', 'https://freeformdrill.org/');
    const svg = document.querySelector('[role=dialog] svg')?.parentElement;
    if (svg) svg.innerHTML = qrSvg(t.value); // so the pictured code scans to the real address too
  });
  await save(page, 'share', await around(page.locator('[role=dialog] > div').first()));
});
shot('ipad', async () => {
  const page = await editor({ ...devices['iPad Pro 11 landscape'] });
  await goSet(page, 2);
  await save(page, 'ipad');
});
shot('phone', async () => {
  const ed = await editor();
  const link = await ed.evaluate(async () => {
    const { encodeShow, SHARE_PREFIX } = await import('/src/engine/share.ts');
    return SHARE_PREFIX + await encodeShow(JSON.parse(localStorage.getItem('freeform:autosave')));
  });
  const ctx = await browser.newContext({ ...devices['iPhone 15'] });
  const page = await ctx.newPage();
  await page.goto(URL_ + link);
  await page.waitForTimeout(1500);
  await page.locator('.who-button').click();
  await page.getByRole('searchbox').fill('P1');
  await page.waitForTimeout(200);
  await save(page, 'phone-who');
  await page.keyboard.press('Enter');
  await page.getByRole('group', { name: 'Go to set' }).getByRole('button', { name: '2', exact: true }).click();
  await page.waitForTimeout(600);
  await save(page, 'phone');
});
/** A printed page (US Letter width at 96 dpi), as the browser would print it. */
async function printed(kind, name) {
  const page = await editor();
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print…' }).click();
  if (kind === 'charts') await page.getByLabel(/Drill charts/).check();
  await page.getByRole('dialog').getByRole('button', { name: /^Print/ }).click();
  await page.setViewportSize({ width: 816, height: 1056 });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(800);
  // The first dot-sheet page; set 2's chart (it has markup and a note).
  await page.locator(kind === 'charts' ? '.chart-page' : '.dot-page').nth(kind === 'charts' ? 1 : 0).screenshot({ path: `${OUT}${name}.png` });
}
shot('dot-sheet', () => printed('dots', 'dot-sheet'));
shot('drill-chart', () => printed('charts', 'drill-chart'));

for (const [name, f] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  await f();
  console.log('✓', name);
}
await browser.close();
await server.close();

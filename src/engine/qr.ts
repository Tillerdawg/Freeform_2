import qrcode from 'qrcode-generator';

/** The FreeFORM logo's colors, passed in from the palette (the engine has no colors of its own). */
export interface QrLogo { tile: string; dot: string; accent: string }

/**
 * A QR code's squares: `size` across, and whether each one is dark. With the logo, `hole` is the square of squares
 * (`start` to `start + side - 1`, in both directions) left blank in the middle for it.
 */
export interface QrCode { size: number; dark: (row: number, col: number) => boolean; hole: { start: number; side: number } | null }

const QUIET = 4; // the blank border scanners need, in squares

// The logo covers about this share of the code's width. With the logo, the code uses Q error correction, which can rebuild
// 25% of it; a hole 22% across covers about 5%, which leaves room for glare, a dirty screen, and a phone held at an angle.
// (Tested: it still reads with a hole 38% across. H, the highest level, would make the squares smaller for no real gain:
// a typical published link goes from 41 squares across with no logo to 57 at Q and 65 at H.)
const HOLE = 0.22;

/**
 * The squares for `text`, or null if it's too long for one code. With `logo`, the code uses Q error correction
 * (so it reads with the middle covered) and leaves a hole for the logo; a link too long for that (a big Send this version
 * link) gets a plain code at the lowest error correction instead, which holds the most.
 */
export function makeQr(text: string, logo = false): QrCode | null {
  for (const level of logo ? ['Q', 'L'] as const : ['L'] as const) {
    let q;
    try { q = qrcode(0, level); q.addData(text, 'Byte'); q.make(); } catch { continue; } // "code length overflow"
    const size = q.getModuleCount();
    if (level === 'L') return { size, dark: (r, c) => q.isDark(r, c), hole: null };
    let side = Math.round(size * HOLE);
    if (side % 2 === 0) side++; // sizes are odd, so an odd hole sits exactly in the middle
    const start = (size - side) / 2, inHole = (n: number) => n >= start && n < start + side;
    return { size, dark: (r, c) => !(inHole(r) && inHole(c)) && q.isDark(r, c), hole: { start, side } };
  }
  return null;
}

/** Back-compat name: the plain code's squares. */
export const qrGrid = (text: string) => makeQr(text);

// The logo: the app icon's curve of 13 dots (the first one gold, like Set 1) on a rounded field-dark tile.
const CURVE: [number, number][] = [[0, 80], [8, 50], [30, 28], [60, 20], [90, 28], [112, 50], [120, 80], [128, 110], [150, 132], [180, 140], [210, 132], [232, 110], [240, 80]];

/** The logo's tile and dots, for a tile `t` wide whose top-left corner is at x, y. Shared by the SVG and the PNG. */
export function logoShapes(x: number, y: number, t: number) {
  const s = (t * 0.8) / 270; // the curve (270 wide with its dots) fills 80% of the tile, like the app icon
  return {
    tile: { x, y, w: t, r: t * 0.18 },
    dots: CURVE.map(([cx, cy], i) => ({ cx: x + t / 2 + (cx - 120) * s, cy: y + t / 2 + (cy - 80) * s, r: (i === 0 ? 15 : 14) * s, accent: i === 0 })),
  };
}

/** The squares (and the logo, if the code has a hole for it) as SVG shapes, `cell` units a square, the code's corner at x, y. */
function codeShapes(code: QrCode, cell: number, x: number, y: number, ink: string, logo?: QrLogo): string {
  let path = '';
  for (let r = 0; r < code.size; r++) for (let c = 0; c < code.size; c++) {
    if (code.dark(r, c)) path += `M${x + c * cell} ${y + r * cell}h${cell}v${cell}h-${cell}z`;
  }
  let out = `<path d="${path}" fill="${ink}"/>`;
  if (code.hole && logo) {
    const pad = cell * 0.6, L = logoShapes(x + code.hole.start * cell + pad, y + code.hole.start * cell + pad, code.hole.side * cell - 2 * pad);
    const n = (v: number) => +v.toFixed(2);
    out += `<rect x="${n(L.tile.x)}" y="${n(L.tile.y)}" width="${n(L.tile.w)}" height="${n(L.tile.w)}" rx="${n(L.tile.r)}" fill="${logo.tile}"/>`
      + L.dots.map((d) => `<circle cx="${n(d.cx)}" cy="${n(d.cy)}" r="${n(d.r)}" fill="${d.accent ? logo.accent : logo.dot}"/>`).join('');
  }
  return out;
}

/**
 * QR code for `text` as an SVG string that fills its box, or null if it's too long to fit in one code. Pass the logo's
 * colors to put the FreeFORM logo in the middle (when the link is short enough).
 */
export function qrSvg(text: string, logo?: QrLogo, colors = { paper: 'white', ink: 'black' }): string | null {
  const code = makeQr(text, !!logo);
  if (!code) return null;
  const w = (code.size + QUIET * 2) * 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" preserveAspectRatio="xMinYMin meet">`
    + `<rect width="100%" height="100%" fill="${colors.paper}"/>${codeShapes(code, 4, QUIET * 4, QUIET * 4, colors.ink, logo)}</svg>`;
}

// The saved picture (for a slide, a handout, or an email): the show's title above the code, and how to scan it below,
// in English and Spanish, on white. Shared by the SVG and the PNG so they look the same.
export const QR_CAPTION = ["Scan with your phone's camera", 'Escanea con la cámara de tu teléfono'];
const TITLE_MAX = 40;

/** A title short enough to sit on one line over the code. */
export function cardTitle(title: string): string {
  const t = title.trim().replace(/\s+/g, ' ');
  return t.length > TITLE_MAX ? t.slice(0, TITLE_MAX - 1).trimEnd() + '…' : t;
}

/** Where everything goes, in pixels, for a code `size` squares across drawn `cell` pixels a square. */
export function cardLayout(size: number, cell: number, labeled: boolean) {
  const side = (size + QUIET * 2) * cell; // the code with its border
  const titleSize = Math.round(side * 0.065), captionSize = Math.round(side * 0.042);
  const top = labeled ? Math.round(titleSize * 2.2) : 0;
  const bottom = labeled ? Math.round(captionSize * 3.6) : 0;
  return {
    width: side, height: top + side + bottom, side, top,
    titleSize, titleY: Math.round(titleSize * 1.5),
    captionSize, captionY: [top + side + Math.round(captionSize * 0.9), top + side + Math.round(captionSize * 2.3)],
    codeX: QUIET * cell, codeY: top + QUIET * cell,
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The saved picture as a standalone SVG file (sharp at any size). Colors are passed in from the palette. */
export function qrCardSvg(text: string, title: string, colors: { paper: string; ink: string }, logo?: QrLogo): string | null {
  const code = makeQr(text, !!logo);
  if (!code) return null;
  const cell = 10, t = cardTitle(title), L = cardLayout(code.size, cell, !!t);
  const font = 'font-family="Barlow, Helvetica, Arial, sans-serif" text-anchor="middle"';
  const labels = t ? `<text x="${L.width / 2}" y="${L.titleY}" ${font} font-size="${L.titleSize}" font-weight="700" fill="${colors.ink}">${esc(t)}</text>`
    + QR_CAPTION.map((line, i) => `<text x="${L.width / 2}" y="${L.captionY[i]}" ${font} font-size="${L.captionSize}" fill="${colors.ink}">${esc(line)}</text>`).join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}">`
    + `<rect width="100%" height="100%" fill="${colors.paper}"/>${codeShapes(code, cell, L.codeX, L.codeY, colors.ink, logo)}${labels}</svg>`;
}

/** A file name for the saved picture: the show's title without characters file systems dislike. */
export function qrFileName(title: string, ext: 'png' | 'svg'): string {
  return `${title.replace(/[^\w\- ]+/g, '').trim() || 'show'} QR code.${ext}`;
}

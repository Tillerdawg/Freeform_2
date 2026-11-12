import qrcode from 'qrcode-generator';

/** QR code for `text` as an SVG string, or null if it's too long to fit in one code. */
export function qrSvg(text: string): string | null {
  try {
    const q = qrcode(0, 'L'); // smallest version that fits; low error correction leaves the most room
    q.addData(text, 'Byte');
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  } catch {
    return null; // "code length overflow"
  }
}

/** The code's squares: `size` across, and whether each one is dark. Null if `text` is too long for one code. */
export interface QrGrid { size: number; dark: (row: number, col: number) => boolean }
export function qrGrid(text: string): QrGrid | null {
  try {
    const q = qrcode(0, 'L');
    q.addData(text, 'Byte');
    q.make();
    return { size: q.getModuleCount(), dark: (r, c) => q.isDark(r, c) };
  } catch {
    return null;
  }
}

// The saved picture (for a slide, a handout, or an email): the show's title above the code, and how to scan it below,
// in English and Spanish, on white. Shared by the SVG and the PNG so they look the same.
export const QR_CAPTION = ["Scan with your phone's camera", 'Escanea con la cámara de tu teléfono'];
const QUIET = 4; // the blank border scanners need, in squares
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
export function qrCardSvg(text: string, title: string, colors: { paper: string; ink: string }): string | null {
  const g = qrGrid(text);
  if (!g) return null;
  const cell = 10, t = cardTitle(title), L = cardLayout(g.size, cell, !!t);
  let path = '';
  for (let r = 0; r < g.size; r++) for (let c = 0; c < g.size; c++) {
    if (g.dark(r, c)) path += `M${L.codeX + c * cell} ${L.codeY + r * cell}h${cell}v${cell}h-${cell}z`;
  }
  const font = 'font-family="Barlow, Helvetica, Arial, sans-serif" text-anchor="middle"';
  const labels = t ? `<text x="${L.width / 2}" y="${L.titleY}" ${font} font-size="${L.titleSize}" font-weight="700" fill="${colors.ink}">${esc(t)}</text>`
    + QR_CAPTION.map((line, i) => `<text x="${L.width / 2}" y="${L.captionY[i]}" ${font} font-size="${L.captionSize}" fill="${colors.ink}">${esc(line)}</text>`).join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}">`
    + `<rect width="100%" height="100%" fill="${colors.paper}"/><path d="${path}" fill="${colors.ink}"/>${labels}</svg>`;
}

/** A file name for the saved picture: the show's title without characters file systems dislike. */
export function qrFileName(title: string, ext: 'png' | 'svg'): string {
  return `${title.replace(/[^\w\- ]+/g, '').trim() || 'show'} QR code.${ext}`;
}

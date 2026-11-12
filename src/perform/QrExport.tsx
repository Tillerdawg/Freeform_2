import { useState } from 'react';
import { cardLayout, cardTitle, logoShapes, makeQr, QR_CAPTION, qrCardSvg, qrFileName } from '../engine/qr';
import { FIELD, QR_LOGO } from '../ui/palette'; // black on white: scanners need it, and it prints and projects cleanly

const COLORS = { paper: FIELD.white, ink: FIELD.black };

/** The saved picture as a PNG, drawn straight onto a canvas (big enough for a projector or a printed handout). */
async function qrPng(text: string, title: string): Promise<Blob> {
  const g = makeQr(text, true);
  if (!g) throw new Error('Too big for a QR code.');
  const cell = Math.max(8, Math.ceil(1200 / (g.size + 8))); // about 1200 pixels across, whatever the code's size
  const t = cardTitle(title), L = cardLayout(g.size, cell, !!t);
  const canvas = document.createElement('canvas');
  canvas.width = L.width; canvas.height = L.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, L.width, L.height);
  ctx.fillStyle = COLORS.ink;
  for (let r = 0; r < g.size; r++) for (let c = 0; c < g.size; c++) if (g.dark(r, c)) ctx.fillRect(L.codeX + c * cell, L.codeY + r * cell, cell, cell);
  if (g.hole) {
    const pad = cell * 0.6, logo = logoShapes(L.codeX + g.hole.start * cell + pad, L.codeY + g.hole.start * cell + pad, g.hole.side * cell - 2 * pad);
    ctx.fillStyle = QR_LOGO.tile;
    ctx.beginPath(); ctx.roundRect(logo.tile.x, logo.tile.y, logo.tile.w, logo.tile.w, logo.tile.r); ctx.fill();
    for (const d of logo.dots) { ctx.fillStyle = d.accent ? QR_LOGO.accent : QR_LOGO.dot; ctx.beginPath(); ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = COLORS.ink;
  }
  if (t) {
    await document.fonts?.ready;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${L.titleSize}px Barlow, Helvetica, Arial, sans-serif`;
    ctx.fillText(t, L.width / 2, L.titleY, L.width - 2 * cell);
    ctx.font = `${L.captionSize}px Barlow, Helvetica, Arial, sans-serif`;
    QR_CAPTION.forEach((line, i) => ctx.fillText(line, L.width / 2, L.captionY[i], L.width - 2 * cell));
  }
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('Could not make the picture.'))), 'image/png'));
}

function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Copy or save a share QR code as a picture, for a slide, a printed handout, or an email. */
export function QrExport({ text, title }: { text: string; title: string }) {
  const [labeled, setLabeled] = useState(true);
  const [note, setNote] = useState('');
  const name = labeled ? title : '';
  const canCopy = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
  const copy = async () => {
    try {
      // Safari wants the clipboard item made right away, with the picture still on its way.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': qrPng(text, name) })]);
      setNote('Picture copied. Paste it into a slide, a document, or an email.');
    } catch { setNote('Copy failed: use Save picture instead.'); }
  };
  const png = async () => {
    try { save(await qrPng(text, name), qrFileName(title, 'png')); setNote(''); } catch (e) { setNote(`✗ ${e instanceof Error ? e.message : String(e)}`); }
  };
  const svg = () => {
    const s = qrCardSvg(text, name, COLORS, QR_LOGO);
    if (s) save(new Blob([s], { type: 'image/svg+xml' }), qrFileName(title, 'svg'));
  };
  return (
    <div role="group" aria-label="Save the QR code as a picture" style={{ fontSize: 12, margin: '0 0 10px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {canCopy && <button onClick={copy} title="Copy the QR code as a picture, to paste into PowerPoint, Keynote, Google Slides, or an email">Copy picture</button>}
        <button onClick={png} title="Save the QR code as a PNG picture">Save picture</button>
        <button onClick={svg} title="Save the QR code as an SVG, which stays sharp at any size (for posters and print)" style={{ fontSize: 12 }}>SVG</button>
      </div>
      <label style={{ display: 'block', textAlign: 'center', margin: '6px 0 0' }}>
        <input type="checkbox" checked={labeled} onChange={(e) => setLabeled(e.target.checked)} />{' '}
        Put the show's title and "Scan with your phone's camera" on it
      </label>
      <p style={{ margin: '4px 0 0', textAlign: 'center', opacity: 0.8 }}>Anyone who can scan the picture can open the show, so share it the way you'd share the link.</p>
      {note && <p role="status" style={{ margin: '4px 0 0', textAlign: 'center' }}>{note}</p>}
    </div>
  );
}

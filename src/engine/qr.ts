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

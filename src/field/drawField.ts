import { FIELD_WIDTH, GOAL_LINE_X, HASHES, STEP_IN, type HashPreset, type Point } from '../engine/coords';

/** Screen transform: px per step, plus screen position of world origin (50 yd line, front sideline). */
export interface View { scale: number; ox: number; oy: number }

const YARD = 1.6; // steps per yard
const LINE = 4 / STEP_IN; // painted line width: 4 in
const HASH_LEN = 24 / STEP_IN; // hash mark length: 24 in
const END_X = GOAL_LINE_X + 10 * YARD; // back of end zone

// Front sideline at the bottom of the screen (director's view), Side 1 on the left.
export const toScreen = (v: View, p: Point) => ({ x: v.ox + p.x * v.scale, y: v.oy - p.y * v.scale });
export const toWorld = (v: View, sx: number, sy: number): Point => ({ x: (sx - v.ox) / v.scale, y: (v.oy - sy) / v.scale });

/** View that fits the whole field (end zones included) into w x h px. */
export function fitView(w: number, h: number): View {
  const scale = Math.min(w / (2 * END_X + 8), h / (FIELD_WIDTH + 8));
  return { scale, ox: w / 2, oy: h / 2 + (FIELD_WIDTH / 2) * scale };
}

export function drawField(ctx: CanvasRenderingContext2D, v: View, hash: HashPreset) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#1d2a1f';
  ctx.fillRect(0, 0, width, height);

  const tl = toScreen(v, { x: -END_X, y: FIELD_WIDTH });
  const s = v.scale;
  ctx.fillStyle = '#2f6b3a';
  ctx.fillRect(tl.x, tl.y, 2 * END_X * s, FIELD_WIDTH * s);

  const vline = (x: number, y0: number, y1: number) => {
    const a = toScreen(v, { x, y: y0 }), b = toScreen(v, { x, y: y1 });
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };
  const hline = (y: number, x0: number, x1: number) => {
    const a = toScreen(v, { x: x0, y }), b = toScreen(v, { x: x1, y });
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };

  // 8-to-5 grid from the front sideline; every 4th step (the "splitting" line) a bit stronger.
  if (s >= 4) {
    for (let i = -GOAL_LINE_X; i <= GOAL_LINE_X; i++) {
      if (i % 8 === 0) continue;
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      vline(i, 0, FIELD_WIDTH);
    }
    for (let j = 1; j < FIELD_WIDTH; j++) {
      ctx.strokeStyle = j % 4 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)';
      hline(j, -GOAL_LINE_X, GOAL_LINE_X);
    }
  }

  // All lines 4 in. Yard lines are centered on their coordinate. Boundary and goal lines sit outside the
  // field, inner edge on the coordinate, so measurements start at the field's inside edge.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1, s * LINE); // 1px floor keeps lines visible zoomed out
  const half = ctx.lineWidth / s / 2;
  for (let x = -GOAL_LINE_X + 8; x < GOAL_LINE_X; x += 8) vline(x, 0, FIELD_WIDTH);
  for (const g of [-GOAL_LINE_X - half, GOAL_LINE_X + half]) vline(g, 0, FIELD_WIDTH);
  const o = toScreen(v, { x: -END_X - half, y: FIELD_WIDTH + half });
  ctx.strokeRect(o.x, o.y, 2 * (END_X + half) * s, (FIELD_WIDTH + 2 * half) * s);

  // Hash marks: a stripe across every yard line, parallel to the sideline, at both hash depths. 24 in x 4 in.
  const h = HASHES[hash];
  const tick = HASH_LEN;
  ctx.lineWidth = Math.max(1, s * LINE);
  for (let x = -GOAL_LINE_X; x <= GOAL_LINE_X; x += 8) {
    hline(h, x - tick / 2, x + tick / 2);
    hline(FIELD_WIDTH - h, x - tick / 2, x + tick / 2);
  }

  // Yard numbers, 6 ft tall. Back numbers face the back sideline.
  // Decorative only: number placement varies by field, so readouts never reference it (see DECISIONS.md).
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic'; // digits sit on the baseline, so baseline = bottom of the number
  // Size the font so the digits themselves (not the font box) are 6 ft tall.
  ctx.font = 'bold 100px system-ui, sans-serif';
  const px = (100 * (72 / STEP_IN) * s) / ctx.measureText('0').actualBoundingBoxAscent;
  ctx.font = `bold ${px}px system-ui, sans-serif`;
  const depth = 8; // bottom of numbers, steps from the sideline
  for (let n = 10; n <= 50; n += 10) {
    for (const sign of n === 50 ? [1] : [-1, 1]) {
      const x = sign * (50 - n) * YARD;
      const label = String(n).split('').join(' ');
      const f = toScreen(v, { x, y: depth });
      ctx.fillText(label, f.x, f.y);
      const b = toScreen(v, { x, y: FIELD_WIDTH - depth });
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.PI); ctx.fillText(label, 0, 0); ctx.restore();
    }
  }
}

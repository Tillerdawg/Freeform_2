import { FIELD_WIDTH, GOAL_LINE_X, HASHES, type HashPreset, type Point } from '../engine/coords';

/** Screen transform: px per step, plus screen position of world origin (50 yd line, front sideline). */
export interface View { scale: number; ox: number; oy: number }

const YARD = 1.6; // steps per yard
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

  // Yard lines every 5 yards, boundary lines.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1, s * 0.18);
  for (let x = -GOAL_LINE_X; x <= GOAL_LINE_X; x += 8) vline(x, 0, FIELD_WIDTH);
  ctx.lineWidth = Math.max(2, s * 0.3);
  ctx.strokeRect(tl.x, tl.y, 2 * END_X * s, FIELD_WIDTH * s);

  // Hash marks: a stripe across every yard line, parallel to the sideline, at both hash depths. 2 ft long.
  const h = HASHES[hash];
  const tick = 24 / 22.5;
  ctx.lineWidth = Math.max(1, s * 0.15);
  for (let x = -GOAL_LINE_X; x <= GOAL_LINE_X; x += 8) {
    hline(h, x - tick / 2, x + tick / 2);
    hline(FIELD_WIDTH - h, x - tick / 2, x + tick / 2);
  }

  // Yard numbers, 6 ft tall. Back numbers face the back sideline.
  // Decorative only: number placement varies by field, so readouts never reference it (see DECISIONS.md).
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${(72 / 22.5) * s}px system-ui, sans-serif`;
  const depth = (9 * 36 - 36) / 22.5; // number center, steps from sideline
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

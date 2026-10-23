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
  const scale = Math.min(w / (2 * END_X + 8), h / (FIELD_WIDTH + 16)); // room for the yard numbers outside the sidelines
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

  // Yard numbers, 4 steps tall. Back numbers face the back sideline.
  // Decorative only: number placement varies by field, so readouts never reference it (see DECISIONS.md).
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic'; // digits sit on the baseline, so baseline = bottom of the number
  // Size the font so the digits themselves (not the font box) are 4 steps tall.
  ctx.font = 'bold 100px system-ui, sans-serif';
  const px = (100 * 4 * s) / ctx.measureText('0').actualBoundingBoxAscent;
  ctx.font = `bold ${px}px system-ui, sans-serif`;
  const depth = -6; // bottom of numbers, steps from the sideline: outside the field, tops 2 steps beyond the sideline
  // Digits sit either side of the yard line. Round edges (0, 2, 3, 5) read as farther away than straight
  // stems (1, 4), so they're tucked a little closer to look equal (the usual typographic optical correction).
  const gap = (18 / STEP_IN) * s; // line center to a straight edge
  const tuck = (4 / STEP_IN) * s; // round edges sit this much closer
  const straightRight = '14';
  const number = (n: number) => {
    const [a, b] = String(n);
    const ma = ctx.measureText(a), mb = ctx.measureText(b);
    ctx.fillText(a, -(straightRight.includes(a) ? gap : gap - tuck) - ma.actualBoundingBoxRight, 0);
    ctx.fillText(b, gap - tuck + mb.actualBoundingBoxLeft, 0); // right digit is always 0: round
  };
  for (let n = 10; n <= 50; n += 10) {
    for (const sign of n === 50 ? [1] : [-1, 1]) {
      const x = sign * (50 - n) * YARD;
      const f = toScreen(v, { x, y: depth });
      ctx.save(); ctx.translate(f.x, f.y); number(n); ctx.restore();
      const b = toScreen(v, { x, y: FIELD_WIDTH - depth });
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.PI); number(n); ctx.restore();
    }
  }
}

export const TIER_COLOR = { ok: 'rgba(255,255,255,0.55)', yellow: '#f5c518', red: '#ff4d4d' } as const;

export interface Dot { id: string; label: string; at: Point }
export interface Path { from: Point; to: Point; tier: keyof typeof TIER_COLOR }

/** Performers, their incoming paths, and an optional selection box. */
export function drawPerformers(
  ctx: CanvasRenderingContext2D, v: View, dots: Dot[], selected: Set<string>, paths: Path[], box?: [Point, Point],
) {
  const s = v.scale;
  ctx.setLineDash([s * 0.4, s * 0.3]);
  ctx.lineWidth = Math.max(1.5, s * 0.12);
  for (const p of paths) {
    const a = toScreen(v, p.from), b = toScreen(v, p.to);
    ctx.strokeStyle = TIER_COLOR[p.tier];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  const r = Math.max(4, s * 0.45);
  ctx.font = `600 ${Math.max(10, s * 0.8)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (const d of dots) {
    const c = toScreen(v, d.at);
    const sel = selected.has(d.id);
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = sel ? '#ffd166' : '#111';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.25);
    ctx.strokeStyle = sel ? '#fff' : '#ffd166';
    ctx.stroke();
    if (s >= 5) {
      ctx.fillStyle = '#fff';
      ctx.fillText(d.label, c.x, c.y - r - 2);
    }
  }

  if (box) {
    const a = toScreen(v, box[0]), b = toScreen(v, box[1]);
    ctx.fillStyle = 'rgba(255,209,102,0.12)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1;
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }
}

/** Shape guide (dashed) and its draggable handles. */
export function drawShape(ctx: CanvasRenderingContext2D, v: View, guide: Point[], closed: boolean, handles: Point[]) {
  ctx.save();
  ctx.strokeStyle = '#5ad1ff';
  ctx.lineWidth = Math.max(1.5, v.scale * 0.1);
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  guide.forEach((p, i) => { const s = toScreen(v, p); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); });
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  const r = HANDLE_PX * (window.devicePixelRatio || 1);
  for (const h of handles) {
    const s = toScreen(v, h);
    ctx.fillStyle = '#5ad1ff';
    ctx.strokeStyle = '#0b2a36';
    ctx.lineWidth = 2;
    ctx.fillRect(s.x - r, s.y - r, 2 * r, 2 * r);
    ctx.strokeRect(s.x - r, s.y - r, 2 * r, 2 * r);
  }
  ctx.restore();
}

export const HANDLE_PX = 6; // half-size of a shape handle, in CSS pixels

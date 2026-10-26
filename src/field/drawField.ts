import { placeLabels, turned } from './labels';
import type { LabelSide } from '../engine/show';
import { FIELD_WIDTH, GOAL_LINE_X, HASHES, STEP_IN, type HashPreset, type Point } from '../engine/coords';
import { TEXT_STEPS, type Mark } from '../engine/marks';

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

/** Colors for the screen (green turf) and for paper (black on white, easy on toner and copiers). */
export const THEMES = {
  screen: { bg: '#1d2a1f', turf: '#357842', gridMinor: 'rgba(255,255,255,0.15)', gridMajor: 'rgba(255,255,255,0.32)', line: '#fff', number: 'rgba(255,255,255,0.9)' },
  print: { bg: '#fff', turf: '#fff', gridMinor: 'rgba(0,0,0,0.07)', gridMajor: 'rgba(0,0,0,0.2)', line: '#000', number: '#555' },
};
export type Theme = keyof typeof THEMES;

export function drawField(ctx: CanvasRenderingContext2D, v: View, hash: HashPreset, theme: Theme = 'screen') {
  const T = THEMES[theme];
  const { width, height } = ctx.canvas;
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, width, height);

  const tl = toScreen(v, { x: -END_X, y: FIELD_WIDTH });
  const s = v.scale;
  ctx.fillStyle = T.turf;
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
      ctx.strokeStyle = i % 4 === 0 ? T.gridMajor : T.gridMinor;
      ctx.lineWidth = 1;
      vline(i, 0, FIELD_WIDTH);
    }
    for (let j = 1; j < FIELD_WIDTH; j++) {
      ctx.strokeStyle = j % 4 === 0 ? T.gridMajor : T.gridMinor;
      hline(j, -GOAL_LINE_X, GOAL_LINE_X);
    }
  }

  // All lines 4 in. Yard lines are centered on their coordinate. Boundary and goal lines sit outside the
  // field, inner edge on the coordinate, so measurements start at the field's inside edge.
  ctx.strokeStyle = T.line;
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
  ctx.fillStyle = T.number;
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

export interface Dot { id: string; label: string; at: Point; pin?: LabelSide; color?: string }
export interface Path { from: Point; to: Point; tier: keyof typeof TIER_COLOR }

/**
 * Dot labels, placed so they don't cover other dots or each other (see placeLabels). Drawn upright on screen even when
 * the field is turned around (Facing front), so the canvas's current transform only moves where they go.
 */
export function drawLabels(
  ctx: CanvasRenderingContext2D, dots: (Dot & { first?: boolean; px?: number; color?: string })[], v: View, r: number, px: number, color: string, halo?: string,
) {
  const m = ctx.getTransform();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const font = (d: { px?: number }) => { ctx.font = `600 ${d.px ?? px}px system-ui, sans-serif`; };
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const k = Math.hypot(m.a, m.b); // the transform's scale, so sizes match what's on screen
  const flipped = m.a < 0; // field turned around (Facing front): pinned sides turn with it
  const items = dots.map((d) => {
    const c = m.transformPoint(toScreen(v, d.at));
    font(d);
    return { x: c.x, y: c.y, w: ctx.measureText(d.label).width + 2, h: d.px ?? px, r: r * k, pin: d.pin && flipped ? turned(d.pin) : d.pin, first: d.first };
  });
  placeLabels(items, Math.max(1, px * 0.15)).forEach((spot, i) => {
    if (!spot || !dots[i].label) return;
    font(dots[i]);
    if (halo) { ctx.lineWidth = (dots[i].px ?? px) * 0.3; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(dots[i].label, spot.x, spot.y); }
    ctx.fillStyle = dots[i].color ?? color;
    ctx.fillText(dots[i].label, spot.x, spot.y);
  });
  ctx.restore();
}

/** Performers, their incoming paths, and an optional selection box. */
export function drawPerformers(
  ctx: CanvasRenderingContext2D, v: View, dots: Dot[], selected: Set<string>, paths: Path[], box?: [Point, Point], dpr = 1,
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
  for (const d of dots) {
    const c = toScreen(v, d.at);
    const sel = selected.has(d.id);
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = sel ? '#ffd166' : d.color ?? '#111';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.25);
    ctx.strokeStyle = sel ? '#fff' : d.color ? '#111' : '#ffd166'; // a colored dot gets a dark ring so light colors show on the turf
    ctx.stroke();
  }
  drawLabels(ctx, dots.map((d) => ({ ...d, first: selected.has(d.id) })), v, r, Math.max(10 * dpr, s * 0.8), '#fff'); // at least 10 CSS px: smaller isn't readable

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
export function drawShape(
  ctx: CanvasRenderingContext2D, v: View, guide: Point[], closed: boolean, handles: Point[],
  controls: boolean[] = [], arms: [Point, Point][] = [],
) {
  ctx.save();
  ctx.strokeStyle = '#5ad1ff';
  ctx.lineWidth = Math.max(1.5, v.scale * 0.1);
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  guide.forEach((p, i) => { const s = toScreen(v, p); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); });
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  // Bézier control arms: thin lines from each anchor to its controls.
  ctx.strokeStyle = 'rgba(90,209,255,0.7)';
  ctx.lineWidth = 1.5;
  for (const [a, b] of arms) {
    const p = toScreen(v, a), q = toScreen(v, b);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  const r = HANDLE_PX * (window.devicePixelRatio || 1);
  handles.forEach((h, k) => {
    const s = toScreen(v, h);
    ctx.fillStyle = '#5ad1ff';
    ctx.strokeStyle = '#0b2a36';
    ctx.lineWidth = 2;
    if (controls[k]) { // controls are circles; points the shape passes through are squares
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillRect(s.x - r, s.y - r, 2 * r, 2 * r);
      ctx.strokeRect(s.x - r, s.y - r, 2 * r, 2 * r);
    }
  });
  ctx.restore();
}

export const HANDLE_PX = 6; // half-size of a shape handle, in CSS pixels

/** Page markup: text notes, arrows, freehand ink. `selected` gets a blue outline. */
export function drawMarks(ctx: CanvasRenderingContext2D, v: View, marks: Mark[], theme: Theme = 'screen', selected?: string | null) {
  const s = v.scale;
  const ink = theme === 'print' ? '#000' : '#fff';
  const halo = theme === 'print' ? '#fff' : 'rgba(0,0,0,0.55)';
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const m of marks) {
    const sel = m.id === selected;
    const stroke = (w: number, path: () => void) => {
      if (sel) { ctx.strokeStyle = '#5ad1ff'; ctx.lineWidth = w + 6; ctx.beginPath(); path(); ctx.stroke(); }
      ctx.strokeStyle = ink; ctx.lineWidth = w; ctx.beginPath(); path(); ctx.stroke();
    };
    if (m.kind === 'text') {
      const q = toScreen(v, m.at);
      ctx.font = `600 ${TEXT_STEPS * s}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const label = m.text || (theme === 'screen' ? '(type a note)' : '');
      ctx.lineWidth = 0.4 * s;
      ctx.strokeStyle = sel ? '#5ad1ff' : halo;
      ctx.strokeText(label, q.x, q.y);
      ctx.fillStyle = m.text ? ink : 'rgba(255,255,255,0.5)';
      ctx.fillText(label, q.x, q.y);
    } else if (m.kind === 'arrow') {
      const a = toScreen(v, m.from), b = toScreen(v, m.to);
      const ang = Math.atan2(b.y - a.y, b.x - a.x), head = Math.min(1.2 * s, Math.hypot(b.x - a.x, b.y - a.y) * 0.5);
      const w = Math.max(2, 0.22 * s);
      stroke(w, () => {
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.moveTo(b.x - head * Math.cos(ang - 0.45), b.y - head * Math.sin(ang - 0.45));
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(b.x - head * Math.cos(ang + 0.45), b.y - head * Math.sin(ang + 0.45));
      });
    } else {
      const w = Math.max(2, 0.18 * s);
      stroke(w, () => m.pts.forEach((p, k) => { const q = toScreen(v, p); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }));
    }
  }
  ctx.restore();
}

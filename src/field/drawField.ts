import { chrome, PALETTE } from '../ui/palette';
import { placeLabels, turned } from './labels';
import type { LabelSide } from '../engine/show';
import { FEET, FIELD_WIDTH, GOAL_LINE_X, HASHES, STEP_IN, type FieldSpec, type Floor, type Point } from '../engine/coords';
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

/** View that fits the whole field (end zones included), or the whole floor, into w x h px. */
export function fitView(w: number, h: number, f: FieldSpec = 'highSchool'): View {
  if (typeof f !== 'string') {
    const scale = Math.min(w / (f.w + 4), h / (f.d + 4));
    return { scale, ox: w / 2, oy: h / 2 + (f.d / 2) * scale };
  }
  const scale = Math.min(w / (2 * END_X + 8), h / (FIELD_WIDTH + 16)); // room for the yard numbers outside the sidelines
  return { scale, ox: w / 2, oy: h / 2 + (FIELD_WIDTH / 2) * scale };
}

/** Colors for the screen (green turf) and for paper (black on white, easy on toner and copiers). */
export const THEMES = {
  screen: { get bg() { return chrome('bg'); }, turf: PALETTE.turf, floor: PALETTE.floor, gridMinor: 'rgba(255,255,255,0.15)', gridMajor: 'rgba(255,255,255,0.32)', line: '#fff', get number() { return chrome('text'); } }, // bg and number sit off the turf, so they follow light/dark mode
  print: { bg: '#fff', turf: '#fff', floor: '#fff', gridMinor: 'rgba(0,0,0,0.07)', gridMajor: 'rgba(0,0,0,0.2)', line: '#000', number: '#555' },
};
export type Theme = keyof typeof THEMES;

/** An indoor floor: its grid and edge, and for a court the center line, circles, lanes, three-point lines, and hoops. */
function drawFloor(ctx: CanvasRenderingContext2D, v: View, f: Floor, theme: Theme) {
  const T = THEMES[theme], s = v.scale, hw = f.w / 2;
  ctx.fillStyle = T.bg; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const tl = toScreen(v, { x: -hw, y: f.d });
  ctx.fillStyle = T.floor; ctx.fillRect(tl.x, tl.y, f.w * s, f.d * s);
  const seg = (a: Point, b: Point) => { const p = toScreen(v, a), q = toScreen(v, b); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
  if (s >= 4) { // the step grid from the center line and the front edge; every 4th step a bit stronger
    ctx.lineWidth = 1;
    for (let i = Math.ceil(-hw); i <= hw; i++) { ctx.strokeStyle = i % 4 === 0 ? T.gridMajor : T.gridMinor; seg({ x: i, y: 0 }, { x: i, y: f.d }); }
    for (let j = 1; j < f.d; j++) { ctx.strokeStyle = j % 4 === 0 ? T.gridMajor : T.gridMinor; seg({ x: -hw, y: j }, { x: hw, y: j }); }
  }
  ctx.strokeStyle = T.line; ctx.lineWidth = Math.max(1, s * LINE * 0.5); // court lines are 2 in
  ctx.strokeRect(tl.x, tl.y, f.w * s, f.d * s);
  const arc = (c: Point, r: number, a0 = 0, a1 = Math.PI * 2) => { const p = toScreen(v, c); ctx.beginPath(); ctx.arc(p.x, p.y, r * s, a0, a1); ctx.stroke(); };
  const my = f.d / 2;
  if (f.kind !== 'court') { // a plain floor: ticks where the center line meets the edges
    ctx.lineWidth = Math.max(1, s * LINE);
    seg({ x: 0, y: 0 }, { x: 0, y: 1 }); seg({ x: 0, y: f.d - 1 }, { x: 0, y: f.d });
    return;
  }
  seg({ x: 0, y: 0 }, { x: 0, y: f.d });
  arc({ x: 0, y: my }, 6 * FEET);
  for (const side of [-1, 1]) { // each end, in feet from its baseline
    const bx = side * hw, inward = -side, at = (ft: number, y: number) => ({ x: bx + inward * ft * FEET, y });
    const lane = 8 * FEET;
    seg(at(0, my - lane), at(19, my - lane)); seg(at(19, my - lane), at(19, my + lane)); seg(at(19, my + lane), at(0, my + lane)); // the lane
    arc(at(19, my), 6 * FEET); // the free-throw circle
    const hoop = at(5.25, my), r3 = 19.75 * FEET; // the three-point line (high school): an arc around the hoop, straight to the baseline
    seg(at(0, my - r3), at(5.25, my - r3)); seg(at(0, my + r3), at(5.25, my + r3));
    const p = toScreen(v, hoop); ctx.beginPath(); ctx.arc(p.x, p.y, r3 * s, side > 0 ? Math.PI / 2 : -Math.PI / 2, side > 0 ? (3 * Math.PI) / 2 : Math.PI / 2); ctx.stroke();
    arc(hoop, 0.75 * FEET);
  }
}

export function drawField(ctx: CanvasRenderingContext2D, v: View, field: FieldSpec, theme: Theme = 'screen') {
  if (typeof field !== 'string') { drawFloor(ctx, v, field, theme); return; }
  const hash = field;
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

// Normal-step paths in the interface's darkest green (3:1 on the turf), so white letters and numbers stay readable where paths cross;
// yellow/red warnings get a dark casing, since bright colors alone barely stand out from mid-green turf (red is 1.6:1).
export const TIER_COLOR = { ok: PALETTE['bg-deep'], yellow: PALETTE.warn, red: PALETTE['step-red'] } as const;
/** The same tiers as text on the dark panels (the field's bright red is too dim for text there). */
export const STEP_TEXT = { ok: 'var(--text)', yellow: 'var(--warn)', red: 'var(--danger)' } as const;

export interface Dot { id: string; label: string; at: Point; pin?: LabelSide; color?: string; glyph?: string; facing?: Point } // glyph: draw this letter instead of a dot; facing: a unit direction on the field
export interface Path { from: Point; to: Point; tier: keyof typeof TIER_COLOR }

/**
 * Dot labels, placed so they don't cover other dots or each other (see placeLabels). Drawn upright on screen even when
 * the field is turned around (Facing front), so the canvas's current transform only moves where they go.
 */
export function drawLabels(
  ctx: CanvasRenderingContext2D, dots: (Dot & { first?: boolean; px?: number; color?: string })[], v: View, r: number, px: number, color: string, halo?: string,
  always = false, // printed charts: every label shows (moved out with a leader line if needed)
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
    return { x: c.x, y: c.y, w: ctx.measureText(d.label).width + 2, h: d.px ?? px, r: r * k, pin: !d.label ? 'hidden' as const : d.pin && flipped ? turned(d.pin) : d.pin, first: d.first }; // no label: still a dot to dodge
  });
  const spots = placeLabels(items, Math.max(1, px * 0.15), always);
  // Leader lines first, under the text: from the dot's edge to the edge of its label's box.
  spots.forEach((spot, i) => {
    if (!spot?.leader || !dots[i].label) return;
    const it = items[i], dx = spot.x - it.x, dy = spot.y - it.y, len = Math.hypot(dx, dy);
    const box = Math.min(Math.abs(dx) > 1e-9 ? it.w / 2 / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-9 ? it.h / 2 / Math.abs(dy) : Infinity); // fraction of the way inside the box
    ctx.beginPath();
    ctx.moveTo(it.x + (dx / len) * it.r, it.y + (dy / len) * it.r);
    ctx.lineTo(spot.x - dx * box, spot.y - dy * box);
    ctx.lineWidth = Math.max(1, px * 0.07); ctx.strokeStyle = dots[i].color ?? color; ctx.stroke();
  });
  spots.forEach((spot, i) => {
    if (!spot || !dots[i].label) return;
    font(dots[i]);
    if (halo) { ctx.lineWidth = (dots[i].px ?? px) * 0.3; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(dots[i].label, spot.x, spot.y); }
    ctx.fillStyle = dots[i].color ?? color;
    ctx.fillText(dots[i].label, spot.x, spot.y);
  });
  ctx.restore();
}

/**
 * A section letter centered on its spot, always upright (drawn in device space, so a field turned around for Facing
 * front doesn't flip it). `badge`: a filled circle behind it (selected). Dark outline so any color reads on turf or paper.
 */
export function drawGlyph(ctx: CanvasRenderingContext2D, at: Point, glyph: string, size: number, color: string, badge?: string, outline = 'rgba(0,0,0,0.85)') {
  const c = ctx.getTransform().transformPoint(at), k = Math.hypot(ctx.getTransform().a, ctx.getTransform().b);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const px = size * k;
  if (badge) { ctx.fillStyle = badge; ctx.beginPath(); ctx.arc(c.x, c.y, px * 0.62, 0, Math.PI * 2); ctx.fill(); }
  ctx.font = `800 ${px}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const y = c.y + px * 0.04; // optical center: capitals sit a touch high on the middle baseline
  if (!badge) { ctx.lineWidth = px * 0.16; ctx.lineJoin = 'round'; ctx.strokeStyle = outline; ctx.strokeText(glyph, c.x, y); }
  ctx.fillStyle = color; ctx.fillText(glyph, c.x, y);
  ctx.restore();
}

/**
 * Which way a performer faces: a small pointer on the edge of its mark (radius r, in screen px), toward field direction
 * `dir`. Drawn through the canvas's transform, so it turns with a field that's turned around (Facing front).
 */
export function drawFacing(ctx: CanvasRenderingContext2D, v: View, at: Point, dir: Point, r: number, fill: string, edge: string) {
  const c = toScreen(v, at), e = toScreen(v, { x: at.x + dir.x, y: at.y + dir.y });
  const len = Math.hypot(e.x - c.x, e.y - c.y) || 1, ux = (e.x - c.x) / len, uy = (e.y - c.y) / len;
  const L = Math.max(6, r * 0.75), base = r - Math.max(1, r * 0.1), w = L * 0.6; // its base tucked into the mark's edge: one mark, not two
  ctx.beginPath();
  ctx.moveTo(c.x + ux * (base + L), c.y + uy * (base + L));
  ctx.lineTo(c.x + ux * base - uy * w, c.y + uy * base + ux * w);
  ctx.lineTo(c.x + ux * base + uy * w, c.y + uy * base - ux * w);
  ctx.closePath();
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, L * 0.25); ctx.strokeStyle = edge; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}

/** Props under the performers: a shape with its name in the middle; `print` is black on white. */
export function drawProps(
  ctx: CanvasRenderingContext2D, v: View, props: { id: string; name: string; w: number; h: number; round?: boolean }[],
  spots: Record<string, { x: number; y: number; angle: number }>, selected: string | null, mode: 'screen' | 'print', px: number,
) {
  for (const pr of props) {
    const s = spots[pr.id];
    if (!s) continue;
    const c = toScreen(v, s), w = pr.w * v.scale, h = pr.h * v.scale, sel = pr.id === selected;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((-s.angle * Math.PI) / 180); // the screen's y runs down, so counterclockwise on the field is negative here
    ctx.beginPath();
    if (pr.round) ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); else ctx.rect(-w / 2, -h / 2, w, h);
    ctx.globalAlpha = mode === 'print' ? 0.85 : 0.7;
    ctx.fillStyle = mode === 'print' ? '#fff' : PALETTE['bg-deep'];
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(2, v.scale * 0.15) * (sel ? 1.6 : 1);
    ctx.strokeStyle = mode === 'print' ? '#000' : sel ? PALETTE.gold : '#fff';
    ctx.setLineDash(mode === 'print' ? [] : [v.scale * 0.6, v.scale * 0.3]);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    const m = ctx.getTransform(), at = m.transformPoint(c);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // the name reads upright, even on a field turned around
    ctx.font = `700 ${px}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const maxW = Math.max(w, h) * Math.hypot(m.a, m.b);
    ctx.lineWidth = px * 0.3; ctx.lineJoin = 'round'; ctx.strokeStyle = mode === 'print' ? '#fff' : 'rgba(0,0,0,0.85)';
    ctx.strokeText(pr.name, at.x, at.y, maxW); // an edge, so lines on the field don't run through the name
    ctx.fillStyle = mode === 'print' ? '#000' : sel ? PALETTE.gold : '#fff';
    ctx.fillText(pr.name, at.x, at.y, maxW);
    ctx.restore();
  }
}

/** Performers, their incoming paths, and an optional selection box. */
export function drawPerformers(
  ctx: CanvasRenderingContext2D, v: View, dots: Dot[], selected: Set<string>, paths: Path[], box?: [Point, Point], dpr = 1,
) {
  const s = v.scale;
  ctx.setLineDash([s * 0.4, s * 0.3]);
  ctx.lineWidth = Math.max(1.5, s * 0.12);
  const w = ctx.lineWidth;
  for (const p of paths) {
    const a = toScreen(v, p.from), b = toScreen(v, p.to);
    if (p.tier !== 'ok') { // dark casing under a warning color
      ctx.setLineDash([]); ctx.strokeStyle = PALETTE['bg-deep']; ctx.lineWidth = w + Math.max(2, s * 0.1);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([s * 0.4, s * 0.3]); ctx.lineWidth = w;
    }
    ctx.strokeStyle = TIER_COLOR[p.tier];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  const letters = dots.some((d) => d.glyph), f = Math.max(11 * dpr, s * 1.2); // letter height
  const r = letters ? f * 0.45 : Math.max(4, s * 0.45);
  for (const d of dots) {
    const c = toScreen(v, d.at);
    const sel = selected.has(d.id);
    if (d.glyph) {
      drawGlyph(ctx, c, d.glyph, f, sel ? '#111' : d.color ?? '#fff', sel ? PALETTE.gold : undefined);
      continue;
    }
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = sel ? PALETTE.gold : d.color ?? '#111';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.25);
    ctx.strokeStyle = sel ? '#fff' : d.color ? '#111' : PALETTE.gold; // a colored dot gets a dark ring so light colors show on the turf
    ctx.stroke();
  }
  // Facing, only where the caller gives it (the editor: selected performers), attached to the mark so the letter stays
  // the spot (Jason): a pointer on the badge's edge.
  const edge = (d0: Dot) => (d0.glyph ? f * 0.62 : r) + Math.max(1, s * 0.05);
  for (const d of dots) if (d.facing) drawFacing(ctx, v, d.at, d.facing, edge(d), PALETTE.gold, 'rgba(0,0,0,0.85)');
  drawLabels(ctx, dots.map((d) => ({ ...d, first: selected.has(d.id) })), v, r, Math.max(10 * dpr, s * 0.8), '#fff', 'rgba(0,0,0,0.85)'); // at least 10 CSS px: smaller isn't readable; black outline so yard lines don't swallow them

  if (box) {
    const a = toScreen(v, box[0]), b = toScreen(v, box[1]);
    ctx.fillStyle = 'rgba(255,209,102,0.12)';
    ctx.strokeStyle = PALETTE.gold;
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
  ctx.strokeStyle = PALETTE.blue;
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
    ctx.fillStyle = PALETTE.blue;
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
      if (sel) { ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = w + 6; ctx.beginPath(); path(); ctx.stroke(); }
      ctx.strokeStyle = ink; ctx.lineWidth = w; ctx.beginPath(); path(); ctx.stroke();
    };
    if (m.kind === 'text') {
      const q = toScreen(v, m.at);
      ctx.font = `600 ${TEXT_STEPS * s}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const label = m.text || (theme === 'screen' ? '(type a note)' : '');
      ctx.lineWidth = 0.4 * s;
      ctx.strokeStyle = sel ? PALETTE.blue : halo;
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

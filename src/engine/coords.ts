// Field math in 8-to-5 steps (1 step = 22.5 in).
// Origin: 50 yard line at the front sideline. +x toward Side 2 (director's right), +y toward back sideline.

export interface Point { x: number; y: number }

export const STEP_IN = 22.5;
export const FIELD_WIDTH = 1920 / STEP_IN; // 160 ft
export const YARDLINE_SPACING = 8; // 5 yards
export const GOAL_LINE_X = 80; // 50 yards

/** Hash distance from the nearer sideline, in steps. */
export const HASHES = {
  highSchool: 640 / STEP_IN, // 53' 4"
  college: 720 / STEP_IN, // 60'
  nfl: 849 / STEP_IN, // 70' 9"
} as const;
export type HashPreset = keyof typeof HASHES;

const EPS = 1e-9;
const quarter = (n: number) => Math.round(n * 4) / 4;
const steps = (n: number) => `${n} step${n === 1 ? '' : 's'}`;
const lineName = (k: number) => (k === 10 ? 'Goal Line' : String(50 - 5 * k));

/** Side-to-side part, e.g. "2 steps outside the Side 2 45". */
export function sideToSide(x: number): string {
  const ax = quarter(Math.abs(x));
  if (ax === 0) return 'On the 50';
  const side = `Side ${x < 0 ? 1 : 2}`;
  // Nearest yard line (index from the 50), capped at the goal line.
  const k = Math.min(Math.round(ax / YARDLINE_SPACING), 10);
  const d = ax - k * YARDLINE_SPACING;
  if (Math.abs(d) === 4) {
    const [a, b] = d > 0 ? [k + 1, k] : [k, k - 1];
    return `Splitting ${lineName(a)} and ${lineName(b)} on ${side}`;
  }
  const where = d > 0 ? 'outside' : 'inside';
  if (k === 0) return `${steps(d)} outside the 50 on ${side}`;
  if (d === 0) return `On the ${side} ${lineName(k)}`;
  return `${steps(Math.abs(d))} ${where} the ${side} ${lineName(k)}`;
}

/** Front-to-back part, e.g. "2 steps in front of Front Hash". */
export function frontToBack(y: number, hash: HashPreset): string {
  const h = HASHES[hash];
  const refs: [string, number][] = [
    ['Front Sideline', 0],
    ['Front Hash', h],
    ['Back Hash', FIELD_WIDTH - h],
    ['Back Sideline', FIELD_WIDTH],
  ];
  // First (most frontward) reference wins ties.
  let [name, ref] = refs[0];
  for (const r of refs) if (Math.abs(y - r[1]) < Math.abs(y - ref) - EPS) [name, ref] = r;
  const d = quarter(y - ref); // round the distance performers actually count
  if (d === 0) return `On ${name}`;
  return `${steps(Math.abs(d))} ${d < 0 ? 'in front of' : 'behind'} ${name}`;
}

export const readout = (p: Point, hash: HashPreset) =>
  `${sideToSide(p.x)}, ${frontToBack(p.y, hash).replace(/^On /, 'on ')}`;

export type StepTier = 'ok' | 'yellow' | 'red';

/** Step size for a move of `dist` steps over `counts` counts, as N-to-5 (8 = standard). */
export function stepSize(dist: number, counts: number): { per5: number; tier: StepTier } {
  if (!(counts > 0)) throw new RangeError('counts must be > 0');
  const len = dist / counts; // steps per count, in 8-to-5 steps
  const per5 = len === 0 ? Infinity : 8 / len;
  const tier: StepTier = per5 < 4 - EPS ? 'red' : per5 < 6 - EPS ? 'yellow' : 'ok';
  return { per5, tier };
}

export const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * Follow-the-leader. `starts[0]` is the leader; the rest follow in order.
 * Everyone travels the leader's path length along the trail: leaderEnd <- leaderStart <- starts[1] <- ...
 * Returns positions at fraction f (0..1) of the move.
 */
export function ftlPositions(starts: Point[], leaderEnd: Point, f: number): Point[] {
  const trail = [leaderEnd, ...starts];
  const arc = [0];
  for (let i = 1; i < trail.length; i++) arc.push(arc[i - 1] + distance(trail[i - 1], trail[i]));
  const travel = arc[1] * f;
  return starts.map((_, i) => pointAt(trail, arc, arc[i + 1] - travel));
}

function pointAt(trail: Point[], arc: number[], s: number): Point {
  let i = 1;
  while (i < arc.length - 1 && arc[i] < s) i++;
  const seg = arc[i] - arc[i - 1];
  const t = seg === 0 ? 0 : (s - arc[i - 1]) / seg;
  const a = trail[i - 1], b = trail[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Show data model and the pure operations on it. All positions are in steps (see coords.ts).
import { HASHES, FIELD_WIDTH, distance, stepSize, type HashPreset, type Point, type StepTier } from './coords';
import { assign } from './shapes';

export interface Section { id: string; name: string; letter: string }
export interface Performer { id: string; section: string; number: number }
/** A set ("page"). `counts` = counts of the move INTO this set; ignored for the first set. */
export interface DrillSet {
  id: string;
  name: string;
  counts: number;
  pos: Record<string, Point>;
  /** Measures the move into this set covers, typed by the drill writer as on a score (e.g. "9–12", or "0–4" from a pickup: pickups are measure 0). */
  measures?: string;
}
export interface Show {
  format: 'freeform-show';
  version: 1;
  title: string;
  hash: HashPreset;
  sections: Section[];
  performers: Performer[];
  sets: DrillSet[];
}

let seq = 0;
export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

const DEFAULT_SECTIONS: [string, string][] = [
  ['Flute', 'F'], ['Clarinet', 'C'], ['Saxophone', 'X'], ['Trumpet', 'T'], ['Mellophone', 'M'],
  ['Low Brass', 'B'], ['Tuba', 'U'], ['Snare', 'S'], ['Tenors', 'Q'], ['Bass Drum', 'D'],
  ['Cymbals', 'Y'], ['Front Ensemble', 'P'], ['Color Guard', 'G'],
];

export function newShow(): Show {
  return {
    format: 'freeform-show',
    version: 1,
    title: 'Untitled show',
    hash: 'highSchool',
    sections: DEFAULT_SECTIONS.map(([name, letter]) => ({ id: newId('s'), name, letter })),
    performers: [],
    sets: [{ id: newId('set'), name: '1', counts: 0, pos: {} }],
  };
}

export function label(show: Show, p: Performer) {
  return `${show.sections.find((s) => s.id === p.section)?.letter ?? '?'}${p.number}`;
}

const mapSet = (show: Show, i: number, f: (s: DrillSet) => DrillSet): Show => ({
  ...show,
  sets: show.sets.map((s, j) => (j === i ? f(s) : s)),
});

/** Adds a performer; it gets `at` in every set so it exists for the whole show. */
export function addPerformer(show: Show, section: string, at: Point): { show: Show; id: string } {
  const id = newId('p');
  const number = Math.max(0, ...show.performers.filter((p) => p.section === section).map((p) => p.number)) + 1;
  return {
    id,
    show: {
      ...show,
      performers: [...show.performers, { id, section, number }],
      sets: show.sets.map((s) => ({ ...s, pos: { ...s.pos, [id]: at } })),
    },
  };
}

export function removePerformers(show: Show, ids: Set<string>): Show {
  return {
    ...show,
    performers: show.performers.filter((p) => !ids.has(p.id)),
    sets: show.sets.map((s) => ({ ...s, pos: Object.fromEntries(Object.entries(s.pos).filter(([k]) => !ids.has(k))) })),
  };
}

/** Sets positions in set `i` for the given performers. */
export function placeInSet(show: Show, i: number, moves: Record<string, Point>): Show {
  return mapSet(show, i, (s) => ({ ...s, pos: { ...s.pos, ...moves } }));
}

/** New set after `i`, starting as a copy of set i's positions. */
export function addSetAfter(show: Show, i: number, counts = 16): Show {
  const src = show.sets[i];
  const names = new Set(show.sets.map((s) => s.name));
  let n = show.sets.length + 1;
  while (names.has(String(n))) n++;
  const sets = [...show.sets];
  sets.splice(i + 1, 0, { id: newId('set'), name: String(n), counts, pos: { ...src.pos } });
  return { ...show, sets };
}

export function removeSet(show: Show, i: number): Show {
  if (show.sets.length <= 1) return show;
  return { ...show, sets: show.sets.filter((_, j) => j !== i) };
}

export const setCounts = (show: Show, i: number, counts: number): Show =>
  mapSet(show, i, (s) => ({ ...s, counts: Math.max(1, Math.round(counts)) }));

// ---- Timeline. Time is measured in counts from the start of the show (set 1 = count 0).

/** starts[i] = the count at which set i is reached. */
export function setStarts(show: Show): number[] {
  const starts = [0];
  for (let i = 1; i < show.sets.length; i++) starts.push(starts[i - 1] + show.sets[i].counts);
  return starts;
}

export const totalCounts = (show: Show) => setStarts(show).at(-1)!;

/** Where time `t` falls: the set being moved into (`to`) and the fraction of that move. f = 1 means "on set `to`". */
export function locate(show: Show, t: number): { to: number; f: number; count: number } {
  const starts = setStarts(show);
  if (t <= 0 || show.sets.length === 1) return { to: 0, f: 1, count: 0 };
  for (let i = 1; i < starts.length; i++) {
    if (t <= starts[i]) {
      const c = t - starts[i - 1];
      return { to: i, f: c / show.sets[i].counts, count: c };
    }
  }
  return { to: starts.length - 1, f: 1, count: show.sets.at(-1)!.counts };
}

/** Index of the set exactly at time t, or -1 if t is mid-move. */
export function setAt(show: Show, t: number): number {
  return setStarts(show).findIndex((s) => Math.abs(s - t) < 1e-9);
}

/** Every performer's position at time t (float / straight-line moves). */
export function positionsAt(show: Show, t: number): Record<string, Point> {
  const { to, f } = locate(show, t);
  const b = show.sets[to].pos;
  if (f >= 1 || to === 0) return b;
  const a = show.sets[to - 1].pos;
  const out: Record<string, Point> = {};
  for (const id of Object.keys(b)) {
    const p = a[id] ?? b[id], q = b[id];
    out[id] = { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f };
  }
  return out;
}

/** Step size per performer for the move into set i (i >= 1). */
export function moveSteps(show: Show, i: number): Record<string, { per5: number; tier: StepTier }> {
  const a = show.sets[i - 1].pos, b = show.sets[i].pos;
  return Object.fromEntries(Object.keys(b).map((id) => [id, stepSize(distance(a[id] ?? b[id], b[id]), show.sets[i].counts)]));
}

/** The largest step (smallest N-to-5) in the move into set i. */
export function biggestStep(show: Show, i: number) {
  const all = Object.values(moveSteps(show, i));
  return all.length ? all.reduce((m, s) => (s.per5 < m.per5 ? s : m)) : null;
}

// ---- Exact coordinate entry: the inverse of the readout.

export type SideDir = 'on' | 'inside' | 'outside';
export type FrontRef = 'Front Sideline' | 'Front Hash' | 'Back Hash' | 'Back Sideline';
export type FrontDir = 'on' | 'in front of' | 'behind';

/** line: 50, 45, ..., 5, or 0 for the goal line. side is ignored for the 50. */
export function xFrom(side: 1 | 2, line: number, steps: number, dir: SideDir): number {
  const base = ((50 - line) / 5) * 8;
  const off = dir === 'on' ? 0 : dir === 'outside' || line === 50 ? steps : -steps;
  return (side === 1 ? -1 : 1) * (base + off);
}

export function yFrom(ref: FrontRef, steps: number, dir: FrontDir, hash: HashPreset): number {
  const h = HASHES[hash];
  const refY = { 'Front Sideline': 0, 'Front Hash': h, 'Back Hash': FIELD_WIDTH - h, 'Back Sideline': FIELD_WIDTH }[ref];
  return refY + (dir === 'on' ? 0 : dir === 'behind' ? steps : -steps);
}

// ---- File format. Shows from disk are untrusted: check shape before use.

export function parseShow(text: string): Show {
  const s = JSON.parse(text);
  const bad = (why: string) => { throw new Error(`Not a valid Freeform show: ${why}`); };
  if (s?.format !== 'freeform-show') bad('missing format marker');
  if (s.version !== 1) bad(`unsupported version ${s.version}`);
  if (!(s.hash in HASHES)) bad('unknown hash preset');
  if (!Array.isArray(s.sections) || !Array.isArray(s.performers) || !Array.isArray(s.sets) || !s.sets.length) bad('missing lists');
  const str = (v: unknown) => typeof v === 'string';
  if (typeof s.title !== 'string') bad('title');
  for (const x of s.sections) if (!str(x?.id) || !str(x.name) || !str(x.letter)) bad('section');
  for (const x of s.performers) if (!str(x?.id) || !str(x.section) || !Number.isFinite(x.number)) bad('performer');
  for (const set of s.sets) {
    if (!str(set?.id) || !str(set.name) || !Number.isFinite(set.counts) || typeof set.pos !== 'object' || !set.pos) bad('set');
    if (set.measures !== undefined && !str(set.measures)) bad('set measures');
    for (const p of Object.values(set.pos) as Point[]) if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) bad(`position in set ${set.name}`);
  }
  return s as Show;
}

// ---- Range playback.

/** The count range [lo, hi] from set `fromId` to set `toId` (null = first / last set, as do ids no longer in the show). */
export function playRange(show: Show, fromId: string | null, toId: string | null): [number, number] {
  const starts = setStarts(show);
  const idx = (id: string | null, fallback: number) => {
    const i = id ? show.sets.findIndex((s) => s.id === id) : -1;
    return i < 0 ? fallback : i;
  };
  const a = idx(fromId, 0), b = idx(toId, show.sets.length - 1);
  return [starts[Math.min(a, b)], starts[Math.max(a, b)]];
}

/** Where playback starts: the current count if it's inside the range (and not at its end), else the range start. */
export const playStart = (t: number, [lo, hi]: [number, number]) => (t >= lo && t < hi ? t : lo);

/** Advance playback by `counts`; at the range end either stop or wrap around to the start. */
export function advance(t: number, counts: number, [lo, hi]: [number, number], loop: boolean): { t: number; done: boolean } {
  const next = t + counts;
  if (next < hi) return { t: next, done: false };
  if (!loop || hi <= lo) return { t: hi, done: true };
  return { t: lo + ((next - lo) % (hi - lo)), done: false };
}

// ---- Mirroring.

/** Flip performers in set i across the 50 ('x') or across the field's front-to-back center ('y'). */
export function flip(show: Show, i: number, ids: string[], axis: 'x' | 'y'): Show {
  const pos = show.sets[i].pos;
  return placeInSet(show, i, Object.fromEntries(ids.map((id) => [id, axis === 'x' ? { x: -pos[id].x, y: pos[id].y } : { x: pos[id].x, y: FIELD_WIDTH - pos[id].y }])));
}

/**
 * The selected performers on side `from` keep their spots; those on the other side take the mirror image across the 50.
 * Pairing is least total travel from the previous set (where the move starts), so paths don't cross.
 * Performers exactly on the 50 are left alone. Throws if the two sides have different numbers of performers.
 */
export function mirrorSides(show: Show, i: number, ids: string[], from: 1 | 2): Show {
  const pos = show.sets[i].pos;
  const onSide = (side: 1 | 2) => ids.filter((id) => (side === 1 ? pos[id].x < 0 : pos[id].x > 0));
  const src = onSide(from), dst = onSide(from === 1 ? 2 : 1);
  if (src.length !== dst.length) {
    throw new Error(`Select the same number on each side (Side ${from}: ${src.length}, Side ${from === 1 ? 2 : 1}: ${dst.length}).`);
  }
  const targets = src.map((id) => ({ x: -pos[id].x, y: pos[id].y }));
  const origin = show.sets[Math.max(0, i - 1)].pos;
  const slotOf = assign(dst.map((id) => origin[id] ?? pos[id]), targets);
  return placeInSet(show, i, Object.fromEntries(dst.map((id, k) => [id, targets[slotOf[k]]])));
}

/**
 * Rotate (degrees; positive = counterclockwise as the director sees it) and/or scale the selected performers
 * in set i around the center of their bounding box.
 */
export function rotateScale(show: Show, i: number, ids: string[], deg: number, scale: number): Show {
  if (!ids.length) return show;
  const pos = show.sets[i].pos;
  const xs = ids.map((id) => pos[id].x), ys = ids.map((id) => pos[id].y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const tidy = (n: number) => Math.round(n * 1e9) / 1e9; // keep 90° turns landing exactly on whole steps
  return placeInSet(show, i, Object.fromEntries(ids.map((id) => {
    const dx = pos[id].x - cx, dy = pos[id].y - cy;
    return [id, { x: tidy(cx + scale * (dx * cos - dy * sin)), y: tidy(cy + scale * (dx * sin + dy * cos)) }];
  })));
}

// ---- Grid snapping.

/** Round a point to the nearest multiple of `unit` steps (0 = leave as is). */
export const snapPoint = (p: Point, unit: number): Point =>
  unit ? { x: Math.round(p.x / unit) * unit, y: Math.round(p.y / unit) * unit } : p;

/** Snap the selected performers in set i to the grid. Returns the labels of any that ended up sharing a spot. */
export function snapSelection(show: Show, i: number, ids: string[], unit: number): { show: Show; stacked: string[] } {
  const moves = Object.fromEntries(ids.map((id) => [id, snapPoint(show.sets[i].pos[id], unit)]));
  const next = placeInSet(show, i, moves);
  const byKey = new Map<string, string[]>();
  for (const p of show.performers) {
    const q = next.sets[i].pos[p.id];
    if (!q) continue;
    const k = `${q.x},${q.y}`;
    byKey.set(k, [...(byKey.get(k) ?? []), p.id]);
  }
  const stacked = [...byKey.values()].filter((g) => g.length > 1 && g.some((id) => ids.includes(id))).flat()
    .map((id) => label(show, show.performers.find((p) => p.id === id)!));
  return { show: next, stacked };
}

export const setMeasures = (show: Show, i: number, measures: string): Show =>
  mapSet(show, i, (s) => ({ ...s, measures: measures || undefined }));

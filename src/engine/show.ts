// Show data model and the pure operations on it. All positions are in steps (see coords.ts).
import { HASHES, FIELD_WIDTH, distance, ftlPositions, stepSize, type HashPreset, type Point, type StepTier } from './coords';
import { assign } from './shapes';
import { validMusic, type Music } from './music';
import { validMark, type Mark } from './marks';

/** `color`: optional #rrggbb the section's dots are drawn in. */
export interface Section { id: string; name: string; letter: string; color?: string }
export const COLOR_RE = /^#[0-9a-f]{6}$/i;
export interface Performer { id: string; section: string; number: number }
/** A set ("page"). `counts` = counts of the move INTO this set; ignored for the first set. */
export interface DrillSet {
  id: string;
  name: string;
  counts: number;
  pos: Record<string, Point>;
  /** Measures the move into this set covers, typed by the drill writer as on a score (e.g. "9–12", or "0–4" from a pickup: pickups are measure 0). */
  measures?: string;
  /**
   * Follow-the-leader groups for the move into this set. order[0] is the leader; the rest follow in order.
   * Followers' spots in this set are computed from the trail (see normalizeFtl), not placed by hand.
   */
  ftl?: { order: string[] }[];
  /** Page markup shown on this set only: notes, arrows, freehand drawing. */
  marks?: Mark[];
  /** A note for the whole set, printed under its chart. */
  note?: string;
  /** Per-performer cue for this set ("Slide L, horns 45"), printed on their dot sheet. */
  cues?: Record<string, string>;
  /** Label sides pinned by the drill writer for this set's picture; everyone else's label is placed automatically. */
  labels?: Record<string, LabelSide>;
  /**
   * Count-by-count spots for performers whose move into this set isn't a straight line (imported from Pyware's
   * per-count pages: follow-the-leader, delayed step-offs, rotations). path[k] = spot on count k, from the previous
   * set (k = 0) to this one (k = counts). Used only while both ends still match, so editing either set or the counts
   * quietly falls back to a straight line.
   */
  paths?: Record<string, Point[]>;
}

/** Sides are on the field: "above" = toward the back sideline (up on the editor's screen). */
export type LabelSide = 'above' | 'above-right' | 'right' | 'below-right' | 'below' | 'below-left' | 'left' | 'above-left' | 'hidden';
export const LABEL_SIDES: LabelSide[] = ['above', 'above-right', 'right', 'below-right', 'below', 'below-left', 'left', 'above-left', 'hidden'];
export interface Show {
  format: 'freeform-show';
  version: 1;
  title: string;
  hash: HashPreset;
  sections: Section[];
  performers: Performer[];
  sets: DrillSet[];
  /** The show's recording and the tapped count timings (the audio itself stays in the browser). */
  music?: Music;
}

let seq = 0;
export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

export type SectionList = { name: string; letter: string; color?: string }[];

/** Freeform's starting sections (Jason's lettering). No front ensemble: they're stationary, so they need no drill spots. */
export const DEFAULT_SECTIONS: SectionList = ([
  ['Flute', 'F'], ['Clarinet', 'K'], ['Alto Saxophone', 'A'], ['Tenor Saxophone', 'X'], ['Trumpet', 'P'], ['Mellophone', 'H'],
  ['Trombone', 'N'], ['Baritone', 'E'], ['Tuba', 'T'], ['Snare Drum', 'S'], ['Bass Drum', 'B'], ['Quads', 'Q'], ['Cymbals', 'C'],
  ['Color Guard', 'G'],
] as const).map(([name, letter]) => ({ name, letter }));

/** A starting list saved from a file or storage: kept only if it's a non-empty list of names and letters. */
export function validSectionList(x: unknown): SectionList | null {
  if (!Array.isArray(x) || !x.length || x.length > 100) return null;
  return x.every((s) => typeof s?.name === 'string' && typeof s?.letter === 'string' && s.name.trim() && s.letter.trim()
    && (s.color === undefined || (typeof s.color === 'string' && COLOR_RE.test(s.color))))
    ? x.map((s) => ({ name: s.name, letter: s.letter, ...(s.color ? { color: s.color } : {}) })) : null;
}

export function newShow(sections: SectionList = DEFAULT_SECTIONS): Show {
  return {
    format: 'freeform-show',
    version: 1,
    title: 'Untitled show',
    hash: 'highSchool',
    sections: sections.map(({ name, letter, color }) => ({ id: newId('s'), name, letter, ...(color ? { color } : {}) })),
    performers: [],
    sets: [{ id: newId('set'), name: '1', counts: 0, pos: {} }],
  };
}

/** The color a performer's section is drawn in, if it has one. */
export const colorOf = (show: Show, p: Performer) => show.sections.find((s) => s.id === p.section)?.color;

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

/**
 * Move performers to another section. They're numbered after the section's current members, in their old label
 * order (B1, B2… become T4, T5… when T1–T3 exist), so nobody in the section changes label.
 */
export function moveToSection(show: Show, ids: string[], section: string): Show {
  if (!show.sections.some((s) => s.id === section)) return show;
  const moving = show.performers.filter((p) => ids.includes(p.id) && p.section !== section)
    .sort((a, b) => show.sections.findIndex((s) => s.id === a.section) - show.sections.findIndex((s) => s.id === b.section) || a.number - b.number);
  let next = Math.max(0, ...show.performers.filter((p) => p.section === section).map((p) => p.number));
  const renumber = new Map(moving.map((p) => [p.id, ++next]));
  return { ...show, performers: show.performers.map((p) => (renumber.has(p.id) ? { ...p, section, number: renumber.get(p.id)! } : p)) };
}

/**
 * Number a section's performers 1…n: 'number' keeps their order and closes the gaps (X4 X5 X6 → X1 X2 X3);
 * 'field' goes from Side 1 to Side 2 as they stand in set `setIndex`, front to back where they line up;
 * 'ranks' goes front to back, rank by rank, each rank from Side 1 to Side 2.
 */
export function renumberSection(show: Show, section: string, by: 'number' | 'field' | 'ranks', setIndex = 0): Show {
  const pos = show.sets[setIndex]?.pos ?? {};
  const members = show.performers.filter((p) => p.section === section);
  const at = (p: Performer) => pos[p.id] ?? { x: Infinity, y: Infinity };
  const order = by === 'number' ? [...members].sort((a, b) => a.number - b.number)
    : by === 'ranks' ? [...members].sort((a, b) => Math.round(at(a).y) - Math.round(at(b).y) || at(a).x - at(b).x || a.number - b.number) // a rank = same step from the front, within half a step
    : [...members].sort((a, b) => at(a).x - at(b).x || at(a).y - at(b).y || a.number - b.number);
  const n = new Map(order.map((p, i) => [p.id, i + 1]));
  return { ...show, performers: show.performers.map((p) => (n.has(p.id) ? { ...p, number: n.get(p.id)! } : p)) };
}

/** Remove a section. Its performers move to `moveTo` first; with no `moveTo`, only an empty section can go. */
export function removeSection(show: Show, id: string, moveTo?: string): Show {
  const members = show.performers.filter((p) => p.section === id).map((p) => p.id);
  if (members.length && (!moveTo || moveTo === id)) throw new Error('Choose a section for its performers first.');
  if (show.sections.length < 2) throw new Error('A show needs at least one section.');
  const moved = members.length ? moveToSection(show, members, moveTo!) : show;
  return { ...moved, sections: moved.sections.filter((s) => s.id !== id) };
}

/** Section letters used by more than one section (their labels would clash: two "A1"s). */
export const duplicateLetters = (show: Show) => {
  const seen = new Map<string, number>();
  for (const s of show.sections) { const k = s.letter.trim().toUpperCase(); seen.set(k, (seen.get(k) ?? 0) + 1); }
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
};

export function removePerformers(show: Show, ids: Set<string>): Show {
  return {
    ...show,
    performers: show.performers.filter((p) => !ids.has(p.id)),
    sets: show.sets.map((s) => ({
      ...s,
      pos: Object.fromEntries(Object.entries(s.pos).filter(([k]) => !ids.has(k))),
      cues: s.cues && Object.fromEntries(Object.entries(s.cues).filter(([k]) => !ids.has(k))),
      labels: s.labels && Object.fromEntries(Object.entries(s.labels).filter(([k]) => !ids.has(k))),
    })),
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
  for (const g of show.sets[to].ftl ?? []) {
    const at = ftlPositions(g.order.map((id) => a[id] ?? b[id]), b[g.order[0]], f);
    g.order.forEach((id, k) => { out[id] = at[k]; });
  }
  const n = show.sets[to].counts;
  for (const [id, path] of Object.entries(show.sets[to].paths ?? {})) {
    if (!pathFits(path, a[id] ?? b[id], b[id], n)) continue;
    const c = f * n, k = Math.min(n - 1, Math.floor(c)), g = c - k;
    out[id] = { x: path[k].x + (path[k + 1].x - path[k].x) * g, y: path[k].y + (path[k + 1].y - path[k].y) * g };
  }
  return out;
}

/** A count-by-count path still belongs to its move: one spot per count, ends on the two sets' spots. */
const pathFits = (path: Point[], from: Point | undefined, to: Point | undefined, counts: number) =>
  !!from && !!to && path.length === counts + 1 && near(path[0], from) && near(path[counts], to);
const near = (p: Point, q: Point) => Math.abs(p.x - q.x) < 1e-6 && Math.abs(p.y - q.y) < 1e-6;

/** The trail a follow-the-leader group marches along in the move into set i: leader's end, leader's start, then each follower's start. */
export function ftlTrail(show: Show, i: number, order: string[]): Point[] {
  const a = show.sets[i - 1].pos, b = show.sets[i].pos;
  return [b[order[0]], ...order.map((id) => a[id] ?? b[id])];
}

/**
 * Recompute every follow-the-leader follower's spot from its trail, set by set (a set's spots feed the next move),
 * and drop groups that lost members. Run after every edit so the stored show is always consistent.
 */
export function normalizeFtl(show: Show): Show {
  if (!show.sets.some((s) => s.ftl?.length)) return show;
  const alive = new Set(show.performers.map((p) => p.id));
  const sets = [...show.sets];
  for (let i = 1; i < sets.length; i++) {
    const groups = (sets[i].ftl ?? []).map((g) => ({ order: g.order.filter((id) => alive.has(id)) })).filter((g) => g.order.length > 1);
    if (!sets[i].ftl && !groups.length) continue;
    const pos = { ...sets[i].pos };
    for (const g of groups) {
      const ends = ftlPositions(g.order.map((id) => sets[i - 1].pos[id] ?? pos[id]), pos[g.order[0]], 1);
      g.order.slice(1).forEach((id, k) => { pos[id] = ends[k + 1]; });
    }
    sets[i] = { ...sets[i], pos, ftl: groups.length ? groups : undefined };
  }
  return { ...show, sets };
}

/** Make `order` a follow-the-leader group for the move into set i (order[0] leads). Members leave any other group. */
export function setFtl(show: Show, i: number, order: string[]): Show {
  const others = (show.sets[i].ftl ?? []).map((g) => ({ order: g.order.filter((id) => !order.includes(id)) }));
  return normalizeFtl(mapSet(show, i, (s) => ({ ...s, ftl: [...others, { order }] })));
}

/** Put performers back to floating for the move into set i. They stay where FTL left them. */
export const clearFtl = (show: Show, i: number, ids: string[]): Show =>
  normalizeFtl(mapSet(show, i, (s) => ({ ...s, ftl: (s.ftl ?? []).map((g) => ({ order: g.order.filter((id) => !ids.includes(id)) })) })));

/** Default follower order: from the leader, each next performer is the nearest remaining one (at the start of the move). */
export function chainOrder(show: Show, i: number, leader: string, ids: string[]): string[] {
  const a = show.sets[Math.max(0, i - 1)].pos;
  const order = [leader];
  const left = new Set(ids.filter((id) => id !== leader));
  while (left.size) {
    const last = a[order.at(-1)!];
    let best = '', bd = Infinity;
    for (const id of left) { const d = distance(last, a[id]); if (d < bd) { bd = d; best = id; } }
    order.push(best);
    left.delete(best);
  }
  return order;
}

/** Step size per performer for the move into set i (i >= 1). */
export function moveSteps(show: Show, i: number): Record<string, { per5: number; tier: StepTier }> {
  const a = show.sets[i - 1].pos, b = show.sets[i].pos;
  const dist: Record<string, number> = Object.fromEntries(Object.keys(b).map((id) => [id, distance(a[id] ?? b[id], b[id])]));
  // In follow-the-leader everyone marches the leader's distance, whatever the straight line says.
  for (const g of show.sets[i].ftl ?? []) for (const id of g.order) dist[id] = dist[g.order[0]];
  // On a count-by-count path, the step size that matters is its biggest single count.
  const n = show.sets[i].counts;
  for (const [id, path] of Object.entries(show.sets[i].paths ?? {}))
    if (pathFits(path, a[id] ?? b[id], b[id], n)) dist[id] = n * Math.max(...path.slice(1).map((p, k) => distance(path[k], p)));
  return Object.fromEntries(Object.entries(dist).map(([id, d]) => [id, stepSize(d, show.sets[i].counts)]));
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
  if (s?.format === 'freeform-locked') throw new Error('That is a locked copy made for a hosted link, and only the link can open it. Import the .freeform file instead.');
  if (s?.format !== 'freeform-show') bad('missing format marker');
  if (s.version !== 1) bad(`unsupported version ${s.version}`);
  if (!(s.hash in HASHES)) bad('unknown hash preset');
  if (!Array.isArray(s.sections) || !Array.isArray(s.performers) || !Array.isArray(s.sets) || !s.sets.length) bad('missing lists');
  const str = (v: unknown) => typeof v === 'string';
  if (typeof s.title !== 'string') bad('title');
  if (s.music !== undefined && !validMusic(s.music)) bad('music');
  for (const x of s.sections) if (!str(x?.id) || !str(x.name) || !str(x.letter) || (x.color !== undefined && !COLOR_RE.test(x.color))) bad('section');
  for (const x of s.performers) if (!str(x?.id) || !str(x.section) || !Number.isFinite(x.number)) bad('performer');
  for (const set of s.sets) {
    if (!str(set?.id) || !str(set.name) || !Number.isFinite(set.counts) || typeof set.pos !== 'object' || !set.pos) bad('set');
    if (set.measures !== undefined && !str(set.measures)) bad('set measures');
    if (set.ftl !== undefined && (!Array.isArray(set.ftl) || !set.ftl.every((g: { order?: unknown }) =>
      Array.isArray(g?.order) && g.order.every((id) => str(id) && id in set.pos)))) bad('set follow-the-leader');
    if (set.marks !== undefined && (!Array.isArray(set.marks) || !set.marks.every(validMark))) bad('set markup');
    if (set.note !== undefined && !str(set.note)) bad('set note');
    if (set.cues !== undefined && (typeof set.cues !== 'object' || !set.cues ||
      !Object.entries(set.cues).every(([id, c]) => id in set.pos && str(c)))) bad('set cues');
    if (set.labels !== undefined && (typeof set.labels !== 'object' || !set.labels ||
      !Object.entries(set.labels).every(([id, side]) => id in set.pos && LABEL_SIDES.includes(side as LabelSide)))) bad('set label sides');
    for (const p of Object.values(set.pos) as Point[]) if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) bad(`position in set ${set.name}`);
    if (set.paths !== undefined && (typeof set.paths !== 'object' || !set.paths || !Object.entries(set.paths).every(([id, path]) =>
      id in set.pos && Array.isArray(path) && path.length <= 2001 && path.every((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y))))) bad('set paths');
  }
  return normalizeFtl(s as Show);
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

/**
 * What Play does from count `t`: start right there and go forward. The play range only decides where it stops
 * (or loops back to); from outside the range, it plays on to the end of the show. Null: nothing ahead to play.
 */
export function playPlan(t: number, [lo, hi]: [number, number], total: number, loop: boolean): { from: number; span: [number, number]; loop: boolean } | null {
  if (t >= lo && t < hi) return { from: t, span: [lo, hi], loop };
  return t < total ? { from: t, span: [t, total], loop: false } : null;
}

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
  const pos = show.sets[i].pos, pins = show.sets[i].labels;
  const moved = placeInSet(show, i, Object.fromEntries(ids.map((id) => [id, axis === 'x' ? { x: -pos[id].x, y: pos[id].y } : { x: pos[id].x, y: FIELD_WIDTH - pos[id].y }])));
  return withPins(moved, i, Object.fromEntries(ids.filter((id) => pins?.[id]).map((id) => [id, mirrorSide(pins![id], axis)])));
}

/** A pinned label side reflected with its dot: across the 50, left ↔ right; front to back, above ↔ below. */
export function mirrorSide(side: LabelSide, axis: 'x' | 'y'): LabelSide {
  const swap: Record<string, string> = axis === 'x' ? { left: 'right', right: 'left' } : { above: 'below', below: 'above' };
  return side.split('-').map((w) => swap[w] ?? w).join('-') as LabelSide;
}

const withPins = (show: Show, i: number, pins: Record<string, LabelSide | null>) =>
  Object.entries(pins).reduce((s, [id, side]) => setLabelSide(s, i, [id], side), show);

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
  const moved = placeInSet(show, i, Object.fromEntries(dst.map((id, k) => [id, targets[slotOf[k]]])));
  // Each copy takes its partner's label side, mirrored (or automatic if the partner has none).
  const pins = show.sets[i].labels;
  return withPins(moved, i, Object.fromEntries(dst.map((id, k) => { const p = pins?.[src[slotOf[k]]]; return [id, p ? mirrorSide(p, 'x') : null]; })));
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

// ---- Changing hash marks.

/**
 * Re-draw every set for a different hash preset, keeping positions relative to the hashes: on the hash stays on the
 * hash, sidelines stay sidelines, and each zone (sideline–hash, hash–hash, hash–sideline) stretches proportionally.
 */
export function remapHash(show: Show, to: HashPreset): Show {
  const h0 = HASHES[show.hash], h1 = HASHES[to], W = FIELD_WIDTH;
  const y = (v: number) =>
    v <= h0 ? (v * h1) / h0
    : v >= W - h0 ? W - ((W - v) * h1) / h0
    : h1 + ((v - h0) * (W - 2 * h1)) / (W - 2 * h0);
  const sets = show.sets.map((s) => ({ ...s, pos: Object.fromEntries(Object.entries(s.pos).map(([id, p]) => [id, { x: p.x, y: y(p.y) }])) }));
  return normalizeFtl({ ...show, hash: to, sets });
}

// ---- Markup, page notes, cues.

export const setMarks = (show: Show, i: number, f: (marks: Mark[]) => Mark[]): Show =>
  mapSet(show, i, (s) => { const marks = f(s.marks ?? []); return { ...s, marks: marks.length ? marks : undefined }; });

export const setNote = (show: Show, i: number, note: string): Show => mapSet(show, i, (s) => ({ ...s, note: note || undefined }));

/** Give the performers the same cue in set i ('' clears it). */
export function setCue(show: Show, i: number, ids: string[], cue: string): Show {
  return mapSet(show, i, (s) => {
    const cues = { ...s.cues };
    for (const id of ids) { if (cue) cues[id] = cue; else delete cues[id]; }
    return { ...s, cues: Object.keys(cues).length ? cues : undefined };
  });
}

/** Pin these performers' label side in set i, or (null) go back to automatic placement. */
export function setLabelSide(show: Show, i: number, ids: string[], side: LabelSide | null): Show {
  return mapSet(show, i, (s) => {
    const labels = { ...s.labels };
    for (const id of ids) { if (side) labels[id] = side; else delete labels[id]; }
    return { ...s, labels: Object.keys(labels).length ? labels : undefined };
  });
}

/**
 * Move set i (i >= 1) to land on count `at`, keeping every other set where it is: the move into set i and the
 * move out of it trade counts. Each move keeps at least 1 count. Returns the show unchanged for set 1.
 */
export function moveSetTo(show: Show, i: number, at: number): Show {
  if (i < 1 || i >= show.sets.length) return show;
  const starts = setStarts(show);
  const hi = i + 1 < show.sets.length ? starts[i + 1] - 1 : Infinity;
  const c = Math.min(hi, Math.max(starts[i - 1] + 1, Math.round(at)));
  if (c === starts[i]) return show;
  return {
    ...show,
    sets: show.sets.map((s, j) => (j === i ? { ...s, counts: c - starts[i - 1] } : j === i + 1 ? { ...s, counts: starts[i + 1] - c } : s)),
  };
}

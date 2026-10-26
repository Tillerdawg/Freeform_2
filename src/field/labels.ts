// Readable dot labels: each label takes the first side (above, below, right, left) where it covers no other dot
// and no label already placed; if every side is taken it's hidden (zooming in spreads the dots and brings it back).
// A side pinned by the drill writer is the only side that label tries; it may cover a dot (a deliberate choice), but
// never another label, so text stays readable: if it would, it's hidden like any other.

import type { LabelSide } from '../engine/show';

export interface LabelItem {
  x: number; y: number; // dot center, in the same units as w, h, r
  w: number; h: number; // label box
  r: number; // dot radius
  pin?: LabelSide;
  first?: boolean; // placed before the others (e.g. selected performers)
}

const AUTO: Exclude<LabelSide, 'hidden'>[] = ['above', 'below', 'right', 'left'];

/** Center of each label's box, or null when it's hidden. Same order as `items`. */
export function placeLabels(items: LabelItem[], gap = 2): ({ x: number; y: number } | null)[] {
  const spot = (it: LabelItem, side: Exclude<LabelSide, 'hidden'>) => {
    const d = it.r + gap;
    if (side === 'above') return { x: it.x, y: it.y - d - it.h / 2 };
    if (side === 'below') return { x: it.x, y: it.y + d + it.h / 2 };
    if (side === 'right') return { x: it.x + d + it.w / 2, y: it.y };
    return { x: it.x - d - it.w / 2, y: it.y };
  };
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  // shortcut: checks every dot and label (n² per frame); fine for a few hundred performers, add a grid beyond that.
  const clearOfLabels = (c: { x: number; y: number }, it: LabelItem) =>
    placed.every((p) => Math.abs(p.x - c.x) >= (p.w + it.w) / 2 || Math.abs(p.y - c.y) >= (p.h + it.h) / 2);
  const clear = (c: { x: number; y: number }, it: LabelItem, self: number) =>
    items.every((o, j) => j === self || Math.abs(o.x - c.x) >= o.r + it.w / 2 || Math.abs(o.y - c.y) >= o.r + it.h / 2) &&
    placed.every((p) => Math.abs(p.x - c.x) >= (p.w + it.w) / 2 || Math.abs(p.y - c.y) >= (p.h + it.h) / 2);

  const order = items.map((_, i) => i).sort((a, b) => rank(items[a]) - rank(items[b]) || a - b);
  const out: ({ x: number; y: number } | null)[] = items.map(() => null);
  for (const i of order) {
    const it = items[i];
    if (it.pin === 'hidden') continue;
    const c = it.pin ? [spot(it, it.pin)].find((c) => clearOfLabels(c, it)) : AUTO.map((s) => spot(it, s)).find((c) => clear(c, it, i));
    if (!c) continue;
    out[i] = c;
    placed.push({ ...c, w: it.w, h: it.h });
  }
  return out;
}

const rank = (it: LabelItem) => (it.first ? 0 : it.pin ? 1 : 2);

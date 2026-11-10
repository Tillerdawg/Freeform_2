// Review: every problem in the whole show, in show order, each pointing at a count and the performers to select.
import { brokenPaths, closeCalls, closeCallsMemo, label, moveSteps, overLimit, setStarts, showLength, totalCounts, type Show } from './show';
import { STEP_LIMIT } from './coords';

export type IssueKind = 'steps' | 'close' | 'straight' | 'missing' | 'unwritten';
/** `set`: the set it's in (for a move, the set the move goes into). `t`: the count to go to. `ids`: the performers to select. */
export interface Issue { kind: IssueKind; set: number; t: number; ids: string[]; text: string }

const MAX_NAMES = 6;

export function reviewShow(show: Show): Issue[] {
  const starts = setStarts(show), out: Issue[] = [];
  const byId = new Map(show.performers.map((p) => [p.id, p]));
  const names = (ids: string[]) => {
    const l = ids.map((id) => label(show, byId.get(id)!));
    return l.length > MAX_NAMES ? `${l.slice(0, MAX_NAMES).join(', ')}, and ${l.length - MAX_NAMES} more` : l.join(', ');
  };
  const people = (n: number) => `${n} ${n === 1 ? 'performer' : 'performers'}`;
  show.sets.forEach((set, i) => {
    const missing = show.performers.filter((p) => !set.pos[p.id]).map((p) => p.id);
    if (missing.length) out.push({ kind: 'missing', set: i, t: starts[i], ids: missing, text: `${people(missing.length)} with no spot: ${names(missing)}` });
    for (const c of i ? closeCallsMemo(show, i) : closeCalls(show, 0))
      out.push({ kind: 'close', set: i, t: (i ? starts[i - 1] : 0) + c.count, ids: [c.a, c.b], text: `${names([c.a, c.b]).replace(', ', ' and ')} ${Math.round(c.d * 10) / 10} ${Math.round(c.d * 10) === 10 ? 'step' : 'steps'} apart${i ? ` on count ${c.count}` : ''}` });
    if (!i) return;
    const over = overLimit(show, i);
    if (over.length) {
      const steps = moveSteps(show, i), big = Math.min(...over.map((id) => steps[id].per5));
      out.push({ kind: 'steps', set: i, t: starts[i], ids: over, text: `${people(over.length)} over the ${show.stepLimit ?? STEP_LIMIT}-to-5 limit (biggest ${Math.round(big * 10) / 10}-to-5): ${names(over)}` });
    }
    const broken = brokenPaths(show, i);
    if (broken.length) out.push({ kind: 'straight', set: i, t: starts[i], ids: broken, text: `${broken.length} imported ${broken.length === 1 ? 'path is' : 'paths are'} straight lines now: ${names(broken)}` });
  });
  const written = totalCounts(show), length = showLength(show);
  if (length > written) out.push({ kind: 'unwritten', set: show.sets.length - 1, t: written, ids: [], text: `Counts ${written + 1} to ${length} aren't written yet` });
  return out;
}

/**
 * Which warning this is, for Dismiss: the kind, the set (by id, so adding a set doesn't move it), and who. If the problem
 * changes (someone else joins it, or it moves to another set), it's a new warning and shows again.
 */
export const issueKey = (show: Show, x: Issue) => `${x.kind}:${show.sets[x.set]?.id}:${[...x.ids].sort().join(',')}`;

/** Review's warnings split into the ones to check and the ones the director dismissed. */
export function splitDismissed(show: Show, all: Issue[]): { open: Issue[]; dismissed: Issue[] } {
  const d = new Set(show.dismissed ?? []);
  return { open: all.filter((x) => !d.has(issueKey(show, x))), dismissed: all.filter((x) => d.has(issueKey(show, x))) };
}

/** Imported paths an edit just made fall back to straight lines: per move (by the set it goes into, in `after`), who. */
export function newlyStraight(before: Show, after: Show): { set: number; ids: string[] }[] {
  return after.sets.flatMap((set, i) => {
    const j = before.sets.findIndex((s) => s.id === set.id);
    if (!i || !set.paths || j < 1 || (before.sets[j] === set && before.sets[j - 1] === after.sets[i - 1])) return [];
    const was = new Set(brokenPaths(before, j));
    const ids = brokenPaths(after, i).filter((id) => before.sets[j].paths?.[id] && !was.has(id));
    return ids.length ? [{ set: i, ids }] : [];
  });
}

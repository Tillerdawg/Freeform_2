// Undo/redo over immutable show snapshots.
export interface History<T> { past: T[]; future: T[]; lastAt: number }

export const MERGE_MS = 500; // continuous changes (drags, typing) within this window are one undo step
const LIMIT = 200;

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [], lastAt: -Infinity });

/**
 * Record that the state changed from `prev`. `boundary` = a click/tap happened since the last change.
 * `holding` = a drag is still held down, so it stays one step however slow it is.
 */
export function record<T>(h: History<T>, prev: T, at: number, boundary: boolean, holding = false): History<T> {
  const merge = !boundary && (holding || at - h.lastAt < MERGE_MS);
  return { past: merge ? h.past : [...h.past, prev].slice(-LIMIT), future: [], lastAt: at };
}

export function undo<T>(h: History<T>, cur: T): { h: History<T>; state: T } | null {
  if (!h.past.length) return null;
  return { h: { past: h.past.slice(0, -1), future: [...h.future, cur], lastAt: -Infinity }, state: h.past.at(-1)! };
}

export function redo<T>(h: History<T>, cur: T): { h: History<T>; state: T } | null {
  if (!h.future.length) return null;
  return { h: { past: [...h.past, cur], future: h.future.slice(0, -1), lastAt: -Infinity }, state: h.future.at(-1)! };
}

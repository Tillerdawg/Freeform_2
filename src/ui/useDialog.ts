// Keyboard behavior for a modal dialog (aria-modal): focus moves in when it opens, Tab and Shift+Tab stay inside,
// Escape closes it, and focus goes back to where it was when it closes.
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
const open: HTMLElement[] = []; // dialogs open now, newest last: only the newest one handles keys

/** The elements Tab can reach inside `el`, in order (hidden ones, like those in a closed <details>, are left out). */
export const focusables = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.getClientRects().length > 0);

/** Where Tab (or Shift+Tab with `back`) from `from` goes, wrapping at the ends; null leaves it to the browser. */
export function nextFocus(list: HTMLElement[], from: Element | null, back: boolean): HTMLElement | null {
  if (!list.length) return null;
  const i = from ? list.indexOf(from as HTMLElement) : -1;
  if (i < 0) return back ? list[list.length - 1] : list[0]; // focus is outside: bring it in
  if (back && i === 0) return list[list.length - 1];
  if (!back && i === list.length - 1) return list[0];
  return null;
}

/** Put the returned ref on the element with role="dialog" (give it tabIndex={-1}). `active`: whether it's open now. */
export function useDialog<T extends HTMLElement = HTMLDivElement>(onClose: () => void, active = true) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose; // the parent passes a new function each render
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const before = document.activeElement as HTMLElement | null;
    open.push(el);
    if (!el.contains(document.activeElement)) (focusables(el)[0] ?? el).focus(); // an autoFocus field inside keeps it
    const key = (e: KeyboardEvent) => {
      if (open[open.length - 1] !== el) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current(); return; } // stop: the editor's own Escape stays out of it
      if (e.key !== 'Tab') return;
      const to = nextFocus(focusables(el), document.activeElement, e.shiftKey);
      if (to) { e.preventDefault(); to.focus(); }
    };
    // Focus that got out some other way (a radio group, a click on the backdrop page) comes back in.
    const stray = (e: FocusEvent) => { if (open[open.length - 1] === el && e.target instanceof Node && !el.contains(e.target)) (focusables(el)[0] ?? el).focus(); };
    document.addEventListener('keydown', key, true);
    document.addEventListener('focusin', stray);
    return () => {
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('focusin', stray);
      open.splice(open.indexOf(el), 1);
      if (before?.isConnected) before.focus();
    };
  }, [active]);
  return ref;
}

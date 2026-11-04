import { useState, type InputHTMLAttributes } from 'react';

type Limits = { min?: number; max?: number; integer?: boolean };

/** What typed text means as a number within the limits, or null while it's empty, unfinished, or out of range. */
export function readNumber(text: string, { min = -Infinity, max = Infinity, integer = false }: Limits): number | null {
  const t = text.trim();
  if (!t || !Number.isFinite(Number(t))) return null;
  const n = integer ? Math.round(Number(t)) : Number(t);
  return n >= min && n <= max ? n : null;
}

/**
 * A number box that can be cleared and retyped (select 144, delete, type 90). Each valid number applies as you type;
 * leaving the box empty or out of range puts the last good number back (an out-of-range number is pulled into range).
 * Shows the number keyboard on phones and iPads. With `whenDone`, the number applies on Enter or leaving the box instead.
 */
export function NumberField({ value, onValue, min, max, integer, whenDone, ...rest }: Limits & {
  value: number | ''; onValue: (n: number) => void;
  /** Apply only on Enter or leaving the box (for numbers whose in-between values move things, like a set's counts). */
  whenDone?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'>) {
  const [draft, setDraft] = useState<string | null>(null);
  const limits = { min, max, integer };
  return (
    <input {...rest} type="number" min={min} max={max} inputMode={integer ? 'numeric' : 'decimal'}
      value={draft ?? value}
      onChange={(e) => { setDraft(e.target.value); const n = readNumber(e.target.value, limits); if (n !== null && !whenDone) onValue(n); }}
      onBlur={(e) => {
        // A number out of range is pulled into range; empty or junk just shows the last good number again.
        const ok = draft === null ? null : readNumber(draft, limits);
        if (ok !== null && whenDone) onValue(ok);
        else if (ok === null && draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
          const n = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(draft)));
          onValue(integer ? Math.round(n) : n);
        }
        setDraft(null);
        rest.onBlur?.(e);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); rest.onKeyDown?.(e); }} />
  );
}

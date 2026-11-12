import type { FieldSpec } from '../engine/coords';
import { validField } from '../engine/show';

// What the last new show was written on, kept in this browser: a winter guard director starts on a floor every time.
const KEY = 'freeform:starting-field';

export function startingField(): FieldSpec {
  try { return validField(JSON.parse(localStorage.getItem(KEY) ?? 'null')) ?? 'highSchool'; } catch { return 'highSchool'; }
}
export function saveStartingField(f: FieldSpec) { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* storage blocked: next time starts on high school */ } }

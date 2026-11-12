// Choosing what a show is written on: the sidebar, the New show box, and the blank field's Start note.
// Two steps: the surface (a football field, a basketball court, or a custom floor), then its details
// (a football field's hashes, or a floor's size).
import type React from 'react';
import { COURT, DEFAULT_FLOOR, FEET, type FieldSpec, type HashPreset } from '../engine/coords';
import { NumberField } from './NumberField';

export const PRESETS: [HashPreset, string][] = [['highSchool', 'High school'], ['college', 'College / DCI'], ['nfl', 'NFL']];

/**
 * The surface menu. Picking a football field again keeps the hashes; going back outside uses `outside` (the show's
 * kept hashes); picking a floor that's already a floor keeps its size.
 */
export function FieldSelect({ value, onChange, outside = 'highSchool', style }: { value: FieldSpec; onChange: (f: FieldSpec) => void; outside?: HashPreset; style?: React.CSSProperties }) {
  return (
    <select aria-label="Field" title="What the show is written on: a football field, a basketball court, or a floor or tarp you size" style={style}
      value={typeof value === 'string' ? 'football' : value.kind} onChange={(e) => {
        const to = e.target.value;
        onChange(to === 'court' ? COURT : to === 'floor' ? (typeof value !== 'string' && value.kind === 'floor' ? value : DEFAULT_FLOOR) : typeof value === 'string' ? value : outside);
      }}>
      <option value="football">Football field</option>
      <option value="court">Basketball court</option>
      <option value="floor">Custom floor</option>
    </select>
  );
}

/** The surface's details: a football field's **Hashes**, or a custom floor's **Wide** and **Deep** in feet (a court has none). */
export function FieldDetails({ value, onChange }: { value: FieldSpec; onChange: (f: FieldSpec) => void }) {
  if (typeof value === 'string') return (
    <label>Hashes <select aria-label="Hashes" title="The football field's hash marks: high school, college or DCI, or NFL" value={value} onChange={(e) => onChange(e.target.value as HashPreset)}>
      {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select></label>
  );
  if (value.kind !== 'floor') return null;
  return <>
    <label>Wide <NumberField aria-label="Floor width in feet" min={8} max={700} step={1} value={Math.round(value.w / FEET)} style={{ width: 56 }}
      onValue={(n) => onChange({ ...value, w: n * FEET })} /></label>
    <label>Deep <NumberField aria-label="Floor depth in feet" min={8} max={700} step={1} value={Math.round(value.d / FEET)} style={{ width: 56 }}
      onValue={(n) => onChange({ ...value, d: n * FEET })} /></label>
    <span style={{ fontSize: 12, opacity: 0.75 }}>feet</span>
  </>;
}

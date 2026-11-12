// Choosing what a show is written on: the sidebar's menu, the New show dialog, and the blank field's Start note.
import type React from 'react';
import { COURT, DEFAULT_FLOOR, FEET, type FieldSpec, type HashPreset } from '../engine/coords';
import { NumberField } from './NumberField';

export const PRESETS: [HashPreset, string][] = [['highSchool', 'High school'], ['college', 'College / DCI'], ['nfl', 'NFL']];
export const TITLE = 'What the show is written on: a football field (by its hashes), a basketball court, or a floor or tarp you size';

/** The field menu. Picking a floor that's already a floor keeps its size. */
export function FieldSelect({ value, onChange, style }: { value: FieldSpec; onChange: (f: FieldSpec) => void; style?: React.CSSProperties }) {
  return (
    <select aria-label="Field" title={TITLE} style={style} value={typeof value === 'string' ? value : value.kind} onChange={(e) => {
      const to = e.target.value;
      onChange(to === 'court' ? COURT : to === 'floor' ? (typeof value !== 'string' && value.kind === 'floor' ? value : DEFAULT_FLOOR) : to as HashPreset);
    }}>
      {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      <option value="court">Basketball court</option>
      <option value="floor">Custom floor</option>
    </select>
  );
}

/** A custom floor's Wide and Deep, in feet. */
export function FloorSize({ value, onChange }: { value: FieldSpec; onChange: (f: FieldSpec) => void }) {
  if (typeof value === 'string' || value.kind !== 'floor') return null;
  return <>
    <label>Wide <NumberField aria-label="Floor width in feet" min={8} max={700} step={1} value={Math.round(value.w / FEET)} style={{ width: 56 }}
      onValue={(n) => onChange({ ...value, w: n * FEET })} /></label>
    <label>Deep <NumberField aria-label="Floor depth in feet" min={8} max={700} step={1} value={Math.round(value.d / FEET)} style={{ width: 56 }}
      onValue={(n) => onChange({ ...value, d: n * FEET })} /></label>
    <span style={{ fontSize: 12, opacity: 0.75 }}>feet</span>
  </>;
}

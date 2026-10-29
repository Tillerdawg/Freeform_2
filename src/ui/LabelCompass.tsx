import type { LabelSide } from '../engine/show';

/** Directions around the compass, in screen degrees (0 = right, counterclockwise). Up = toward the back sideline. */
const POINTS: [Exclude<LabelSide, 'hidden'>, number, string][] = [
  ['right', 0, 'right (toward Side 2)'], ['above-right', 45, 'up and right'], ['above', 90, 'above (toward the back sideline)'],
  ['above-left', 135, 'up and left'], ['left', 180, 'left (toward Side 1)'], ['below-left', 225, 'down and left'],
  ['below', 270, 'below (toward the front sideline)'], ['below-right', 315, 'down and right'],
];

const SIZE = 88, R = 32, DOT = 18;

/** Click a point on the ring to put the selected dots' labels that way; the center goes back to automatic. */
export function LabelCompass({ value, onPick }: { value: LabelSide | '' | 'mixed'; onPick: (side: LabelSide | null) => void }) {
  const btn = (on: boolean): React.CSSProperties => ({
    position: 'absolute', width: DOT, height: DOT, padding: 0, borderRadius: '50%', border: '2px solid var(--gold)',
    background: on ? 'var(--gold)' : '#111', cursor: 'pointer', transform: 'translate(-50%, -50%)',
  });
  return (
    <div role="group" aria-label="Label direction" style={{ position: 'relative', width: SIZE, height: SIZE, flex: 'none' }}>
      <div aria-hidden style={{ position: 'absolute', inset: SIZE / 2 - R, borderRadius: '50%', border: '1px solid var(--line-strong)' }} />
      {POINTS.map(([side, deg, words]) => (
        <button key={side} aria-label={`Label ${words}`} title={`Label ${words}`} aria-pressed={value === side} onClick={() => onPick(side)}
          style={{ ...btn(value === side), left: SIZE / 2 + R * Math.cos((deg * Math.PI) / 180), top: SIZE / 2 - R * Math.sin((deg * Math.PI) / 180) }} />
      ))}
      <button aria-label="Label placed automatically" title="Automatic: Freeform picks a free side, and hides the label when there's no room"
        aria-pressed={value === ''} onClick={() => onPick(null)}
        style={{ ...btn(value === ''), left: SIZE / 2, top: SIZE / 2, width: 26, height: 26, fontSize: 10, fontWeight: 700, color: value === '' ? '#111' : 'var(--gold)' }}>
        A
      </button>
    </div>
  );
}

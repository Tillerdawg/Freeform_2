import { useEffect, useRef, useState } from 'react';
import { readout, type HashPreset } from './engine/coords';
import { drawField, fitView, toWorld, type View } from './field/drawField';

const PRESETS: [HashPreset, string][] = [['highSchool', 'High school'], ['college', 'College / DCI'], ['nfl', 'NFL']];

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hash, setHash] = useState<HashPreset>('highSchool');
  const [view, setView] = useState<View | null>(null);
  const [hover, setHover] = useState('');
  const drag = useRef<{ x: number; y: number } | null>(null);
  const dpr = window.devicePixelRatio || 1;

  // Size the canvas to its box; refit on resize.
  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      setView(fitView(c.width, c.height));
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [dpr]);

  useEffect(() => {
    if (view) drawField(canvasRef.current!.getContext('2d')!, view, hash);
  }, [view, hash]);

  // Wheel zooms around the cursor.
  useEffect(() => {
    const c = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const sx = e.offsetX * dpr, sy = e.offsetY * dpr;
      setView((v) => {
        if (!v) return v;
        // Clamp between whole-field-ish and ~1 step filling a thumb's width.
        const scale = Math.min(Math.max(v.scale * Math.exp(-e.deltaY * 0.0015), 2 * dpr), 120 * dpr);
        const k = scale / v.scale;
        return { scale, ox: sx - (sx - v.ox) * k, oy: sy - (sy - v.oy) * k };
      });
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [dpr]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 16px' }}>
        <strong>Freeform</strong>
        <label>
          Hashes{' '}
          <select value={hash} onChange={(e) => setHash(e.target.value as HashPreset)}>
            {PRESETS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <button onClick={() => { const c = canvasRef.current!; setView(fitView(c.width, c.height)); }}>Fit field</button>
        <span aria-live="polite" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{hover}</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ flex: 1, width: '100%', minHeight: 0, touchAction: 'none', cursor: drag.current ? 'grabbing' : 'crosshair' }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => setHover('')}
        onPointerMove={(e) => {
          if (!view) return;
          if (drag.current) {
            const dx = (e.clientX - drag.current.x) * dpr, dy = (e.clientY - drag.current.y) * dpr;
            drag.current = { x: e.clientX, y: e.clientY };
            setView({ ...view, ox: view.ox + dx, oy: view.oy + dy });
          }
          setHover(readout(toWorld(view, e.nativeEvent.offsetX * dpr, e.nativeEvent.offsetY * dpr), hash));
        }}
      />
    </div>
  );
}

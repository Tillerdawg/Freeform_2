import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { colorOf, label, type Show } from '../engine/show';
import { drawField, drawLabels, drawMarks, fitView, toScreen } from '../field/drawField';
import { chartTitle, chunk, dotCards, hasMeasures, sortedPerformers } from './docs';

type Kind = 'dots' | 'charts';
type Who = 'all' | 'section' | 'selected';
interface Job { kind: Kind; ids: Set<string> | undefined }

/** A set's field chart as a high-resolution black-on-white image. */
function chartImage(show: Show, i: number): string {
  const c = document.createElement('canvas');
  c.width = 3000;
  c.height = 1500;
  const ctx = c.getContext('2d')!;
  const v = fitView(c.width, c.height);
  drawField(ctx, v, show.hash, 'print');
  const s = v.scale, pos = show.sets[i].pos;
  const here = show.performers.filter((p) => pos[p.id]);
  for (const p of here) {
    const q = toScreen(v, pos[p.id]);
    const color = colorOf(show, p);
    ctx.fillStyle = color ?? '#000';
    ctx.beginPath(); ctx.arc(q.x, q.y, 0.5 * s, 0, Math.PI * 2); ctx.fill();
    if (color) { ctx.lineWidth = 0.12 * s; ctx.strokeStyle = '#000'; ctx.stroke(); } // outlined, so pale colors still show on white
  }
  // White halo so yard lines and grid don't run through the labels.
  drawLabels(ctx, here.map((p) => ({ id: p.id, label: label(show, p), at: pos[p.id], pin: show.sets[i].labels?.[p.id] })), v, 0.5 * s, 1.5 * s, '#000', '#fff');
  drawMarks(ctx, v, show.sets[i].marks ?? [], 'print');
  return c.toDataURL('image/png');
}

/** Keep the pieces a performer reads as one unit on one line ("Side 2 45", "Front Hash", "the 50"). */
const keep = (t: string) => t
  .replace(/Side ([12]) (\d+|Goal Line)/g, 'Side\u00a0$1\u00a0$2').replace(/Side ([12])/g, 'Side\u00a0$1')
  .replace(/(Front|Back) (Hash|Sideline)/g, '$1\u00a0$2').replace(/the 50/g, 'the\u00a050').replace(/Goal Line/g, 'Goal\u00a0Line');

interface Props { show: Show; selected: Set<string>; onClose: () => void }

export function PrintDialog({ show, selected, onClose }: Props) {
  const [kind, setKind] = useState<Kind>('dots');
  const [who, setWho] = useState<Who>(selected.size ? 'selected' : 'all');
  const [section, setSection] = useState(show.sections[0]?.id ?? '');
  const [job, setJob] = useState<Job | null>(null);

  const ids = who === 'all' ? undefined
    : who === 'selected' ? selected
    : new Set(show.performers.filter((p) => p.section === section).map((p) => p.id));
  const count = ids ? ids.size : show.performers.length;

  // Once the pages are in the document (and images decoded), open the browser's print dialog.
  useLayoutEffect(() => {
    if (!job) return;
    const imgs = [...document.querySelectorAll<HTMLImageElement>('#print-root img')];
    Promise.all(imgs.map((im) => im.decode().catch(() => {}))).then(() => window.print());
  }, [job]);
  useEffect(() => {
    const done = () => { setJob(null); onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('afterprint', done);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('afterprint', done); window.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: '#1d2a1f', border: '1px solid #33443a', padding: 20, width: 360, maxWidth: 'calc(100vw - 32px)', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Print</h2>
        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 12px' }}>
          <legend style={{ fontWeight: 700, marginBottom: 4 }}>What</legend>
          <label style={{ display: 'block' }}><input type="radio" name="kind" checked={kind === 'dots'} onChange={() => setKind('dots')} /> Dot sheets (4 cards per page)</label>
          <label style={{ display: 'block' }}><input type="radio" name="kind" checked={kind === 'charts'} onChange={() => setKind('charts')} /> Drill charts (one page per set, {show.sets.length} pages)</label>
        </fieldset>
        {kind === 'dots' && (
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 12px' }}>
            <legend style={{ fontWeight: 700, marginBottom: 4 }}>Who</legend>
            <label style={{ display: 'block' }}><input type="radio" name="who" checked={who === 'all'} onChange={() => setWho('all')} /> Everyone ({show.performers.length})</label>
            <label style={{ display: 'block' }}>
              <input type="radio" name="who" checked={who === 'section'} onChange={() => setWho('section')} /> Section{' '}
              <select aria-label="Section to print" value={section} onChange={(e) => { setSection(e.target.value); setWho('section'); }}>
                {show.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'block' }}><input type="radio" name="who" checked={who === 'selected'} disabled={!selected.size} onChange={() => setWho('selected')} /> Selected ({selected.size})</label>
          </fieldset>
        )}
        <p style={{ opacity: 0.75, fontSize: 12, margin: '0 0 12px' }}>Opens your browser's print dialog. Choose "Save as PDF" there to get a PDF.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => setJob({ kind, ids })} disabled={kind === 'dots' && !count}>Print{kind === 'dots' ? ` ${count}` : ''}</button>
        </div>
      </div>
      {job && createPortal(<Pages show={show} job={job} />, document.getElementById('print-root')!)}
    </div>
  );
}

function Pages({ show, job }: { show: Show; job: Job }) {
  const charts = useMemo(() => (job.kind === 'charts' ? show.sets.map((_, i) => chartImage(show, i)) : []), [show, job]);
  const meas = hasMeasures(show);
  const pageStyle = job.kind === 'charts' ? '@page { size: letter landscape; margin: 0.4in; }' : '@page { size: letter portrait; margin: 0.4in; }';
  return (
    <>
      <style>{pageStyle}</style>
      {job.kind === 'dots'
        ? chunk(dotCards(show, sortedPerformers(show, job.ids)), 4).map((page, k) => (
          <div className="dot-page" key={k}>
            {page.map((c, j) => (
              <section className="dot-card" key={j}>
                <header>
                  <strong>{c.label}</strong> <span>{c.section}</span>
                  <span className="dot-show">{show.title}{c.parts > 1 ? ` · card ${c.part} of ${c.parts}` : ''}</span>
                </header>
                <table className={meas ? "with-meas" : undefined}>
                  <thead><tr><th>Set</th><th>Cts</th>{meas && <th>Meas.</th>}<th>Side to side</th><th>Front to back</th></tr></thead>
                  <tbody>{c.rows.map((r) => (
                    <Fragment key={r.set}>
                      <tr className={r.cue ? 'has-cue' : undefined}><td>{r.set}</td><td>{r.counts}</td>{meas && <td className="meas">{r.measures}</td>}<td>{keep(r.side)}</td><td>{keep(r.front)}</td></tr>
                      {r.cue && <tr className="cue"><td></td><td colSpan={meas ? 4 : 3}>{r.cue}</td></tr>}
                    </Fragment>
                  ))}</tbody>
                </table>
              </section>
            ))}
          </div>
        ))
        : charts.map((src, i) => (
          <div className="chart-page" key={i}>
            <header><strong>{show.title}</strong><span>{chartTitle(show, i)}</span></header>
            <img src={src} alt={`Drill chart, ${chartTitle(show, i)}`} />
            {show.sets[i].note && <p className="chart-note">{show.sets[i].note}</p>}
          </div>
        ))}
    </>
  );
}

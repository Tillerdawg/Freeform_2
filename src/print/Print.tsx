import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialog } from '../ui/useDialog';
import { colorOf, fieldOf, mark, moveSegments, revisionLabel, type Show } from '../engine/show';
import { drawProps, drawField, drawGlyph, drawLabels, drawMarks, fitView, toScreen } from '../field/drawField';
import { ROWS_PER_PAGE, ROWS_WITH_PICTURES, chartTitle, chunk, dotCards, hasMeasures, sortedPerformers, type Card } from './docs';

type Kind = 'dots' | 'charts';
type Who = 'all' | 'section' | 'selected';
interface Job { kind: Kind; ids: Set<string> | undefined; single: boolean; pics: boolean; paths: boolean; sets: [number, number] } // single: one dot sheet per page; pics: with a field picture per set (single only); paths: the moves into each set on its chart; sets: first and last set printed

/** A set's field chart as a high-resolution black-on-white image. */
function chartImage(show: Show, i: number, paths: boolean): string {
  const c = document.createElement('canvas');
  c.width = 3000;
  c.height = 1500;
  const ctx = c.getContext('2d')!;
  const v = fitView(c.width, c.height, fieldOf(show));
  drawField(ctx, v, fieldOf(show), 'print');
  drawProps(ctx, v, show.props ?? [], show.sets[i].props ?? {}, null, 'print', 1.4 * v.scale);
  const s = v.scale, pos = show.sets[i].pos;
  if (paths && i > 0) { // where everyone came from: thin dashed lines, under the dots
    ctx.save(); ctx.strokeStyle = '#000'; ctx.lineWidth = 0.1 * s; ctx.setLineDash([0.5 * s, 0.35 * s]);
    for (const seg of moveSegments(show, i)) { const a = toScreen(v, seg.from), b = toScreen(v, seg.to); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.restore();
  }
  const here = show.performers.filter((p) => pos[p.id]);
  const letters = show.symbols !== 'dots';
  for (const p of here) {
    const q = toScreen(v, pos[p.id]);
    const color = colorOf(show, p);
    if (letters) { drawGlyph(ctx, q, mark(show, p).glyph!, 1.7 * s, color ?? '#000', undefined, color ? '#000' : '#fff'); continue; } // white edge on plain black letters keeps lines from running through
    ctx.fillStyle = color ?? '#000';
    ctx.beginPath(); ctx.arc(q.x, q.y, 0.5 * s, 0, Math.PI * 2); ctx.fill();
    if (color) { ctx.lineWidth = 0.12 * s; ctx.strokeStyle = '#000'; ctx.stroke(); } // outlined, so pale colors still show on white
  }
  // White halo so yard lines and grid don't run through the labels.
  drawLabels(ctx, here.map((p) => ({ id: p.id, label: mark(show, p).label, at: pos[p.id], pin: show.sets[i].labels?.[p.id] })), v, letters ? 0.65 * s : 0.5 * s, 1.5 * s, '#000', '#fff', true); // on paper every label shows
  drawMarks(ctx, v, show.sets[i].marks ?? [], 'print');
  return c.toDataURL('image/png');
}

/**
 * Small field pictures for dot sheets, like a dot book: the whole field with everyone faint and this performer as a big
 * black dot, one per set. Each set's faint band is drawn once and copied for every performer.
 */
function dotPictures(show: Show, cards: Card[]): Map<string, string> {
  const W = 480, H = 240, out = new Map<string, string>(), bases = new Map<number, HTMLCanvasElement>();
  const v = fitView(W, H, fieldOf(show));
  const base = (i: number) => {
    let c = bases.get(i);
    if (c) return c;
    c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    drawField(ctx, v, fieldOf(show), 'print'); // this small, the field has no step grid: just its lines
    ctx.fillStyle = '#9a9a9a';
    for (const q of Object.values(show.sets[i].pos)) { const p = toScreen(v, q); ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
    bases.set(i, c);
    return c;
  };
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  for (const card of cards) for (const r of card.rows) {
    const at = show.sets[r.index].pos[card.id];
    if (!at) continue;
    ctx.drawImage(base(r.index), 0, 0);
    const p = toScreen(v, at);
    ctx.fillStyle = '#000'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    out.set(`${card.id}:${r.index}`, c.toDataURL('image/png'));
  }
  return out;
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
  const [single, setSingle] = useState(false);
  const [pics, setPics] = useState(false);
  const [paths, setPaths] = useState(false); // off by default: charts have shown only each set's spots (Jason)
  const last = show.sets.length - 1;
  const [from, setFrom] = useState(0), [to, setTo] = useState(last); // a rehearsal packet: "work 8–10 tonight"
  const sets: [number, number] = [Math.min(from, to), Math.max(from, to)];

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
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, [onClose]);
  const dialog = useDialog(onClose);

  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 360, maxWidth: 'calc(100vw - 32px)', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Print</h2>
        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 12px' }}>
          <legend style={{ fontWeight: 700, marginBottom: 4 }}>What</legend>
          <label style={{ display: 'block' }}><input type="radio" name="kind" checked={kind === 'dots'} onChange={() => setKind('dots')} /> Dot sheets</label>
          <label style={{ display: 'block' }}><input type="radio" name="kind" checked={kind === 'charts'} onChange={() => setKind('charts')} /> Drill charts (one page per set, {sets[1] - sets[0] + 1} pages)</label>
        </fieldset>
        {show.sets.length > 1 && (
          <div style={{ margin: '0 0 12px' }}>
            <strong>Sets</strong>{' '}
            <select aria-label="Print from set" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
              {show.sets.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
            </select>{' '}to{' '}
            <select aria-label="Print to set" value={to} onChange={(e) => setTo(Number(e.target.value))}>
              {show.sets.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
            </select>
            {(sets[0] > 0 || sets[1] < last) && <button style={{ marginLeft: 6 }} onClick={() => { setFrom(0); setTo(last); }}>All</button>}
          </div>
        )}
        {kind === 'dots' && (
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 12px' }}>
            <legend style={{ fontWeight: 700, marginBottom: 4 }}>Layout</legend>
            <label style={{ display: 'block' }}><input type="radio" name="layout" checked={!single} onChange={() => { setSingle(false); setPics(false); }} /> 4 cards per page</label>
            <label style={{ display: 'block' }}><input type="radio" name="layout" checked={single && !pics} onChange={() => { setSingle(true); setPics(false); }} /> 1 per page, bigger, with a notes column</label>
            <label style={{ display: 'block' }}><input type="radio" name="layout" checked={pics} onChange={() => { setSingle(true); setPics(true); }} /> 1 per page, with a small field picture for each set</label>
          </fieldset>
        )}
        {kind === 'charts' && (
          <label style={{ display: 'block', margin: '0 0 12px' }}><input type="checkbox" checked={paths} onChange={(e) => setPaths(e.target.checked)} /> Show the paths into each set</label>
        )}
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
          <button onClick={() => setJob({ kind, ids, single, pics, paths, sets })} disabled={kind === 'dots' && !count}>Print{kind === 'dots' ? ` ${count}` : ''}</button>
        </div>
      </div>
      {job && createPortal(<Pages show={show} job={job} />, document.getElementById('print-root')!)}
    </div>
  );
}

function Pages({ show, job }: { show: Show; job: Job }) {
  const nums = show.sets.map((_, i) => i).slice(job.sets[0], job.sets[1] + 1);
  const charts = useMemo(() => (job.kind === 'charts' ? nums.map((i) => chartImage(show, i, job.paths)) : []), [show, job]); // eslint-disable-line react-hooks/exhaustive-deps
  const rev = show.revision ? ` · ${revisionLabel(show)}` : ''; // so "who has revision 6?" works on paper too
  const meas = hasMeasures(show);
  const cards = useMemo(() => (job.kind === 'dots' ? dotCards(show, sortedPerformers(show, job.ids), job.pics ? ROWS_WITH_PICTURES : job.single ? ROWS_PER_PAGE : undefined, job.sets) : []), [show, job]);
  const pictures = useMemo(() => (job.pics ? dotPictures(show, cards) : null), [show, job, cards]);
  const pageStyle = job.kind === 'charts' ? '@page { size: letter landscape; margin: 0.4in; }' : '@page { size: letter portrait; margin: 0.4in; }';
  return (
    <>
      <style>{pageStyle}</style>
      {job.kind === 'dots'
        ? chunk(cards, job.single ? 1 : 4).map((page, k) => (
          <div className={job.pics ? 'dot-page single pics' : job.single ? 'dot-page single' : 'dot-page'} key={k}>
            {page.map((c, j) => (
              <section className="dot-card" key={j}>
                <header>
                  <strong>{c.label}</strong> {c.name && <span className="dot-name">{c.name}</span>} <span>{c.section}</span>
                  <span className="dot-show">{show.title}{rev}{c.parts > 1 ? ` · card ${c.part} of ${c.parts}` : ''}</span>
                </header>
                <table className={meas ? "with-meas" : undefined}>
                  <thead><tr><th>Set</th><th>Cts</th>{meas && <th>Meas.</th>}<th>Side to side</th><th>Front to back</th>{job.single && <th>Notes</th>}{pictures && <th>Where</th>}</tr></thead>
                  <tbody>{c.rows.map((r) => (
                    <Fragment key={r.set}>
                      <tr className={r.cue && !job.single ? 'has-cue' : undefined}><td>{r.set}</td><td>{r.counts}</td>{meas && <td className="meas">{r.measures}</td>}<td>{keep(r.side)}</td><td>{keep(r.front)}</td>{job.single && <td className="notes">{r.cue}</td>}{pictures && <td className="pic">{pictures.has(`${c.id}:${r.index}`) && <img src={pictures.get(`${c.id}:${r.index}`)} alt="" />}</td>}</tr>
                      {r.cue && !job.single && <tr className="cue"><td></td><td colSpan={meas ? 4 : 3}>{r.cue}</td></tr>}
                    </Fragment>
                  ))}</tbody>
                </table>
              </section>
            ))}
          </div>
        ))
        : charts.map((src, k) => { const i = nums[k]; return (
          <div className="chart-page" key={i}>
            <header><strong>{show.title}{rev}</strong><span>{chartTitle(show, i)}</span></header>
            <img src={src} alt={`Drill chart, ${chartTitle(show, i)}`} />
            {show.sets[i].note && <p className="chart-note">{show.sets[i].note}</p>}
          </div>
        ); })}
    </>
  );
}

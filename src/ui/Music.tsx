import { useEffect, useRef, useState } from 'react';
import { countsFromMidi, fillMeasures, secondsAt, withHolds, type Midi } from '../engine/midi';
import { parseScore } from '../engine/musicxml';
import { synced } from '../engine/music';
import { newId, showLength, type Show } from '../engine/show';
import type { RehearsalSource } from '../engine/scoreMidi';
import { deleteAudio, putAudio } from './audioStore';
import { makeRehearsalTrack } from './rehearsalTrack';
import { Menu } from './Toolbar';
import { NumberField } from './NumberField';
import { useDialog } from './useDialog';

interface Props {
  show: Show;
  setShow: (f: (s: Show) => Show) => void;
  audio: HTMLAudioElement | null; // null: this browser doesn't have the show's recording
  onAudio: (id: string) => void; // a recording was stored under this id
  useMusic: boolean;
  setUseMusic: (on: boolean) => void;
}

/**
 * The show's music in two separate steps, in either order: the score (its counts) and the recording. Whichever comes
 * second completes it. A recording alone can have its counts tapped instead.
 */
export function MusicMenu({ show, setShow, audio, onAudio, useMusic, setUseMusic }: Props) {
  const file = useRef<HTMLInputElement>(null), scoreFile = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [tapping, setTapping] = useState(false);
  // A score added before its recording waits here (only for this session) until the recording comes.
  const [score, setScore] = useState<{ name: string; map: Midi } | null>(null);
  const [playable, setPlayable] = useState<{ name: string; source: RehearsalSource; map: Midi } | null>(null);
  const [making, setMaking] = useState<string | null>(null); // the rehearsal track's progress
  const currentShow = useRef<Show | null>(show);
  useEffect(() => {
    currentShow.current = show;
    return () => { currentShow.current = null; };
  }, [show]);
  const m = show.music, total = showLength(show);
  // Counts from the score (MuseScore, MusicXML, .mxl, or MIDI): exact when the recording was rendered from that same score.
  const counts = (map: Midi, name: string, s: Show) => {
    const held = withHolds(s, map), r = countsFromMidi(map, held.show.sets), sets = held.show.sets.length - 1;
    const note = [`Counts from ${name}: ${r.matched} of ${sets} sets placed by their measures${r.matched < sets ? '; the rest count plain beats' : ''}.`,
      ...(held.added.length ? [`Added hold set${held.added.length > 1 ? 's' : ''} ${held.added.join(', ')} for bars no set covered (undo removes ${held.added.length > 1 ? 'them' : 'it'}).`] : []),
      ...r.notes, ...(map.warnings ?? [])];
    const f = fillMeasures(map, r.taps, held.show.sets);
    if (f.filled) note.push(`Filled in the measures of ${f.filled} set${f.filled > 1 ? 's' : ''} that had none.`);
    return { sets: f.sets, taps: r.taps, note };
  };
  // A recording much shorter, or much longer, than the score plays is probably a different piece (or another export).
  const pairCheck = (length: number | null, map: Midi) => {
    const s = secondsAt(map, map.end);
    return length !== null && (length < s - 2 || length > s + 20) ? [`Check that these go together: the recording is ${fmt(length)} but the score plays for ${fmt(s)}.`] : [];
  };
  const load = async (f: File) => {
    const id = newId('a');
    const length = await duration(f);
    if (!(await putAudio(id, f))) { setNote("This browser wouldn't store the music (it may be out of space or in private mode)."); return; }
    const old = show.music?.audioId;
    if (old && old !== id) deleteAudio(old);
    onAudio(id);
    if (score) { // the score came first: the recording completes it, counts and all
      const c = counts(score.map, score.name, show);
      setShow((s) => ({ ...s, sets: c.sets, music: { name: f.name, audioId: id, taps: c.taps } }));
      setNote([`Loaded ${f.name}.`, ...c.note, ...pairCheck(length, score.map)].join(' '));
      setScore(null);
      return;
    }
    // A different recording needs new counts; the same file again (another computer) keeps them.
    const keep = old && show.music!.name === f.name;
    setShow((s) => ({ ...s, music: { name: f.name, audioId: id, taps: keep ? s.music!.taps : [] } }));
    setNote(keep ? 'Loaded. Your counts still apply.' : `Loaded ${f.name}. Now add its score, or tap the counts.`);
  };
  const addScore = async (f: File) => {
    try {
      const { rehearsal: source, ...map } = await parseScore(await f.arrayBuffer());
      setPlayable(source ? { name: f.name, source, map } : null);
      if (!show.music) { setScore({ name: f.name, map }); setNote([`Score added: ${f.name}.`, ...(map.warnings ?? []), source ? 'Make a rehearsal track, or add the recording made from this score.' : 'Now add its recording (mp3).'].join(' ')); return; }
      const c = counts(map, f.name, show);
      setShow((s) => (s.music ? { ...s, sets: c.sets, music: { ...s.music, taps: c.taps } } : s));
      setNote([...c.note, ...pairCheck(audio && Number.isFinite(audio.duration) ? audio.duration : null, map)].join(' '));
    } catch (e) { setNote(e instanceof Error ? e.message : "That score file couldn't be read."); }
  };
  // The count map and the rendered notes follow the same score timing.
  const makeTrack = async () => {
    if (!playable || making) return;
    const pct = (f: number) => `${Math.round(f * 100)}%`;
    try {
      setNote('');
      const blob = await makeRehearsalTrack(playable.source, playable.map, (step, f) => setMaking(step === 'instruments' ? `Getting the instrument sounds… ${pct(f)}` : step === 'playing' ? `Playing the score… ${pct(f)}` : 'Saving the track…'));
      const id = newId('a');
      if (!(await putAudio(id, blob))) throw new Error("This browser wouldn't store the rehearsal track (it may be out of space or in private mode).");
      const active = currentShow.current;
      if (!active) { deleteAudio(id); return; }
      const old = active.music?.audioId;
      const c = counts(playable.map, playable.name, active);
      setShow((s) => s.id === active.id ? { ...s, sets: c.sets, music: { name: rehearsalName(playable.name), audioId: id, taps: c.taps } } : s);
      if (old) deleteAudio(old);
      onAudio(id);
      setNote([`Made a rehearsal track from ${playable.name}.`, ...c.note].join(' '));
      setScore(null);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "The rehearsal track couldn't be made.");
    } finally {
      setMaking(null);
    }
  };
  const rehearsal = !!m && isRehearsal(m.name);
  const label = !m ? 'Music' : synced(m) && useMusic && audio ? '♪ Music' : 'Music';
  const done = (ok: boolean) => (ok ? '✓ ' : '');
  return (
    <>
      <Menu label={label} pressed={!!(m && synced(m) && useMusic && audio)} title="Play the drill with the show's recording">
        {(close) => <>
          {!m && <p style={{ margin: 0, fontSize: 12, maxWidth: 320 }}>Add a MusicXML (.musicxml or .mxl) or MIDI score to make a rehearsal track. If you have a recording made from the score, add both in either order to sync the counts. MuseScore files work with a recording, too. To use a recording on its own, tap the counts.</p>}
          {m && <p style={{ margin: 0, fontSize: 12 }}><strong>{m.name}</strong><br />
            {m.taps.length ? `${m.taps.length} of ${total + 1} counts placed${m.taps.length < total + 1 ? '; later counts keep the last pace' : ''}.` : 'No counts yet: add the score, or tap them.'}</p>}
          {m && !audio && <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--warn)' }}>{rehearsal ? "The rehearsal track isn't in this browser. Add the score again and make the track to hear it." : `The recording isn't in this browser. Add ${m.name} again to hear it.`}</p>}
          <button disabled={!!making} onClick={() => scoreFile.current?.click()} title="MuseScore (.mscz), MusicXML (exported from Finale, Sibelius, or Dorico), .mxl, or MIDI. Each set's counts are placed in the measures typed for it.">
            {done(!!score)}{score ? `Score: ${score.name}` : m?.taps.length ? 'Add the score again…' : 'Add the score…'}</button>
          <button disabled={!!making} onClick={() => file.current?.click()}>{done(!!m && !!audio && !rehearsal)}{rehearsal ? 'Use a real recording instead…' : m ? 'Replace the recording…' : 'Add the recording (mp3)…'}</button>
          {playable && <button disabled={!!making} onClick={makeTrack} title="FreeFORM plays the score with General MIDI instruments. The counts follow the same repeats, endings, and tempos.">
            {done(rehearsal && !!audio)}{rehearsal ? 'Make the rehearsal track again' : m ? 'Use a rehearsal track instead' : 'Make a rehearsal track'}</button>}
          {making && <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 12 }}>{making}</p>}
          {m && <button disabled={!audio} onClick={() => { setTapping(true); close(); }}>Tap counts…</button>}
          {m && synced(m) && <label style={{ fontSize: 13 }}><input type="checkbox" checked={useMusic} onChange={(e) => setUseMusic(e.target.checked)} /> Play with music (off: use Tempo)</label>}
          {m && <button disabled={!!making} className="danger" onClick={() => { deleteAudio(m.audioId); setShow((s) => { const { music: _, ...rest } = s; return rest; }); setNote(''); }}>Remove music</button>}
          {note && <p role="status" style={{ margin: 0, fontSize: 12, maxWidth: 320 }}>{note}</p>}
        </>}
      </Menu>
      <input ref={file} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
      <input ref={scoreFile} type="file" accept=".mscz,.mscx,.mid,.midi,audio/midi,.musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) addScore(f); e.target.value = ''; }} />
      {tapping && audio && m && <TapDialog audio={audio} total={total} kept={m.taps} onDone={(taps) => { setTapping(false); if (taps) setShow((s) => (s.music ? { ...s, music: { ...s.music, taps } } : s)); }} />}
    </>
  );
}

/**
 * Play the recording and tap (Space, Enter or the big button) on every count: from the top, or from count `from` to
 * redo part of it. Counts before `from` keep their earlier taps; the playback starts 2 counts' worth of time before it.
 */
function TapDialog({ audio, total, kept, onDone }: { audio: HTMLAudioElement; total: number; kept: number[]; onDone: (taps: number[] | null) => void }) {
  const [from, setFrom] = useState(0); // the count the next tap is (redo from here); kept[0..from-1] stay
  const [taps, setTaps] = useState<number[]>([]); // new taps, for counts from, from+1, …
  const [running, setRunning] = useState(false);
  // Redoing a passage: the old taps after it stay too, if they still come after the last new one.
  const after = kept.slice(from + taps.length), keepAfter = from > 0 && taps.length > 0 && after.length > 0 && after[0] > taps[taps.length - 1];
  const all = [...kept.slice(0, from), ...taps, ...(keepAfter ? after : [])];
  const tapped = from + taps.length; // counts tapped so far in this pass, for the button and readout
  const allRef = useRef(all);
  allRef.current = all;
  const floor = from ? kept[from - 1] : -Infinity; // a new tap must come after the last kept one
  const tap = () => { if (running) setTaps((t) => (audio.currentTime <= (t.length ? t[t.length - 1] : floor) ? t : [...t, audio.currentTime])); };
  const start = (at: number) => { audio.currentTime = Math.max(0, at); audio.play().then(() => setRunning(true), () => setRunning(false)); };
  const lead = from >= 2 ? kept[from - 1] - (kept[from - 1] - kept[from - 2]) * 2 : 0; // two counts before the redo starts
  const canRedo = kept.length >= 2;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); tap(); }
    };
    window.addEventListener('keydown', key, true); // before the editor's own shortcuts (Space = play)
    return () => window.removeEventListener('keydown', key, true);
  });
  useEffect(() => () => audio.pause(), [audio]);
  const dialog = useDialog(() => { audio.pause(); onDone(null); });
  const n = all.length;
  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Tap counts" style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', zIndex: 30, whiteSpace: 'normal' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 10, padding: 20, width: 440, maxWidth: 'calc(100vw - 32px)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Tap the counts</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.85 }}>
          Press <strong>Space</strong> (or the button) on every count, starting with count {from}{from ? '' : ', where set 1 stands'}. Keep tapping as long as you
          like: counts past your last tap keep its pace. Small misses are fine; you can undo a tap or start over.
        </p>
        {canRedo && !running && !taps.length && (
          <label style={{ display: 'block', margin: '0 0 10px', fontSize: 13 }}>Redo from count{' '}
            <NumberField aria-label="Redo from count" min={0} max={kept.length} integer value={from} style={{ width: 64 }} onValue={setFrom} />
            {' '}<span style={{ opacity: 0.8 }}>(counts before it keep their taps; you've tapped {kept.length})</span>
          </label>
        )}
        <button onPointerDown={(e) => { e.preventDefault(); tap(); }} disabled={!running} className="primary"
          style={{ width: '100%', height: 96, fontSize: 28, fontWeight: 700 }}>
          {running ? (taps.length ? `Count ${tapped - 1}` : `Tap on count ${from}`) : 'Press Start'}
        </button>
        <p style={{ margin: '8px 0', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {n} of {total + 1} counts tapped{tapped > 1 ? ` · last count ${(all[tapped - 1] - all[tapped - 2]).toFixed(2)} s (${Math.round(60 / (all[tapped - 1] - all[tapped - 2]))} bpm)` : ''}
          {keepAfter ? ` · counts ${tapped}–${n - 1} keep their earlier taps` : from > 0 && taps.length ? ` · earlier taps after count ${tapped - 1} are replaced` : ''}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!running && <button className="primary" onClick={() => { setTaps([]); start(from ? lead : 0); }}>{taps.length ? (from ? `Start again from count ${from}` : 'Start over') : from ? `Start from count ${from}` : 'Start'}</button>}
          {running && <button onClick={() => { audio.pause(); setRunning(false); }}>Pause</button>}
          {!running && taps.length > 0 && <button onClick={() => start(Math.max(0, taps[taps.length - 1] - 2))} title="Back up 2 seconds before your last tap and keep going">Resume</button>}
          <button disabled={!taps.length} onClick={() => setTaps((t) => t.slice(0, -1))}>Undo last tap</button>
          <span style={{ marginLeft: 'auto' }} />
          <button onClick={() => { audio.pause(); onDone(null); }}>Cancel</button>
          <button className="primary" disabled={n < 2 || !taps.length} onClick={() => { audio.pause(); onDone(allRef.current); }}>Done</button>
        </div>
      </div>
    </div>
  );
}

/** A recording's length in seconds, from its metadata (null if the browser can't tell). */
function duration(f: Blob): Promise<number | null> {
  return new Promise((ok) => {
    const a = new Audio(), url = URL.createObjectURL(f);
    const done = (v: number | null) => { URL.revokeObjectURL(url); ok(v); };
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? a.duration : null);
    a.onerror = () => done(null);
    setTimeout(() => done(null), 5000);
    a.preload = 'metadata'; a.src = url;
  });
}
const rehearsalName = (score: string) => `Rehearsal track (${score})`;
/** A rehearsal track keeps its score's name in the show's music name (no new field in the show file). */
const isRehearsal = (name: string) => name.startsWith('Rehearsal track (');
const fmt = (s: number) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; };

import { useEffect, useRef, useState } from 'react';
import { countsFromMidi, secondsAt, withHolds } from '../engine/midi';
import { parseScore } from '../engine/musicxml';
import { synced } from '../engine/music';
import { newId, showLength, type Show } from '../engine/show';
import { deleteAudio, putAudio } from './audioStore';
import { Menu } from './Toolbar';

interface Props {
  show: Show;
  setShow: (f: (s: Show) => Show) => void;
  audio: HTMLAudioElement | null; // null: this browser doesn't have the show's recording
  onAudio: (id: string) => void; // a recording was stored under this id
  useMusic: boolean;
  setUseMusic: (on: boolean) => void;
}

/** Load the show's recording, tap its counts, and choose whether playback follows it. */
export function MusicMenu({ show, setShow, audio, onAudio, useMusic, setUseMusic }: Props) {
  const file = useRef<HTMLInputElement>(null), midiFile = useRef<HTMLInputElement>(null), pairFile = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [tapping, setTapping] = useState(false);
  const m = show.music, total = showLength(show);
  const load = async (f: File) => {
    const id = newId('a');
    if (!(await putAudio(id, f))) { setNote("This browser wouldn't store the music (it may be out of space or in private mode)."); return; }
    const old = show.music?.audioId;
    // A different recording needs new taps; the same file again (another computer) keeps them.
    const keep = old && show.music!.name === f.name;
    setShow((s) => ({ ...s, music: { name: f.name, audioId: id, taps: keep ? s.music!.taps : [] } }));
    if (old && old !== id) deleteAudio(old);
    onAudio(id);
    setNote(keep ? 'Loaded. Your tapped counts still apply.' : 'Loaded. Now tap the counts.');
  };
  // Counts from the score (MuseScore, MusicXML, .mxl or MIDI): exact when the loaded music was rendered from that same score.
  const counts = async (f: File) => {
    const midi = await parseScore(await f.arrayBuffer());
    const held = withHolds(show, midi), r = countsFromMidi(midi, held.show.sets), sets = held.show.sets.length - 1;
    const note = [`Counts from ${f.name}: ${r.matched} of ${sets} sets placed by their measures${r.matched < sets ? '; the rest count plain beats' : ''}.`,
      ...held.widened,
      ...(held.added.length ? [`Added hold set${held.added.length > 1 ? 's' : ''} ${held.added.join(', ')} for bars no set covered (undo removes ${held.added.length > 1 ? 'them' : 'it'}).`] : []),
      ...r.notes, ...(midi.warnings ?? [])];
    return { sets: held.show.sets, taps: r.taps, note, seconds: secondsAt(midi, midi.end) };
  };
  const fromMidi = async (f: File) => {
    try {
      const c = await counts(f);
      setShow((s) => (s.music ? { ...s, sets: c.sets, music: { ...s.music, taps: c.taps } } : s));
      setNote(c.note.join(' '));
    } catch (e) { setNote(e instanceof Error ? e.message : "That score file couldn't be read."); }
  };
  // One step: the score and the recording MuseScore exported from it, chosen together. One Undo takes it all back.
  const fromMuseScore = async (files: File[]) => {
    const isAudio = (f: File) => f.type.startsWith('audio/') && !/midi/.test(f.type) || /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(f.name);
    const sound = files.filter(isAudio), score = files.filter((f) => !isAudio(f));
    if (sound.length !== 1 || score.length !== 1) { setNote('Choose two files together (⌘- or Ctrl-click): the score (.mscz, MusicXML or MIDI) and the recording exported from it (.mp3).'); return; }
    try {
      const c = await counts(score[0]);
      const length = await duration(sound[0]);
      const id = newId('a');
      if (!(await putAudio(id, sound[0]))) { setNote("This browser wouldn't store the music (it may be out of space or in private mode)."); return; }
      const old = show.music?.audioId;
      setShow((s) => ({ ...s, sets: c.sets, music: { name: sound[0].name, audioId: id, taps: c.taps } }));
      if (old && old !== id) deleteAudio(old);
      onAudio(id);
      // A recording much shorter, or much longer, than the score is probably a different piece (or a different export).
      const off = length !== null && (length < c.seconds - 2 || length > c.seconds + 20);
      setNote([`Loaded ${sound[0].name}.`, ...c.note, ...(off ? [`Check the pair: the recording is ${fmt(length!)} but the score plays for ${fmt(c.seconds)}, so they may not be the same piece.`] : [])].join(' '));
    } catch (e) { setNote(e instanceof Error ? e.message : "Those files couldn't be read."); }
  };
  const label = !m ? 'Music' : synced(m) && useMusic && audio ? '♪ Music' : 'Music';
  return (
    <>
      <Menu label={label} pressed={!!(m && synced(m) && useMusic && audio)} title="Play the drill with the show's recording">
        {(close) => <>
          {!m && <p style={{ margin: 0, fontSize: 12 }}>Load the show's recording, then tap along on each count, or take the counts from the score (MuseScore, MusicXML or MIDI). Playback then follows the music.</p>}
          {m && <p style={{ margin: 0, fontSize: 12 }}><strong>{m.name}</strong><br />
            {m.taps.length ? `${m.taps.length} of ${total + 1} counts tapped${m.taps.length < total + 1 ? '; later counts keep the last pace' : ''}.` : 'No counts tapped yet.'}</p>}
          {m && !audio && <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--warn)' }}>The recording isn't in this browser. Load {m.name} again to hear it.</p>}
          <button className={m ? undefined : 'primary'} onClick={() => pairFile.current?.click()} title="Choose the score (.mscz, MusicXML or MIDI) and the recording exported from it (.mp3) together: the music loads with every count in place">Add music from MuseScore…</button>
          <button onClick={() => file.current?.click()}>{m ? 'Replace or reload music…' : 'Load music only (mp3)…'}</button>
          {m && <button disabled={!audio} onClick={() => { setTapping(true); close(); }}>Tap counts…</button>}
          {m && <button onClick={() => midiFile.current?.click()} title="Use when the music was rendered from this score (e.g. exported as audio from MuseScore). Choose the score's MuseScore file (.mscz), or its MusicXML, .mxl or MIDI; each set's counts are placed in the measures typed for it.">Counts from the score…</button>}
          {m && synced(m) && <label style={{ fontSize: 13 }}><input type="checkbox" checked={useMusic} onChange={(e) => setUseMusic(e.target.checked)} /> Play with music (off: use Tempo)</label>}
          {m && <button className="danger" onClick={() => { deleteAudio(m.audioId); setShow((s) => { const { music: _, ...rest } = s; return rest; }); setNote(''); }}>Remove music</button>}
          {note && <p role="status" style={{ margin: 0, fontSize: 12 }}>{note}</p>}
        </>}
      </Menu>
      <input ref={file} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
      <input ref={pairFile} type="file" multiple accept=".mscz,.mscx,.mxl,.musicxml,.xml,.mid,.midi,audio/*,.mp3,.m4a,.wav,.aac" hidden onChange={(e) => { const f = [...(e.target.files ?? [])]; if (f.length) fromMuseScore(f); e.target.value = ''; }} />
      <input ref={midiFile} type="file" accept=".mscz,.mscx,.mid,.midi,audio/midi,.musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) fromMidi(f); e.target.value = ''; }} />
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
      if (e.key === 'Escape') { e.stopPropagation(); audio.pause(); onDone(null); }
    };
    window.addEventListener('keydown', key, true); // before the editor's own shortcuts (Space = play)
    return () => window.removeEventListener('keydown', key, true);
  });
  useEffect(() => () => audio.pause(), [audio]);
  const n = all.length;
  return (
    <div role="dialog" aria-modal="true" aria-label="Tap counts" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 30, whiteSpace: 'normal' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 10, padding: 20, width: 440, maxWidth: 'calc(100vw - 32px)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Tap the counts</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.85 }}>
          Press <strong>Space</strong> (or the button) on every count, starting with count {from}{from ? '' : ', where set 1 stands'}. Keep tapping as long as you
          like: counts past your last tap keep its pace. Small misses are fine; you can undo a tap or start over.
        </p>
        {canRedo && !running && !taps.length && (
          <label style={{ display: 'block', margin: '0 0 10px', fontSize: 13 }}>Redo from count{' '}
            <input type="number" aria-label="Redo from count" min={0} max={kept.length} value={from} style={{ width: 64 }}
              onChange={(e) => setFrom(Math.max(0, Math.min(kept.length, Math.round(Number(e.target.value)) || 0)))} />
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
const fmt = (s: number) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; };

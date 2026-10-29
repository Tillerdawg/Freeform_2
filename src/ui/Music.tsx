import { useEffect, useRef, useState } from 'react';
import { countsFromMidi, parseMidi, withHolds } from '../engine/midi';
import { synced } from '../engine/music';
import { newId, totalCounts, type Show } from '../engine/show';
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
  const file = useRef<HTMLInputElement>(null), midiFile = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [tapping, setTapping] = useState(false);
  const m = show.music, total = totalCounts(show);
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
  // Counts from the score's MIDI: exact when the loaded music was rendered from that same MIDI.
  const fromMidi = async (f: File) => {
    try {
      const midi = parseMidi(await f.arrayBuffer());
      const held = withHolds(show, midi), r = countsFromMidi(midi, held.show.sets), sets = held.show.sets.length - 1;
      setShow((s) => (s.music ? { ...s, sets: held.show.sets, music: { ...s.music, taps: r.taps } } : s));
      setNote([`Counts from ${f.name}: ${r.matched} of ${sets} sets placed by their measures${r.matched < sets ? '; the rest count plain beats' : ''}.`,
        ...(held.added.length ? [`Added hold set${held.added.length > 1 ? 's' : ''} ${held.added.join(', ')} for bars no set covered (undo removes ${held.added.length > 1 ? 'them' : 'it'}).`] : []),
        ...r.notes].join(' '));
    } catch (e) { setNote(e instanceof Error ? e.message : "That MIDI file couldn't be read."); }
  };
  const label = !m ? 'Music' : synced(m) && useMusic && audio ? '♪ Music' : 'Music';
  return (
    <>
      <Menu label={label} pressed={!!(m && synced(m) && useMusic && audio)} title="Play the drill with the show's recording">
        {(close) => <>
          {!m && <p style={{ margin: 0, fontSize: 12 }}>Load the show's recording, then tap along on each count, or take the counts from the score's MIDI. Playback then follows the music.</p>}
          {m && <p style={{ margin: 0, fontSize: 12 }}><strong>{m.name}</strong><br />
            {m.taps.length ? `${m.taps.length} of ${total + 1} counts tapped${m.taps.length < total + 1 ? '; later counts keep the last pace' : ''}.` : 'No counts tapped yet.'}</p>}
          {m && !audio && <p role="alert" style={{ margin: 0, fontSize: 12, color: '#f5c518' }}>The recording isn't in this browser. Load {m.name} again to hear it.</p>}
          <button onClick={() => file.current?.click()}>{m ? 'Replace or reload music…' : 'Load music (mp3)…'}</button>
          {m && <button disabled={!audio} onClick={() => { setTapping(true); close(); }}>Tap counts…</button>}
          {m && <button onClick={() => midiFile.current?.click()} title="Use when the music was rendered from this score's MIDI. Each set's counts are placed in the measures typed for it.">Counts from the score's MIDI…</button>}
          {m && synced(m) && <label style={{ fontSize: 13 }}><input type="checkbox" checked={useMusic} onChange={(e) => setUseMusic(e.target.checked)} /> Play with music (off: use Tempo)</label>}
          {m && <button className="danger" onClick={() => { deleteAudio(m.audioId); setShow((s) => { const { music: _, ...rest } = s; return rest; }); setNote(''); }}>Remove music</button>}
          {note && <p role="status" style={{ margin: 0, fontSize: 12 }}>{note}</p>}
        </>}
      </Menu>
      <input ref={file} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
      <input ref={midiFile} type="file" accept=".mid,.midi,audio/midi" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) fromMidi(f); e.target.value = ''; }} />
      {tapping && audio && m && <TapDialog audio={audio} total={total} onDone={(taps) => { setTapping(false); if (taps) setShow((s) => (s.music ? { ...s, music: { ...s.music, taps } } : s)); }} />}
    </>
  );
}

/** Play the recording from the top and tap (Space, Enter or the big button) on every count. */
function TapDialog({ audio, total, onDone }: { audio: HTMLAudioElement; total: number; onDone: (taps: number[] | null) => void }) {
  const [taps, setTaps] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const tapsRef = useRef(taps);
  tapsRef.current = taps;
  const tap = () => { if (running) setTaps((t) => (t.length && audio.currentTime <= t[t.length - 1] ? t : [...t, audio.currentTime])); };
  const start = (from: number) => { audio.currentTime = from; audio.play().then(() => setRunning(true), () => setRunning(false)); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); tap(); }
      if (e.key === 'Escape') { e.stopPropagation(); audio.pause(); onDone(null); }
    };
    window.addEventListener('keydown', key, true); // before the editor's own shortcuts (Space = play)
    return () => window.removeEventListener('keydown', key, true);
  });
  useEffect(() => () => audio.pause(), [audio]);
  const n = taps.length;
  return (
    <div role="dialog" aria-modal="true" aria-label="Tap counts" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 30, whiteSpace: 'normal' }}>
      <div style={{ background: '#1d2a1f', border: '1px solid #44594a', borderRadius: 10, padding: 20, width: 440, maxWidth: 'calc(100vw - 32px)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Tap the counts</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.85 }}>
          Press <strong>Space</strong> (or the button) on every count, starting with count 0, where set 1 stands. Keep tapping as long as you
          like: counts past your last tap keep its pace. Small misses are fine; you can undo a tap or start over.
        </p>
        <button onPointerDown={(e) => { e.preventDefault(); tap(); }} disabled={!running} className="primary"
          style={{ width: '100%', height: 96, fontSize: 28, fontWeight: 700 }}>
          {running ? (n ? `Count ${n - 1}` : 'Tap on count 0') : 'Press Start'}
        </button>
        <p style={{ margin: '8px 0', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {n} of {total + 1} counts tapped{n > 1 ? ` · last count ${(taps[n - 1] - taps[n - 2]).toFixed(2)} s (${Math.round(60 / (taps[n - 1] - taps[n - 2]))} bpm)` : ''}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!running && <button className="primary" onClick={() => { setTaps([]); start(0); }}>{n ? 'Start over' : 'Start'}</button>}
          {running && <button onClick={() => { audio.pause(); setRunning(false); }}>Pause</button>}
          {!running && n > 0 && <button onClick={() => start(Math.max(0, taps[n - 1] - 2))} title="Back up 2 seconds before your last tap and keep going">Resume</button>}
          <button disabled={!n} onClick={() => setTaps((t) => t.slice(0, -1))}>Undo last tap</button>
          <span style={{ marginLeft: 'auto' }} />
          <button onClick={() => { audio.pause(); onDone(null); }}>Cancel</button>
          <button className="primary" disabled={n < 2} onClick={() => { audio.pause(); onDone(tapsRef.current); }}>Done</button>
        </div>
      </div>
    </div>
  );
}

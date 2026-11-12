// Export the show as an MP4 video: the whole field from the press box, with the music if the show has it, and the
// title, piece, set, and count in a corner. Encoded in the browser (WebCodecs, through Mediabunny), faster than real time.
import { useState } from 'react';
import { useDialog } from './useDialog';
import { colorOf, fieldOf, mark, positionsAt, propsAt, setAt, type Show } from '../engine/show';
import { synced } from '../engine/music';
import { FPS, videoCaption, videoFrames } from '../engine/video';
import { drawField, drawMarks, drawPerformers, drawProps, fitView } from '../field/drawField';
import { PALETTE } from './palette';
import { getAudio } from './audioStore';

const W = 1920, H = 1080, TOP = 120; // TOP: a band over the field for the caption, so it covers no yard numbers

/** One frame: the field as the editor draws it while playing (no labels, so nothing jumps), and the caption. */
function drawFrame(ctx: CanvasRenderingContext2D, show: Show, t: number) {
  const fit = fitView(W, H - TOP, fieldOf(show)), v = { ...fit, oy: fit.oy + TOP }, pos = positionsAt(show, t), at = setAt(show, t);
  drawField(ctx, v, fieldOf(show));
  drawProps(ctx, v, show.props ?? [], propsAt(show, t), null, 'screen', 22);
  if (at >= 0) drawMarks(ctx, v, show.sets[at].marks ?? []);
  drawPerformers(ctx, v, show.performers.filter((p) => pos[p.id]).map((p) => ({ id: p.id, label: '', glyph: mark(show, p).glyph, at: pos[p.id], color: colorOf(show, p) })), new Set(), [], undefined, 2);
  const { title, place } = videoCaption(show, t);
  ctx.font = '600 38px system-ui, sans-serif';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text; ctx.fillText(title, 40, 18);
  ctx.fillStyle = PALETTE.gold; ctx.fillText(place, 40, 66);
}

/** The recording from `start` for `seconds`, silence where it runs out, as one AudioBuffer. */
async function audioWindow(blob: Blob, start: number, seconds: number): Promise<AudioBuffer> {
  const ac = new OfflineAudioContext(2, 1, 48000);
  const all = await ac.decodeAudioData(await blob.arrayBuffer());
  const rate = all.sampleRate, n = Math.ceil(seconds * rate), from = Math.round(start * rate);
  const out = new AudioBuffer({ length: n, numberOfChannels: all.numberOfChannels, sampleRate: rate });
  for (let ch = 0; ch < all.numberOfChannels; ch++) out.copyToChannel(all.getChannelData(ch).subarray(from, from + n), ch);
  return out;
}

export function VideoDialog({ show, bpm, onClose }: { show: Show; bpm: number; onClose: () => void }) {
  const last = show.sets.length - 1;
  const [from, setFrom] = useState(0), [to, setTo] = useState(last);
  const hasMusic = synced(show.music);
  const [withMusic, setWithMusic] = useState(hasMusic);
  const [progress, setProgress] = useState<number | null>(null); // 0 to 1 while making it
  const [note, setNote] = useState('');
  const [cancel, setCancel] = useState<(() => void) | null>(null);
  const dialog = useDialog(() => { if (progress === null) onClose(); });
  const range: [number, number] = [Math.min(from, to), Math.max(from, to)];

  const make = async () => {
    setNote(''); setProgress(0);
    let stop = false, output: { cancel: () => Promise<void> } | null = null;
    setCancel(() => () => { stop = true; void output?.cancel(); });
    try {
      // A big library: loaded only when someone makes a video. Named here so the build keeps only these parts of it.
      const { getFirstEncodableVideoCodec, getFirstEncodableAudioCodec, Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, QUALITY_HIGH } = await import('mediabunny');
      const music = withMusic && hasMusic ? await getAudio(show.music!.audioId) : undefined;
      if (withMusic && hasMusic && !music) throw new Error("The recording isn't in this browser, so the video can't have music. Add it again under Music, or uncheck With the music.");
      const plan = videoFrames(show, range[0], range[1], bpm, music ? show.music!.taps : null);
      const vcodec = await getFirstEncodableVideoCodec(['avc', 'hevc', 'vp9', 'av1'], { width: W, height: H });
      if (!vcodec) throw new Error("This browser can't make videos. Try a current Chrome, Edge, or Safari.");
      const audio = music ? await audioWindow(music, plan.start, plan.seconds) : null;
      const acodec = audio ? await getFirstEncodableAudioCodec(['aac', 'opus'], { numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate }) : null;
      const out = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
      output = out;
      const canvas = new OffscreenCanvas(W, H), ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
      const video = new CanvasSource(canvas, { codec: vcodec, bitrate: QUALITY_HIGH });
      out.addVideoTrack(video, { frameRate: FPS });
      const sound = audio && acodec ? new AudioBufferSource({ codec: acodec, bitrate: QUALITY_HIGH }) : null;
      if (sound) out.addAudioTrack(sound);
      await out.start();
      if (sound && audio) await sound.add(audio);
      for (let k = 0; k < plan.counts.length; k++) {
        if (stop) return;
        drawFrame(ctx, show, plan.counts[k]);
        await video.add(k / FPS, 1 / FPS);
        if (k % 15 === 0) setProgress(k / plan.counts.length);
      }
      await out.finalize();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([out.target.buffer!], { type: 'video/mp4' }));
      a.download = `${(show.title || 'FreeFORM Drill show').replace(/[\\/:*?"<>|]+/g, '-')}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
      setNote(audio && !acodec ? "Saved. This browser can't encode audio, so the video has no music." : 'Saved. It went to your Downloads folder (or wherever your browser saves files).');
    } catch (e) {
      if (!stop) setNote(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null); setCancel(null);
    }
  };

  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Make a video" style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 380, maxWidth: 'calc(100vw - 32px)', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Make a video</h2>
        <p style={{ margin: '0 0 12px' }}>An MP4 of the whole field from the press box, with the show's title, the piece, the set, and the count in the corner. Good for the band's group chat, your staff, or the boosters.</p>
        {show.sets.length > 1 && (
          <div style={{ margin: '0 0 12px' }}>
            <strong>Sets</strong>{' '}
            <select aria-label="Video from set" value={from} disabled={progress !== null} onChange={(e) => setFrom(Number(e.target.value))}>
              {show.sets.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
            </select>{' '}to{' '}
            <select aria-label="Video to set" value={to} disabled={progress !== null} onChange={(e) => setTo(Number(e.target.value))}>
              {show.sets.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
            </select>
            {(range[0] > 0 || range[1] < last) && <button style={{ marginLeft: 6 }} disabled={progress !== null} onClick={() => { setFrom(0); setTo(last); }}>All</button>}
          </div>
        )}
        {hasMusic
          ? <label style={{ display: 'block', margin: '0 0 12px' }}><input type="checkbox" checked={withMusic} disabled={progress !== null} onChange={(e) => setWithMusic(e.target.checked)} /> With the music</label>
          : <p style={{ margin: '0 0 12px', opacity: 0.8 }}>No recording with counts yet, so the video moves at the Tempo ({bpm} bpm), with no sound.</p>}
        {progress !== null && (
          <div style={{ margin: '0 0 12px' }}>
            <div role="progressbar" aria-label="Making the video" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}
              style={{ height: 10, background: 'var(--surface-2)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--gold-fill)' }} />
            </div>
            <p role="status" style={{ margin: '6px 0 0', fontSize: 12 }}>Making the video… {Math.round(progress * 100)}%. Keep this tab open.</p>
          </div>
        )}
        {note && <p role="status" style={{ margin: '0 0 12px' }}>{note}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {progress !== null ? <button onClick={() => cancel?.()}>Cancel</button> : <button onClick={onClose}>Close</button>}
          <button className="primary" disabled={progress !== null || (show.sets.length > 1 && range[0] === range[1])} onClick={make}>Make the video</button>
        </div>
      </div>
    </div>
  );
}

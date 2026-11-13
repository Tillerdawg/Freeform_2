// Making a rehearsal track in the browser: fetch the sound library (once; the service worker keeps it for offline use
// after that), render the MIDI in a worker, and compress it the way Video does (AAC, else Opus, in an .m4a), or keep a WAV
// when the browser can't compress audio. The result is stored like any recording.
import { wavBytes } from '../engine/rehearsal';

/** The General MIDI sound library (GeneralUser GS, by S. Christian Collins; its license is beside it). Not in the offline download until first used. */
const BANK = 'sounds/GeneralUser-GS.sf3';

export type Step = 'instruments' | 'playing' | 'saving';

export async function makeRehearsalTrack(midi: ArrayBuffer, onStep: (step: Step, done: number) => void): Promise<Blob> {
  const bank = await fetchBank((f) => onStep('instruments', f));
  onStep('playing', 0);
  const { left, right, sampleRate } = await new Promise<{ left: Float32Array; right: Float32Array; sampleRate: number }>((ok, fail) => {
    const w = new Worker(new URL('./rehearsalWorker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e) => {
      if ('progress' in e.data) onStep('playing', e.data.progress);
      else { w.terminate(); if ('done' in e.data) ok(e.data.done); else fail(new Error(e.data.error)); }
    };
    w.onerror = () => { w.terminate(); fail(new Error("The rehearsal track couldn't be made in this browser.")); };
    w.postMessage({ bank, midi: midi.slice(0) }, [bank]);
  });
  onStep('saving', 0);
  return (await compress(left, right, sampleRate)) ?? new Blob([wavBytes(left, right, sampleRate) as BlobPart], { type: 'audio/wav' });
}

async function fetchBank(onProgress: (done: number) => void): Promise<ArrayBuffer> {
  let res: Response;
  try { res = await fetch(new URL(`../${BANK}`, location.href)); } catch { res = new Response(null, { status: 0 }); }
  if (!res.ok || !res.body) throw new Error("FreeFORM couldn't download the instrument sounds. Check that you're online and try again (after the first time, they work offline).");
  const total = Number(res.headers.get('content-length')) || 7_400_000, parts: Uint8Array[] = [], reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const out = new Uint8Array(got);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out.buffer;
}

/** An .m4a (AAC, else Opus), or null when this browser can't encode audio. */
async function compress(left: Float32Array, right: Float32Array, sampleRate: number): Promise<Blob | null> {
  try {
    const { getFirstEncodableAudioCodec, Output, Mp4OutputFormat, BufferTarget, AudioBufferSource, QUALITY_HIGH } = await import('mediabunny');
    const codec = await getFirstEncodableAudioCodec(['aac', 'opus'], { numberOfChannels: 2, sampleRate });
    if (!codec) return null;
    const audio = new AudioBuffer({ length: left.length, numberOfChannels: 2, sampleRate });
    audio.copyToChannel(left as Float32Array<ArrayBuffer>, 0); audio.copyToChannel(right as Float32Array<ArrayBuffer>, 1);
    const out = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const src = new AudioBufferSource({ codec, bitrate: QUALITY_HIGH });
    out.addAudioTrack(src);
    await out.start();
    await src.add(audio);
    await out.finalize();
    return new Blob([out.target.buffer!], { type: 'audio/mp4' });
  } catch {
    return null;
  }
}

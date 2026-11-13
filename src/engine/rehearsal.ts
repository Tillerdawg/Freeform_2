// A rehearsal track: the score played by FreeFORM itself, from a MIDI file and a General MIDI sound library, for shows
// without a recording (Jason: it can sound like a notation program's playback; a real recording stays the upgrade).
// The audio and the counts come from the same MIDI, so the counts are exact. Pure rendering, no UI: the editor runs it
// in a worker (src/ui/rehearsalWorker.ts) so the page doesn't freeze.
import { BasicMIDI, BasicSoundBank, SoundBankLoader, SpessaSynthProcessor, SpessaSynthSequencer } from 'spessasynth_core';
import { MAX_TRACK_SECONDS } from './scoreMidi';

export const RATE = 44100; // AAC encoders take 44.1 or 48 kHz
const TAIL = 2; // seconds after the last note, for the final chord to ring
const BLOCK = 128; // the synthesizer's largest render size

/**
 * Render a MIDI file with a SoundFont (SF2, or SF3 with compressed samples). The track starts at the MIDI's time 0, not
 * at its first note, so it lines up with the counts. Scaled to a steady peak, so quiet and loud scores come out alike.
 */
export async function renderMidi(bank: ArrayBuffer, midiFile: ArrayBuffer, onProgress?: (done: number) => void): Promise<{ left: Float32Array; right: Float32Array; sampleRate: number }> {
  await BasicSoundBank.ready; // the SF3 decoder
  const midi = BasicMIDI.fromArrayBuffer(midiFile);
  if (!(midi.duration > 0)) throw new Error('That MIDI file has no music in it.');
  if (midi.duration > MAX_TRACK_SECONDS) throw new Error('That MIDI file is longer than 30 minutes, too long for a rehearsal track.');
  const synth = new SpessaSynthProcessor(RATE, { effectsEnabled: true, eventsEnabled: false });
  synth.soundBankManager.addSoundBank(SoundBankLoader.fromArrayBuffer(bank), 'main');
  await synth.ready;
  const seq = new SpessaSynthSequencer(synth);
  seq.skipToFirstNoteOn = false; // keep the lead-in: count 0 is the MIDI's time 0
  seq.loopCount = 0;
  seq.loadNewSongList([midi]);
  seq.play();
  const n = Math.ceil((midi.duration + TAIL) * RATE), left = new Float32Array(n), right = new Float32Array(n);
  for (let f = 0, next = 0; f < n; f += BLOCK) {
    seq.processTick();
    synth.process(left, right, f, Math.min(BLOCK, n - f));
    if (f >= next) { onProgress?.(f / n); next = f + RATE * 5; }
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  if (peak > 0) { const k = 0.9 / peak; for (let i = 0; i < n; i++) { left[i] *= k; right[i] *= k; } }
  onProgress?.(1);
  return { left, right, sampleRate: RATE };
}

/** 16-bit stereo WAV bytes, for browsers that can't compress audio. */
export function wavBytes(left: Float32Array, right: Float32Array, rate: number): Uint8Array {
  const n = left.length, out = new Uint8Array(44 + n * 4), v = new DataView(out.buffer);
  const text = (at: number, s: string) => { for (let k = 0; k < s.length; k++) out[at + k] = s.charCodeAt(k); };
  text(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); text(8, 'WAVE');
  text(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  text(36, 'data'); v.setUint32(40, n * 4, true);
  const s16 = (x: number) => Math.max(-32768, Math.min(32767, Math.round(x * 32767)));
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, s16(left[i]), true); v.setInt16(46 + i * 4, s16(right[i]), true); }
  return out;
}

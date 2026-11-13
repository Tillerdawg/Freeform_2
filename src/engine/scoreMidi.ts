import { MIDIBuilder, MIDIControllers, MIDIMessageTypes } from 'spessasynth_core';
import { secondsAt, type Midi } from './midi';

export type RehearsalNote = {
  bar: number;
  from: number;
  to: number;
  key: number;
  voice: string;
  tieIn: boolean;
  tieOut: boolean;
};

export type RehearsalPart = { program: number | null; notes: RehearsalNote[] };
export type ScoreNotes = { parts: RehearsalPart[]; order: number[] };
export type RehearsalSource = ArrayBuffer | ScoreNotes;

const MAX_NOTES = 500_000;
export const MAX_TRACK_SECONDS = 30 * 60;

/** Write the notes against the same expanded bar starts and tempo events used by drill counts. */
export function scoreMidi(score: ScoreNotes, map: Midi): ArrayBuffer {
  if (!map.end || !score.parts.length) throw new Error('That MusicXML score has no playable notes.');
  if (!Number.isSafeInteger(map.end) || map.end > 0x0fffffff || secondsAt(map, map.end) > MAX_TRACK_SECONDS) {
    throw new Error('That score is too long for a rehearsal track.');
  }
  const midi = new MIDIBuilder({ format: 1, timeDivision: map.ppq });
  for (const [tick, us] of map.tempos) {
    if (tick > map.end) break;
    if (us > 0xffffff) throw new Error('A tempo in that score is too slow for a rehearsal track.');
    midi.addEvent(tick, 0, MIDIMessageTypes.setTempo, [us >> 16, (us >> 8) & 255, us & 255]);
  }
  let pitched = 0, drums = 0, noteCount = 0;
  for (const { program, notes } of score.parts) {
    const byBar = new Map<number, RehearsalNote[]>();
    for (const note of notes) {
      let bar = byBar.get(note.bar);
      if (!bar) { bar = []; byBar.set(note.bar, bar); }
      bar.push(note);
    }
    const heard: RehearsalNote[] = [];
    const ties = new Map<string, RehearsalNote>();
    for (const [index, bar] of score.order.entries()) {
      const start = map.measures[index].start;
      const end = map.measures[index + 1]?.start ?? map.end;
      for (const note of byBar.get(bar) ?? []) {
        const from = start + Math.round(note.from * map.ppq);
        const to = Math.min(end, Math.max(from + 1, start + Math.round(note.to * map.ppq)));
        if (from >= to) continue;
        if (++noteCount > MAX_NOTES) throw new Error('That score has too many notes for a rehearsal track.');
        const id = `${note.voice}/${note.key}`;
        const previous = ties.get(id);
        const played = note.tieIn && previous?.to === from ? previous : { ...note, from, to };
        if (played === previous) played.to = to;
        else heard.push(played);
        if (note.tieOut) ties.set(id, played);
        else ties.delete(id);
      }
    }
    if (!heard.length) continue;
    // Reserve channel 10 for drums. Extra MIDI ports let large scores keep each part's own channel and instrument.
    const slot = program === null ? 9 : pitched % 15;
    const channel = program === null || slot < 9 ? slot : slot + 1;
    const port = program === null ? drums++ : Math.floor(pitched++ / 15);
    if (port > 127) throw new Error('That score has too many instrument parts for a rehearsal track.');
    midi.addTrack('', port);
    const track = midi.tracks.length - 1;
    if (program !== null) midi.programChange(0, track, channel, program);
    // Two voices can overlap on the same key. Release it after both voices have finished.
    const keys = new Map<number, RehearsalNote>();
    for (const note of heard.sort((a, b) => a.from - b.from)) {
      const active = keys.get(note.key);
      if (active && note.from < active.to) {
        active.to = Math.max(active.to, note.to);
      } else {
        if (active) midi.noteOff(active.to, track, channel, active.key);
        midi.noteOn(note.from, track, channel, note.key, 80);
        keys.set(note.key, note);
      }
    }
    for (const note of keys.values()) midi.noteOff(note.to, track, channel, note.key);
    // The synthesizer measures duration to the last channel event. Keep any written rests at the end.
    midi.controllerChange(map.end, track, channel, MIDIControllers.allNotesOff, 0);
  }
  if (midi.tracks.length === 1) throw new Error('That MusicXML score has no playable notes.');
  midi.flush();
  return midi.writeMIDI();
}

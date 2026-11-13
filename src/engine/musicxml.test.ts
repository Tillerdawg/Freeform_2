// @ts-expect-error: only the tests run in Node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BasicMIDI, MIDIMessageTypes } from 'spessasynth_core';
import { countsFromMidi, parseMidi, secondsAt } from './midi';
import { parseMscx, parseMusicXml, parseScore, parseXml } from './musicxml';
import { renderMidi } from './rehearsal';
import { scoreMidi } from './scoreMidi';

// Two parts, divisions 2 (eighths). m. 1: a one-beat pickup in 3/4 (implicit). m. 2: 3/4 at ♩=120 (a metronome mark).
// m. 3: everyone rests. m. 4: 4/4, <sound tempo="60">, a half note with a fermata in part 1 while part 2 moves on beat 2.
const note = (d: number, extra = '') => `<note><pitch><step>C</step><octave>4</octave></pitch><duration>${d}</duration>${extra}</note>`;
const rest = (d: number, extra = '') => `<note><rest/><duration>${d}</duration>${extra}</note>`;
const xml = `<?xml version="1.0"?><!DOCTYPE score-partwise PUBLIC "x" "y"><!-- a comment -->
<score-partwise version="4.0"><part-list><score-part id="P1"/><score-part id="P2"/></part-list>
<part id="P1">
  <measure number="1" implicit="yes"><attributes><divisions>2</divisions><time><beats>3</beats><beat-type>4</beat-type></time></attributes>${note(2)}</measure>
  <measure number="2"><direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>120</per-minute></metronome></direction-type></direction>${note(2)}${note(2)}${note(2, '<chord/>')}${note(2)}</measure>
  <measure number="3">${rest(6)}</measure>
  <measure number="4"><attributes><time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="60"/>${note(4, '<notations><fermata/></notations>')}${rest(4)}</measure>
</part>
<part id="P2">
  <measure number="1"><attributes><divisions>4</divisions><time><beats>3</beats><beat-type>4</beat-type></time></attributes>${rest(4)}</measure>
  <measure number="2">${rest(12)}</measure>
  <measure number="3">${rest(12)}</measure>
  <measure number="4"><attributes><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${rest(4)}${note(12)}<grace/></measure>
</part></score-partwise>`;

describe('counts from MusicXML', () => {
  it('reads elements, attributes and text, skipping comments and the DOCTYPE', () => {
    const d = parseXml('<!DOCTYPE x><a b="1" c=\'2\'><!-- no --><d>hi</d><e/></a>');
    expect(d.kids[0].attrs).toEqual({ b: '1', c: '2' });
    expect(d.kids[0].kids.map((k) => k.tag)).toEqual(['d', 'e']);
    expect(d.kids[0].kids[0].text).toBe('hi');
  });
  it('builds the bar and tempo map: a short pickup, silent bars, meters, tempos, fermatas', () => {
    const m = parseMusicXml(xml);
    expect(m.measures.map((x) => `${x.beats}/${x.den}`)).toEqual(['1/4', '3/4', '3/4', '4/4']); // the pickup is its own one-beat bar
    expect(m.measures.map((x) => x.sounding)).toEqual([true, true, false, true]);
    expect(m.measures.map((x) => secondsAt(m, x.start))).toEqual([0, 0.5, 2, 3.5]); // 120 bpm from the start
    // m. 4 at 60: the fermata holds beat 1 (until part 2's note on beat 2) at half tempo: 2 s, then 1 s per beat.
    expect(secondsAt(m, m.measures[3].start + 480)).toBe(5.5);
    expect(secondsAt(m, m.measures[3].start + 480 * 2)).toBe(6.5);
    expect(m.warnings).toEqual([]);
    // Counts placed by the same rules as for a MIDI: set 2 over the pickup and m. 2 (1 + 3 beats).
    const r = countsFromMidi(m, [{ name: '1', counts: 0 }, { name: '2', counts: 4, measures: '1–2' }]);
    expect(r.notes).toEqual([]);
    expect(r.taps.slice(1)).toEqual([0.001, 0.5, 1, 1.5]); // count 1 on the pickup's downbeat (just after count 0); hit on count 4
  });
  it('plays out repeats and endings, numbering bars in the order heard', () => {
    // m. 2–3 repeat with a 1st ending on m. 3 and a 2nd ending on m. 4: heard 1, 2, 3, 2, 4.
    const rep = xml
      .replace('<measure number="2">', '<measure number="2"><barline location="left"><repeat direction="forward"/></barline>')
      .replace('<measure number="3">', '<measure number="3"><barline location="left"><ending number="1" type="start"/></barline>')
      .replace(/(<measure number="3">[\s\S]*?)<\/measure>/, '$1<barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline></measure>')
      .replace('<measure number="4">', '<measure number="4"><barline location="left"><ending number="2" type="start"/></barline>');
    const m = parseMusicXml(rep);
    expect(m.measures.map((x) => x.written ?? null)).toEqual([null, null, null, 2, 4]); // bars 4 and 5 are written m. 2 and m. 4
    expect(m.measures.map((x) => `${x.beats}/${x.den}`)).toEqual(['1/4', '3/4', '3/4', '3/4', '4/4']);
    expect(m.warnings[0]).toMatch(/Repeats played out: the score's 4 bars play as 5.*m\. 4 here is written m\. 2\./);
    // Second time through m. 2 is back at ♩=120 (as written there), so it takes 1.5 s like the first time.
    const s = (k: number) => secondsAt(m, m.measures[k].start);
    expect(s(4) - s(3)).toBe(1.5);
    expect(s(2) - s(1)).toBe(1.5);
  });
  it('follows D.S. al Coda from MusicXML sound marks', () => {
    const bars = ['<sound segno="s"/>', '<sound tocoda="c"/>', '<sound dalsegno="s"/>', '<sound coda="c"/>'].map((x, k) =>
      `<measure number="${k + 1}">${k === 0 ? '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>' : ''}<direction><direction-type><words>x</words></direction-type>${x}</direction>${note(4)}</measure>`);
    const m = parseMusicXml(`<score-partwise><part id="P1">${bars.join('')}</part></score-partwise>`);
    expect(m.measures.map((x) => x.written ?? null)).toEqual([null, null, null, 1, 2, 4]); // 1 2 3, back to the segno: 1 2, To Coda: 4
  });
  it('opens MIDI, MusicXML and compressed .mxl files by their content, and rejects others', async () => {
    const enc = (s: string) => new TextEncoder().encode(s).buffer;
    expect((await parseScore(enc(xml))).measures).toHaveLength(4);
    const mxl = await zip({ 'META-INF/container.xml': '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>', 'score.xml': xml });
    expect((await parseScore(mxl)).measures).toHaveLength(4);
    await expect(parseScore(enc('hello'))).rejects.toThrow(/isn't a MuseScore, MusicXML, or MIDI/);
    expect(() => parseMusicXml('<score-timewise/>')).toThrow(/Timewise/);
  });
});

// A MuseScore 4 score: a one-beat pickup (an irregular bar, len="1/4") in 3/4 at ♩=120, a bar with a triplet and a
// grace note, a stored multi-measure rest (skipped) before an empty bar, then a fermata on a half note at ♩=60.
const chord = (d: string, extra = '') => `<Chord>${extra}<durationType>${d}</durationType><Note><pitch>60</pitch></Note></Chord>`;
const mscx = `<?xml version="1.0" encoding="UTF-8"?><museScore version="4.70"><Score><Part><Staff id="1"/></Part>
<Staff id="1">
  <Measure len="1/4"><voice><TimeSig><sigN>3</sigN><sigD>4</sigD></TimeSig><Tempo><tempo>2</tempo></Tempo>${chord('quarter')}</voice></Measure>
  <Measure><voice>${chord('eighth', '<acciaccatura/>')}${chord('quarter')}<Tuplet><normalNotes>2</normalNotes><actualNotes>3</actualNotes></Tuplet>${chord('eighth')}${chord('eighth')}${chord('eighth')}<endTuplet/>${chord('quarter')}</voice></Measure>
  <Measure len="3/4"><multiMeasureRest>1</multiMeasureRest><voice><Rest><durationType>measure</durationType><duration>3/4</duration></Rest></voice></Measure>
  <Measure><voice><Rest><durationType>measure</durationType><duration>3/4</duration></Rest></voice></Measure>
  <Measure><voice><TimeSig><sigN>4</sigN><sigD>4</sigD></TimeSig><Tempo><tempo>1</tempo></Tempo><Fermata><subtype>fermataAbove</subtype></Fermata>${chord('half')}<Rest><durationType>half</durationType></Rest></voice></Measure>
</Staff></Score></museScore>`;

describe('counts from a MuseScore file', () => {
  it('reads the bars, tempos and fermatas, as MuseScore plays them', () => {
    const m = parseMscx(mscx);
    expect(m.measures.map((x) => `${x.beats}/${x.den}`)).toEqual(['1/4', '3/4', '3/4', '4/4']); // the pickup is its own bar; the stored multi-rest is skipped
    expect(m.measures.map((x) => x.sounding)).toEqual([true, true, false, true]);
    expect(m.measures.map((x) => secondsAt(m, x.start))).toEqual([0, 0.5, 2, 3.5]);
    expect(secondsAt(m, m.end)).toBe(3.5 + 4 + 2); // the fermata half note (2 beats at 60) held twice as long, then a half rest
  });
  it('plays out MuseScore 4 repeats, voltas, and a D.C. al Fine', () => {
    const bar = (inner: string, extra = '') => `<Measure>${extra}<voice>${inner}${chord('whole')}</voice></Measure>`;
    const ms = `<museScore version="4.70"><Score><Staff id="1">
      ${bar('<TimeSig><sigN>4</sigN><sigD>4</sigD></TimeSig>', '<startRepeat/>')}
      ${bar('<Spanner type="Volta"><Volta><endings>1</endings></Volta><next><location><measures>1</measures></location></next></Spanner>', '<endRepeat>2</endRepeat>')}
      ${bar('<Spanner type="Volta"><prev><location><measures>-1</measures></location></prev></Spanner><Spanner type="Volta"><Volta><endings>2</endings></Volta><next><location><measures>1</measures><fractions>1/1</fractions></location></next></Spanner>')}
      ${bar('<Marker><label>fine</label></Marker>')}
      ${bar('<Jump><jumpTo>start</jumpTo><playUntil>fine</playUntil></Jump>')}
    </Staff></Score></museScore>`;
    const m = parseMscx(ms);
    // 1 2, again 1, second ending 3–4, on to 5, D.C.: 1, last ending 3–4, Fine.
    expect(m.measures.map((x) => x.written ?? null)).toEqual([null, null, 1, 3, 4, 5, 1, 3, 4]);
  });
  it('opens a .mscz (a zip) and rejects scores from before MuseScore 3', async () => {
    expect((await parseScore(await zip({ 'score.mscx': mscx, 'Excerpts/part.mscx': '<museScore version="4.70"/>' }))).measures).toHaveLength(4);
    expect(() => parseMscx('<museScore version="2.06"><Score/></museScore>')).toThrow(/older version/);
  });
  it.each([false, true])('renders the native repeat and both endings with marching percussion = %s', async (marching) => {
    // The native forms MuseScore writes for repeat bars, a volta to the next bar, and a volta to the end of the score.
    const rest = (type: string) => `<Rest><durationType>${type}</durationType></Rest>`;
    const note = (key: number) => `<Chord><durationType>16th</durationType><Note><pitch>${key}</pitch></Note></Chord>`;
    const tail = rest('16th') + rest('eighth') + rest('half');
    const volta = (n: number, location: string) => `<Spanner type="Volta"><Volta><endings>${n}</endings></Volta><next><location>${location}</location></next></Spanner>`;
    const keys = marching ? [50, 52, 53] : [58, 62, 65];
    const instrument = marching ? 'id="marching-snare"><useDrumset>1</useDrumset>' : 'id="bb-trumpet"><transposeChromatic>-2</transposeChromatic>';
    const native = `<museScore version="4.70"><Score>
      <Part><Staff/><Instrument ${instrument}<Channel><program value="56"/></Channel></Instrument></Part>
      <Staff id="1">
        <Measure><startRepeat/><voice><Tempo><tempo>2</tempo></Tempo>${rest('quarter')}${note(keys[0])}${tail}</voice></Measure>
        <Measure><endRepeat>2</endRepeat><voice><Tempo><tempo>1</tempo></Tempo>
          ${volta(1, '<measures>1</measures>')}${note(keys[1])}${tail}${rest('quarter')}</voice></Measure>
        <Measure><voice><Tempo><tempo>1.5</tempo></Tempo>
          ${volta(2, '<fractions>1/1</fractions>')}${note(keys[2])}${tail}${rest('quarter')}</voice></Measure>
      </Staff></Score></museScore>`;
    const archive = await zip({
      'META-INF/container.xml': '<container><rootfiles><rootfile full-path="score_style.mss"/><rootfile full-path="scores/band.mscx"/></rootfiles></container>',
      'Excerpts/trumpet.mscx': '<museScore version="4.70"/>',
      'scores/band.mscx': native,
    });
    const { rehearsal, ...map } = await parseScore(archive);
    expect(map).toEqual(parseMscx(native));
    if (!rehearsal || rehearsal instanceof ArrayBuffer) throw new Error('Expected native rehearsal notes.');
    expect(rehearsal.order).toEqual([0, 1, 0, 2]);
    const bytes = scoreMidi(rehearsal, map);
    const events = BasicMIDI.fromArrayBuffer(bytes).tracks.flatMap((track) => track.events);
    const channel = marching ? 9 : 0;
    expect(events.find((e) => e.statusByte === (MIDIMessageTypes.programChange | channel))?.data[0]).toBe(56);
    const notes = events.filter((e) => e.statusByte === (MIDIMessageTypes.noteOn | channel));
    expect(notes.map((e) => e.data[0])).toEqual([keys[0], keys[1], keys[0], keys[2]]);
    const counts = countsFromMidi(map, [{ name: '1', counts: 0 }, { name: '2', counts: 16, measures: '1–4' }]);
    expect(counts.matched).toBe(1);
    const entrances = [2, 5, 10, 13].map((i) => counts.taps[i]);
    expect(entrances).toEqual([0.5, 2, 6.5, 8]);
    const midiMap = parseMidi(bytes);
    expect(notes.map((e) => secondsAt(midiMap, e.ticks))).toEqual(entrances);
    let loaded = 0;
    const audio = await renderMidi(soundBank(), bytes, undefined, async () => {
      loaded++;
      return soundBank('MS-Basic-Marching.sf3');
    });
    expect(loaded).toBe(marching ? 1 : 0);
    expectEntrances(audio, entrances);
  });
  it('reads chord tones, ties, and percussion from independent staves and voices', async () => {
    const tie = (edge: 'prev' | 'next') => `<Spanner type="Tie"><${edge}><location><measures>1</measures></location></${edge}></Spanner>`;
    const native = `<museScore version="3.02"><Score>
      <Part><Staff id="1"/><Instrument><Channel><program value="71"/></Channel></Instrument></Part>
      <Part><Staff id="2"/><Instrument><useDrumset>1</useDrumset></Instrument></Part>
      <Staff id="1">
        <Measure len="1/4"><voice><Chord><durationType>quarter</durationType>
          <Note><pitch>60</pitch>${tie('next')}</Note><Note><pitch>64</pitch></Note>
        </Chord></voice></Measure>
        <Measure><voice><Chord><durationType>quarter</durationType><Note><pitch>60</pitch>${tie('prev')}</Note></Chord></voice></Measure>
      </Staff><Staff id="2">
        <Measure len="1/4"><voice><Rest><durationType>measure</durationType></Rest></voice>
        <voice><location><fractions>1/8</fractions></location><Chord><durationType>eighth</durationType><Note><pitch>38</pitch></Note></Chord></voice></Measure>
        <Measure><voice><Rest><durationType>measure</durationType></Rest></voice></Measure>
      </Staff></Score></museScore>`;
    const { rehearsal, ...map } = await parseScore(new TextEncoder().encode(native).buffer);
    if (!rehearsal || rehearsal instanceof ArrayBuffer) throw new Error('Expected native rehearsal notes.');
    const events = BasicMIDI.fromArrayBuffer(scoreMidi(rehearsal, map)).tracks.flatMap((track) => track.events);
    const notes = events.filter((e) => (e.statusByte & 0xf0) === MIDIMessageTypes.noteOn);
    expect(notes.map((e) => [e.ticks, e.statusByte & 15, e.data[0]])).toEqual([[0, 0, 60], [0, 0, 64], [240, 9, 38]]);
    const release = events.find((e) => e.statusByte === MIDIMessageTypes.noteOff && e.data[0] === 60);
    expect(release?.ticks).toBe(960);
  });
});

describe('MusicXML rehearsal tracks', () => {
  const pitch = (step: string, length: number, extra = '') =>
    `<note>${extra}<pitch><step>${step}</step><octave>4</octave></pitch><duration>${length}</duration></note>`;
  const repeated = `<score-partwise><part-list><score-part id="P1">
    <score-instrument id="trumpet"/><midi-instrument id="trumpet"><midi-program>57</midi-program></midi-instrument>
  </score-part></part-list><part id="P1">
    <measure number="1"><attributes><divisions>4</divisions><transpose><chromatic>-2</chromatic></transpose></attributes>
      <barline location="left"><repeat direction="forward"/></barline><sound tempo="120"/>${rest(4)}${pitch('C', 1)}${rest(11)}
    </measure>
    <measure number="2"><barline location="left"><ending type="start" number="1"/></barline>
      <sound tempo="60"/>${pitch('E', 1)}${rest(15)}
      <barline location="right"><ending type="stop" number="1"/><repeat direction="backward"/></barline>
    </measure>
    <measure number="3"><barline location="left"><ending type="start" number="2"/></barline>
      <sound tempo="90"/>${pitch('G', 1)}${rest(15)}
      <barline location="right"><ending type="stop" number="2"/></barline>
    </measure></part></score-partwise>`;

  it('keeps the rendered entrances aligned with drill counts on both passes and in each ending', async () => {
    const xmlFile = new TextEncoder().encode(repeated).buffer;
    const mxlFile = await zip({
      'META-INF/container.xml': '<container><rootfiles><rootfile full-path="scores/repeat.musicxml"/></rootfiles></container>',
      'scores/repeat.musicxml': repeated,
    });
    const plain = await parseScore(xmlFile);
    const compressed = await parseScore(mxlFile);
    expect(compressed).toEqual(plain);
    const { rehearsal, ...map } = compressed;
    if (!rehearsal || rehearsal instanceof ArrayBuffer) throw new Error('Expected MusicXML rehearsal notes.');
    expect(rehearsal.order).toEqual([0, 1, 0, 2]);
    const bytes = scoreMidi(rehearsal, map);
    const midi = BasicMIDI.fromArrayBuffer(bytes);
    const events = midi.tracks.flatMap((track) => track.events);
    expect(events.filter((e) => e.statusByte === MIDIMessageTypes.programChange).map((e) => e.data[0])).toEqual([56]);
    const noteOns = events.filter((e) => e.statusByte === MIDIMessageTypes.noteOn);
    expect(noteOns.map((e) => e.data[0])).toEqual([58, 62, 58, 65]);
    const counts = countsFromMidi(map, [{ name: '1', counts: 0 }, { name: '2', counts: 16, measures: '1–4' }]);
    expect(counts.matched).toBe(1);
    const entrances = [2, 5, 10, 13].map((count) => counts.taps[count]);
    expect(entrances).toEqual([0.5, 2, 6.5, 8]);
    const midiMap = parseMidi(bytes);
    expect(noteOns.map((e) => secondsAt(midiMap, e.ticks))).toEqual(entrances);

    const audio = await renderMidi(soundBank(), bytes);
    expectEntrances(audio, entrances);
    expect(audio.left.length / audio.sampleRate).toBeCloseTo(secondsAt(map, map.end) + 2, 3);
  });

  it('uses chord and voice positions, carries ties, and maps unpitched instruments to MIDI drums', async () => {
    const xml = `<score-partwise><part-list><score-part id="P1"><midi-instrument id="snare"><midi-unpitched>39</midi-unpitched></midi-instrument></score-part></part-list>
      <part id="P1"><measure><attributes><divisions>2</divisions></attributes>
        ${pitch('C', 2, '<tie type="start"/>')}${pitch('G', 2, '<chord/>')}
        <backup><duration>2</duration></backup><note><unpitched/><duration>1</duration><instrument id="snare"/><voice>2</voice></note>
      </measure><measure>${pitch('C', 2, '<tie type="stop"/>')}<note><cue/><pitch><step>B</step><octave>4</octave></pitch><duration>2</duration></note></measure></part></score-partwise>`;
    const { rehearsal, ...map } = await parseScore(new TextEncoder().encode(xml).buffer);
    if (!rehearsal || rehearsal instanceof ArrayBuffer) throw new Error('Expected MusicXML rehearsal notes.');
    const midi = BasicMIDI.fromArrayBuffer(scoreMidi(rehearsal, map));
    const events = midi.tracks.flatMap((track) => track.events);
    const notes = events.filter((e) => (e.statusByte & 0xf0) === MIDIMessageTypes.noteOn);
    expect(notes.map((e) => [e.ticks, e.statusByte & 15, e.data[0]])).toEqual([[0, 0, 60], [0, 0, 67], [0, 9, 38]]);
    const release = events.find((e) => e.statusByte === MIDIMessageTypes.noteOff && e.data[0] === 60);
    expect(release?.ticks).toBe(960);
  });
  it('uses marching presets only for identified percussion and keeps exported battery keys', async () => {
    const parts = [
      ['Snare Drum', 'Battery Snare', 57, 51, 56, 50],
      ['Marching Tenors', 'Drum 4', 97, 97, 96, 96],
      ['Marching Bass Drums', 'Bass Drum', 60, 86, 59, 85],
      ['Marching Cymbals', 'Crash', 1, 50, 58, 72],
      ['Drum kit', 'Acoustic Snare', 57, 39, undefined, 38],
    ] as const;
    const definitions = parts.map(([name, instrument, program, key], i) => `<score-part id="P${i}"><part-name>${name}</part-name>
      <score-instrument id="I${i}"><instrument-name>${instrument}</instrument-name></score-instrument>
      <midi-instrument id="I${i}"><midi-program>${program}</midi-program><midi-unpitched>${key}</midi-unpitched></midi-instrument></score-part>`);
    const body = parts.map((_, i) => `<part id="P${i}"><measure><note><unpitched/><duration>4</duration><instrument id="I${i}"/></note></measure></part>`);
    const xml = `<score-partwise><part-list>${definitions.join('')}</part-list>${body.join('')}</score-partwise>`;
    const { rehearsal } = await parseScore(await zip({ 'score.musicxml': xml }));
    if (!rehearsal || rehearsal instanceof ArrayBuffer) throw new Error('Expected MusicXML rehearsal notes.');
    expect(rehearsal.parts.map((p) => [p.program, p.marching, p.notes[0].key])).toEqual(parts.map((p) => [null, p[4], p[5]]));
  });
});

function soundBank(name = 'GeneralUser-GS.sf3'): ArrayBuffer {
  const file: Uint8Array = readFileSync(new URL(`../../public/sounds/${name}`, import.meta.url));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
}

function expectEntrances(audio: Awaited<ReturnType<typeof renderMidi>>, entrances: number[]) {
  for (const at of entrances) {
    const start = Math.round((at - 0.06) * audio.sampleRate);
    const first = audio.left.findIndex((x, i) => i >= start && Math.max(Math.abs(x), Math.abs(audio.right[i])) > 0.01);
    expect(first / audio.sampleRate).toBeGreaterThanOrEqual(at - 0.003);
    expect(first / audio.sampleRate).toBeLessThan(at + 0.04);
  }
}

/** A minimal zip (deflated entries), as MuseScore's .mxl export is. */
async function zip(files: Record<string, string>): Promise<ArrayBuffer> {
  const parts: Uint8Array[] = [], central: Uint8Array[] = [];
  let off = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = new TextEncoder().encode(text), n = new TextEncoder().encode(name);
    const data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    const local = new Uint8Array(30 + n.length), lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(8, 8, true); lv.setUint32(18, data.length, true); lv.setUint32(22, raw.length, true); lv.setUint16(26, n.length, true); local.set(n, 30);
    const c = new Uint8Array(46 + n.length), cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(10, 8, true); cv.setUint32(20, data.length, true); cv.setUint32(24, raw.length, true); cv.setUint16(28, n.length, true); cv.setUint32(42, off, true); c.set(n, 46);
    parts.push(local, data); central.push(c); off += local.length + data.length;
  }
  const size = central.reduce((s, c) => s + c.length, 0), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, central.length, true); ev.setUint16(10, central.length, true); ev.setUint32(12, size, true); ev.setUint32(16, off, true);
  const out = new Uint8Array(off + size + 22); let k = 0;
  for (const p of [...parts, ...central, end]) { out.set(p, k); k += p.length; }
  return out.buffer;
}

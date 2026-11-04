import { describe, expect, it } from 'vitest';
import { countsFromMidi, secondsAt } from './midi';
import { parseMscx, parseMusicXml, parseScore, parseXml } from './musicxml';

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
  it('warns about repeats, which it counts once through', () => {
    const rep = xml.replace('<measure number="3">', '<measure number="3"><barline location="right"><repeat direction="backward"/></barline>');
    expect(parseMusicXml(rep).warnings[0]).toMatch(/repeats/);
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
  it('opens a .mscz (a zip) and rejects scores from before MuseScore 3', async () => {
    expect((await parseScore(await zip({ 'score.mscx': mscx, 'Excerpts/part.mscx': '<museScore version="4.70"/>' }))).measures).toHaveLength(4);
    expect(() => parseMscx('<museScore version="2.06"><Score/></museScore>')).toThrow(/older version/);
  });
});

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

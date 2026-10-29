// Roster import: a list of students from a spreadsheet (pasted from Excel, or a CSV file) names the show's dots, or
// creates them. Columns are found by their headers (Name / First / Last, Instrument / Section, Code / Dot / Label /
// Rank) or, without headers, by what's in them. Nothing changes until the drill writer has seen the plan.
import { FIELD_WIDTH } from './coords';
import { MAX_NAME, label, newId, type Show } from './show';

export type Role = 'name' | 'first' | 'last' | 'instrument' | 'code' | 'ignore';
export interface Step {
  row: number; // 1-based line in the pasted list
  name: string;
  kind: 'name' | 'new' | 'skip';
  label?: string; // the dot it names or creates
  section?: string; // section id
  number?: number;
  performer?: string; // existing performer id, for 'name'
  note?: string; // why it's skipped, or what it replaces
  waiting?: boolean; // skipped only until the drill writer picks a section for its instrument
}
/**
 * `unknown`: instruments that match no section (Bassoon), for the drill writer to decide: put those players in a
 * section (a bassoonist who marches baritone) or leave them off. Choices come back in `choices` (key → section id or
 * 'skip'); rows waiting on a choice are skipped until then.
 */
export interface Plan { roles: Role[]; header: boolean; steps: Step[]; unknown: { key: string; instrument: string; rows: number; note: string; choice?: string }[] }
export type Choices = Record<string, string>; // instrument key → section id, or 'skip' to leave those rows off
export const instrumentKey = (cell: string) => norm(cell);

const MAX_ROWS = 2000;

/** Spreadsheet text → rows of cells. Excel copies as tabs; CSV files use commas (or semicolons), with "quoted" cells. */
export function parseTable(text: string): string[][] {
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const first = lines.split('\n').find((l) => l.trim()) ?? '';
  const sep = first.includes('\t') ? '\t' : (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i <= lines.length; i++) {
    const c = lines[i];
    if (quoted && c !== undefined) { // inside "quotes": commas, tabs and line breaks are part of the cell
      if (c === '"' && lines[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
      continue;
    }
    if (c === '"' && !cell.trim()) { quoted = true; cell = ''; }
    else if (c === sep) { row.push(cell.trim()); cell = ''; }
    else if (c === '\n' || c === undefined) {
      row.push(cell.trim()); cell = '';
      if (row.some((x) => x)) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS) throw new Error(`That list has more than ${MAX_ROWS} rows.`);
    } else cell += c;
  }
  return rows;
}

/** "P4", "p-4", "P 4" → ['P', 4]. */
const CODE = /^([A-Za-z]{1,2})\s*[-#.]?\s*(\d{1,3})$/;
const code = (s: string): [string, number] | null => { const m = s.trim().match(CODE); return m ? [m[1].toUpperCase(), +m[2]] : null; };

// Common spellings in band rosters, mapped to words in Freeform's section names.
const ALIASES: [RegExp, string][] = [
  [/^(fl|flt|flutes?|picc(olo)?s?)$/, 'flute'], [/^(cl|clar|clars|clarinets?|bcl|bass clarinet)$/, 'clarinet'],
  [/^(as|asx|alto|alto sax|altos?|sax|saxes|saxophones?)$/, 'alto saxophone'], // a lone "Sax" means alto (Jason) [/^(ts|tsx|tenor sax|tenors? sax)$/, 'tenor saxophone'],
  [/^(bari sax|bs|bsx)$/, 'baritone saxophone'], [/^(tp|tpt|trp|trpt|trumpets?|cornets?)$/, 'trumpet'],
  [/^(mel|mello|mellos|mellophones?|french horns?|horns?)$/, 'mellophone'], [/^(tb|tbn|trb|trombones?|bones?)$/, 'trombone'],
  [/^(bar|bari|baris|baritones?|euph|euphoniums?)$/, 'baritone'], [/^(tu|tba|tubas?|sousa|sousaphones?)$/, 'tuba'],
  [/^(sn|snr|snares?|snare drums?)$/, 'snare drum'], [/^(bd|bass|basses|bass drums?)$/, 'bass drum'],
  [/^(quads?|quints?|tenors|tenor drums?|tds?)$/, 'quads'], [/^(cym|cyms|cymbals?)$/, 'cymbals'],
  [/^(cg|guard|color guard|colorguard|flags?|rifles?|sabres?|winter guard)$/, 'color guard'],
];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The section an instrument cell means: its letter, its name, a common abbreviation, or a clear prefix. */
export function sectionFor(show: Show, cell: string): { id?: string; note?: string } {
  const raw = cell.trim(), n = norm(raw);
  if (!n) return {};
  const byLetter = show.sections.find((s) => s.letter.toUpperCase() === raw.toUpperCase());
  if (byLetter && raw.length <= 2) return { id: byLetter.id };
  const named = (want: string) => show.sections.filter((s) => norm(s.name) === want);
  const exact = named(n);
  if (exact.length === 1) return { id: exact[0].id };
  const alias = ALIASES.find(([re]) => re.test(n))?.[1];
  if (alias && named(alias).length === 1) return { id: named(alias)[0].id };
  // Every word starts a word of the section's name ("Alto Sax" ~ "Alto Saxophone"); must be unambiguous ("Sax" isn't).
  const words = (alias ?? n).split(' ');
  const hits = show.sections.filter((s) => { const sw = norm(s.name).split(' '); return words.every((w) => sw.some((x) => x.startsWith(w))); });
  if (hits.length === 1) return { id: hits[0].id };
  return { note: hits.length > 1 ? `"${raw}" could be ${hits.map((s) => s.name).join(' or ')}` : `no section for "${raw}"` };
}

/** Which column holds what: from header words if the first row has them, else from the cells themselves. */
function roles(show: Show, rows: string[][]): { roles: Role[]; header: boolean } {
  const width = Math.max(...rows.map((r) => r.length));
  const head = rows[0].map(norm);
  const byHeader = head.map((h): Role | null =>
    /^(first|first name|given|given name|preferred name)$/.test(h) ? 'first'
      : /^(last|last name|surname|family name)$/.test(h) ? 'last'
      : /^(name|names|student|student name|full name|performer|member)$/.test(h) ? 'name'
      : /^(instrument|instr|section|part|voice|inst)$/.test(h) ? 'instrument'
      : /^(code|dot|dot code|label|drill|drill code|drill number|rank|rank code|spot|number|id|position)$/.test(h) ? 'code' : null);
  if (byHeader.filter(Boolean).length) return { roles: Array.from({ length: width }, (_, k) => byHeader[k] ?? 'ignore'), header: true };
  const out: Role[] = Array(width).fill('ignore');
  const share = (k: number, test: (s: string) => boolean) => { const cells = rows.map((r) => r[k] ?? '').filter(Boolean); return cells.length ? cells.filter(test).length / cells.length : 0; };
  for (let k = 0; k < width; k++) {
    if (share(k, (s) => !!code(s)) >= 0.6) out[k] = 'code';
    else if (share(k, (s) => !!sectionFor(show, s).id) >= 0.6) out[k] = 'instrument';
  }
  // The rest with text is the name; two such columns read as first and last ("Pat", "Example").
  const left = [...out.keys()].filter((k) => out[k] === 'ignore' && share(k, (s) => /[a-z]/i.test(s)) >= 0.6);
  left.forEach((k) => { out[k] = 'name'; });
  return { roles: out, header: false };
}

/** What importing these rows would do. Codes name or create that exact dot; rows without a code fill the section's
 * unnamed dots in order, then get new dots. */
export function planRoster(show: Show, rows: string[][], given?: Role[], choices: Choices = {}): Plan {
  if (!rows.length) return { roles: [], header: false, steps: [], unknown: [] };
  const unknown = new Map<string, Plan['unknown'][number]>();
  const detected = roles(show, rows);
  const r = given ?? detected.roles, header = detected.header; // a header row stays a header when columns are re-chosen
  const body = header ? rows.slice(1) : rows;
  const taken = new Set<string>(), steps: Step[] = [];
  const byLabel = new Map(show.performers.map((p) => [label(show, p).toUpperCase(), p]));
  const nextNew = new Map<string, number>(); // section id → next free number for a new dot
  const free = (sec: string) => {
    if (!nextNew.has(sec)) nextNew.set(sec, Math.max(0, ...show.performers.filter((p) => p.section === sec).map((p) => p.number)) + 1);
    return nextNew.get(sec)!;
  };
  const pending: Step[] = [];
  body.forEach((cells, k) => {
    const row = k + 1 + (header ? 1 : 0);
    const col = (role: Role) => r.map((x, j) => (x === role ? cells[j] ?? '' : '')).filter(Boolean).join(' ').trim();
    const name = (col('name') || [col('first'), col('last')].filter(Boolean).join(' ')).slice(0, MAX_NAME);
    const inst = col('instrument'), c = code(col('code'));
    if (!name) { steps.push({ row, name, kind: 'skip', note: 'no name' }); return; }
    let sec = inst ? sectionFor(show, inst) : {}, waiting = false;
    if (inst && !sec.id && !c) { // with a dot code the code decides, so the instrument needs no choice
      const key = norm(inst), choice = choices[key];
      const u = unknown.get(key) ?? { key, instrument: inst, rows: 0, note: sec.note ?? '' };
      u.rows++; unknown.set(key, u);
      if (choice && show.sections.some((s) => s.id === choice)) { u.choice = choice; sec = { id: choice }; }
      else if (choice === 'skip') { u.choice = 'skip'; sec = { note: 'left off (your choice)' }; }
      else sec = { note: `${sec.note}: choose a section for ${inst} players, or leave them off` }, waiting = true;
    }
    if (c) {
      const key = `${c[0]}${c[1]}`;
      if (taken.has(key)) { steps.push({ row, name, kind: 'skip', label: key, note: `${key} is on an earlier row` }); return; }
      const p = byLabel.get(key);
      if (p) {
        taken.add(key);
        const noteParts = [p.name && p.name !== name ? `replaces ${p.name}` : '', sec.id && sec.id !== p.section ? `${key} isn't ${inst}; the code wins` : ''].filter(Boolean);
        steps.push({ row, name, kind: 'name', label: key, performer: p.id, ...(noteParts.length ? { note: noteParts.join('; ') } : {}) });
        return;
      }
      const s = show.sections.find((x) => x.letter.toUpperCase() === c[0]);
      if (!s) { steps.push({ row, name, kind: 'skip', label: key, note: `no section uses the letter ${c[0]}` }); return; }
      taken.add(key);
      nextNew.set(s.id, Math.max(free(s.id), c[1] + 1));
      steps.push({ row, name, kind: 'new', label: key, section: s.id, number: c[1] });
      return;
    }
    if (!sec.id) { steps.push({ row, name, kind: 'skip', note: inst ? sec.note : 'no instrument or dot code', ...(waiting ? { waiting } : {}) }); return; }
    pending.push({ row, name, kind: 'new', section: sec.id });
    steps.push(pending[pending.length - 1]);
  });
  // Rows with only an instrument: the section's unnamed dots first (in number order), then new dots.
  for (const st of pending) {
    const open = show.performers.filter((p) => p.section === st.section && !p.name && !taken.has(label(show, p).toUpperCase())).sort((a, b) => a.number - b.number)[0];
    if (open) { const l = label(show, open); taken.add(l.toUpperCase()); Object.assign(st, { kind: 'name', performer: open.id, label: l }); continue; }
    let n = free(st.section!);
    const letter = show.sections.find((s) => s.id === st.section)!.letter.toUpperCase();
    while (taken.has(`${letter}${n}`) || byLabel.has(`${letter}${n}`)) n++;
    nextNew.set(st.section!, n + 1);
    taken.add(`${letter}${n}`);
    Object.assign(st, { number: n, label: `${letter}${n}` });
  }
  return { roles: r, header, steps, unknown: [...unknown.values()] };
}

/**
 * Carry out a plan: name dots and add the new ones. New dots wait in rows along the front sideline, centered on the 50
 * (2 steps apart, section by section) in every set, ready to be placed.
 */
export function applyRoster(show: Show, plan: Plan): Show {
  const names = new Map(plan.steps.filter((s) => s.kind === 'name').map((s) => [s.performer!, s.name]));
  const performers = show.performers.map((p) => (names.has(p.id) ? { ...p, name: names.get(p.id)! } : p));
  const order = new Map(show.sections.map((s, i) => [s.id, i]));
  const fresh = plan.steps.filter((s) => s.kind === 'new').sort((a, b) => (order.get(a.section!) ?? 0) - (order.get(b.section!) ?? 0) || a.number! - b.number!);
  const spots: Record<string, { x: number; y: number }> = {};
  fresh.forEach((s, k) => {
    const id = newId('p');
    performers.push({ id, section: s.section!, number: s.number!, name: s.name });
    const inRow = Math.min(41, fresh.length - Math.floor(k / 41) * 41); // rows of up to 41, centered on the 50
    spots[id] = { x: ((k % 41) - (inRow - 1) / 2) * 2, y: Math.min(FIELD_WIDTH, 2 + Math.floor(k / 41) * 2) };
  });
  return { ...show, performers, sets: show.sets.map((s) => ({ ...s, pos: { ...s.pos, ...spots } })) };
}

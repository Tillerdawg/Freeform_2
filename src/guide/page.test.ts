import { describe, expect, it } from 'vitest';
import md from '../../docs/HOW-TO.md?raw';
import students from '../../docs/STUDENTS.md?raw';
import estudiantes from '../../docs/STUDENTS.es.md?raw';
import { guidePage, slug, studentPage } from './page';

describe('the guide page', () => {
  const html = guidePage(md);
  it('has an anchor for every "#…" link in the guide', () => {
    const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    const links = [...md.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(10);
    expect(links.filter((l) => !ids.has(l))).toEqual([]);
  });
  it('keeps the pictures beside it and links back to the app', () => {
    expect(html).toContain('src="img/editor.png"');
    expect(html).toContain('href="../"');
  });
  it('makes anchors the way GitHub does', () => {
    expect(slug('Shapes: lines, arcs, and letters')).toBe('shapes-lines-arcs-and-letters');
    expect(slug('Saving, backing up, and opening files')).toBe('saving-backing-up-and-opening-files');
  });
});

describe('the student quickstart pages', () => {
  it('use the guide\'s pictures, link to the guide, and switch languages', () => {
    const en = studentPage(students, 'en'), es = studentPage(estudiantes, 'es');
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('src="../guide/img/phone.png"');
    expect(en).toContain('href="../guide/"'); // the "director's guide" link, written for GitHub as HOW-TO.md
    expect(en).toContain('href="../es/students/"');
    expect(es).toContain('<html lang="es">');
    expect(es).toContain('src="../../guide/img/phone.png"');
    expect(es).toContain('href="../../students/"');
  });
  it('cover the same steps in both languages, with the same pictures', () => {
    const heads = (m: string) => [...m.matchAll(/^## /gm)].length, pics = (m: string) => [...m.matchAll(/\]\((img\/[^)]+)\)/g)].map((x) => x[1]);
    expect(heads(estudiantes)).toBe(heads(students));
    expect(pics(estudiantes)).toEqual(pics(students));
  });
});

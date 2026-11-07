import { describe, expect, it } from 'vitest';
import md from '../../docs/HOW-TO.md?raw';
import { guidePage, slug } from './page';

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

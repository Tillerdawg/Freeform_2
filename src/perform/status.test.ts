import { describe, expect, it } from 'vitest';
import { statusParts, type StatusIn } from './status';

const base: StatusIn = { ready: false, music: false, hosted: false, check: null, when: () => '3:42 PM', lang: 'en' };

describe('the phone status line', () => {
  it('says nothing for an unsaved share link with no revision', () => {
    expect(statusParts(base)).toEqual([]);
  });
  it('says when the show works offline, and whether the music does too', () => {
    expect(statusParts({ ...base, ready: true, revision: 6 })).toEqual(['Ready offline', 'Revision 6']);
    expect(statusParts({ ...base, ready: true, music: true })).toEqual(['Ready offline, with the music']);
  });
  it('says whether a hosted show is the latest, and why not when it can\'t tell', () => {
    const h = { ...base, hosted: true, revision: 6, checked: 1 };
    expect(statusParts(h)).toEqual(['Revision 6', 'checked for updates 3:42 PM']);
    expect(statusParts({ ...h, check: 'checking' })).toEqual(['Revision 6', 'checking for updates…']);
    expect(statusParts({ ...h, check: 'offline' })).toEqual(['Revision 6', 'Offline: using the copy on this phone (last checked 3:42 PM)']);
    expect(statusParts({ ...h, check: 'failed', checked: undefined })).toEqual(['Revision 6', "Couldn't check for updates: using the copy on this phone (never checked)"]);
    expect(statusParts({ ...base, hosted: true })).toEqual(['No revision number', 'not checked for updates yet']);
  });
  it('speaks Spanish', () => {
    expect(statusParts({ ...base, ready: true, hosted: true, revision: 6, checked: 1, check: 'offline', lang: 'es' }))
      .toEqual(['Listo sin internet', 'Revisión 6', 'Sin internet: usando la copia de este teléfono (última revisión 3:42 PM)']);
  });
});

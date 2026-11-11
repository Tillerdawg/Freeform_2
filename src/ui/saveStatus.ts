// "Is my work safe?" in one place: the top bar's status chip and the panel it opens. Three layers, each said in words
// (never color alone): this browser's autosave, a .freeform file, and the phones.

export interface SaveState {
  /** This browser's autosave worked on the last change. */
  browserOk: boolean;
  /** When the show first changed after it was last saved to a file (or opened from one); null if no changes since. */
  unexported: number | null;
  /** When the show was last saved to a file from here, if ever. */
  fileSavedAt: number | null;
  /** The revision phones have, if the show has been published. */
  revision?: number;
  /** The drill changed after that revision went out (revisionLabel's "+ changes"). */
  changedSincePublish: boolean;
  /** "2:14 PM" today, "Nov 5" before. */
  when: (ms: number) => string;
}

export interface SaveStatus {
  /** The chip's one line, like "Browser ✓ · File: 2:14 PM · Phones: rev 6". */
  label: string;
  /** True when something isn't saved somewhere it could be (the chip gets an outline as well as its words). */
  attention: boolean;
  browser: string;
  file: string;
  phones: string;
}

export function saveStatus(s: SaveState): SaveStatus {
  const file = s.unexported ? 'unsaved changes' : s.fileSavedAt ? s.when(s.fileSavedAt) : 'no changes';
  const phones = s.revision ? `rev ${s.revision}${s.changedSincePublish ? ' + changes' : ''}` : 'not published';
  return {
    label: `${s.browserOk ? 'Browser ✓' : 'Browser: not saved'} · File: ${file} · Phones: ${phones}`,
    attention: !s.browserOk || !!s.unexported || s.changedSincePublish,
    browser: s.browserOk
      ? 'Saved in this browser as you work. It stays here until this browser\'s data is cleared, and only this computer has it.'
      : "This browser couldn't save your last changes (its storage may be full or turned off). Save a file now so you don't lose them.",
    file: s.unexported
      ? `Changes since ${s.fileSavedAt ? `you last saved a file (${s.when(s.fileSavedAt)})` : `${s.when(s.unexported)}, not saved to a file yet`}. Save a file to keep a copy off this browser.`
      : s.fileSavedAt ? `Saved to a file at ${s.when(s.fileSavedAt)}, with no changes since.` : 'No changes to save to a file.',
    phones: !s.revision
      ? 'Not published to phones yet. Share sends it to your performers.'
      : s.changedSincePublish
        ? `Phones have revision ${s.revision}, and you've changed the drill since. Publish again to send the changes.`
        : `Phones have revision ${s.revision}, the drill as it is now.`,
  };
}

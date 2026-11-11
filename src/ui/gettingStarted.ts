// The getting-started checklist: six steps from a blank field to a show on phones. Each step ticks itself off when the
// show (or what the director has done) says it's done; nothing is locked or hidden. Shown on shows started in this
// browser, until it's hidden or every step is done.
import type { Show } from '../engine/show';

/** What the director has done with this show that the show itself can't tell: pressed Play, opened Review, opened Share. */
export interface Done { played?: boolean; reviewed?: boolean; shared?: boolean }

export interface Step { id: string; title: string; hint: string; done: boolean }

export function gettingStarted(show: Show, did: Done, openIssues: number): Step[] {
  const [a, b] = show.sets;
  const moved = !!b && show.performers.some((p) => a.pos[p.id] && b.pos[p.id] && (a.pos[p.id].x !== b.pos[p.id].x || a.pos[p.id].y !== b.pos[p.id].y));
  return [
    { id: 'performers', title: 'Put performers on the field', done: show.performers.length > 0,
      hint: 'Click Add Performer in the toolbar, then click the field for each one. On a blank field, Import a roster… brings in a list from Excel.' },
    { id: 'set', title: 'Add the next set', done: show.sets.length > 1,
      hint: 'Click the ▾ next to Add Performer, then Set. It goes right after the set you\'re on.' },
    { id: 'move', title: 'Move performers to their new spots', done: moved,
      hint: 'On set 2, drag performers to new spots, or select a group and use Shape to make a line, an arc, or a block.' },
    { id: 'play', title: 'Watch the move', done: !!did.played && moved,
      hint: 'Press Space, or ▶ under the field. The path lines show who goes where.' },
    { id: 'review', title: 'Check for problems', done: !!did.reviewed && moved && openIssues === 0,
      hint: openIssues ? `Click Review in the top bar. It lists ${openIssues === 1 ? 'one problem' : `${openIssues} problems`}: fix them, or dismiss what's fine as written.` : 'Click Review in the top bar. It lists steps that are too big, performers too close, and counts not written yet.' },
    { id: 'share', title: 'Send it to your band', done: !!did.shared || !!show.revision,
      hint: 'Click Share… in the sidebar for a link and QR code. Students can read freeformdrill.org/students/ first.' },
  ];
}

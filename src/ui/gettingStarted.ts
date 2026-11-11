// The two step-by-step checklists. Getting started: five steps from a blank field to a first move, checked in Review.
// Send it to your band: four steps from a finished move to performers' phones. Each step ticks itself off when the show
// (or what the director has done) says it's done; nothing is locked or hidden.
import type { Show } from '../engine/show';

/** What the director has done with this show that the show itself can't tell: pressed Play, opened Review. */
export interface Done { played?: boolean; reviewed?: boolean }

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
  ];
}

/** Send it to your band: what the show can't tell (opened Share, copied the message, read the rehearsal tip). */
export interface SendDone { shared?: boolean; copied?: boolean; rehearsal?: boolean }

export function sendSteps(show: Show, did: SendDone, openIssues: number): Step[] {
  return [
    { id: 'review', title: 'Check for problems', done: openIssues === 0,
      hint: openIssues ? `Review lists ${openIssues === 1 ? 'one problem' : `${openIssues} problems`}. Fix them, or dismiss what's fine as written, before your band learns it.` : 'Review has nothing to fix.' },
    { id: 'share', title: 'Get a link for your band', done: !!did.shared || !!show.revision,
      hint: 'Share… gives you two choices. Send this version: a link and QR code with the show inside, which never changes. Keep phones up to date: one link that updates on phones each time you publish again.' },
    { id: 'message', title: 'Send it, with the student guide', done: !!did.copied,
      hint: 'Copy a message with the show link and the two-minute student guide, then paste it into your text, email, or team app.' },
    { id: 'rehearsal', title: 'Check phones at rehearsal', done: !!did.rehearsal,
      hint: 'Ask "What revision does everyone have?" It\'s at the top of My dots on every phone. After you change the drill, publish again, and phones update the next time they open the show.' },
  ];
}

/** The message to paste for the band: the show's link (if it's published) and the student guide, in English and Spanish. */
export function bandMessage(title: string, link: string | null): string {
  return [
    `Here's our drill for ${title || 'the show'} in FreeFORM: ${link ?? '(paste the link from Share here)'}`,
    'Open it on your phone, pick your name, and your dots are there. It works with no signal once it\'s opened.',
    'New to FreeFORM? This two-minute guide shows how: https://freeformdrill.org/students/',
    'En español: https://freeformdrill.org/es/students/',
  ].join('\n');
}


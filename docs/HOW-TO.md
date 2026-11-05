# How to use FreeFORM

This guide walks you through writing a show in FreeFORM, from an empty field to dot sheets in your students' hands and the drill on their phones. It's written for band directors and drill writers. You don't need to have used Pyware or UDB before, but if you have, most of this will feel familiar.

FreeFORM runs in your web browser at <https://freeformdrill.org/>. There's nothing to install and no account to make.

The pictures in this guide come from a small sample show (47 performers, 4 sets) that ships with the code. Your screen will look the same, just with your own drill on it.

## Contents

1. [Before you start](#before-you-start)
2. [A quick tour of the editor](#a-quick-tour-of-the-editor)
3. [Set up a new show](#set-up-a-new-show)
4. [Add performers](#add-performers)
5. [Select and move performers](#select-and-move-performers)
6. [Sets, counts, and the timeline](#sets-counts-and-the-timeline)
7. [Shapes: lines, arcs, curves, circles, spirals, and blocks](#shapes-lines-arcs-curves-circles-spirals-and-blocks)
8. [Rotate, stretch, and flip](#rotate-stretch-and-flip)
9. [Follow-the-leader](#follow-the-leader)
10. [Step-size warnings](#step-size-warnings)
11. [Dot labels](#dot-labels)
12. [Markup and notes](#markup-and-notes)
13. [Play it back](#play-it-back)
14. [Add your music](#add-your-music)
15. [Print dot sheets and drill charts](#print-dot-sheets-and-drill-charts)
16. [Send the show to your performers](#send-the-show-to-your-performers)
17. [What performers see on their phones](#what-performers-see-on-their-phones)
18. [Using an iPad](#using-an-ipad)
19. [Saving, backing up, and opening files](#saving-backing-up-and-opening-files)
20. [Keyboard shortcuts](#keyboard-shortcuts)
21. [If something goes wrong](#if-something-goes-wrong)

## Before you start

You'll want a computer or an iPad to write drill. FreeFORM needs a current version of Chrome, Edge, Firefox, or Safari, or iPadOS 16.4 or later (any iPad from 2017 on). If your browser is too old, you'll get a page that says so.

Phones only get the performer view. That's on purpose: a phone screen is too small to write drill on, but it's perfect for a student checking their spot.

One thing to know up front: **your show is saved in the browser you're using.** FreeFORM saves every change automatically, but only on that computer, in that browser. If you clear your browser data, or switch from Chrome to Safari, your show won't be there. Use **Export** often to keep a copy you control (see [Saving, backing up, and opening files](#saving-backing-up-and-opening-files)).

## A quick tour of the editor

![The FreeFORM editor with the sample show on set 2](img/editor.png)

From top to bottom:

- **The top bar** shows the set you're on, with its counts and measures, **+ Add set**, and **Delete set**. The sun/moon button at the far right switches between dark mode (the default) and light mode. The field looks the same either way.
- **The drill toolbar** has two rows. The first row picks what a click on the field does: **Select Performer(s)** or **Add Performer(s)**. It also has **Delete Performer(s)**, and at the right end Undo, Redo, Fit (zooms back out to the whole field), the timeline button, and the sidebar button. The second row has the tools for placing and moving performers: **Snap to grid**, **Markup**, **Shape**, **Transform**, **FTL**, **Labels**, and **Reset to set**.
- **The field** is in the middle. You're looking at it from the press box: the front sideline is at the bottom and Side 1 is on the left. Scroll to move around, and pinch (or hold ⌘ or Ctrl and scroll) to zoom.
- **The timeline** runs across the bottom. Each set has a numbered button, and each move between sets shows its counts, measures, and biggest step size.
- **The sidebar** on the right holds the show's file buttons, title, and hash marks; the current set's notes; whatever you have selected; and the **Sections** and **Roster** lists. The sidebar button (at the right end of the toolbar) shows and hides it.

## Set up a new show

Click **New** in the sidebar to start a show. (If you already have one open, FreeFORM asks first, and Undo brings it back.)

1. **Name it.** Type the title in the box under the file buttons. It prints on every dot sheet and chart.
2. **Pick your hash marks.** The menu under the title has **High school**, **College / DCI**, and **NFL**. FreeFORM draws the field the way drill software does, with whole-step hashes:

   | Level | Sideline to hash / hash to hash / hash to sideline |
   |---|---|
   | High school | 28 / 28 / 28 steps |
   | College / DCI | 32 / 20 / 32 steps |
   | NFL | 36 / 12 / 36 steps |

   If you change the hashes after you've written drill, FreeFORM asks whether performers should keep their places relative to the hashes (on the hash stays on the hash) or keep their exact spots on the field.
3. **Letters or dots.** By default each performer is drawn as their section letter with their number beside it (a P with a 4). Switch the menu beside the hashes to **Dots** if you'd rather see plain dots labeled P4.
4. **Check your sections.** Open **Sections** in the sidebar.

![The Sections list](img/sections.png)

New shows start with Flute (F), Clarinet (K), Alto Sax (A), Tenor Sax (X), Trumpet (P), Mellophone (H), Trombone (N), Baritone (E), Tuba (T), Snare (S), Quads (Q), Bass Drum (B), Cymbals (C), and Color Guard (G). There's no front ensemble, since they usually stay put, but you can add one.

In the Sections list you can:

- Rename a section or change its letter. If two sections share a letter, FreeFORM flags them, since their labels would look the same.
- Give a section a color with the swatch. Its dots show in that color on the field, on phones, and on printed charts. **Clear colors** goes back to plain dots.
- Add or delete a section. If you delete one that has performers, you pick where they go.
- Reorder the list by dragging the dotted grip at the left of a row, or use **Sort** for score order, by letter, or by name. Dot sheets print in this order.
- Renumber a section with **#**: **Close the gaps** (X4, X5, X6 become X1, X2, X3), **Left to right** (Side 1 to Side 2), or **Front to back** (rank by rank), as they stand in the current set.

If your program always uses the same sections, set them up once and choose **Starting list → Use this list for new shows**. New shows in that browser will start with your list. **Back to FreeFORM's list** undoes it.

## Add performers

![The Add Performer(s) menu, picking a section](img/add-performers.png)

1. Click **Add Performer(s)** and pick a section.
2. Click the field wherever you want each one. They're numbered in order: P1, P2, P3, and so on.
3. Press **V** (or click **Select Performer(s)**) when you're done.

Performers are part of the whole show, so a performer you add appears in every set, on the same spot, until you move them.

**Names.** Each dot can have the name of the student who marches it. Click a dot and type the name at the top of **Selection** in the sidebar. The **Roster** list shows every dot and its name.

![The Roster list](img/roster.png)

If you already have your roster in a spreadsheet, use **Import a list…** in Roster. Copy the cells from Excel and paste them, or choose a CSV file. FreeFORM reads the column headers (Name, or First and Last; Instrument or Section; Dot or Label), and you can fix any column it reads wrong. It shows you what will happen to every row before anything changes:

- A row with a dot (P4) names that dot, or adds it if it doesn't exist yet.
- A row with only an instrument names that section's next unnamed dot, or adds a new one.
- An instrument that doesn't match any section (say, a bassoonist who marches baritone) asks you which section those players go in.

New dots from an import wait in rows on the front sideline, centered on the 50. The whole import is one step, so a single Undo takes it all back.

Names are saved with the show and print on dot sheets. Plain share links leave them out, since anyone with the link could read them. Locked hosted links keep them (see [Send the show to your performers](#send-the-show-to-your-performers)).

## Select and move performers

With **Select Performer(s)** on:

- **Click** a performer to select them.
- **Shift-click** to add or remove performers from the selection.
- **Drag a box** on open field to select everyone inside it.
- **Drag** any selected performer to move the whole selection.

On a touch screen there's no Shift key, so turn on **Add to selection** in the sidebar's Selection area. Every tap or box then adds to what's already selected.

**Snap to grid** (in the toolbar) sets how dragging and adding land: on whole steps, half steps, or anywhere (free). If performers are already off the grid (after a rotate, a shape, or an import), select them and click **Apply** to round them onto it. FreeFORM warns you if two performers would land on the same spot.

**Reading coordinates.** Click one performer and the sidebar shows exactly where they are, in standard drill language.

![A selected performer's coordinate in the sidebar](img/coordinates.png)

Coordinates read side to side first, then front to back, from the nearest yard line and the nearest sideline or hash, rounded to quarter steps. For example: "2 steps outside the Side 2 45, 2 steps in front of Front Hash," "Splitting 40 and 45 on Side 1," or "On the 50." Open **All sets** to see that performer's spot in every set.

**Placing someone exactly.** Open **Place exactly (this set)** under the coordinate, fill in the steps, inside or outside, the side and yard line, then the steps in front of or behind a sideline or hash, and click **Place**.

**Moves carry forward through holds.** When you move someone in a set, every later set where they were still standing on their old spot (holding) moves with them, up to the first set where you'd already put them somewhere else. So if you add performers, then place them in set 2, they stay there in sets 3, 4 and on until you move them again, and drill you've already written for later sets is never changed. This works the same for dragging, shapes, flips, rotating and stretching, snapping, and **Place exactly**.

**Reset to set** in the toolbar puts the selected performers back where they were in the set before, so you can start their move over.

## Sets, counts, and the timeline

![The timeline](img/timeline.png)

A set is one picture of the drill, and the move into it takes a number of counts. Set 1 is the opening set, so it has no move into it.

- **+ Add set** (top bar) adds a set 16 counts after the one you're on, and the sets after it move along. The new set starts as a copy of the one you were on, so you only move the people who move.
- Change a set's **Counts** and **Measures** in the top bar. New counts take effect when you press Enter or tap away, so the set doesn't jump around while you type. Type measures the way the score numbers them (a pickup bar is m. 1).
- **Delete set** removes the set you're on. The sets always stay numbered in order: delete set 7 of 8 and the old 8 becomes 7. Adding a set in the middle moves the later ones up a number the same way. Sub-sets keep their place after the set before them and stay lettered in order (the old 8A becomes 7A).
- **Click a set's button** on the timeline to go to it, or click any count to see where everyone is on that count.
- **Drag a set's button** to move it to a different count. The sets around it stay where they are.

Each move on the timeline shows its counts, measures, and the biggest step anyone takes (colored if it's too big, see [Step-size warnings](#step-size-warnings)).

The timeline scrolls sideways for a long show. Use the mouse wheel or a swipe over it, or right-drag. The magnifying glasses at the right end zoom the timeline in and out, and **Fit** shows the whole show.

**Movements: laying out the show by counts first.** If you know your music's length before you write, open **Movements** (under the field, beside Music) and type each tune's total counts.

![The Movements menu](img/movements.png)

The timeline then runs the full length, with the part you haven't written yet striped *Not written yet*. To add a set at a particular count, click that count on the timeline and press **+ Add set**, or type the count in the **at count** box. No other set moves. A set added in the middle of a move splits it and gets a sub-set name (1A after 1), the way Pyware names them.

## Shapes: lines, arcs, curves, circles, spirals, and blocks

![Shaping a block into an arc](img/shape-arc.png)

1. Select the performers you want in the shape.
2. Open **Shape** and pick **Line**, **Arc**, **Curve**, **Bézier**, **Circle**, **Spiral**, or **Block**. Or press its letter (see [Keyboard shortcuts](#keyboard-shortcuts)).
3. Drag the blue handles on the field to adjust the shape. Choose **Even** spacing, or **Every** so many steps.
4. Click **Done** (or press Esc) when it looks right.

FreeFORM decides who goes to which spot by keeping total travel from the previous set as short as it can, so the paths don't cross. Curves can take extra points (**+ Curve point**) and Béziers extra segments (**+ Segment**). Bézier joints stay smooth unless you hold Option (Alt on Windows) while you drag a handle. Blocks also take a number of **Columns**.

**Spirals** start in the center and wind out to the outer end. The first handle is the center and the second is the outer end. Set the number of **Turns**, and click the direction button to wind it **Counterclockwise** or **Clockwise**. The coils stay the same distance apart all the way out. Spacing is measured in a straight line from one performer to the next, so performers near the tight center get the same interval as everyone else. If the coils get closer than 2 steps, FreeFORM warns you, because performers on neighboring coils would be too close. Use fewer turns or make the spiral bigger.

![A block shaped into a spiral](img/shape-spiral.png)

## Rotate, stretch, and flip

Select two or more performers and a dashed frame appears around them.

![A selected arc with its rotate knob and corner handles](img/select-frame.png)

- **Drag the round knob** above the frame to rotate the selection around its center. It lands on whole degrees and pulls toward multiples of 15°, so 45° and 90° are easy to hit.
- **Drag a corner** to stretch. Drag sideways to make the group wider or narrower, up or down to make it deeper or shallower, or diagonally for both. Each direction pulls toward 100%, so a slightly crooked sideways drag won't change the depth.

The amount shows in the bottom-left corner of the field while you drag, and each drag is one Undo. Stretching follows the field's lines (side to side and front to back), even after you've rotated a group.

The **Transform** menu has the rest:

- **Flip across the 50** swaps Side 1 and Side 2, and **Flip front ↔ back** swaps front and back.
- **Copy Side 1 → 2** (or 2 → 1) gives the other side the mirror image. FreeFORM pairs each performer with the one in the mirror-opposite spot.
- **Rotate & scale** turns the selection by a typed number of degrees, and **Expand** and **Contract** scale it evenly by a typed percent.

Rotating or stretching usually leaves performers between grid steps. Use **Snap to grid → Apply** if you want them back on whole or half steps.

## Follow-the-leader

In a follow-the-leader (FTL) move, the performers march the leader's path in order, instead of each going straight to their spot.

![The FTL menu for the guard's move into set 3, with the leader's turn](img/ftl.png)

1. Go to the set the move ends on, and select the group.
2. Open **FTL**, pick the **Leader**, and put the others in order with the arrows.
3. Drag the leader to their end spot. Everyone else follows the trail.
4. For a route with corners, click **Add turns**, then click each turn on the field in marching order. Press Esc when you're done.

With the group selected, each turn has a blue handle you can drag. **Remove last turn** and **Straight route** take turns back out, and **Float instead** turns FTL off for that group. Turns move with the group when you drag, flip, rotate, or stretch it, and **Copy Side 1 → 2** copies an FTL group to the other side.

Everyone in an FTL move covers the leader's whole route at one steady step size, so a turn never makes anybody take a giant step.

## Step-size warnings

![Paths into set 4, too fast on purpose](img/step-warnings.png)

FreeFORM checks every move against the counts it has:

- **Yellow** means someone's step is bigger than a 6-to-5.
- **Red** means it's bigger than a 4-to-5, which is about as big a step as anyone should take.

The colors show on the path lines on the field and in the timeline's "max" readout for each move. To fix a red move, add counts, shorten the distance, or split the move with a sub-set.

## Dot labels

FreeFORM keeps labels from overlapping each other or covering another dot. Each one sits above its dot, or below, beside, or on a diagonal when that spot is taken. In a tight block, some labels hide until you zoom in.

To place labels yourself, select performers, open **Labels**, and click a direction on the compass for the current set. The center **A** goes back to automatic, and **Hide** hides them. For a curve of three or more performers, **Inside curve** and **Outside curve** point every label toward or away from the curve's center.

Labels hide while a show plays (they'd jump around) and come back when you stop. Printed charts always show every label, with a thin leader line when one has to move away from its dot to find room.

## Markup and notes

**Markup** (in the toolbar) puts notes on the field for the current set only:

- **Text**: click the field and type. (Press **T** as a shortcut.)
- **Arrow**: drag from where the arrow starts to where it points.
- **Draw**: drag to draw freehand.

Click a piece of markup to select it, drag it to move it, and press Delete to remove it.

There are two kinds of written notes in the sidebar:

- **Ensemble notes** belong to a set and print under that set's drill chart, for everyone.
- **Performer notes** belong to the selected performers and print on their dot sheets for that set ("Slide L, horns 45").

## Play it back

The play controls are at the left end of the timeline: back to the start, back one count, play or pause, and forward one count.

- Play starts where you are and goes forward. Pick a set, then press Play (or Space).
- Set the speed with **Tempo**.
- **Play set … to …** limits playback to a range of sets. Check **Loop** to repeat it.
- The left and right arrow keys step one count at a time (when no one is selected).

## Add your music

![The Music menu](img/music.png)

FreeFORM can play your drill along with the recording, so the moves line up with the music the way they will on the field.

**The easy way, with MuseScore:**

1. In MuseScore, export the score as audio (mp3).
2. In FreeFORM, open **Music** (beside Tempo) and click **Add the score (MuseScore)…**. Choose the `.mscz` file (MusicXML, `.mxl`, and MIDI work too).
3. Click **Add the recording (mp3)…** and choose the mp3 you exported.

You can do steps 2 and 3 in either order. Once both are in, FreeFORM takes the time of every count from the score, including meter changes, tempo marks, and fermatas, and places each set's counts in the measures you typed for it. It warns you if the recording's length doesn't match the score (usually a sign you picked the wrong file). Bars that no set covers, like a G.P. or an intro, get a hold sub-set (4A) so everyone stands still through them.

**With any recording, by tapping:** add just the recording (mp3, m4a, or wav), then choose **Tap counts…**. FreeFORM plays it from the top while you press Space on every count, starting with count 0 (set 1). You can undo a tap, pause, or start over. To fix part of it later, set **Redo from count** first.

When the counts are in, Play follows the music, rubato and all, and the recording's waveform shows along the bottom of the timeline. Uncheck **Play with music** to go back to the Tempo setting.

The recording stays in your browser. It isn't saved in the `.freeform` file, but the counts are, so on another computer you can add the same recording again and everything lines up.

## Print dot sheets and drill charts

Click **Print…** in the sidebar.

![The Print dialog](img/print.png)

Choose **Dot sheets** or **Drill charts**, and who to print for: **Everyone**, one **Section**, or the performers you have **Selected**. FreeFORM opens your browser's print dialog. To get a PDF instead of paper, pick **Save as PDF** there.

Dot sheets come four cards to a page. Each card has the performer's label, name, and section, then every set with its counts, measures, and coordinates, plus any performer notes.

![A page of dot sheets](img/dot-sheet.png)

Drill charts are one page per set, with every dot labeled, the set's markup, and its ensemble notes underneath. They're black on white so they copy well. Sections with a color print as colored dots, which come out as shades of gray on a black-and-white printer.

![A drill chart for set 2](img/drill-chart.png)

## Send the show to your performers

Click **Share…** in the sidebar.

![The Share dialog with a link and QR code](img/share.png)

**Share links** are the quick way. The whole show is packed inside the link, so there's no server and no account involved. Text it, email it, or post it in your band's group chat. For a small show you also get a QR code you can put on a screen at rehearsal. Two things to keep in mind:

- Anyone with the link can see the show, so names are left out.
- Changes you make later aren't sent. After you edit, share a new link.

**Hosted links** are better for a real season. Open **Hosted link** in the Share dialog. FreeFORM makes a *locked* show file, encrypted in your browser, and you put that file online. The link that opens it is short, makes a QR code that scans easily, and keeps working when you update the show: performers' phones pick up your latest version the next time they open it online. The key that unlocks the file is only in the link, so whoever hosts the file can't read it. **The link is the password, so share it only with your band.** A locked file can carry names and, if you want, the music.

There are two ways to put the file online:

- **Publish to phones** does it in one click once you connect FreeFORM to a public GitHub repository of your own. (Public is fine, since the file is encrypted.) You'll need the repository's name and a fine-grained GitHub token that can write only to that repository (*Contents: Read and write*). Both stay in your browser. After that, **Publish update** replaces the file, and the link and QR code never change.
- **Or host the file yourself**: download the locked file and upload it anywhere that gives you a direct link to it. A GitHub repository works (upload the file, open it, and copy its **Raw** link). Paste that address into the box and FreeFORM makes your short link.

To cut off old links (say, a student leaves the program), clear the address and start over. Phones that already have the show keep their copy but get no more updates.

## What performers see on their phones

When a student opens your link on their phone, they pick who they are.

![Picking who you are on a phone](img/phone-who.png)

They can search by name, by dot (P4), or by section, and **Staff (whole band)** at the top shows everyone. FreeFORM remembers their choice, and the show keeps working offline once it's opened.

![A performer's view of set 2 on a phone](img/phone.png)

On the performer screen:

- **My view** follows their dot through each move. **Whole field** shows everything, and pinch-zoom works in both.
- **Director view** shows the field the way the editor does. Tap it to switch to **Facing front**, which turns the field around to match what they see facing the audience.
- Under the field they see their spot now and in the next set, with counts, measures, and step size, plus their notes and the ensemble notes.
- **Around you** lists their nearest neighbors (up to four, within 10 steps) and where each one is, like "P5 · 4 steps toward Side 1."
- They can play at any tempo, step count by count, scrub, or tap a set number to jump to it. If the show has music, Play follows it, and **♪ Music** switches back to a tempo.

Students can add FreeFORM to their home screen. In the home-screen app, they open a show with **Scan QR code** or by pasting the link.

On a computer or iPad, **Performer view** in the sidebar (or **Open performer view here** in the Share dialog) shows you the same screen, and **← Editor** takes you back.

## Using an iPad

![The editor on an iPad](img/ipad.png)

The editor works on an iPad the same way it does on a computer, with a few touch habits:

- **One finger** does whatever the tool does: tap to select or add, drag to move, drag on open field for a box.
- **Two fingers** pan and pinch-zoom the field. If a second finger lands while the first one has started something, FreeFORM takes that back and moves the view instead.
- **With an Apple Pencil**, the Pencil does the editing. Once you've used it on the field, a single finger or a palm resting on the screen does nothing there, so you can rest your hand while you work. Two fingers still pan and zoom, and they never undo what the Pencil just did. To go back to editing with your finger, reload the page.
- Turn on **Add to selection** to build up a selection without a Shift key.
- On the timeline, tap a set to go to it and swipe to scroll. To move a set to a new count, touch and hold its button until it lifts, then drag. That way a swipe can't move a set by accident.
- On an iPad held upright, the sidebar starts hidden. The sidebar button opens it over the right side of the field.
- For more room while you write drill, hide the timeline, the sidebar, or both. The timeline button (a window with a bar along the bottom) and the sidebar button (a window with a bar on the right) are at the right end of the toolbar, and each one shows and hides its panel. The field grows to fill the space and zooms back out to fit. You can still change sets with the arrows at the top, and the keyboard shortcuts still work.

With a keyboard attached, the [keyboard shortcuts](#keyboard-shortcuts) work too.

## Saving, backing up, and opening files

- **Autosave**: every change is saved in your browser right away.
- **Export** downloads the show as a `.freeform` file. This is your real backup, because the autosave lives in only that one browser. Export before big changes and at the end of every session.
- **Import…** opens a `.freeform` file (older `.freeform.json` files too). It replaces the current show, and Undo brings the old one back.
- **Pyware 3D files (`.3dj`)**: Import… also opens these. You get the sets with their counts and names, measures and notes, sections from Pyware's symbols, label positions, and the roster names. Moves that aren't straight in Pyware (follow-the-leader, rotations, delayed step-offs) come in count by count, with even steps. Drawn markup and the 3D figures don't come over.

## Keyboard shortcuts

| Do this | Press |
|---|---|
| Select tool | V |
| Add performer tool | A |
| Text note tool | T |
| Shape the selection (2 or more): Line, Arc, cUrve, Bézier, circle (O), Spiral, blocK | L, R, U, B, O, S, K |
| Play or pause | Space |
| Back or forward one count (no one selected) | ← or → |
| Move the selection 1 step | ← → ↑ ↓ |
| Move the selection 4 steps | Shift + arrow |
| Move the selection half a step | Option (Alt) + arrow |
| Zoom the field in or out | ⌘+ or ⌘− (Ctrl on Windows) |
| Fit the whole field | F, or ⌘0 (Ctrl+0) |
| Delete the selection (asks first) | Delete |
| Undo | ⌘Z (Ctrl+Z on Windows) |
| Redo | ⇧⌘Z (Ctrl+Y or Ctrl+Shift+Z on Windows) |
| Close a menu, then clear the selection | Esc |
| Move around the field | Scroll, or right-drag |
| Zoom | Pinch, or ⌘/Ctrl + scroll |

Arrows move the selection the way it looks on screen: ↑ is toward the back sideline. Shortcuts don't fire while you're typing in a box.

## If something goes wrong

**My show is gone.** Make sure you're in the same browser on the same computer you used before. The autosave doesn't follow you to other browsers or devices. If you exported the show, use **Import…** to open that file.

**I made a mistake.** Undo (⌘Z or Ctrl+Z) works for every edit, including deleting performers, importing a show, and starting a new one.

**A student's phone shows an old version.** A share link holds the show as it was when you made it, so send a new one. A hosted link updates itself when the phone opens it while online. If you changed the file online but the phone hasn't caught up, have the student close the show and open it again while connected.

**The browser says it's too old.** Update your browser, or on an iPad, update iPadOS to 16.4 or later.

**FreeFORM hit an error.** The error page has **Download autosaved show**, so you can save your work before you reload. If it keeps happening, please [open an issue](https://github.com/Tillerdawg/Freeform_2/issues) and say what you were doing.

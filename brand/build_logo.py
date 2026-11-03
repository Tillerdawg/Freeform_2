"""Builds the Freeform logo SVGs: the dot curve + "Free" (Parisienne, tuned) + "FORM" (Barlow Semi Condensed Bold),
with the letters converted to paths so the files need no fonts. Usage: python3 build_logo.py <font dir> <out dir>"""
import io, os, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONTS, OUT = sys.argv[1], sys.argv[2]
SCRIPT = os.path.join(FONTS, 'parisienne/files/parisienne-latin-400-normal.woff2')
BLOCK = os.path.join(FONTS, 'barlow-semi-condensed/files/barlow-semi-condensed-latin-700-normal.woff2')

COLORS = {  # from src/ui/palette.ts
    'dark': dict(script='#ffd166', block='#e9f0ea', first='#ffd166', dots='#e9f0ea'),   # for dark backgrounds
    'light': dict(script='#357842', block='#1d2a1f', first='#357842', dots='#1d2a1f'),  # for white paper
}
# The 13 curve dots (two 180° arcs of radius 60, 30° apart, so every step is the same length).
DOTS = [(0, 80), (8, 50), (30, 28), (60, 20), (90, 28), (112, 50), (120, 80), (128, 110), (150, 132), (180, 140), (210, 132), (232, 110), (240, 80)]
FORM_SIZE = 66


def load(path):
    tt = TTFont(path)  # woff2 needs brotli
    buf = io.BytesIO(); tt.flavor = None; tt.save(buf)
    return tt, hb.Font(hb.Face(buf.getvalue()))


def shape(fonts, text, size, x0, baseline, tracking=0.0):
    """Return (svg path d, advance end x, bounds) for text set at size with its baseline at y=baseline."""
    tt, font = fonts
    upem = tt['head'].unitsPerEm; s = size / upem
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    pen = SVGPathPen(gs); bp = BoundsPen(gs); x = x0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        t = (s, 0, 0, -s, x + pos.x_offset * s, baseline - pos.y_offset * s)  # font y is up, SVG y is down
        gs[name].draw(TransformPen(pen, t)); gs[name].draw(TransformPen(bp, t))
        x += pos.x_advance * s + tracking
    return pen.getCommands(), x - tracking, bp.bounds


def lockup(variant, boost, stroke, mark=True):
    """boost: script size relative to the hero; stroke: outline added to "Free", in units where FORM is 66."""
    c = COLORS[variant]; script, block = load(SCRIPT), load(BLOCK)
    cap = block[0]['OS/2'].sCapHeight / block[0]['head'].unitsPerEm * FORM_SIZE
    parts = []; x = 0.0; baseline = 0.0
    if mark:  # curve 150 wide (viewBox 264 wide), centered on FORM's cap height, 20 gap
        k = 150 / 264; cy = baseline - cap / 2
        for i, (dx, dy) in enumerate(DOTS):
            r = (11 if i == 0 else 10) * k
            fill = c['first'] if i == 0 else c['dots']
            parts.append(f'<circle cx="{(dx + 12) * k:.2f}" cy="{cy + (dy - 80) * k:.2f}" r="{r:.2f}" fill="{fill}"/>')
        x = 150 + 20
    d1, x, b1 = shape(script, 'Free', FORM_SIZE * 1.2 * boost, x, baseline)
    parts.append(f'<path d="{d1}" fill="{c["script"]}" stroke="{c["script"]}" stroke-width="{stroke}" stroke-linejoin="round"/>')
    d2, xe, b2 = shape(block, 'FORM', FORM_SIZE, x + 6, baseline, tracking=2)
    parts.append(f'<path d="{d2}" fill="{c["block"]}"/>')
    pad = stroke + 2
    ys = [b1[1], b1[3], b2[1], b2[3]]  # bounds are already in SVG (y-down) space
    y0 = min(ys + ([baseline - cap / 2 - 41] if mark else [])) - pad
    y1 = max(ys + ([baseline - cap / 2 + 41] if mark else [])) + pad
    x1 = max(xe, b2[2]) + pad
    w, h = x1 + pad, y1 - y0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad:.1f} {y0:.1f} {w:.1f} {h:.1f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="Freeform">\n' + '\n'.join(parts) + '\n</svg>\n')


def mark_only(variant):
    c = COLORS[variant]
    dots = '\n'.join(f'<circle cx="{x}" cy="{y}" r="{11 if i == 0 else 10}" fill="{c["first"] if i == 0 else c["dots"]}"/>' for i, (x, y) in enumerate(DOTS))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 8 264 144" width="264" height="144" role="img" aria-label="Freeform">\n{dots}\n</svg>\n'


def monogram(variant, tile=False):
    """FF: Parisienne F in front, its swash roofing a Barlow F. The script's outline (plus a gap) is cut out of the block F
    with a mask, so the gap is see-through on any background. tile=True puts it on a rounded green app-icon square."""
    c = COLORS[variant]; script, block = load(SCRIPT), load(BLOCK)
    d1, adv, b1 = shape(script, 'F', 170, 0, 0)
    d2, _, b2 = shape(block, 'F', 136, adv - 22, 0)
    gap = 9  # knockout width around the script F
    x0, x1 = min(b1[0], b2[0]) - gap, max(b1[2], b2[2]) + gap
    y0, y1 = min(b1[1], b2[1]) - gap, max(b1[3], b2[3]) + gap
    mid = f'ff-ko-{variant}{"-tile" if tile else ""}'
    art = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="{x0:.1f}" y="{y0:.1f}" width="{x1 - x0:.1f}" height="{y1 - y0:.1f}">'
           f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1 - x0:.1f}" height="{y1 - y0:.1f}" fill="white"/>'
           f'<path d="{d1}" fill="black" stroke="black" stroke-width="{gap}" stroke-linejoin="round"/></mask>\n'
           f'<path d="{d2}" fill="{c["block"]}" mask="url(#{mid})"/>\n'
           f'<path d="{d1}" fill="{c["script"]}" stroke="{c["script"]}" stroke-width="1.5" stroke-linejoin="round"/>')
    if not tile:
        w, h = x1 - x0, y1 - y0
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" '
                f'role="img" aria-label="Freeform">\n{art}\n</svg>\n')
    k = 0.74 * 200 / max(x1 - x0, y1 - y0)  # letters fill 74% of the tile, centered on their actual outlines
    tx, ty = 100 - k * (x0 + x1) / 2, 100 - k * (y0 + y1) / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Freeform">\n'
            f'<rect width="200" height="200" rx="44" fill="#357842"/>\n<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.4f})">\n{art}\n</g>\n</svg>\n')


os.makedirs(OUT, exist_ok=True)
open(f'{OUT}/freeform-ff-icon.svg', 'w').write(monogram('dark', tile=True))
for v in COLORS:
    # hero: header size and up. small: toolbar size (~18 px FORM), script 20% bigger and outline heavier, per the finalists board.
    open(f'{OUT}/freeform-logo-{v}.svg', 'w').write(lockup(v, boost=1.0, stroke=0.6))
    open(f'{OUT}/freeform-logo-small-{v}.svg', 'w').write(lockup(v, boost=1.2, stroke=0.45 * FORM_SIZE / 18))
    open(f'{OUT}/freeform-mark-{v}.svg', 'w').write(mark_only(v))
    open(f'{OUT}/freeform-ff-{v}.svg', 'w').write(monogram(v))
print(sorted(os.listdir(OUT)))

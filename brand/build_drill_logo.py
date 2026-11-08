"""Builds the FreeFORM Drill logos (chosen by Jason, 2026-11-08): the main logo (FreeFORM DRILL on one line with the
curve over it), the stacked square for avatars, and the round badge for merch, plus a one-line version for the editor's top bar. Same fonts, tuning, and colors as
build_logo.py, with letters converted to outlines. Usage: python3 build_drill_logo.py <font dir> <out dir>
(the font dir is node_modules/@fontsource, as for build_logo.py)."""
import io, math, os, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONTS, OUT = sys.argv[1], sys.argv[2]
F = lambda fam, w: os.path.join(FONTS, f'{fam}/files/{fam}-latin-{w}-normal.woff2')

COLORS = {  # brand colors from src/ui/palette.ts
    'dark': dict(bg='#1d2a1f', script='#ffd166', block='#e9f0ea', first='#ffd166', dots='#e9f0ea', drill='#e9f0ea',
                 quiet='#a9c2ae', plate='#e9f0ea', on_plate='#1d2a1f', rule='#e9f0ea'),
    'light': dict(bg='#ffffff', script='#357842', block='#1d2a1f', first='#357842', dots='#1d2a1f', drill='#1d2a1f',
                  quiet='#4c6352', plate='#1d2a1f', on_plate='#ffffff', rule='#1d2a1f'),
}
DOTS = [(0, 80), (8, 50), (30, 28), (60, 20), (90, 28), (112, 50), (120, 80), (128, 110), (150, 132), (180, 140), (210, 132), (232, 110), (240, 80)]
FORM_SIZE = 66
_cache = {}


def load(path):
    if path not in _cache:
        tt = TTFont(path); buf = io.BytesIO(); tt.flavor = None; tt.save(buf)
        _cache[path] = (tt, hb.Font(hb.Face(buf.getvalue())))
    return _cache[path]


SCRIPT = lambda: load(F('parisienne', 400))
BLOCK = lambda w=700: load(F('barlow-semi-condensed', w))


def cap_h(fonts, size):
    tt = fonts[0]; return tt['OS/2'].sCapHeight / tt['head'].unitsPerEm * size


def glyphs(fonts, text, size, tracking=0.0):
    """[(glyph name, x offset from start)] and total advance."""
    tt, font = fonts; s = size / tt['head'].unitsPerEm
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': True})
    order = tt.getGlyphOrder(); out = []; x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append((order[info.codepoint], x + pos.x_offset * s, pos.x_advance * s)); x += pos.x_advance * s + tracking
    return out, x - tracking


def text(fonts, txt, size, x0, baseline, tracking=0.0):
    """(path d, bounds (x0,y0,x1,y1) in SVG space, advance end x)."""
    tt = fonts[0]; s = size / tt['head'].unitsPerEm; gs = tt.getGlyphSet()
    pen = SVGPathPen(gs); bp = BoundsPen(gs); gl, adv = glyphs(fonts, txt, size, tracking)
    for name, gx, _ in gl:
        t = (s, 0, 0, -s, x0 + gx, baseline)
        gs[name].draw(TransformPen(pen, t)); gs[name].draw(TransformPen(bp, t))
    return pen.getCommands(), bp.bounds, x0 + adv


def width_of(fonts, txt, size, tracking=0.0):
    return text(fonts, txt, size, 0, 0, tracking)[1]


def track_to(fonts, txt, size, target):
    """tracking so the ink of txt spans target width."""
    b = width_of(fonts, txt, size); return (target - (b[2] - b[0])) / max(1, len(txt) - 1)


class Art:
    def __init__(self, variant):
        self.c = COLORS[variant]; self.v = variant; self.parts = []; self.box = None; self.defs = []

    def add(self, el, b):
        self.parts.append(el)
        if b: self.box = b if not self.box else (min(self.box[0], b[0]), min(self.box[1], b[1]), max(self.box[2], b[2]), max(self.box[3], b[3]))

    def txt(self, fonts, s, size, x, base, fill, tracking=0, stroke=0):
        d, b, end = text(fonts, s, size, x, base, tracking)
        st = f' stroke="{fill}" stroke-width="{stroke:.2f}" stroke-linejoin="round"' if stroke else ''
        self.add(f'<path d="{d}" fill="{fill}"{st}/>', (b[0] - stroke / 2, b[1] - stroke / 2, b[2] + stroke / 2, b[3] + stroke / 2))
        return b, end

    def curve(self, x, cy, width, r_scale=1.0):
        """The 13-dot curve, `width` wide (viewBox 264 incl. dot radii), left at x, vertically centered on cy."""
        k = width / 264
        for i, (dx, dy) in enumerate(DOTS):
            r = (11 if i == 0 else 10) * k * r_scale
            fill = self.c['first'] if i == 0 else self.c['dots']
            cx, cyy = x + (dx + 12) * k, cy + (dy - 80) * k
            self.add(f'<circle cx="{cx:.2f}" cy="{cyy:.2f}" r="{r:.2f}" fill="{fill}"/>', (cx - r, cyy - r, cx + r, cyy + r))
        return (x, cy - 72 * k, x + width, cy + 72 * k)

    def svg(self, pad=6, label='FreeFORM Drill', square=False, bg_rect=None):
        x0, y0, x1, y1 = self.box; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
        if square:
            w, h = x1 - x0, y1 - y0; m = max(w, h); x0 -= (m - w) / 2; y0 -= (m - h) / 2; x1, y1 = x0 + m, y0 + m
        w, h = x1 - x0, y1 - y0
        bg = bg_rect(x0, y0, w, h) if bg_rect else ''
        defs = f'<defs>{"".join(self.defs)}</defs>\n' if self.defs else ''
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" '
                f'role="img" aria-label="{label}">\n{defs}{bg}' + '\n'.join(self.parts) + '\n</svg>\n')


def wordmark(a, x, base, boost=1.0, stroke=0.6, form_size=FORM_SIZE):
    """FreeFORM exactly as brand/build_logo.py sets it (scaled by form_size/66). Returns (free bounds, FORM bounds)."""
    k = form_size / FORM_SIZE
    b1, end = a.txt(SCRIPT(), 'Free', form_size * 1.2 * boost, x, base, a.c['script'], stroke=stroke * k * 2)
    b2, _ = a.txt(BLOCK(), 'FORM', form_size, end + 6 * k, base, a.c['block'], tracking=2 * k)
    return b1, b2


CAP = cap_h(BLOCK(), FORM_SIZE)


# ---------------------------------------------------------------- concepts








def c05_stacked(v):
    """Square avatar: curve on top, FreeFORM, DRILL tracked to the wordmark width, on a field (or white) tile."""
    a = Art(v); b1, bf = wordmark(a, 0, 0)
    x0, x1 = b1[0], bf[2]; mid = (x0 + x1) / 2
    cw = 170; a.curve(mid - cw / 2, min(b1[1], bf[1]) - 22 - 72 * cw / 264, cw)
    size = 40; ch = cap_h(BLOCK(), size); base = 22 + ch
    tr = track_to(BLOCK(600), 'DRILL', size, (x1 - x0) * 0.5)
    db = width_of(BLOCK(600), 'DRILL', size, tracking=tr)
    a.txt(BLOCK(600), 'DRILL', size, mid - (db[2] - db[0]) / 2 - db[0], base, a.c['drill'], tracking=tr)
    bg = a.c['bg']
    return a.svg(pad=34, square=True, bg_rect=lambda x, y, w, h: f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{w * 0.12:.1f}" fill="{bg}"/>\n')






def arc_text(a, fonts, s, size, cx, cy, radius, center_deg, fill, tracking=0, bottom=False):
    """Set s along a circle. top: reads clockwise over the top; bottom: reads left-to-right along the bottom (upright)."""
    tt = fonts[0]; k = size / tt['head'].unitsPerEm; gs = tt.getGlyphSet()
    gl, adv = glyphs(fonts, s, size, tracking); ch = cap_h(fonts, size)
    r_base = radius - ch / 2 if not bottom else radius + ch / 2  # put cap-height middle on the radius
    total = adv / r_base; paths = []
    for name, gx, ga in gl:
        mid = gx + ga / 2; ang = center_deg + math.degrees((mid - adv / 2) / r_base) * (-1 if bottom else 1)
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (k, 0, 0, -k, -ga / 2, 0)))  # glyph centered on x=0, baseline y=0
        rot = ang if not bottom else ang - 180
        th = math.radians(ang - 90)
        px, py = cx + r_base * math.cos(th), cy + r_base * math.sin(th)
        paths.append(f'<path transform="translate({px:.2f} {py:.2f}) rotate({rot:.2f})" d="{pen.getCommands()}"/>')
    a.add(f'<g fill="{fill}">' + ''.join(paths) + '</g>', None)


def c08_badge(v):
    """Round emblem for shirts and dot-book covers: ring with the tagline over the top and the URL along the bottom, on a filled disc so it reads on any background."""
    a = Art(v); fs = 50
    b1, bf = wordmark(a, 0, 0, form_size=fs, boost=1.0, stroke=0.7)
    x0, x1 = b1[0], bf[2]; mid = (x0 + x1) / 2
    ch = cap_h(BLOCK(), 26)
    db = width_of(BLOCK(600), 'DRILL', 26, tracking=10)
    a.txt(BLOCK(600), 'DRILL', 26, mid - (db[2] - db[0]) / 2 - db[0], 18 + ch, a.c['drill'], tracking=10)
    cw = 120; a.curve(mid - cw / 2, min(b1[1], bf[1]) - 16 - 72 * cw / 264, cw)
    cy = (a.box[1] + a.box[3]) / 2; R = 200
    ring = a.c['block']
    a.parts.insert(0, f'<circle cx="{mid:.2f}" cy="{cy:.2f}" r="{R}" fill="{a.c["bg"]}" stroke="{ring}" stroke-width="8"/>'
                      f'<circle cx="{mid:.2f}" cy="{cy:.2f}" r="{R - 52}" fill="none" stroke="{ring}" stroke-width="3"/>')
    a.add('', (mid - R - 4, cy - R - 4, mid + R + 4, cy + R + 4))
    band = R - 26
    arc_text(a, BLOCK(600), 'DRILL, WITHOUT THE BILL.', 24, mid, cy, band, 0, a.c['script'], tracking=3)
    arc_text(a, BLOCK(600), 'FREEFORMDRILL.ORG', 24, mid, cy, band, 180, a.c['block'], tracking=4, bottom=True)
    for ang in (90, 270):  # gold step dots between the two arcs
        th = math.radians(ang - 90); px, py = mid + band * math.cos(th), cy + band * math.sin(th)
        a.add(f'<circle cx="{px:.2f}" cy="{py:.2f}" r="6" fill="{a.c["first"]}"/>', None)
    return a.svg(pad=2)


def one_line(a):
    """FreeFORM DRILL on one baseline (DRILL in Barlow Medium, so FreeFORM still leads). Returns (x0, top, x1, bottom)."""
    b1, bf = wordmark(a, 0, 0)
    db, _ = a.txt(BLOCK(500), 'DRILL', FORM_SIZE, bf[2] + 22, 0, a.c['drill'], tracking=3)
    return b1[0], min(b1[1], bf[1], db[1]), db[2], max(b1[3], bf[3], db[3])


def c09_curve_over(v):
    """One line, with the curve centered above it."""
    a = Art(v); x0, top, x1, _ = one_line(a); mid = (x0 + x1) / 2
    cw = 200; a.curve(mid - cw / 2, top - 26 - 72 * cw / 264, cw)
    return a.svg(pad=10)





def small_line(v):
    """The editor's top bar (24 to 30 px tall): the curve with fatter dots, FreeFORM with the small-logo tuning, then DRILL."""
    a = Art(v); a.curve(0, -CAP / 2, 96, r_scale=1.25)
    _, bf = wordmark(a, 112, 0, boost=1.2, stroke=0.45 * FORM_SIZE / 18)
    a.txt(BLOCK(500), 'DRILL', FORM_SIZE, bf[2] + 22, 0, a.c['drill'], tracking=3)
    return a.svg()

LOGOS = {'freeform-drill-logo': c09_curve_over, 'freeform-drill-stacked': c05_stacked, 'freeform-drill-badge': c08_badge, 'freeform-drill-logo-small': small_line}
os.makedirs(OUT, exist_ok=True)
for name, make in LOGOS.items():
    for v in COLORS:
        open(f'{OUT}/{name}-{v}.svg', 'w').write(make(v))
print('built', list(LOGOS))

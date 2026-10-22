"""Décalque du vrai plan de rez-de-chaussée de l'Adidas Arena (NP2F, publié par Architectural Review, juin 2024).

Le PDF est vectoriel : les murs y sont des surfaces pleines (poché). On les rasterise à 10 px/m, on les découpe en
rectangles, puis on les cale sur l'emprise OpenStreetMap (bord ouest et façade sud, rotation lue sur OSM).
Le PDF est téléchargé dans data/ (jamais commité : dessin sous droits d'auteur, usage de référence interne).
Sortie : un dict fusionné dans scene.json par build_scene.py sous la clé 'reel'.
Ce qui n'est pas sur le plan (étages, balcons, parking) est construit par paramètres et marqué e=1 (« estimé »).
"""
import math, os, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PDF_URL = 'https://cdn.ca.emap.com/wp-content/uploads/sites/12/2024/06/np2f_drawings_ar_3.pdf'
PDF = os.path.join(HERE, 'data', 'np2f_plan.pdf')

PT_PER_M = 22.2 / 10           # barre d'échelle du PDF (10 m = 22,2 pt)
R = 10                         # px par mètre « plan » pour la rasterisation
CLIP = (95, 395, 380, 612)     # zone du plan de RDC sur la page (pt)
# Calage sur OSM (way 861084938) : bord ouest du bâtiment et façade sud ; échelle ajustée sur la largeur est-ouest OSM
PX_W, PX_S, PX_E = 208, 945, 1235           # bords ouest, sud, est du bâtiment sur le raster
OSM_W, OSM_S, OSM_E = -61.1, 55.5, 66.6     # mêmes bords dans le repère de la scène (m)
S = (OSM_E - OSM_W) / (PX_E - PX_W)         # m par px raster (≈ 0,124 ; le terrain de basket mesure alors ≈ 30 x 16 m)
THETA = math.atan2(-3.7, 124.2)              # rotation de la façade sud lue sur OSM


def to_scene(px, py):
    dx, dz = (px - PX_W) * S, (py - PX_S) * S
    c, s = math.cos(THETA), math.sin(THETA)
    return round(OSM_W + dx * c - dz * s, 2), round(OSM_S + dx * s + dz * c, 2)


def quad(x0, y0, x1, y1):
    out = []
    for px, py in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)):
        out += to_scene(px, py)
    return out


def poly(points):
    out = []
    for px, py in points:
        out += to_scene(px, py)
    return out


def rasterise_walls():
    import pymupdf
    from PIL import Image, ImageDraw
    if not os.path.exists(PDF):
        os.makedirs(os.path.dirname(PDF), exist_ok=True)
        req = urllib.request.Request(PDF_URL, headers={'User-Agent': 'hack-accel-maquette/1.0'})
        open(PDF, 'wb').write(urllib.request.urlopen(req, timeout=60).read())
    page = pymupdf.open(PDF)[0]
    X0, Y0, X1, Y1 = CLIP
    W, H = int((X1 - X0) / PT_PER_M * R), int((Y1 - Y0) / PT_PER_M * R)
    tf = lambda p: ((p.x - X0) / PT_PER_M * R, (p.y - Y0) / PT_PER_M * R)

    def pts(it):
        t = it[0]
        if t == 'l': return [it[1], it[2]]
        if t == 'c':
            a, b, c, d = [np.array(q) for q in it[1:5]]
            return [pymupdf.Point(*((1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d)) for u in np.linspace(0, 1, 8)]
        if t == 're': r = it[1]; return [r.tl, r.tr, r.br, r.bl, r.tl]
        if t == 'qu': q = it[1]; return [q.ul, q.ur, q.lr, q.ll, q.ul]
        return []

    mask = np.zeros((H, W), bool)
    for d in page.get_drawings():
        r = d['rect']
        if not (r.y0 >= Y0 - 1 and r.y1 <= Y1 and r.x0 >= X0 - 1 and r.x1 <= X1): continue
        if not (d.get('fill') and round(d['fill'][0], 2) == 0.14): continue
        acc = np.zeros((H, W), bool); cur = []
        subs = []
        for it in d['items']:
            ps = [tf(q) for q in pts(it)]
            if not ps: continue
            if cur and math.hypot(cur[-1][0] - ps[0][0], cur[-1][1] - ps[0][1]) > .5: subs.append(cur); cur = []
            cur += ps
        if cur: subs.append(cur)
        for sp in subs:
            if len(sp) >= 3:
                im = Image.new('1', (W, H), 0); ImageDraw.Draw(im).polygon(sp, fill=1); acc ^= np.array(im)
        mask |= acc
    # garder seulement l'intérieur du bâtiment (exclut arbres, voitures, mobilier urbain du plan)
    keep = np.zeros_like(mask); keep[175:952, PX_W - 4:PX_E + 6] = True
    return mask & keep


def rectangles(mask):
    """Découpe le masque en rectangles : runs par ligne, fusionnés verticalement quand ils sont identiques."""
    H, W = mask.shape; open_runs = {}; out = []
    for y in range(H + 1):
        runs = set()
        if y < H:
            row = mask[y]; x = 0
            while x < W:
                if row[x]:
                    x0 = x
                    while x < W and row[x]: x += 1
                    runs.add((x0, x))
                else:
                    x += 1
        for k in list(open_runs):
            if k not in runs:
                y0 = open_runs.pop(k)
                if (k[1] - k[0]) * (y - y0) >= 3: out.append((k[0], y0, k[1], y))
        for k in runs:
            open_runs.setdefault(k, y)
    return out


def tribune(name, inner, outer, rows, y0, rise, level, places):
    return {'n': name, 'l': level, 'inner': poly(inner), 'outer': poly(outer), 'rows': rows, 'y0': y0, 'rise': rise, 'places': places}


def build():
    mask = rasterise_walls()
    rects = rectangles(mask)
    reel = {'source': 'NP2F, plan de RDC (Architectural Review, juin 2024), calé sur OSM', 'echelle_m_par_px': round(S, 4),
            'murs': [quad(*r) for r in rects], 'hauteur_rdc': 5.5}
    # Sols lus sur le plan (px du raster) : aire de jeu, terrain de basket, gymnase
    reel['aire'] = quad(482, 362, 700, 668)
    reel['basket'] = quad(515, 395, 645, 640)
    reel['gymnase'] = quad(1022, 430, 1228, 808)
    reel['emprise_salle'] = poly([(430, 245), (745, 245), (745, 790), (430, 790)])
    # Tribunes basses lues sur le plan : nord et sud en éventail, est et ouest étroites (niveau 0 → 1)
    reel['tribunes'] = [
        tribune('Gradins nord (A à E)', [(470, 345), (705, 345)], [(425, 262), (750, 262)], 14, .6, .42, 1, 0),
        tribune('Gradins sud (H à M)', [(705, 685), (470, 685)], [(750, 778), (425, 778)], 14, .6, .42, 1, 0),
        tribune('Gradins ouest (N, O, W)', [(478, 690), (478, 340)], [(440, 690), (440, 340)], 5, .6, .45, 1, 0),
        tribune('Gradins est (F, G)', [(688, 345), (688, 690)], [(722, 345), (722, 690)], 5, .6, .45, 1, 0),
        # Gradins métalliques mobiles autour de l'aire (règlement intérieur), entre les lignes du terrain et le bord de l'aire
        tribune('Gradins mobiles est (estimé)', [(650, 395), (650, 640)], [(684, 395), (684, 640)], 6, .3, .3, 0, 0),
        tribune('Gradins mobiles ouest (estimé)', [(510, 640), (510, 395)], [(484, 640), (484, 395)], 4, .3, .3, 0, 0),
        # Balcons (étage haut) au-dessus du socle : estimés d'après la coupe AA, en porte-à-faux derrière les gradins
        tribune('Balcon nord (estimé)', [(425, 258), (750, 258)], [(395, 180), (780, 180)], 12, 7.5, .55, 2, 0),
        tribune('Balcon sud (estimé)', [(750, 782), (425, 782)], [(780, 860), (395, 860)], 12, 7.5, .55, 2, 0),
        tribune('Balcon ouest (estimé)', [(436, 700), (436, 330)], [(372, 740), (372, 290)], 10, 7.5, .55, 2, 0),
        tribune('Balcon est (estimé)', [(726, 330), (726, 700)], [(790, 290), (790, 740)], 10, 7.5, .55, 2, 0),
    ]
    for t in reel['tribunes']:
        if '(estimé)' in t['n']: t['e'] = 1
        # places : longueur moyenne des rangs / 0,5 m par siège, moins 10 % d'escaliers
        ix, iz = t['inner'][0::2], t['inner'][1::2]; ox, oz = t['outer'][0::2], t['outer'][1::2]
        Li = math.hypot(ix[1] - ix[0], iz[1] - iz[0]); Lo = math.hypot(ox[1] - ox[0], oz[1] - oz[0])
        t['places'] = int(t['rows'] * (Li + Lo) / 2 / .5 * .9)
    # Vomitoires en diagonale aux 4 angles (lus sur le plan) : axe de passage
    reel['vomitoires'] = [{'n': n, 'p': poly(p), 'w': 3.5} for n, p in (
        ('Vomitoire nord-ouest', [(470, 345), (395, 280)]), ('Vomitoire nord-est', [(705, 345), (775, 275)]),
        ('Vomitoire sud-ouest', [(470, 685), (425, 735)]), ('Vomitoire sud-est', [(705, 685), (745, 735)]))]
    # Entrée publique unique (FAQ adidasarena : angle av. de la Porte de la Chapelle et bd des Maréchaux) = angle sud-ouest
    reel['entree'] = {'n': 'Entrée publique (angle sud-ouest)', 'p': poly([(210, 945), (420, 945)]), 'w': 20}
    # Socle et volumes hauts (coupe AA, recherche) : terrasse à 11,5 m, volume aluminium jusqu'à ≈ 26 m, toit végétalisé
    reel['terrasse_y'], reel['haut_y'], reel['parking_y'] = 11.5, 26.0, -3.6
    reel['volume_haut'] = poly([(300, 215), (1180, 215), (1180, 905), (300, 905)])
    reel['parking'] = poly([(300, 300), (980, 300), (980, 880), (300, 880)])
    return reel


if __name__ == '__main__':
    r = build()
    print('murs', len(r['murs']), 'tribunes', [(t['n'], t['places']) for t in r['tribunes']], 'total', sum(t['places'] for t in r['tribunes']))

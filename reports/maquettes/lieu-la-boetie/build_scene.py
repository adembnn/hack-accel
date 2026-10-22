"""Construit scene.json pour la vue 3D du 5 rue La Boétie (Metafore, Paris 8e).
Repère : origine = point adresse (48.874291, 2.318655), x vers l'est, z vers le sud, y vers le haut ; niveau n -> altitude n * ETAGE.
Entrées (lecture seule, déjà téléchargées) : DATA_DIR/scene-metafore.json (emprises BD TOPO + OSM déjà converties en mètres),
DATA_DIR/osm_mobilier.json (arbres, bancs ; format Overpass `out geom`). Aucun téléchargement.
Sortie : scene.json (< 1 Mo). Les intérieurs sont ESTIMÉS (aucun plan relevé)."""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get('DATA_DIR') or (sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'data'))
if not os.path.exists(os.path.join(DATA, 'scene-metafore.json')):
    DATA = r'C:\Users\detot\Documents\HACK\refuge-data\data\metafore'
LAT0, LON0 = 48.874291, 2.318655
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110540
ETAGE = 3.2
NIV = 6
RAYON = 250
SRC = json.load(open(os.path.join(DATA, 'scene-metafore.json'), encoding='utf-8'))


def xy(lat, lon):
    return round((lon - LON0) * KX, 2), round((LAT0 - lat) * KZ, 2)


def pip(x, z, p):
    c = False
    n = len(p) // 2
    for i in range(n):
        j = (i - 1) % n
        xi, zi, xj, zj = p[2 * i], p[2 * i + 1], p[2 * j], p[2 * j + 1]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            c = not c
    return c


def centre(p):
    return sum(p[0::2]) / (len(p) // 2), sum(p[1::2]) / (len(p) // 2)


scene = {'origine': [LAT0, LON0], 'etage': ETAGE, 'rayon_m': RAYON, 'lieu': 'Metafore Boétie, 5 rue La Boétie, 75008 Paris',
         'batiments': [], 'interieur': [], 'cloisons': [], 'escalators': [], 'escaliers': [], 'ascenseurs': [], 'portes': [],
         'quais': [], 'metro': [], 'incendie': [], 'arbres': [], 'bancs': [], 'bornes': [], 'velib': [], 'rues': [], 'pietons': [],
         'verts': [], 'eau': []}

# Bâtiments : emprises BD TOPO / OSM, bâtiment cible = celui qui contient le point adresse
cible = None
for b in SRC['batiments']:
    cx, cz = centre(b['p'])
    if math.hypot(cx, cz) > RAYON + 40:
        continue
    o = {'h': b['h'], 'b': b.get('b', 0), 'n': b.get('n', ''), 'k': b.get('k', ''), 'p': b['p']}
    if pip(0, 0, b['p']):
        o['cible'] = True
        cible = o
    scene['batiments'].append(o)
assert cible, 'bâtiment cible introuvable'
P = cible['p']
hm = SRC['lieu']['batiment_cible']
cible['h_bdtopo'] = hm['bdtopo_hauteur_m']
cible['niveaux'] = NIV
cible['h'] = round(NIV * ETAGE, 1)  # volume estimé : 6 niveaux x 3,2 m ; la hauteur BD TOPO mesurée reste dans h_bdtopo

# Intérieur ESTIMÉ : dalle par niveau, cage (escalier + ascenseur), palier, cloisons de refend, couloir d'entrée depuis le porche
E = hm['cage_estimee']
CX, CZ = round(E['x'], 1), round(E['z'], 1)
PORCHE = [-0.2, -1.0]  # point adresse projeté sur la façade
for l in range(NIV):
    scene['interieur'].append({'k': 'area', 'l': [l], 'n': 'niveau %d (intérieur estimé)' % l, 'p': P, 'estime': True})


def couloir(x0, z0, x1, z1, w):
    dx, dz = x1 - x0, z1 - z0
    L = math.hypot(dx, dz) or 1
    nx, nz = -dz / L * w / 2, dx / L * w / 2
    return [round(v, 2) for v in (x0 + nx, z0 + nz, x1 + nx, z1 + nz, x1 - nx, z1 - nz, x0 - nx, z0 - nz)]


scene['interieur'].append({'k': 'corridor', 'l': [0], 'n': 'porche et hall du n°5 (intérieur estimé)',
                           'p': couloir(PORCHE[0], PORCHE[1] + 0.2, CX - 1.0, CZ, 2.4), 'estime': True})
for l in range(1, NIV):
    scene['interieur'].append({'k': 'corridor', 'l': [l], 'n': 'palier de desserte (intérieur estimé)',
                               'p': couloir(CX - 1.0, CZ - 2.0, CX + 0.5, CZ + 17.0, 1.8), 'estime': True})


def scan(z):
    xs = []
    n = len(P) // 2
    for i in range(n):
        x1, z1, x2, z2 = P[2 * i], P[2 * i + 1], P[(2 * i + 2) % len(P)], P[(2 * i + 3) % len(P)]
        if (z1 > z) != (z2 > z):
            xs.append(x1 + (z - z1) * (x2 - x1) / (z2 - z1))
    return sorted(xs)


segs = []
for z in (9.5, 14.0, 18.5, 23.0):
    xs = scan(z)
    if len(xs) < 2:
        continue
    a, b = xs[0], xs[-1]
    px = CX + 2.0  # passage vers le palier
    for (s, e) in ((a + 0.15, px - 1.2), (px + 1.2, b - 0.15)):
        if e - s > 1.5:
            segs.append([round(s, 2), z, round(e, 2), z])
segs.append([round(CX + 3.4, 2), 11.0, round(CX + 3.4, 2), 24.0])
for l in range(NIV):
    scene['cloisons'].append({'l': [l], 'estime': True, 'segs': segs})

for l in range(NIV - 1):
    scene['escaliers'].append({'id': 'ESC-EST-%d' % l, 'l': [l, l + 1], 'n': 'escalier principal estimé', 'x': CX - 1.2, 'z': CZ,
                               'p': [CX - 1.8, CZ - 1.3, CX - 0.6, CZ - 1.3, CX - 0.6, CZ + 1.3, CX - 1.8, CZ + 1.3],
                               'largeur_m': 1.2, 'estime': True})
scene['ascenseurs'].append({'id': 'ASC-EST-1', 'l': [0, NIV - 1], 'n': 'ascenseur estimé', 'x': CX + 0.9, 'z': CZ, 'estime': True})
scene['portes'].append({'id': 'P-EST-ADRESSE', 'x': PORCHE[0], 'z': PORCHE[1], 'l': [0], 'k': 'main',
                        'n': 'porche du n°5 (entrée estimée : point adresse BAN projeté sur la façade)', 'largeur_m': 1.8, 'estime': True})

for r in SRC['rues']:
    pts = list(zip(r['p'][0::2], r['p'][1::2]))
    if any(math.hypot(x, z) <= RAYON + 30 for x, z in pts):
        scene['rues'].append({'k': r['k'], 'n': r.get('n', ''), 'p': r['p']})
for r in SRC.get('pietons', []):
    scene['pietons'].append({'n': r.get('n', ''), 'p': r['p']})

try:
    for e in json.load(open(os.path.join(DATA, 'osm_mobilier.json'), encoding='utf-8'))['elements']:
        t = e.get('tags', {})
        if e['type'] != 'node':
            continue
        x, z = xy(e['lat'], e['lon'])
        if math.hypot(x, z) > RAYON + 30:
            continue
        if t.get('natural') == 'tree':
            scene['arbres'].append([x, z])
        elif t.get('amenity') == 'bench':
            scene['bancs'].append([x, z])
        elif t.get('amenity') == 'bicycle_parking' or t.get('highway') == 'bus_stop':
            scene['bornes'].append([x, z])
except FileNotFoundError:
    print('osm_mobilier.json absent : pas de mobilier')

json.dump(scene, open(os.path.join(HERE, 'scene.json'), 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print({k: len(v) for k, v in scene.items() if isinstance(v, list)})
print('taille scene.json :', os.path.getsize(os.path.join(HERE, 'scene.json')), 'octets')

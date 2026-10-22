"""Grille praticable du Forum (1 m) par niveau, à partir de scene.json (OSM) : zones où l'on marche, liens verticaux
(escaliers, escalators), sorties (portes nommées, quais). Écrit navgrid.json et un rapport de connexité."""
import json, os, base64, collections, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(HERE, 'scene.json'), encoding='utf-8'))
X0, X1, Z0, Z1, RES = -330, 300, -170, 330, 1.0
W, H = int((X1 - X0) / RES), int((Z1 - Z0) / RES)
LEVELS = [0, -1, -2, -3, -4, -5]
LI = {l: i for i, l in enumerate(LEVELS)}


def pairs(p):
    pts = [(p[i], p[i + 1]) for i in range(0, len(p), 2)]
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    return pts


def lvl_list(ls):
    out = set()
    for v in ls:
        r = int(math.floor(v + 0.25)) if v < 0 else int(round(v))
        if -5 <= r <= 0:
            out.add(r)
    return sorted(out)


def fill(mask, pts):
    """Remplissage par lignes de balayage d'un polygone (coordonnées en mètres) dans un masque W×H."""
    if len(pts) < 3:
        return
    gx = [(x - X0) / RES for x, _ in pts]
    gz = [(z - Z0) / RES for _, z in pts]
    zmin, zmax = max(0, int(math.floor(min(gz)))), min(H - 1, int(math.ceil(max(gz))))
    n = len(pts)
    for row in range(zmin, zmax + 1):
        yc = row + 0.5
        xs = []
        for i in range(n):
            x1, y1, x2, y2 = gx[i], gz[i], gx[(i + 1) % n], gz[(i + 1) % n]
            if (y1 <= yc < y2) or (y2 <= yc < y1):
                xs.append(x1 + (yc - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for a, b in zip(xs[0::2], xs[1::2]):
            c0, c1 = max(0, int(math.ceil(a - 0.5))), min(W - 1, int(math.floor(b - 0.5)))
            if c1 >= c0:
                mask[row, c0:c1 + 1] = True


walk = np.zeros((len(LEVELS), H, W), bool)
wall = np.zeros((len(LEVELS), H, W), bool)
# fl (kind) : le sol dessiné (source de vérité unique : la page dessine ces cases, la simulation ne marche que sur elles)
# 0 aucun, 1 zone, 2 couloir, 3 local/boutique, 4 quai, 5 passage estimé
fl = np.zeros((len(LEVELS), H, W), np.uint8)
KORDER = {'area': 1, 'yes': 1, 'corridor': 2, 'room': 3}
polys = []
for o in S['interieur']:
    ls = lvl_list(o['l'])
    if not ls:
        continue
    pts = pairs(o['p'])
    if not pts or max(abs(x) for x, _ in pts) > 2000:
        continue
    polys.append((o, ls, pts))
for want in (1, 2, 3):  # ordre de dessin : zone < couloir < local (le dernier gagne)
    for o, ls, pts in polys:
        if KORDER.get(o['k']) == want:
            for l in ls:
                m = np.zeros((H, W), bool)
                fill(m, pts)
                fl[LI[l]][m] = want
for o, ls, pts in polys:
    if o['k'] == 'wall':
        for l in ls:
            fill(wall[LI[l]], pts)
for q in S['quais']:
    for l in lvl_list(q['l']):
        m = np.zeros((H, W), bool)
        fill(m, pairs(q['p']))
        fl[LI[l]][m] = 4

# recoudre les polygones voisins : fermeture (dilatation puis érosion d'une case) ; une case ajoutée prend le type voisin
def dilate(m):
    d = m.copy()
    d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
    return d
def erode(m):
    return ~dilate(~m)
for i in range(len(LEVELS)):
    k0 = fl[i]
    cl = erode(dilate(k0 > 0)) & ~(k0 > 0)
    if cl.any():
        # type voisin dominant (max sur le voisinage 4)
        nb = np.zeros_like(k0)
        nb[1:, :] = np.maximum(nb[1:, :], k0[:-1, :]); nb[:-1, :] = np.maximum(nb[:-1, :], k0[1:, :])
        nb[:, 1:] = np.maximum(nb[:, 1:], k0[:, :-1]); nb[:, :-1] = np.maximum(nb[:, :-1], k0[:, 1:])
        for _ in range(2):
            nb2 = nb.copy()
            nb2[1:, :] = np.maximum(nb2[1:, :], nb[:-1, :]); nb2[:-1, :] = np.maximum(nb2[:-1, :], nb[1:, :])
            nb2[:, 1:] = np.maximum(nb2[:, 1:], nb[:, :-1]); nb2[:, :-1] = np.maximum(nb2[:, :-1], nb[:, 1:])
            nb = np.where(nb > 0, nb, nb2)
        k0[cl] = np.where(nb[cl] > 0, nb[cl], 2)
    walk[i] = (k0 > 0) & ~wall[i]


def cell(x, z):
    return int((z - Z0) / RES), int((x - X0) / RES)


# ---- boutiques : fermées sauf par une ouverture réelle ------------------------------------------------------------------
# Une boutique (room) est entourée d'une façade d'une case ; on n'y entre que par une porte OSM (à 2 m au plus de la façade) ou, faute de
# porte, par une largeur de vitrine ouverte (3 m) du côté d'un espace praticable voisin (galerie, zone, quai). Sans ouverture : fermée
# (non praticable). Le cinéma UGC (et ses salles) reste praticable tel quel (ses issues ne sont pas dans OSM).
def pip(px, pz, pts):
    c = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, zi = pts[i]; xj, zj = pts[j]
        if (zi > pz) != (zj > pz) and px < (xj - xi) * (pz - zi) / (zj - zi) + xi:
            c = not c
        j = i
    return c
ugc_polys = [pairs(o['p']) for o in S['interieur'] if (o.get('n') or '').strip() == 'UGC']
def is_ugc(pts):
    cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
    return any(pip(cx, cz, u) for u in ugc_polys)
GAP_R = 1.5          # rayon d'une ouverture : ~3 m de large
room_polys = []
open_doors = []      # pour le dessin des façades : {l, x, z, r, room, src}
shops = {'total': 0, 'ugc': 0, 'ouvertes_osm': 0, 'ouvertes_vitrine': 0, 'fermees': 0}
doors_all = [d for d in S['portes'] if d.get('k') not in ('no', 'garage')]
def seg_dist(px, pz, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    L2 = dx * dx + dz * dz or 1e-9
    t = max(0, min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L2))
    return math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t)
cc_x = lambda c: X0 + (c + 0.5) * RES
cc_z = lambda r: Z0 + (r + 0.5) * RES
for ri, o in enumerate(S['interieur']):
    if o['k'] != 'room':
        continue
    ls = lvl_list(o['l'])
    pts = pairs(o['p'])
    if not ls or len(pts) < 3 or max(abs(x) for x, _ in pts) > 2000:
        continue
    for l in ls:
        i = LI[l]
        shops['total'] += 1
        if is_ugc(pts) or (o.get('n') or '').strip() == 'UGC':
            shops['ugc'] += 1
            continue
        room_polys.append((ri, l, pts))
        m = np.zeros((H, W), bool)
        fill(m, pts)
        m &= (fl[i] == 3)                       # là où le local est effectivement le sol dessiné
        if not m.any():
            continue
        # façade : toutes les cases que la ligne de façade traverse (une personne dans une de ces cases pourrait franchir la ligne)
        band = np.zeros((H, W), bool)
        for k in range(len(pts)):
            a_, b_ = pts[k], pts[(k + 1) % len(pts)]
            n_ = max(1, int(math.hypot(b_[0] - a_[0], b_[1] - a_[1]) / 0.2))
            for q in range(n_ + 1):
                r_, c_ = cell(a_[0] + (b_[0] - a_[0]) * q / n_, a_[1] + (b_[1] - a_[1]) * q / n_)
                if 0 <= r_ < H and 0 <= c_ < W:
                    band[r_, c_] = True
        band &= (fl[i] > 0)
        nb = dilate(m) & ~m & (fl[i] > 0)       # espaces voisins sur lesquels une vitrine peut s'ouvrir
        cand = band & dilate(nb)
        opened = []
        # (a) portes OSM
        for d in doors_all:
            dl = lvl_list(d['l'])
            if dl and l not in dl:
                continue
            if min(seg_dist(d['x'], d['z'], pts[k], pts[(k + 1) % len(pts)]) for k in range(len(pts))) <= 2.0:
                opened.append((d['x'], d['z'], 'osm'))
        # (b) sinon une vitrine ouverte côté espace voisin : la case de façade candidate la plus proche du centre des candidates
        if not opened and cand.any():
            rr, cc = np.nonzero(cand)
            mx, mz = np.mean([cc_x(c) for c in cc]), np.mean([cc_z(r) for r in rr])
            k = int(np.argmin([(cc_x(c) - mx) ** 2 + (cc_z(r) - mz) ** 2 for r, c in zip(rr, cc)]))
            opened.append((cc_x(cc[k]), cc_z(rr[k]), 'vitrine'))
        # ouvertures : cases de façade à moins de GAP_R du point d'ouverture
        gap = np.zeros((H, W), bool)
        for x, z, src in opened:
            r0, c0 = cell(x, z)
            for dr in range(-2, 3):
                for dc in range(-2, 3):
                    r, c = r0 + dr, c0 + dc
                    if 0 <= r < H and 0 <= c < W and band[r, c] and math.hypot(cc_x(c) - x, cc_z(r) - z) <= GAP_R and (cand[r, c] or src == 'osm'):
                        gap[r, c] = True
        if gap.any():
            shops['ouvertes_osm' if any(s == 'osm' for _, _, s in opened) else 'ouvertes_vitrine'] += 1
            walk[i][band & ~gap] = False         # façade fermée, sauf l'ouverture
            for x, z, src in opened:
                open_doors.append({'l': l, 'x': round(x, 2), 'z': round(z, 2), 'r': GAP_R, 'room': ri, 'src': src})
        else:
            shops['fermees'] += 1
            walk[i][m | band] = False            # boutique fermée : ni façade ni intérieur praticables


# ---- mobilier : bancs, bacs à plantes, bornes posés le long des murs, non praticables (aucune personne dedans) --------------
import random
rng = random.Random(43)
mobilier = []     # [niveau, x, z, rotation (rad, axe long), type]
def block_rect(l, cx, cz, hx, hz, rot):
    """Rend non praticables les cases que le rectangle (demi-côtés hx, hz, orienté rot) touche."""
    co, si = math.cos(rot), math.sin(rot)
    ext = abs(hx * co) + abs(hz * si) + 0.6, abs(hx * si) + abs(hz * co) + 0.6
    r0, c0 = cell(cx - ext[0], cz - ext[1]); r1, c1 = cell(cx + ext[0], cz + ext[1])
    n = 0
    for r in range(max(0, r0), min(H, r1 + 1)):
        for c in range(max(0, c0), min(W, c1 + 1)):
            if not walk[LI[l], r, c]:
                continue
            hit = False
            for a in range(5):
                for b in range(5):
                    px, pz = X0 + (c + a / 4) * RES - cx, Z0 + (r + b / 4) * RES - cz
                    if abs(px * co + pz * si) <= hx and abs(-px * si + pz * co) <= hz:
                        hit = True
            if hit:
                walk[LI[l], r, c] = False; n += 1
    return n
SIZES = {'banc': (1.0, 0.3), 'plante': (0.6, 0.6), 'borne': (0.3, 0.18)}
for l in LEVELS:
    if l == 0:
        continue
    i = LI[l]
    free = walk[i] & ((fl[i] == 1) | (fl[i] == 2))
    cands = []
    for r in range(2, H - 2):
        for c in range(2, W - 2):
            if not free[r, c]:
                continue
            for dr, dc in ((0, -1), (0, 1), (-1, 0), (1, 0)):          # mur de ce côté, couloir libre de l'autre sur 4 cases
                if not walk[i, r + dr, c + dc] and all(0 <= r - dr * k < H and 0 <= c - dc * k < W and walk[i, r - dr * k, c - dc * k] for k in range(1, 5)):
                    cands.append((r, c, dr, dc)); break
    rng.shuffle(cands)
    nmax = int(free.sum() / 140)
    placed = 0
    for r, c, dr, dc in cands:
        if placed >= nmax:
            break
        if not walk[i, r, c] or not all(walk[i, r - dr * k, c - dc * k] for k in range(1, 5)):
            continue
        t = ('banc', 'plante', 'banc', 'borne')[placed % 4]
        hx, hz = SIZES[t]
        cx, cz = X0 + (c + .5) * RES + dc * 0.15, Z0 + (r + .5) * RES + dr * 0.15
        rot = 0.0 if dc else math.pi / 2          # axe long le long du mur (mur en dc : mur à gauche/droite -> axe z)
        rot = math.pi / 2 if dc else 0.0
        before = walk[i].copy()
        # ne pas boucher : on teste que les cases voisines restent reliées à la case d'en face
        block_rect(l, cx, cz, hx, hz, rot)
        mobilier.append([l, round(cx, 2), round(cz, 2), round(rot, 3), t]); placed += 1
    # panneaux suspendus (décor en hauteur, ne gênent pas la marche)
    pc = [(r, c) for r, c in zip(*np.nonzero(free))]
    rng.shuffle(pc)
    for r, c in pc[:max(2, int(free.sum() / 700))]:
        mobilier.append([l, round(X0 + (c + .5) * RES, 2), round(Z0 + (r + .5) * RES, 2), round(rng.random() * 3.14, 3), 'panneau'])
# niveau 0 (rue) : bancs, bornes, arbres et stations Vélib d'OSM qui tombent sur une case praticable
n0 = 0
for (x, z) in S['bancs']:
    n0 += block_rect(0, x, z, 0.9, 0.3, 0.0)
for (x, z) in S['bornes']:
    n0 += block_rect(0, x, z, 0.12, 0.12, 0.0)
for (x, z) in S['arbres']:
    n0 += block_rect(0, x, z, 0.3, 0.3, 0.0)
for v in S['velib']:
    n0 += block_rect(0, v['x'], v['z'], 1.5, 0.6, 0.0)
print('mobilier', len(mobilier), 'objets intérieurs ; niveau 0 :', n0, 'cases bloquées')


def snap(l, x, z, rmax=6):
    r0, c0 = cell(x, z)
    best = None
    for dr in range(-rmax, rmax + 1):
        for dc in range(-rmax, rmax + 1):
            r, c = r0 + dr, c0 + dc
            if 0 <= r < H and 0 <= c < W and walk[LI[l], r, c]:
                d = dr * dr + dc * dc
                if best is None or d < best[0]:
                    best = (d, r, c)
    return None if best is None else (best[1], best[2])


links = []
carved = {'escalier': 0, 'escalator': 0, 'ascenseur': 0}
def land(l, x, z, kind):
    """Case d'arrivée d'un lien vertical : la case praticable à moins de 2 m de l'extrémité dessinée ; sinon on creuse la case de l'extrémité (sol dessiné de type passage)."""
    c = snap(l, x, z, 1)
    if c:
        return c
    r, cc = cell(x, z)
    if not (0 < r < H - 1 and 0 < cc < W - 1):
        return None
    walk[LI[l], r, cc] = True
    if fl[LI[l], r, cc] == 0:
        fl[LI[l], r, cc] = 5
    carved[kind] += 1
    for ri2, l2, pts2 in room_polys:        # extrémité dans une boutique : l'escalier ou l'ascenseur y est une ouverture déclarée
        if l2 == l and pip(cc_x(cc), cc_z(r), pts2):
            open_doors.append({'l': l, 'x': round(cc_x(cc), 2), 'z': round(cc_z(r), 2), 'r': 1.2, 'room': ri2, 'src': 'accès vertical'})
    return (r, cc)
for kind, arr in (('escalator', S['escalators']), ('escalier', S['escaliers'])):
    for oi, o in enumerate(arr):
        ls = lvl_list(o['l'])
        pts = pairs(o['p'])
        if len(ls) < 2 or len(pts) < 2:
            continue
        a, b = max(ls), min(ls)
        # sens et extrémités identiques à l'objet dessiné : le haut est pts[0] au niveau a, le bas pts[-1] au niveau b (comme index.html)
        A, B = pts[0], pts[-1]
        L = math.hypot(B[0] - A[0], B[1] - A[1]) + 6 * (a - b)
        ca, cb = land(a, *A, kind), land(b, *B, kind)
        if ca and cb:
            links.append({'k': kind, 'n': o['n'], 'obj': oi, 'a': [LI[a], *ca], 'b': [LI[b], *cb], 'len': round(L, 1),
                          'pa': [round(A[0], 2), round(A[1], 2)], 'pb': [round(B[0], 2), round(B[1], 2)],
                          'debit': 1.0 if kind == 'escalator' else 1.3})

# Ascenseurs : un lien par paire de niveaux desservis, dans la cage dessinée (centre = position OSM). Cabine de 13 personnes (1 000 kg), cycle portes + trajet ~20 s
# -> débit ~0,6 pers./s ; coût de trajet augmenté de l'attente moyenne (~15 s, soit ~20 m de marche).
for i, o in enumerate(S['ascenseurs']):
    ls = lvl_list(o['l'])
    for a, b in zip(ls[1:][::-1], ls[:-1][::-1]):
        ca, cb = land(b, o['x'], o['z'], 'ascenseur'), land(a, o['x'], o['z'], 'ascenseur')
        if ca and cb:
            links.append({'k': 'ascenseur', 'n': o['n'] or 'Ascenseur', 'asc': i, 'a': [LI[b], *ca], 'b': [LI[a], *cb],
                          'pa': [round(o['x'], 2), round(o['z'], 2)], 'pb': [round(o['x'], 2), round(o['z'], 2)],
                          'len': round(20 + 6 * (b - a), 1), 'debit': 0.6})
print('liens créés :', len(links), '; cases creusées sous les extrémités sans sol :', carved)

exits = []
seen = set()
for d in S['portes']:
    n = d['n'] or ''
    if not (n.startswith('Porte') or n.startswith('Rue ')):
        continue
    l = lvl_list(d['l'])[0] if lvl_list(d['l']) else 0
    key = (n, l)
    if key in seen:
        continue
    c = snap(l, d['x'], d['z'], 8)
    if c:
        seen.add(key)
        exits.append({'id': len(exits), 'n': n, 'type': 'rue', 'cell': [LI[l], *c]})
# Portes et issues de secours trouvées par la recherche (reports/issues-forum-halles.md, coordonnées OSM uniquement)
import re
LAT0, LON0 = 48.8620, 2.3470
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110540
ISS = os.path.join(HERE, 'issues.json')
for e in (json.load(open(ISS, encoding='utf-8')) if os.path.exists(ISS) else []):
    if e['type'] not in ('porte', 'issue') or e['lat'] is None or e['nom'].startswith('Sortie de métro'):
        continue
    m = re.match(r'\s*(-?\d)', str(e['niveau'] or '0'))
    l = int(m.group(1)) if m else 0
    if l not in LI:
        continue
    x, z = (e['lon'] - LON0) * KX, (LAT0 - e['lat']) * KZ
    n = re.sub(r'\s*\(.*\)\s*$', '', e['nom']) if e['type'] == 'porte' else 'Issues de secours'
    if e['type'] == 'porte' and any(x2['n'] == n for x2 in exits):
        same = [x2 for x2 in exits if x2['n'] == n and x2['cell'][0] == LI[l]]
        if same:
            continue
    c, est = snap(l, x, z, 10), False
    if not c:
        # hors des couloirs OSM : passage estimé de 2 m vers le couloir le plus proche (40 m au plus)
        t = snap(l, x, z, 40)
        r0, c0 = cell(x, z)
        if t and 0 <= r0 < H and 0 <= c0 < W:
            steps = max(abs(t[0] - r0), abs(t[1] - c0), 1)
            for k in range(steps + 1):
                rr, cc = round(r0 + (t[0] - r0) * k / steps), round(c0 + (t[1] - c0) * k / steps)
                walk[LI[l], max(0, rr - 1):rr + 1, max(0, cc - 1):cc + 1] = True
                sl = (LI[l], slice(max(0, rr - 1), rr + 1), slice(max(0, cc - 1), cc + 1))
                fl[sl] = np.where(fl[sl] > 0, fl[sl], 5)
                for r2 in range(sl[1].start, sl[1].stop):
                    for c2 in range(sl[2].start, sl[2].stop):
                        for ri2, l2, pts2 in room_polys:
                            if l2 == l and pip(cc_x(c2), cc_z(r2), pts2):
                                open_doors.append({'l': l, 'x': round(cc_x(c2), 2), 'z': round(cc_z(r2), 2), 'r': 1.2, 'room': ri2, 'src': 'issue estimée'})
            c, est = (r0, c0), True
    if c:
        exits.append({'id': len(exits), 'n': n, 'type': 'rue' if e['type'] == 'porte' else 'secours', 'cell': [LI[l], *c],
                      'estime': est, 'label': e['nom'], 'source': e['source'][:80]})
    else:
        print('hors grille :', e['nom'], l)

for q in S['quais']:
    ls = lvl_list(q['l'])
    pts = pairs(q['p'])
    if not ls or not pts:
        continue
    cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
    c = snap(ls[0], cx, cz, 10)
    if c:
        exits.append({'id': len(exits), 'n': 'Quai ' + (q['n'] or 'RER/métro'), 'type': 'train', 'cell': [LI[ls[0]], *c]})

walk[:, 0, :] = False; walk[:, -1, :] = False; walk[:, :, 0] = False; walk[:, :, -1] = False   # bord de grille

# connexité : BFS depuis toutes les sorties, au travers des liens verticaux
adj = collections.defaultdict(list)
for k in links:
    a, b = tuple(k['a']), tuple(k['b'])
    adj[a].append(b); adj[b].append(a)
seenc = np.zeros(walk.shape, bool)
dq = collections.deque()
for e in exits:
    l, r, c = e['cell']
    seenc[l, r, c] = True; dq.append((l, r, c))
while dq:
    l, r, c = dq.popleft()
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        rr, cc = r + dr, c + dc
        if 0 <= rr < H and 0 <= cc < W and walk[l, rr, cc] and not seenc[l, rr, cc]:
            seenc[l, rr, cc] = True; dq.append((l, rr, cc))
    for t in adj.get((l, r, c), []):
        if not seenc[t]:
            seenc[t] = True; dq.append(t)

def rle(a):
    f = a.ravel()
    ch = np.flatnonzero(np.diff(f)) + 1
    st = np.concatenate(([0], ch))
    ln = np.diff(np.concatenate((st, [f.size])))
    return [int(v) for p in zip(f[st].tolist(), ln.tolist()) for v in p]
assert not (walk & (fl == 0)).any()
print('boutiques', shops)
out = {'mobilier': mobilier, 'ouvertures': open_doors, 'fk': [rle(fl[i]) for i in range(len(LEVELS))], 'bbox': [X0, Z0, X1, Z1], 'res': RES, 'w': W, 'h': H, 'levels': LEVELS,
       'walk': [base64.b64encode(np.packbits(walk[i]).tobytes()).decode() for i in range(len(LEVELS))],
       'reach': [base64.b64encode(np.packbits(seenc[i]).tobytes()).decode() for i in range(len(LEVELS))],
       'links': links, 'exits': exits}
json.dump(out, open(os.path.join(HERE, 'navgrid.json'), 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print('grille', W, 'x', H, 'x', len(LEVELS), 'niveaux ; liens verticaux', len(links), '; sorties', len(exits),
      '(rue', sum(e['type'] == 'rue' for e in exits), ', quais', sum(e['type'] == 'train' for e in exits), ')')
for i, l in enumerate(LEVELS):
    tot, ok = int(walk[i].sum()), int((walk[i] & seenc[i]).sum())
    print(f'niveau {l:>2} : {tot:>6} m² praticables, {ok:>6} reliés à une sortie ({(100*ok/tot if tot else 0):.0f} %)')
print('taille navgrid.json :', os.path.getsize(os.path.join(HERE, 'navgrid.json')), 'octets')

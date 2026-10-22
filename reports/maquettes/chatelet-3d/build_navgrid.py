"""Grille praticable du Forum (1 m) par niveau, à partir de scene.json (OSM) : zones où l'on marche, liens verticaux
(escaliers, escalators), sorties (portes nommées, quais). Écrit navgrid.json et un rapport de connexité."""
import json, os, base64, collections, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(HERE, 'scene.json'), encoding='utf-8'))
X0, X1, Z0, Z1, RES = -200, 300, -150, 330, 1.0
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
for o in S['interieur']:
    ls = lvl_list(o['l'])
    if not ls:
        continue
    pts = pairs(o['p'])
    if not pts or max(abs(x) for x, _ in pts) > 2000:
        continue
    for l in ls:
        if o['k'] in ('corridor', 'area', 'room', 'yes'):
            fill(walk[LI[l]], pts)
        elif o['k'] == 'wall':
            fill(wall[LI[l]], pts)
for q in S['quais']:
    for l in lvl_list(q['l']):
        fill(walk[LI[l]], pairs(q['p']))

# dilatation d'une case pour recoudre les polygones voisins, puis retrait des murs
def dilate(m):
    d = m.copy()
    d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
    return d
for i in range(len(LEVELS)):
    walk[i] = dilate(walk[i]) & ~wall[i]


def cell(x, z):
    return int((z - Z0) / RES), int((x - X0) / RES)


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
for kind, arr in (('escalator', S['escalators']), ('escalier', S['escaliers'])):
    for o in arr:
        ls = lvl_list(o['l'])
        pts = pairs(o['p'])
        if len(ls) < 2 or len(pts) < 2:
            continue
        a, b = max(ls), min(ls)
        A, B = pts[0], pts[-1]
        L = math.hypot(B[0] - A[0], B[1] - A[1]) + 6 * (a - b)
        for (pa, pb) in ((A, B), (B, A)):
            ca, cb = snap(a, *pa), snap(b, *pb)
            if ca and cb:
                links.append({'k': kind, 'n': o['n'], 'a': [LI[a], *ca], 'b': [LI[b], *cb], 'len': round(L, 1),
                              'debit': 1.0 if kind == 'escalator' else 1.3})
                break

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
for q in S['quais']:
    ls = lvl_list(q['l'])
    pts = pairs(q['p'])
    if not ls or not pts:
        continue
    cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
    c = snap(ls[0], cx, cz, 10)
    if c:
        exits.append({'id': len(exits), 'n': 'Quai ' + (q['n'] or 'RER/métro'), 'type': 'train', 'cell': [LI[ls[0]], *c]})

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

out = {'bbox': [X0, Z0, X1, Z1], 'res': RES, 'w': W, 'h': H, 'levels': LEVELS,
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

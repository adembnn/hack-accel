"""Brouillon du graphe multi-niveaux Forum des Halles + RER Châtelet–Les Halles, depuis un extrait OSM.

usage : python3 build_graph.py osm-forum.json forum-graph.json
Nœuds : quais, zones nommées (couloirs, places), paliers déduits des escaliers, sorties sur rue.
Arcs : escalators/escaliers (entre niveaux), couloirs (même niveau), accès (vers la rue).
Toute capacité est une hypothèse listée dans meta.hypotheses ; toute liaison déduite porte source="déduit".
"""
import json, math, sys
from collections import defaultdict, deque

src, out = sys.argv[1], sys.argv[2]
els = json.load(open(src))['elements']
LAT0, LON0 = 48.8620, 2.3460
K = math.cos(math.radians(LAT0))
xy = lambda lat, lon: (round((lon - LON0) * 111320 * K, 1), round(-(lat - LAT0) * 110574, 1))
inside = lambda lat, lon: 48.8604 <= lat <= 48.8650 and 2.3415 <= lon <= 2.3505  # Forum + RER, sans Châtelet sud

# hypothèses de débit (à vérifier, voir meta)
ESC = 1.4        # pers/s par escalator (≈ 5 000 pers/h pratique, marche de 1 m)
STAIR = 0.9 * 2.5  # pers/s : 0,9 pers/m/s × 2,5 m par défaut (OSM n'a quasi aucune largeur)
CORR = 1.3 * 5   # pers/s : 1,3 pers/m/s × 5 m par défaut
V, LEVEL_S = 1.3, 12  # m/s à plat ; s par niveau franchi

def pos(x):
    c = x.get('center') or x
    return c['lat'], c['lon']

def lv(t):
    l = t.get('level')
    try:
        return [float(v) for v in l.split(';')] if l else None
    except ValueError:
        return None

nodes, edges = {}, {}
def add_node(nid, kind, name, level, lat, lon, osm):
    x, y = xy(lat, lon)
    nodes[nid] = dict(id=nid, kind=kind, name=name, level=level, lat=round(lat, 6), lon=round(lon, 6), x=x, y=y, osm=osm)

# 1. sorties sur rue : portes nommées du Forum (+ issues de secours ouest regroupées)
groups = defaultdict(list)
for x in els:
    t = x.get('tags', {})
    if x['type'] != 'node' or not inside(x['lat'], x['lon']):
        continue
    l = lv(t)
    if t.get('railway') == 'subway_entrance' and t.get('name') and (t['name'].startswith('Porte') or t['name'] == 'Rue Montorgueil') and (l is None or 0 in l):
        groups[t['name']].append(x)
    elif t.get('entrance') == 'emergency' and l and -1 in l:
        groups['Issues de secours ouest (-1)'].append(x)
for name, xs in groups.items():
    lat = sum(p['lat'] for p in xs) / len(xs); lon = sum(p['lon'] for p in xs) / len(xs)
    level = -1.0 if 'secours' in name else 0.0
    add_node('S_' + name.split('(')[0].strip().replace(' ', '_'), 'sortie', name, level, lat, lon, ['node/%d' % p['id'] for p in xs])

# 2. quais et zones nommées (un seul niveau)
zg = defaultdict(list)
for x in els:
    t = x.get('tags', {})
    l = lv(t)
    if not l or len(l) != 1:
        continue
    lat, lon = pos(x)
    if not inside(lat, lon):
        continue
    if x['type'] == 'relation' and (t.get('public_transport') == 'platform' or t.get('railway') == 'platform'):
        zg[('Q', 'RER ' + t.get('name', 'quai'), l[0])].append(x)
    elif x['type'] == 'way' and t.get('railway') == 'platform':
        zg[('Q', 'Quai M4 Les Halles [?]', l[0])].append(x)
    elif t.get('indoor') in ('corridor', 'area') and t.get('name') and t.get('public_transport') != 'platform':
        zg[('Z', t['name'][0].upper() + t['name'][1:], l[0])].append(x)
for i, ((k, name, level), xs) in enumerate(sorted(zg.items(), key=lambda kv: (kv[0][2], kv[0][1]))):
    ps = [pos(x) for x in xs]
    lat = sum(p[0] for p in ps) / len(ps); lon = sum(p[1] for p in ps) / len(ps)
    add_node('%s%d' % (k, i), 'quai' if k == 'Q' else 'zone', name, level, lat, lon, ['%s/%d' % (x['type'], x['id']) for x in xs])

def nearest(level, x, y, maxd):
    best, bd = None, maxd
    for n in nodes.values():
        if n['level'] == level:
            d = math.hypot(n['x'] - x, n['y'] - y)
            if d < bd:
                best, bd = n, d
    return best

def edge(a, b, kind, n_esc=0, n_stairs=0, osm=(), source='OSM'):
    key = tuple(sorted((a['id'], b['id']))) + (kind,)
    e = edges.setdefault(key, dict(a=key[0], b=key[1], kind=kind, n_escalators=0, n_stairs=0, osm=[], source=source))
    e['n_escalators'] += n_esc; e['n_stairs'] += n_stairs; e['osm'] += list(osm)

# 3. escaliers et escalators : relient les nœuds des deux niveaux ; palier créé si rien à moins de 60 m
pal = 0
for x in els:
    t = x.get('tags', {})
    if t.get('highway') != 'steps':
        continue
    l = lv(t); lat, lon = pos(x)
    if not l or len(l) != 2 or not inside(lat, lon):
        continue
    X, Y = xy(lat, lon)
    ends = []
    for level in l:
        n = nearest(level, X, Y, 85)
        if not n:
            pal += 1
            add_node('P%d' % pal, 'palier', 'Palier niveau %g' % level, level, lat, lon, [])
            n = nodes['P%d' % pal]
        ends.append(n)
    esc = bool(t.get('conveying'))
    edge(ends[0], ends[1], 'vertical', n_esc=int(esc), n_stairs=int(not esc), osm=['way/%d' % x['id']])

# 4. couloirs : même niveau à moins de 70 m (déduit) ; chaque nœud isolé rattaché au plus proche de son niveau
ids = list(nodes)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        A, B = nodes[a], nodes[b]
        if A['level'] == B['level'] and math.hypot(A['x'] - B['x'], A['y'] - B['y']) < 70 and 'sortie' not in (A['kind'], B['kind']):
            edge(A, B, 'couloir', source='déduit')
for n in nodes.values():
    if n['kind'] != 'sortie' and not any(n['id'] in (e['a'], e['b']) and e['kind'] == 'couloir' for e in edges.values()):
        cands = [m for m in nodes.values() if m['level'] == n['level'] and m['id'] != n['id'] and m['kind'] != 'sortie']
        if cands:
            edge(n, min(cands, key=lambda m: math.hypot(m['x'] - n['x'], m['y'] - n['y'])), 'couloir', source='déduit')

# sortie sans escalier OSM : accès déduit vers le nœud le plus proche à -1 ou -2
for n in [n for n in nodes.values() if n['kind'] == 'sortie']:
    if not any(n['id'] in (e['a'], e['b']) for e in edges.values()):
        cands = [m for m in nodes.values() if m['level'] in (-1, -2) and m['kind'] != 'sortie']
        m = min(cands, key=lambda m: math.hypot(m['x'] - n['x'], m['y'] - n['y']))
        edge(n, m, 'vertical', n_stairs=1, source='déduit')

# 5. capacités et temps
for e in edges.values():
    A, B = nodes[e['a']], nodes[e['b']]
    d = math.hypot(A['x'] - B['x'], A['y'] - B['y'])
    e['length_m'] = round(d, 1)
    e['time_s'] = round(d / V + abs(A['level'] - B['level']) * LEVEL_S, 1)
    e['capacity_ps'] = round(e['n_escalators'] * ESC + e['n_stairs'] * STAIR, 2) if e['kind'] == 'vertical' else CORR

graph = dict(
    meta=dict(
        name='Forum des Halles + RER Châtelet–Les Halles (brouillon)',
        source='OpenStreetMap © contributeurs, ODbL ; extrait Overpass du 22 oct. 2026 (osm-forum.json)',
        origin=dict(lat=LAT0, lon=LON0, note='x vers l\'est, y vers le sud, en mètres'),
        perimetre='Forum (portes 1 à 9) et RER (quais 1-4, salle d\'échange) ; Châtelet sud (M1/7/11/14) hors périmètre, à brancher par la Rue de l\'Orient Express (-4)',
        hypotheses=[
            'Escalator : %.1f pers/s (≈ 5 000 pers/h en pratique pour 1 m), à vérifier (TCQSM / NF EN 115). Arrêté = escalier.' % ESC,
            'Escalier : 0,9 pers/m/s sur 2,5 m par défaut ; OSM n\'a presque aucune largeur (1 sur 208).',
            'Couloir : 1,3 pers/m/s sur 5 m par défaut.',
            'Marche à 1,3 m/s ; %d s par niveau franchi.' % LEVEL_S,
            'Couloirs « déduits » : deux nœuds du même niveau à moins de 70 m sont supposés reliés. À contrôler sur plan.',
            'Paliers P* créés quand un escalier n\'a aucun nœud à moins de 85 m sur son niveau.',
            'Ascenseurs exclus (hors service en évacuation).',
        ],
        a_verifier=['Quai -2 attribué à M4 Les Halles par sa position', 'Largeur réelle des portes et escaliers', 'Sens et nombre d\'escalators par trémie',
                    'Liaison RER -4/-5 vers le Forum (fragmentée dans OSM)', 'Débit des portes du Forum vers la rue'],
    ),
    nodes=list(nodes.values()),
    edges=list(edges.values()),
)
json.dump(graph, open(out, 'w'), ensure_ascii=False, indent=1)

# contrôle : chaque quai atteint au moins une sortie
adj = defaultdict(set)
for e in edges.values():
    adj[e['a']].add(e['b']); adj[e['b']].add(e['a'])
def reach(s):
    seen, q = {s}, deque([s])
    while q:
        for m in adj[q.popleft()] - seen:
            seen.add(m); q.append(m)
    return seen
kinds = defaultdict(int)
for n in nodes.values():
    kinds[n['kind']] += 1
print('nœuds', len(nodes), dict(kinds), '| arcs', len(edges), '| escalators', sum(e['n_escalators'] for e in edges.values()))
exits = {n['id'] for n in nodes.values() if n['kind'] == 'sortie'}
for n in nodes.values():
    if n['kind'] in ('quai', 'sortie'):
        r = reach(n['id'])
        print('%-7s %-42s niv %5g → %s' % (n['kind'], n['name'][:42], n['level'], 'OK' if (r & exits) - {n['id']} or (n['kind'] == 'sortie' and len(r) > 1) else 'ISOLÉ'))

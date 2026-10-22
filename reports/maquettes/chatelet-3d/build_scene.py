"""Convertit les extraits OSM (data/*.json) en une scène compacte en mètres (scene.json).
Repère : origine au centre du Forum, x vers l'est, z vers le sud, y vers le haut. Niveau OSM n -> altitude n * ETAGE."""
import json, math, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
LAT0, LON0 = 48.8620, 2.3470
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110540
ETAGE = 6.0


def xy(lat, lon):
    return round((lon - LON0) * KX, 2), round((LAT0 - lat) * KZ, 2)


def load(name):
    return json.load(open(os.path.join(HERE, 'data', name), encoding='utf-8'))['elements']


def levels(tag):
    """'-3;-2' -> [-3,-2] ; '-1' -> [-1] ; '-3.5' -> [-3.5] ; '' -> []"""
    if not tag:
        return []
    out = []
    for part in re.split(r'[;,]', tag):
        part = part.strip()
        m = re.match(r'^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$', part)
        if m:
            a, b = float(m.group(1)), float(m.group(2))
            out += [a, b]
            continue
        try:
            out.append(float(part))
        except ValueError:
            pass
    return out


def ring(geom):
    pts = []
    for p in geom:
        x, z = xy(p['lat'], p['lon'])
        pts += [x, z]
    return pts


def height(t):
    for k in ('height', 'building:height'):
        if k in t:
            try:
                return float(re.findall(r'[\d.]+', t[k])[0])
            except (IndexError, ValueError):
                pass
    if 'building:levels' in t:
        try:
            return float(t['building:levels']) * 3.2 + 1.5
        except ValueError:
            pass
    return 18.0


def min_height(t):
    if 'min_height' in t:
        try:
            return float(re.findall(r'[\d.]+', t['min_height'])[0])
        except (IndexError, ValueError):
            pass
    return 0.0


scene = {'origine': [LAT0, LON0], 'etage': ETAGE, 'batiments': [], 'interieur': [], 'escalators': [], 'escaliers': [],
         'ascenseurs': [], 'portes': [], 'quais': [], 'metro': [], 'incendie': [], 'arbres': [], 'bancs': [], 'bornes': [],
         'velib': [], 'rues': [], 'pietons': [], 'verts': [], 'eau': []}

for e in load('batiments.json'):
    t = e.get('tags', {})
    if t.get('location') == 'underground' or (t.get('layer', '0').lstrip('-').isdigit() and int(t.get('layer', '0')) < 0):
        continue
    rings = []
    if e['type'] == 'way' and 'geometry' in e:
        rings = [e['geometry']]
    elif e['type'] == 'relation':
        rings = [m['geometry'] for m in e.get('members', []) if m.get('role') == 'outer' and 'geometry' in m]
    for g in rings:
        if len(g) >= 4:
            scene['batiments'].append({'h': round(height(t), 1), 'b': min_height(t), 'n': t.get('name', ''),
                                       'k': t.get('building', 'yes'), 'p': ring(g)})

for e in load('forum.json'):
    t = e.get('tags', {})
    lv = levels(t.get('level') or t.get('level:ref', ''))
    if e['type'] == 'node':
        x, z = xy(e['lat'], e['lon'])
        if t.get('highway') == 'elevator' or t.get('elevator') == 'yes':
            scene['ascenseurs'].append({'x': x, 'z': z, 'l': lv, 'n': t.get('name', '')})
        elif 'door' in t or 'entrance' in t:
            scene['portes'].append({'x': x, 'z': z, 'l': lv, 'n': t.get('name', '') or t.get('ref', ''),
                                    'k': t.get('entrance') or t.get('door')})
        continue
    if e['type'] == 'relation':
        for m in e.get('members', []):
            if m.get('role') == 'outer' and 'geometry' in m:
                scene['interieur'].append({'k': t.get('indoor', 'yes'), 'l': lv, 'n': t.get('name', ''), 'p': ring(m['geometry'])})
        continue
    g = e.get('geometry')
    if not g:
        continue
    if 'conveying' in t:
        scene['escalators'].append({'l': lv, 'd': t.get('conveying'), 'n': t.get('name', ''), 'p': ring(g)})
    elif t.get('highway') == 'steps':
        scene['escaliers'].append({'l': lv, 'n': t.get('name', ''), 'p': ring(g)})
    elif t.get('highway') == 'elevator':
        x, z = xy(g[0]['lat'], g[0]['lon'])
        scene['ascenseurs'].append({'x': x, 'z': z, 'l': lv, 'n': t.get('name', '')})
    elif t.get('railway') == 'platform' or t.get('public_transport') == 'platform':
        scene['quais'].append({'l': lv, 'n': t.get('name', '') or t.get('ref', ''), 'p': ring(g)})
    elif 'indoor' in t:
        scene['interieur'].append({'k': t.get('indoor'), 'l': lv, 'n': t.get('name', '') or t.get('shop', '') or t.get('amenity', ''),
                                   'p': ring(g)})

for e in load('abords.json'):
    t = e.get('tags', {})
    if e['type'] == 'node':
        x, z = xy(e['lat'], e['lon'])
        if t.get('railway') == 'subway_entrance':
            scene['metro'].append({'x': x, 'z': z, 'n': t.get('name', '') or t.get('ref', ''), 'l': levels(t.get('level', ''))})
        elif t.get('emergency') == 'fire_hydrant':
            scene['incendie'].append([x, z])
        elif t.get('natural') == 'tree':
            scene['arbres'].append([x, z])
        elif t.get('amenity') == 'bench':
            scene['bancs'].append([x, z])
        elif t.get('barrier') == 'bollard':
            scene['bornes'].append([x, z])
        elif t.get('amenity') == 'bicycle_rental':
            scene['velib'].append({'x': x, 'z': z, 'n': t.get('name', ''), 'c': t.get('capacity', '')})
        continue
    g = e.get('geometry')
    if not g:
        continue
    if 'highway' in t:
        hw = t['highway']
        if t.get('area') == 'yes' and hw in ('pedestrian', 'footway'):
            scene['pietons'].append({'n': t.get('name', ''), 'p': ring(g)})
        elif t.get('level', '0').lstrip('-').replace('.', '').isdigit() and float(t.get('level', '0')) < 0:
            continue
        elif t.get('tunnel') == 'yes' or t.get('layer', '0').startswith('-'):
            continue
        else:
            scene['rues'].append({'k': hw, 'n': t.get('name', ''), 'p': ring(g)})
    elif t.get('leisure') in ('park', 'garden') or t.get('landuse') == 'grass':
        scene['verts'].append({'n': t.get('name', ''), 'p': ring(g)})
    elif t.get('water') or t.get('natural') == 'water':
        scene['eau'].append({'n': t.get('name', ''), 'p': ring(g)})

json.dump(scene, open(os.path.join(HERE, 'scene.json'), 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print({k: len(v) for k, v in scene.items() if isinstance(v, list)})
lv = {}
for o in scene['interieur'] + scene['escalators'] + scene['escaliers']:
    for l in o['l'] or ['?']:
        lv[l] = lv.get(l, 0) + 1
print('objets intérieurs par niveau :', dict(sorted(lv.items(), key=lambda kv: (kv[0] == '?', kv[0] if kv[0] != '?' else 0))))
print('taille scene.json :', os.path.getsize(os.path.join(HERE, 'scene.json')), 'octets')

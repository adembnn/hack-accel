"""Leviers de l'Adidas Arena alignés sur le catalogue des contraintes de l'équipe (reports/catalogue-contraintes.md,
branche decisions/geste-du-jure) : C1, B1, B3, B5, D1/D2, D5, F1 = le menu du juré (ticket #13).

Chaque levier pointe sur un objet réel de la scène (OSM, plan NP2F) ou estimé (e=1, à remplacer par un vrai plan).
Sortie : scene['leviers'] = liste de {code, id, nom, type, x, z, niveau, etat, e, source, effet}.
Les effets suivent la colonne « représentation dans le simulateur » du catalogue.
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_reel import to_scene

EFFET = {
    'C1': "Nœud de transport inaccessible à partir de l'heure posée ; la foule se reporte sur les autres accès ou reste",
    'B1': "Issue fermée (arête supprimée) ; report vers les autres issues, qui saturent",
    'B3': "L'escalator devient un escalier : vitesse ~0,7 m/s, débit réduit ; 50 % au plus comptent comme sortie (CO 34)",
    'B5': "Plus de chemin pour les personnes à mobilité réduite (nœud supprimé pour le profil PMR)",
    'D1': "Zone à éviter mobile + flux entrant de manifestants",
    'D2': "Zone interdite autour des issues qui y donnent ; repli vers l'intérieur",
    'D5': "Zone fermée pendant N minutes (périmètre) ; arrêt observé ~1 à 2 h (Forum des Halles, 2 nov. 2017)",
    'F1': "Information retardée : la foule bouge N minutes après la décision",
}


def lever(code, id_, nom, typ, xz, niveau=0, e=0, source='', **kw):
    d = {'code': code, 'id': id_, 'nom': nom, 'type': typ, 'x': round(xz[0], 1), 'z': round(xz[1], 1), 'niveau': niveau,
         'etat': 'ouvert', 'e': e, 'source': source, 'effet': EFFET[code]}
    d.update(kw)
    return d


def build(scene):
    L = []
    # C1 : accès métro 12 Porte de la Chapelle et arrêts du tram T3b à moins de 400 m (OSM)
    near = [m for m in scene['metro'] if m.get('t') in ('metro', 'tram') and math.hypot(m['x'], m['z']) < 400]
    seen = set()
    for i, m in enumerate(sorted(near, key=lambda m: math.hypot(m['x'], m['z']))):
        key = (m['t'], round(m['x'] / 15), round(m['z'] / 15))
        if key in seen: continue
        seen.add(key)
        nom = ('Accès métro 12 · ' if m['t'] == 'metro' else 'Tram T3b · ') + (m['n'] or 'Porte de la Chapelle')
        L.append(lever('C1', f"C1-{m['t']}-{len(seen)}", nom, m['t'], (m['x'], m['z']), source='OpenStreetMap'))
    L.append(lever('C1', 'C1-station-12', 'Station Porte de la Chapelle (ligne 12, toute la station)', 'station', (-110, 205), source='OpenStreetMap'))
    # B1 : l'entrée publique réelle (FAQ adidasarena) + issues de façade lues comme ouvertures sur le plan NP2F (estimées)
    L.append(lever('B1', 'B1-entree', 'Entrée publique (angle av. de la Porte de la Chapelle et bd Ney)', 'issue', to_scene(315, 945), largeur=20, source='FAQ adidasarena.com'))
    for n, (px, py) in enumerate([(210, 400), (210, 560), (210, 720), (480, 945), (700, 945), (900, 945), (1235, 500), (1235, 700), (900, 245)], 1):
        L.append(lever('B1', f'B1-issue-{n}', f'Issue de secours {n}', 'issue', to_scene(px, py), largeur=1.8, e=1, source='ouverture de façade lue sur le plan NP2F'))
    for n, (px, py) in enumerate([(420, 300), (750, 300), (440, 740), (735, 740)], 1):
        L.append(lever('B1', f'B1-vomitoire-{n}', f'Vomitoire {["nord-ouest", "nord-est", "sud-ouest", "sud-est"][n - 1]}', 'vomitoire', to_scene(px, py), niveau=1, largeur=3.5, source='plan NP2F'))
    # B3 : escalators dessinés sur le plan (hall sud et hall est)
    for n, (px, py) in enumerate([(840, 885), (1125, 850)], 1):
        L.append(lever('B3', f'B3-escalator-{n}', f'Escalator {["hall sud", "hall est"][n - 1]}', 'escalator', to_scene(px, py), source='symbole d\'escalator sur le plan NP2F', e=1))
    # B5 : ascenseurs (noyaux de circulation du plan, positions estimées)
    for n, (px, py) in enumerate([(300, 350), (330, 820), (960, 470), (1060, 850)], 1):
        L.append(lever('B5', f'B5-ascenseur-{n}', f'Ascenseur {n}', 'ascenseur', to_scene(px, py), e=1, source='noyau de circulation du plan NP2F, position estimée'))
    # D1 / D2 : zones posables proposées (polygones en mètres, à déplacer par le juré)
    zones = {
        'Parvis Alice Milliat': [(-60, 58), (70, 58), (70, 115), (-60, 115)],
        'Boulevard Ney (est)': [(70, 105), (260, 115), (260, 140), (70, 130)],
        'Avenue de la Porte de la Chapelle': [(-110, -60), (-80, -60), (-80, 170), (-110, 170)],
        'Sous le périphérique (nord)': [(-150, -130), (150, -150), (150, -100), (-150, -80)],
    }
    for n, (nom, poly) in enumerate(zones.items(), 1):
        cx = sum(p[0] for p in poly) / len(poly); cz = sum(p[1] for p in poly) / len(poly)
        for code in ('D1', 'D2'):
            L.append(lever(code, f'{code}-zone-{n}', nom, 'zone', (cx, cz), poly=[c for p in poly for c in p], e=1, source='zone proposée, à poser par le juré', etat='inactive'))
    # D5 : colis suspect, point + périmètre (rayon par défaut non sourcé : réglable)
    L.append(lever('D5', 'D5-colis', 'Colis suspect (à poser)', 'point', to_scene(600, 900), rayon=50, duree_min=60, e=1, etat='inactif',
                   source='durée d\'après le Forum des Halles, 2 nov. 2017 (~1 h) ; rayon non sourcé'))
    # F1 : retard d'information (paramètre global)
    L.append(lever('F1', 'F1-annonce', 'Retard de l\'annonce au public', 'parametre', (0, 0), retard_min=0, etat='0 min', source='19 oct. 2026 : cinéma prévenu « à la dernière minute »'))
    return L


if __name__ == '__main__':
    import json, os, collections
    sc = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scene.json'), encoding='utf-8'))
    L = build(sc)
    print(collections.Counter(l['code'] for l in L))
    for l in L:
        if l['code'] == 'C1': print(' ', l['id'], l['nom'], l['x'], l['z'])

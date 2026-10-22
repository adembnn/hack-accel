"""Intérieur ESTIMÉ de l'Adidas Arena : OSM ne donne que l'aire de jeu et les deux gymnases.
Tout ce qui sort d'ici porte e=1 et s'affiche « estimé (dessiné à la main) ».

Faits publics utilisés (22/10/2026) :
- 8 000 places assises en sport, 9 000 en concert (Wikipédia, SOLIDEO, mairie du 18e) ;
- deux gymnases, Aimée Lallement (niveau 0) et Alice Coachman (niveau 5), positions OSM ;
- parvis arboré Alice Milliat entre le bâtiment et le boulevard Ney, conçu pour gérer les flux de spectateurs (paris.fr) ;
- espace « Central Chapelle » de 2 600 m² (loisirs, restauration), terrasse sur le toit, parking d'environ 200 places (SOLIDEO).
Hypothèses (à remplacer par un vrai plan de salle) : bol rectangulaire à angles arrondis autour de l'aire de jeu OSM,
tribune basse de 11 rangs et tribune haute de 9 rangs, coursive au niveau 1, portes publiques côté parvis (sud) et côté
avenue de la Porte de la Chapelle (ouest), 8 vomitoires (passages entre coursive et tribune basse).
Repère : celui de scene.json (mètres, x vers l'est, z vers le sud). Niveau n -> altitude n * 4 m dans la vue.
"""

# Aire de jeu OSM (way 1249959682) : x -24,3..10,6 ; z -22,8..30,3
FLOOR = (-24.3, -22.8, 10.6, 30.3)
ROW_DEPTH, SEAT_W = 0.8, 0.5
TIERS = [  # nom, décalage depuis l'aire de jeu (m), rangs, hauteur du 1er rang (m), montée par rang (m)
    {'n': 'Tribune basse', 'off': 1.5, 'rows': 11, 'y0': 0.5, 'rise': 0.4},
    {'n': 'Tribune haute', 'off': 10.0, 'rows': 9, 'y0': 8.0, 'rise': 0.55},
]
CORNER = 6.0  # rayon des angles du bol au niveau du 1er rang


def rect(x0, z0, x1, z1):
    return [x0, z0, x1, z0, x1, z1, x0, z1, x0, z0]


def seats(t):
    x0, z0, x1, z1 = FLOOR
    w, h = x1 - x0, z1 - z0
    tot = 0
    for r in range(t['rows']):
        d = t['off'] + (r + .5) * ROW_DEPTH
        per = 2 * (w + h) + 2 * 3.1416 * (CORNER + d) - 8 * CORNER  # rectangle arrondi
        tot += per / SEAT_W
    return int(tot * 0.92)  # escaliers d'accès et vomitoires retirés


def build():
    x0, z0, x1, z1 = FLOOR
    out = {'gradins': [], 'interieur': [], 'portes': [], 'escaliers': []}
    for t in TIERS:
        out['gradins'].append({**t, 'floor': list(FLOOR), 'corner': CORNER, 'depth': ROW_DEPTH, 'places': seats(t), 'e': 1})
    low_out = TIERS[0]['off'] + TIERS[0]['rows'] * ROW_DEPTH  # 10,3 m
    # Coursive niveau 1 : anneau entre le haut de la tribune basse et la façade (en 4 bandes, le rendu ne gère pas les trous)
    ox0, oz0, ox1, oz1 = -56, -52, 33, 50
    ix0, iz0, ix1, iz1 = x0 - low_out, z0 - low_out, x1 + low_out, z1 + low_out
    for n, p in (('Coursive nord', rect(ox0, oz0, ox1, iz0)), ('Coursive sud', rect(ox0, iz1, ox1, oz1)),
                 ('Coursive ouest', rect(ox0, iz0, ix0, iz1)), ('Coursive est', rect(ix1, iz0, ox1, iz1))):
        out['interieur'].append({'k': 'corridor', 'l': [1], 'n': n, 'p': p, 'e': 1})
    # Hall d'entrée niveau 0 côté parvis, et Central Chapelle (2 600 m² annoncés, ici environ 60 x 40 m côté ouest)
    out['interieur'].append({'k': 'area', 'l': [0], 'n': 'Hall Parvis Alice Milliat', 'p': rect(-50, 36, 30, 52), 'e': 1})
    out['interieur'].append({'k': 'room', 'l': [0], 'n': 'Central Chapelle (loisirs, restauration)', 'p': rect(-58, -40, -36, 32), 'e': 1})
    out['interieur'].append({'k': 'area', 'l': [4], 'n': 'Terrasse', 'p': rect(-50, -50, 30, -30), 'e': 1})
    # Portes publiques (niveau 0) : largeur estimée en mètres, utile au simulateur (débit de porte)
    for n, x, z, w in (('Porte Parvis Ouest', -30, 55, 6), ('Porte Parvis Centre', -5, 55, 8), ('Porte Parvis Est', 20, 55, 6),
                       ('Porte Chapelle', -61, 0, 6), ('Accès gymnases', 66, 10, 3), ('Accès logistique (fermé au public)', 0, -58, 8)):
        out['portes'].append({'x': x, 'z': z, 'l': [0], 'n': n, 'k': 'entrance', 'w': w, 'e': 1})
    # Vomitoires (niveau 1) : 2 par grand côté, 1 par petit côté, 2 aux angles sud
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    v = [(cx - 9, iz0), (cx + 9, iz0), (cx - 9, iz1), (cx + 9, iz1), (ix0, cz), (ix1, cz), (ix0 + 3, iz1 - 3), (ix1 - 3, iz1 - 3)]
    for i, (x, z) in enumerate(v, 1):
        out['portes'].append({'x': round(x, 1), 'z': round(z, 1), 'l': [1], 'n': f'Vomitoire {i}', 'k': 'vomitoire', 'w': 2.4, 'e': 1})
    # Escaliers hall (niveau 0) -> coursive (niveau 1) et coursive -> tribune haute (niveau 2) : premier point en haut
    for n, p, l in (('Escalier hall ouest', [-40, 40, -40, 48], [1, 0]), ('Escalier hall est', [22, 40, 22, 48], [1, 0]),
                    ('Escalier coursive nord-ouest', [-50, -40, -50, -48], [2, 1]), ('Escalier coursive nord-est', [28, -40, 28, -48], [2, 1]),
                    ('Escalier coursive sud-ouest', [-52, 30, -52, 38], [2, 1]), ('Escalier coursive sud-est', [29, 30, 29, 38], [2, 1])):
        out['escaliers'].append({'l': l, 'n': n, 'p': p, 'e': 1})
    return out


if __name__ == '__main__':
    b = build()
    print({k: len(v) for k, v in b.items()}, 'places estimées :', [g['places'] for g in b['gradins']], '=', sum(g['places'] for g in b['gradins']))

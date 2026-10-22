# Vue 3D de Châtelet et du Forum des Halles (22/10/2026)

Vraie géométrie OpenStreetMap : 3 013 bâtiments avec hauteurs, 334 espaces intérieurs du Forum (niveaux 0 à -5), 107 escalators,
17 ascenseurs, 528 portes, 59 bouches de métro, 351 bouches d'incendie (couverture bénévole OSM), arbres, bancs, bornes, Vélib, rues.
Quatre styles commutables (A fil de fer, B argile, C thermique, D Paris texturé par défaut : façades haussmanniennes, vitrines, toits en zinc, chaussées et trottoirs, ciel et ombres), caméras (orbite, dessus, coupe, Forum), isolation d'un niveau,
écartement des niveaux souterrains, surface transparente, calques, fiche de chaque élément au clic.

Lancer :
1. `./recuperer-osm.sh` (télécharge les extraits OSM dans `data/` et construit `scene.json`, non commités), puis `./recuperer-textures.sh` (9 textures CC0 de Poly Haven dans `tex/`, 5 Mo, non commitées ; sans elles, rendu procédural).
2. `python3 -m http.server 8767` dans ce dossier, puis ouvrir http://127.0.0.1:8767/index.html

Limites : la population affichée est un placement de démonstration (marche aléatoire dans les couloirs), pas la simulation ;
les niveaux -1 et -2 sont pauvres dans OSM ; les hauteurs manquantes valent 18 m par défaut ; repère : origine au centre du Forum
(48.8620, 2.3470), x vers l'est, z vers le sud, niveau OSM n à l'altitude n × 6 m × écartement.
Données © contributeurs OpenStreetMap, licence ODbL.

Fluidité mesurée (navigateur intégré, 1400×860, style D, jour) : 60 images/s, 685 appels de dessin, 748 000 triangles. Ombres calculées une seule fois, portes et escalators instanciés, foule mise à jour par tiers, résolution plafonnée à 1,5.
Textures : Poly Haven (CC0) : beige_wall_001, grey_roof_01, asphalt_02, granite_tile, leafy_grass, marble_tiles, floor_tiles_06, large_floor_tiles_02, plastered_wall_02.

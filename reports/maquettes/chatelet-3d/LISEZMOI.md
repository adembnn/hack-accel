# Vue 3D de Châtelet et du Forum des Halles (22/10/2026)

Vraie géométrie OpenStreetMap : 3 013 bâtiments avec hauteurs, 334 espaces intérieurs du Forum (niveaux 0 à -5), 107 escalators,
17 ascenseurs, 528 portes, 59 bouches de métro, 351 bouches d'incendie (couverture bénévole OSM), arbres, bancs, bornes, Vélib, rues.
Quatre styles commutables (A fil de fer, B argile, C thermique, D Paris texturé par défaut : façades haussmanniennes, vitrines, toits en zinc, chaussées et trottoirs, ciel et ombres), caméras (orbite, dessus, coupe, Forum), isolation d'un niveau,
écartement des niveaux souterrains, surface transparente, calques, fiche de chaque élément au clic.

Lancer :
1. `./recuperer-osm.sh` (télécharge les extraits OSM dans `data/` et construit `scene.json`, non commités), puis `./recuperer-textures.sh` (9 textures CC0 de Poly Haven dans `tex/`, 5 Mo, non commitées ; sans elles, rendu procédural).
2. `python3 build_navgrid.py` (grille praticable 1 m par niveau, liens verticaux, sorties : `navgrid.json`, non commité).
3. `python3 -m http.server 8767` dans ce dossier, puis ouvrir http://127.0.0.1:8767/index.html

Évacuation (`sim.js`) : 3 200 personnes sur la vraie grille du Forum ; départ log-logistique (cinéma, médiane 40,5 s), choix de sortie logit
(Lovreglio : familiarité, suivisme, zone évitée), changement d'avis, hésitation devant une porte fermée, forces sociales (Helbing) avec contact
« corps dur » (personne ne se chevauche ni ne traverse un mur), escalators à 1,25 pers./s et escaliers à 2 pers./s.
Mesure (navigateur intégré, 3 200 personnes) : 3,1 ms par pas de 0,1 s, 0 personne dans un mur, 2 452 sorties à 15 min.

Leviers du juré (`leviers.js`, même format que la maquette Arena : `{code,id,nom,type,x,z,niveau,etat,source,effet}`, `toggleLever(id)`,
événement `levier`) : épingles visibles à travers les toits pour 7 portes du Forum (B1), 26 bouches de métro et RER (C1 : toutes fermées =
stations fermées), 17 ascenseurs (B5), bornes incendie (masquées si une zone les couvre) ; « + Manifestation » (D1, la foule évite les
portes voisines) et « + Troubles » (D2, les portes couvertes sont bloquées) se posent d'un clic dans la rue ; noms des rues ; boutons
« Aller à » (Forum, portes, cinéma UGC, Châtelet).

Limites : la carte OSM ne contient pas les escaliers de secours du cinéma UGC (sa sortie passe par un seul escalator, d'où une file d'attente) ;
les niveaux -1 et -2 sont pauvres dans OSM ; les hauteurs manquantes valent 18 m par défaut ; repère : origine au centre du Forum
(48.8620, 2.3470), x vers l'est, z vers le sud, niveau OSM n à l'altitude n × 6 m × écartement.
Données © contributeurs OpenStreetMap, licence ODbL.

Fluidité mesurée (navigateur intégré, 1400×860, style D, jour) : 60 images/s, 685 appels de dessin, 748 000 triangles. Ombres calculées une seule fois, portes et escalators instanciés, foule mise à jour par tiers, résolution plafonnée à 1,5.
Textures : Poly Haven (CC0) : beige_wall_001, grey_roof_01, asphalt_02, granite_tile, leafy_grass, marble_tiles, floor_tiles_06, large_floor_tiles_02, plastered_wall_02.

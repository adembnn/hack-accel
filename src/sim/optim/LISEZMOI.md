# Optimisation linéaire : flot maximal sur le graphe du Forum des Halles

Ce dossier calcule, **de façon exacte et sans bibliothèque**, la borne physique de l'évacuation : le meilleur débit possible et le meilleur temps possible, quel que soit le plan.

- `maxflow.ts` : flot maximal (Dinic) et coupe minimale. C'est la solution exacte du programme linéaire de flot (dualité flot max / coupe min).
- `borne.ts` : capacité par porte, goulot, temps minimal sur réseau étendu dans le temps, effet d'une fermeture.
- `demo-optim.ts` : `node src/sim/optim/demo-optim.ts` imprime le tableau de la démo.

## Données (`donnees/`)

- `forum-graph.json` : graphe multi-niveaux (61 nœuds : quais, zones, paliers, sorties ; 134 arcs avec `capacity_ps` en personnes/seconde, `time_s`, `kind`). Généré par `build_graph.py` (copié ici, usage dans son en-tête).
- Source : OpenStreetMap © contributeurs, licence ODbL (extrait Overpass du 22 oct. 2026). Les données dérivées restent sous ODbL ; le crédit « © contributeurs OpenStreetMap » doit rester affiché.

## Hypothèses (à vérifier sur plan)

Celles du graphe (`meta.hypotheses`) : escalator 1,4 pers/s ; escalier 0,9 pers/m/s sur 2,5 m ; couloir 1,3 pers/m/s sur 5 m ; marche 1,3 m/s et 12 s par niveau ; couloirs « déduits » entre nœuds du même niveau à moins de 70 m ; paliers créés si un escalier n'a aucun nœud proche ; ascenseurs exclus.

Ajoutées ici :
- Débit d'une porte vers la rue = largeur × 1,3 pers/s/m (SFPE). Largeurs supposées : 4 m pour une porte, 1,4 m pour les issues de secours (soit 5,2 et 1,82 pers/s).
- Les arcs du graphe se parcourent dans les deux sens, avec la même capacité.
- Le cinéma (3 000 personnes) débouche sur la « Rue du Cinéma » du niveau -3 (nœud `Z19`).
- Aucune limite de stockage dans les nœuds (on peut attendre n'importe où) : c'est optimiste, donc le temps rendu est bien un plancher.
- Réseau étendu dans le temps : pas de 10 s, durées des arcs arrondies au pas le plus proche (au moins un pas), soit une précision de l'ordre de quelques pas.

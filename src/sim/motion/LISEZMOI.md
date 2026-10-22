# Prototype foule-mouvement (ticket #8, prototype adoptable, pas le lot officiel)

TypeScript pur, sans dépendance, Node 24. Tests : `node --test src/sim/motion/motion.test.ts`. Bench : `node src/sim/motion/bench.ts`.

- `navgrid.ts` : interface `NavGrid` (cellules 0,5 m par niveau, liens verticaux, portes avec largeur et état, sorties).
- `testgrid.ts` : grilles de test (salle + porte, bâtiment à 2 niveaux).
- `field.ts` : itinéraires (Dijkstra inverse, liens verticaux inclus, ascenseurs exclus en évacuation).
- `crowd.ts` : modèle à vitesse sans collision (CFS, Tordeux 2016), escalators à débit (arrêtables), densité et pression de Helbing (densité x variance de vitesse).

Limites connues : la pression de Helbing est nulle quand tout le monde est à l'arrêt (modèle sans force, vitesse nulle) ;
débit d'escalator, vitesses de liens et escalator arrêté sont des valeurs de démonstration non calées ;
le budget de 8 ms par pas pour 5 000 personnes n'est pas atteint (voir `bench-resultats.txt`).

# src/scene : jumeau 3D du Forum des Halles

- `scene.json` : le lieu (bâtiments IGN, rues, intérieur OSM niveaux 0 à -5, portes, bouches, liens verticaux). Chaque valeur non documentée porte `estime: true`.
- `navgrid.json` : la grille praticable à 0,5 m, un niveau par plan, liens verticaux, portes et sorties. Lue par `navgrid.ts` (`Navigation`).
- `contrainte.ts` : l'événement `contrainte` `{id, type, niveau, x, y, largeur_m, etat}` (bus `BusContraintes`).
- `leviers.ts` : les leviers du juré au format commun `{code,id,nom,type,x,z,niveau,etat,source,effet}`, ids `porte-<k>`, `issue-<j>`, `bouche-<i>`, `ascenseur-<i>`, `toggleLever(id)`, événement `levier`, zones D1/D2. Branchés sur `contrainte` dans les deux sens. Noms et issues : `acces-forum.json` (recherche, extrait de `reports/maquettes/chatelet-3d/issues.json`).
- `motiongrid.ts` : `versMotionGrid(navgrid)`, raccord avec le moteur de mouvement (#8) : niveaux réels, dimensions propres à chaque niveau (pas de rembourrage), tableaux partagés, tout en mètres.
- `vue/` : la vue 3D unique (Three.js, style D procédural sans texture). `npm run dev:scene` puis http://localhost:5174/. Les épingles lisent et commandent `Leviers` ; `vue/projection.ts` porte la logique pure testée.
- `vue3d.html` : ancienne vue provisoire de Titouan (CDN, textures), gardée tant que `vue/` ne couvre pas la foule, la nuit et les styles A/B/C.

## Écart connu : ouest des niveaux -1 et -2

Quatre issues (côté piscine 1 à 3, issue ouest niveau -2) sont à 80 à 200 m de toute cellule praticable : l'extrait OSM de `refuge-data` n'a presque aucun couloir à l'ouest du Forum (UGC). La grille élargie de `build_navgrid.py` s'appuie sur le `scene.json` plus riche de la maquette ; la porter demande de réextraire ces couloirs, pas seulement de recopier le script. Ces issues restent `sur_grille:false` et `estime:true` : fermer l'une d'elles émet bien `contrainte` mais n'agit pas sur la grille.

## Régénérer scene.json et navgrid.json

Sans réseau, depuis les extraits déjà téléchargés (dossier `refuge-data/data`, voir son `SOURCES.md`) :

    npm run scene:generer                       # défaut : ../../../../refuge-data/data, ou la variable REFUGE_DATA
    node src/scene/generer.ts --data <dossier>  # ou en précisant le dossier

La sortie est reproductible octet pour octet (le test `reproductibilité` le vérifie quand les données sont présentes ; il est ignoré sinon).

## Tests

    npm run test:scene      # node --test src/scene/*.test.mts, sans réseau

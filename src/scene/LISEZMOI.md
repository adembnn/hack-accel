# src/scene : jumeau 3D du Forum des Halles

- `scene.json` : le lieu (bâtiments IGN, rues, intérieur OSM niveaux 0 à -5, portes, bouches, liens verticaux). Chaque valeur non documentée porte `estime: true`.
- `navgrid.json` : la grille praticable à 0,5 m, un niveau par plan, liens verticaux, portes et sorties. Lue par `navgrid.ts` (`Navigation`).
- `contrainte.ts` : l'événement `contrainte` `{id, type, niveau, x, y, largeur_m, etat}` (bus `BusContraintes`).
- `leviers.ts` : les leviers du juré au format commun `{code,id,nom,type,x,z,niveau,etat,source,effet}`, ids `porte-<k>`, `issue-<j>`, `bouche-<i>`, `ascenseur-<i>`, `toggleLever(id)`, événement `levier`, zones D1/D2. Branchés sur `contrainte` dans les deux sens. Noms et issues : `acces-forum.json` (recherche, extrait de `reports/maquettes/chatelet-3d/issues.json`).
- `vue3d.html` : vue 3D provisoire (le portage complet de la vue de la maquette est le lot suivant).

## Régénérer scene.json et navgrid.json

Sans réseau, depuis les extraits déjà téléchargés (dossier `refuge-data/data`, voir son `SOURCES.md`) :

    npm run scene:generer                       # défaut : ../../../../refuge-data/data, ou la variable REFUGE_DATA
    node src/scene/generer.ts --data <dossier>  # ou en précisant le dossier

La sortie est reproductible octet pour octet (le test `reproductibilité` le vérifie quand les données sont présentes ; il est ignoré sinon).

## Tests

    npm run test:scene      # node --test src/scene/*.test.mts, sans réseau

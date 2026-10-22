# Générer un lieu à partir d'une adresse (prototype de Titouan, 22 oct. 2026)

`lieu.mjs` : adresse (ou lat/lon + rayon) → scène 3D + grille praticable, depuis OSM (ODbL) et la BD TOPO (Licence Ouverte 2.0).
Mesuré : 5 rue La Boétie 34,7 s à froid (0,3 s avec cache) ; Forum des Halles 60,8 s à froid (2,5 s avec cache). Le goulot est Overpass (95 %), qui a été saturé deux fois : repli sur la BD TOPO seule.
**L'intérieur des bâtiments est estimé** (marqué `estime: true`) : plans réels à fournir par le gestionnaire du lieu.
Rapports : `17-metafore-geodonnees.md` (géodonnées, temps, limites) et `16-metafore-boetie-lieu.md` (lieu, plans publics, capacités).
Prototype hors lots : aucun fichier d'un lot n'est modifié.

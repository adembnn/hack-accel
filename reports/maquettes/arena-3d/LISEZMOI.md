# Vue 3D de l'Adidas Arena et de la Porte de la Chapelle (22/10/2026)

Copie de la vue Châtelet (branche `maquette/chatelet-3d`), recentrée sur l'Adidas Arena (56 bd Ney, 75018 ; OSM way 861084938 :
8 000 places, 5 niveaux, ouverte en 2024). Même pile : three.js r128, page HTML unique, aucune étape de build.

Ce que donne OpenStreetMap autour de l'Arena (zone d'environ 1,5 km × 1,5 km) : 785 bâtiments avec hauteurs, 1 740 tronçons de rues,
17 places piétonnes, 60 arrêts (métro Porte de la Chapelle ligne 12, tram T3b, bus), 72 bouches d'incendie, 1 424 arbres, 10 stations Vélib.

Ce qui manque : l'intérieur de l'Arena est presque vide dans OSM (3 surfaces, 0 porte, 0 escalier intérieur, 0 tribune).
Contrairement au Forum des Halles, il faut le dessiner : bol de tribunes, coursives, portes d'accès, parvis. Sources possibles :
plan de salle publié par la billetterie, photos Wikimedia Commons, vue aérienne IGN (affichage). Tout ce qui est dessiné est étiqueté « estimé ».

Différences avec Châtelet : niveaux au-dessus du sol (0 à +4) et pas en sous-sol ; foule de sortie de match ou de concert vers
un seul nœud de transport (métro 12 + T3b) au lieu d'un pôle multi-lignes ; rues larges (boulevard Ney, périphérique, avenue de la Porte de la Chapelle).

Lancer :
```bash
cd reports/maquettes/arena-3d && sh recuperer-osm.sh && python -m http.server 8768
```
puis http://127.0.0.1:8768/index.html (bouton caméra « Arena » pour le gros plan).

Pièges ajoutés : sous Windows, `build_scene.py` doit ouvrir les fichiers en UTF-8 (corrigé ici) ; Overpass sature souvent, réessayer
(le serveur principal a répondu, kumi.systems était plein). Données OSM générées (`data/`, `scene.json`) jamais commitées.

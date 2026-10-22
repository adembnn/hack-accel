# Vue 3D du 5 rue La Boétie · Metafore (lieu du hackathon)

Même vue que la maquette Châtelet (style D « Paris texturé », ombres, orbite, isolation de niveau), centrée sur 48.874291, 2.318655, rayon 250 m.
Bâtiments voisins, rues et arbres : données réelles (IGN BD TOPO, OpenStreetMap). **Intérieur du n°5 : ESTIMÉ** (aucun plan relevé) : emprise BD TOPO extrudée sur 6 niveaux de 3,2 m, escalier, ascenseur et cloisons supposés, entrée par le porche du n°5 (point adresse projeté sur la façade). Un bandeau permanent et chaque fiche au clic le rappellent.

Lancer : `python -m http.server 8771 --bind 127.0.0.1` dans ce dossier, puis http://127.0.0.1:8771/index.html (`scene.json` est commité, < 100 Ko).
Regénérer : `DATA_DIR=<refuge-data>/data/metafore ./generer.sh`. Sans `tex/`, rendu procédural (aucune texture téléchargée).
Retiré par rapport à Châtelet : évacuation, leviers, cortège, directeur, métro/RER.

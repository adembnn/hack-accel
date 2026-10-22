# Leviers du juré à l'Adidas Arena

Codes et effets repris tels quels du catalogue de l'équipe (`reports/catalogue-contraintes.md`, branche `decisions/geste-du-jure`, ticket #13).
Généré par `leviers_arena.py` dans `scene.json` (clé `leviers`). Dans la vue (`?sty=M`), un poteau par levier, couleur = famille, rouge = fermé ou actif ; double-clic ou `toggleLever(id)` pour basculer ; chaque bascule émet l'événement `levier` (pour la régie et le moteur).

| Code | Perturbation | Objets à l'Arena | Réel ou estimé |
|---|---|---|---|
| C1 | Station fermée | 4 accès du métro 12 Porte de la Chapelle (bd Ney, rue de la Chapelle, rue Raymond Queneau, rond-point de la Chapelle), la station entière, tram T3b Porte de la Chapelle et Colette Besson | réel (OSM) |
| B1 | Issue bloquée | entrée publique unique (angle av. de la Porte de la Chapelle / bd Ney, FAQ adidasarena), 4 vomitoires diagonaux | réel (plan NP2F) |
| B1 | Issue bloquée | 9 issues de secours lues comme ouvertures de façade | estimé |
| B3 | Escalator arrêté | 2 escalators dessinés sur le plan (hall sud, hall est) | estimé (position lue sur le plan) |
| B5 | Ascenseur en panne | 4 ascenseurs aux noyaux de circulation | estimé |
| D1 / D2 | Manifestation / troubles | 4 zones proposées : parvis Alice Milliat, bd Ney est, av. de la Porte de la Chapelle, sous le périphérique | zones à poser par le juré |
| D5 | Colis suspect | un point + périmètre (50 m, non sourcé) pendant 60 min (Forum des Halles, 2 nov. 2017) | à poser |
| F1 | Information tardive | retard de l'annonce au public, en minutes | paramètre |

À remplacer dès qu'on a mieux : positions réelles des issues de secours, des escalators et des ascenseurs (plans de niveaux du dossier de presse Solideo).

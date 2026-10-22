# Écran de démo du juré (style Matrix)

Page : `src/app/ui/index.html` (+ `ui.js`, sans dépendance, sans réseau externe).

- `npm run dev` puis http://localhost:5173/src/app/ui/index.html
- ou n'importe quel serveur statique lancé à la racine du dépôt (`python -m http.server`) ; en `file://` le navigateur bloque `fetch` : utiliser les deux sélecteurs de fichiers « Fichiers locaux » (scene.json, résultats).
- Paramètres : `?scene=URL` et `?resultats=URL`.

## Gestes du juré
Sortie (clic = fermer/rouvrir), C1 bouche de métro fermée, B1 issue bloquée, B3 escalator arrêté, B5 ascenseur en panne, D1/D2 zones (barrage 60 m / 25 m), D5 colis suspect (barrage fermé 50 m), F1 curseur de retard d'annonce.
Chaque geste émet sur `window` un événement `contrainte` (`detail` = `Contrainte` de `src/scene/contrainte.ts`). F1 n'a pas de géométrie : événement `perturbation` `{code:'F1', retard_min}`. La consigne libre du juré émet `consigne`. Correspondance d'états : bloquée = bloquee, escalator arrêté et colis suspect = fermee.
Pour écouter : `window.addEventListener('contrainte', e => console.log(e.detail))`. Journal : `window.refugeUI.contraintes`.

## Sélecteurs de démo (demo/parcours.json)
`[data-etape='2']` scène chargée, `[data-action='lancer']` puis `[data-etape='3']` fil d'alertes, `[data-entree='jury']` + `[data-action='envoyer']` puis `[data-etape='4']`, `[data-etape='5']` panneau avant/après avec sa source.

## Format du fichier de résultats (JSON libre)
```
{ "source": "exemple" | "simulation" | ..., "rejeu": true, "titre": "...",
  "metriques": [ { "cle", "libelle", "unite", "avant", "apres", "sens": "haut_mieux" | "bas_mieux" } ],
  "serie": [ { "t_s": 0, "tension": 0..1, "points": [ [x_m, z_m, niveau], ... ] } ],
  "alertes": [ { "t_s": 60, "niveau": "info" | "alerte" | "critique", "texte": "..." } ] }
```
`resultats.exemple.json` porte `source: "exemple"` : valeurs de remplissage et positions tirées au hasard (`node src/app/ui/generer-exemple.mjs`), affichées avec la mention « EXEMPLE, à ne pas citer ». Aucun chiffre réel. Le vrai moteur doit écrire le même format avec sa propre source.

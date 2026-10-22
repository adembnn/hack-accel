# Lancer la démo

La démo est une page 3D servie par un petit serveur Node : le Forum des Halles, sa foule simulée, la régie en strips de contrôle, les ordres à la voix compris par Claude et les personnages pilotés par Claude Haiku.

## 1. Une seule fois : récupérer le code et les données

```bash
git clone https://github.com/adembnn/hack-accel.git
cd hack-accel/reports/maquettes/chatelet-3d
bash recuperer-osm.sh        # télécharge OpenStreetMap dans data/ et construit scene.json
python build_navgrid.py      # grille de marche 1 m par niveau : navgrid.json
npm install                  # dépendances du serveur (SDK Anthropic, zod)
```

`data/`, `scene.json` et `navgrid.json` sont générés : ils ne sont jamais commités.

## 2. La clé Anthropic

À la racine du dépôt, créer `.env` à partir de `.env.example` et remplir `ANTHROPIC_API_KEY=` (jamais dans un commit, jamais dans un chat). Sans clé, la page marche quand même : les ordres passent par des règles simples au lieu de Claude.

## 3. Démarrer le serveur

```bash
cd reports/maquettes/chatelet-3d
node serveur.mjs
```

Ouvrir **http://127.0.0.1:8767/chatelet-3d/index.html** dans Chrome. Pour changer de port : `PORT_MAQUETTE=8780 node serveur.mjs`. Vérifier que Claude est branché : http://127.0.0.1:8767/api/etat doit répondre `"claude":true`.

## 4. Les plans conseillés (explorateur)

La baie « À trancher » affiche les 3 meilleurs plans calculés par l'explorateur. Pour les produire (environ 40 min sur un PC portable, 16 fils) :

```bash
node src/explorateur/explorer.mjs --fils 16
```

Le résultat est écrit dans `reports/maquettes/commun/plans-forum.json` (donnée générée, non commitée). Sans ce fichier, la baie l'indique et le reste de la démo fonctionne.

## 5. Les gestes de la démo

| Geste | Où | Ce qu'on voit |
|---|---|---|
| Lancer l'évacuation | bouton « Évacuer » (barre du haut) | la foule part, les compteurs bougent |
| Fermer les stations | onglet Agir → « Fermer les bouches (19 oct.) » | les quais ne servent plus de sortie, alertes dans la baie |
| Poser une manifestation | « + Manifestation » puis clic dans la rue | les portes voisines sont évitées |
| Donner un ordre | champ « Dire un ordre » ou bouton « Micro » (Chrome) | ex. « Poste une équipe porte du Louvre » : Claude l'exécute |
| Choisir un plan | baie à gauche → « Proposer » | la décision passe dans « Fait », les portes concernées s'allument |
| Suivre une personne | clic sur une silhouette | sa sortie la plus sûre et son trajet |
| Voir chaque niveau | bouton « Caméras » | un écran par niveau et par sortie chargée |
| Revenir à l'ancien écran | « Ancienne vue » | tous les panneaux d'origine |

## 6. La vidéo

Vidéo de secours (1 min 12, voix off Gradium) : [`docs/video/demo-secours.mp4`](docs/video/demo-secours.mp4).

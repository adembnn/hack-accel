# Décideurs branchés sur le moteur d'Adem (branche proto/integration-adem)

Question : les décideurs du lot decideurs tournent-ils sur `reports/maquettes/chatelet-3d/sim.js` (3 200 personnes, vraie grille du Forum), assez vite pour une démo en direct ? Réponse : **oui, la boucle tourne de bout en bout, sans réseau ni clé, et 2 000 personnes sur 12 minutes simulées coûtent environ 6 s** (contre plusieurs minutes avec `src/sim/motion`). Modèle simplifié, non certifié.

Lancer : `npm run demo:integration-adem` (écrit `bench/integration-adem/resultats.json`, `source: "simulation"`) ; options `-- --personnes 3200 --horizon 15 --graine 7`. Tester : `npm run test:integration-adem` (≈ 16 s).

## Préparer les données (gitignorées)

`navgrid.json` et `scene.json` ne sont pas versionnés. Les mettre dans `reports/maquettes/chatelet-3d/` : soit `./recuperer-osm.sh` puis `python3 build_navgrid.py` (demande `numpy`), soit copier les fichiers déjà construits d'un autre worktree. Ici ils ont été copiés depuis `wt-sync` (le `numpy` manquait et rien n'a été téléchargé) : `navgrid.json` contient bien les liens d'ascenseurs (`asc`) de la version d'Adem. Sans eux, la démo s'arrête avec un message et les tests sont sautés.

## Ce qui est fait

- `moteur.ts` charge `sim.js` **sans le modifier** : le fichier est enveloppé dans une fonction (ses déclarations deviennent locales ; un contexte `vm` était 6 fois plus lent : 20 ms par pas contre 3 ms), avec un `Math.random` à graine (`mulberry32`) : même graine, mêmes résultats (testé). Un cache des champs de pentes (Dial, ~60 ms chacun) évite de les recalculer quand une sortie se rouvre dans le même état.
- `simulateur.ts` : `SimulateurAdem` implémente `Simulateur`/`Grille` du lot decideurs. Contrairement à `CrowdSim`, sim.js avance **minute par minute sans rejouer depuis t = 0** : `avancer(plan, 1)` = 600 pas de 0,1 s.
- `chaine.ts` / `demo.ts` : « avant » = la même boucle, mêmes perturbations, aucun décideur n'agit ; « après » = backend `rules`. Rédacteur en rejeu (cache rempli par gabarit), chiffres vérifiés par le code. `fetch` remplacé par une fonction qui échoue.
- Population : tirée par `simSpawn` (55 % cinéma, 20 % RER, reste clients). Zones des décideurs = `ugc` (spectateurs du cinéma) et `niveau_0` à `niveau_-4` (niveau d'origine ; le -5 est rangé avec le -4). Les effectifs du `Scenario` sont les effectifs réels du tirage.

## Ce qui est appliqué à sim.js

| Entrée des décideurs | Effet dans sim.js |
|---|---|
| `plan.portes[p] = fermee`, SORTIE, B1 | groupe de sortie fermé, champ de pentes recalculé, les personnes déjà en route hésitent puis rechoisissent (comportement d'Adem) |
| C1 stations fermées (et `heure_fermeture_stations`, `stations_fermees_minute`) | groupe « Quais RER et métro » fermé |
| B3 escalators arrêtés (et `hors_plan.escalators = arret`) | l'escalator devient un escalier (0,55 m/s, 2 pers./s) : un escalator arrêté reste praticable à pied |
| B5 ascenseurs en panne | lien supprimé |
| D2 troubles / D5 zone fermée sur une rue du périmètre | porte correspondante bloquée (D5 : jusqu'à `minute + duree_min`) |
| D1 manifestation | porte marquée « zone à éviter » (−1,5 dans le choix de sortie) |
| F1 retard d'information | `SIM.delay` (tous les départs retardés) |
| `plan.phasage_salles` | les gens de la zone ne partent pas avant l'heure donnée |
| `plan.confinement` | les gens de la zone ne partent pas tant que le confinement dure |
| `plan.guidage` / `renforts_portes` | agent posté à la porte (+2,739 dans le choix de sortie à moins de 40 m) |
| `plan.messages_par_zone` | si le texte nomme une porte : bonus +1 pour cette porte et départ plus rapide des gens de la zone |

Les perturbations (événement `contrainte`) arrivent par une seconde copie de la liste passée à `lancerBoucle` (le `Simulateur` ne reçoit que le plan), le `hors_plan` par `surMinute` (donc **avec une minute de retard**).

## Écarts honnêtes (ce que le moteur ne supporte pas ou que l'adaptateur simplifie)

1. **C1 : tout ou rien.** sim.js ferme l'ensemble des quais d'un coup ; fermer une seule station n'existe pas. La cible est ignorée (signalée).
2. **B3 / B5 : cibles par nom impossibles.** Les escalators d'OSM n'ont pas de nom, les ascenseurs ont quelques noms (`Ascenseurs Lescot`...). Cible acceptée : `tous`, un indice, un nom, ou une porte (liens à moins de 40 m). Sinon ignorée et signalée. « Sens unique en sortie » (`escalators`) : sim.js n'a pas de sens d'escalator, sans effet.
3. **D1 / D2 / D5 : seules les rues Berger et Rambuteau** sont rattachées à une porte (comme dans `evenements.ts`). Les autres zones du périmètre (Sébastopol, passage des Lingères...) n'ont aucune porte : sans effet. D5 sur une zone intérieure : non supporté. La foule de manifestants n'existe pas dans sim.js (seulement la porte évitée ou bloquée).
4. **`canopee` et `parking_turbigo`** n'ont aucune sortie dans sim.js : les fermer ne change rien. « Rue de Rivoli » (sortie de sim.js) n'a pas de porte nommée, elle reste ouverte.
5. **Guidage par zone, messages par zone.** Le guidage des décideurs cible souvent une zone (`ugc`, `niveau_-1`...) ou une porte ; seules les portes comptent. Le nombre d'agents n'est pas pris en compte (agent présent ou non). L'annonce est globale pour la sortie nommée (sim.js n'a pas d'annonce par zone) ; seule l'accélération des départs est propre à la zone. La `clarté` d'un message n'existe pas.
6. **`mode` du plan** (rester ouvert, fermer par étapes, fermer) : sans effet propre, seules les portes comptent. Constaté en démo : le mode reste `rester_ouvert` alors que 3 portes sont fermées.
7. **Hors plan non transmis** : `correspondances`, `sorties_metro` (les 8 sorties numérotées ne sont pas dans sim.js), `parking_vagues`, `coordination_ugc_ratp`, `perimetre_couvre_feu`, `demande_fermeture_stations`, `minute_annonce` (l'alerte part à la première minute, la minute d'annonce du scénario est la minute 0).
8. **`EtatResume`** : `pression_max` (Helbing) non fournie, sim.js ne la calcule pas. `densite` par zone = densité maximale (cellule de 1 m, comme `SIM.dmax`) vue sur 12 échantillons par minute chez les personnes de la zone ; `sortis_vers_zone_danger` = `SIM.zoneOut` (sorties par Berger et Rambuteau, plus les portes marquées zone par D1). `debit_portes` = sorties de la minute par porte (clés : id de porte ou nom du groupe de sim.js).
9. **Pas de période calme.** Les personnes gardent leur place du tirage (le cinéma est assis) et l'alerte part à t = 0 ; le délai de départ est log-logistique (médiane 40,5 s pour le cinéma, 30 s pour les autres, 20 s pour le RER). Pas de tampon de 20 h 07 : les stations ne ferment pas dans l'horizon sauf perturbation C1.
10. **Les escaliers de secours du cinéma UGC sont absents d'OSM** (limite d'Adem) : sa sortie passe par un seul escalator, d'où les files (`densite_max` de 4 à 5 pers./m², sous le seuil d'écrasement mesuré dans la grille).
11. **Hasard.** sim.js tire sur `Math.random` : on le remplace par un générateur à graine (la population est la même pour « avant » et « après », les décisions de chacun divergent ensuite). Un seul tirage par graine : les écarts avant/après de quelques personnes sont du bruit, pas un gain démontré.
12. **Décideurs en mode `rules`.** Ils répètent les mêmes leviers chaque minute et ne choisissent qu'entre fermer quelques portes et annoncer. En démo, fermer Berger et Rambuteau fait passer les sorties vers la zone de danger de 73 à 4 sur 2 000 personnes, mais allonge le t90 (238 s → 252 s) : c'est un compromis, pas une victoire. `écrasement` = 0 (aucune cellule ne dépasse 5 pers./m² plus d'un échantillon).
13. **Non fait** : Claude réel, Jev, serveur Aiven, vue 3D branchée sur les résultats, `numpy` absent donc `build_navgrid.py` non relancé ici.

## Temps réel mesuré (Node 24, cette machine, un seul fil)

| Population | Horizon | Durée d'une simulation | ms par pas (moyenne) |
|---|---|---|---|
| 800 | 10 min | 2,2 s | 0,35 |
| 2 000 | 12 min | 6,1 s | 0,84 |
| 3 200 | 15 min | 11,8 s | 1,3 (7 ms au tout début, 0,2 ms en fin) |

Le coût est dominé par les premières minutes (tout le monde bouge) ; chargement du moteur : ~0,7 s (calcul des champs de pentes de 11 sorties). **Sous 10 s pour 2 000 personnes sur 12 minutes : une démo en direct est possible**, pour 3 200 personnes il faut ~12 s (réduire l'horizon à 10 minutes passe sous 10 s). Chiffres ms/pas du navigateur d'Adem (3,1 ms pour 3 200) : non comparables (autre moteur V8, pas de mesure d'échantillonnage).

## Fichiers

- `bench/integration-adem/resultats.json` : avant/après, t90, zone de danger, densité, leviers, textes vérifiés, écarts, temps réels par minute.
- `bench/integration-adem/rejeu-textes.json` : cache de rejeu du rédacteur.

# Plan : jumeau 3D d'évacuation du Forum des Halles

## Contexte
Hack Accel AI Innovate Paris (22 oct. 2026). Cas réel : lundi 19 oct. 2026, vers 19h20, couvre-feu préfectoral (Châtelet,
République) ; l'UGC Ciné Cité Les Halles évacue en pleine séance (~3 000 spectateurs, consigne « sortez par où vous êtes
rentrés ») ; métro et RER Châtelet fermés à 22h ; manifestation interdite à 20h au nord-est. Utilisateur : le directeur du
centre. L'outil reconstruit le vrai Forum (niveaux 0 à -5) et ses rues à ~1 km, simule la foule comme de vraies personnes,
laisse poser des contraintes, explore les plans possibles, les note avec une grille issue de l'état de l'art, et fait
décider puis expliquer le meilleur plan par des agents décisionnels. Critères du jury et livrables : fin de
`kickoff/0-cadrage.md`. Recherche : `reports/` (25 rapports) + branches de Titouan.

## Décisions tranchées pendant le grill
- Lieu : Forum des Halles, niveaux 0 à -5 (surface, Canopée, jardin, galeries, UGC 27 salles sur -2/-3, piscine
  Suzanne-Berlioux et Forum des images à -3, salle d'échange RER à -4/-5), rues à ~1 km. Exactement comme en vrai, à partir
  de toutes les sources publiques (OSM intérieur : ~760 objets `indoor`, 190 portes, 194 escaliers, 107 escalators, 29
  ascenseurs ; IGN BD TOPO ; IDFM ; presse) ; ce qui manque est dessiné à la main et étiqueté « estimé ».
- Population à 19h20 : ~3 000 spectateurs UGC + clients + voyageurs RER en flux calés sur les validations IDFM (~5 000).
- Rendu : 3D temps réel, plusieurs modes commutables (fil de fer de Titouan, maquette d'architecte v1, autres) et plusieurs
  caméras (orbite, dessus, coupe par niveau, hauteur d'homme, suivi d'une personne). Collisions partout.
- Foule « comme de vraies personnes » : modèles publiés (mouvement, décision humaine, groupes, suivisme), calés sur mesures.
- Grille de jugement : filtre de faisabilité, puis dans l'ordre (1) personnes non sorties à 22h et 23h (dont mobilité
  réduite), (2) exposition à la zone de danger (dont culs-de-sac devant une station fermée), (3) écrasement (personnes-
  minutes au-dessus de 5 pers./m², pression de foule de Helbing) ; puis délai et continuité. Détail sourcé :
  `/Users/adem/.claude/plans/clever-waddling-wave-agent-a68bc6b017e5f7d7f.md`.
- Agents décisionnels : modèle de décision **Jev** (API TypeSafe, clé `TYPESAFE_API_KEY` remplie par Adem) pour les quatre
  décideurs (préfecture, RATP, sécurité, directeur), chacun limité à ses vrais leviers ; **Claude** rédige l'explication et
  l'ordre de service, chaque chiffre vérifié. Aucun appel payant sans accord d'Adem.
- Garde-fou : manifestation et fauteurs de trouble = contraintes neutres (zones, issues, flux), jamais d'agent hostile.
- Démo : ouverture sur une carte de Paris en 3D, clic sur les Halles. Le moment où le jury agit et le script complet sont
  repoussés jusqu'à ce que le produit soit visible.

## Lots (un responsable, une branche, des dossiers à soi, une vérification bloquante)
Règles du harnais : ticket « Lot » + branche `lot/<nom>` + dossiers ; fichiers partagés selon `tools/lot.mjs` (PARTAGE) ;
fusion seulement par `node tools/fusionner.mjs`. Étape de `demo/SCRIPT.md` : à remplir quand le script sera écrit.

| Lot | Responsable | Dossiers | Ce qu'il livre | Bloqué par |
|---|---|---|---|---|
| `socle` | Adem (orchestrateur) | config partagée, `src/app/` squelette | Vite + TypeScript, scripts lint/typecheck/test/build, déploiement Aiven Runtime, PostgreSQL Aiven branché, un cas réel de bout en bout (une porte fermée change le résultat) | rien |
| `jumeau-3d` | Adem | `src/scene/`, `src/app/` | vrai Forum 0 à -5 + rues 1 km depuis OSM/IGN/IDFM, `scene.json`, rendu temps réel, modes et caméras commutables, collisions avec le décor, clic sur portes/escalators/ascenseurs/bouches | socle |
| `foule-mouvement` | Sullyvan | `src/sim/motion/` | déplacement et collisions entre personnes et avec les murs (forces sociales ou modèle à vitesse), escalators à débit, densité locale, pression de foule | socle |
| `foule-decision` | Alexandre | `src/sim/behavior/`, `bench/` | départ, choix de sortie (logit), groupes, suivisme, changement d'avis ; calage sur mesures publiées (Jülich, cinéma) ; benchmark avant/après (consigne du 19 oct. contre plan recommandé, mêmes graines) | socle |
| `decideurs` | Titouan | `src/agents/`, `src/server/` | quatre décideurs Jev sur un tableau commun, leviers réels, boucle décider-simuler-noter chaque minute, mémoire des runs dans PostgreSQL Aiven, explication et ordre de service par Claude avec vérificateur de chiffres | socle, coutures |
| `pitch` | Adem | `demo/`, `pitch/`, `kickoff/` | script de 3 min, slide, MP4, TXT de la couche de données, nom et pitch d'une ligne | tous (MP4) |

## Coutures (à écrire dans chaque ticket avant de coder)
- `scene.json` (jumeau-3d → foule, rendu) : niveaux {id, altitude}, zones praticables par niveau (grille 0,5 m),
  obstacles, portes {id, niveau, segment, largeur, état}, escalators et escaliers {id, de, vers, débit, état},
  ascenseurs {id, niveaux, état}, sorties {id, type rue/métro/RER, niveau, zone de danger ou non}.
- Décision → mouvement : à chaque pas, par personne {id, sortie cible, vitesse voulue, groupe, état}.
- Mouvement → rendu et métriques : images {t, positions et états des personnes} ; métriques de la grille par run.
- Décideurs ↔ simulateur : `plan` {portes ouvertes/fermées, phasage des salles, guidage par sortie, annonce, confiner} ;
  retour : métriques de la grille + état résumé.
- Stockage Aiven : PostgreSQL (scènes, runs, décisions, mémoire) ; ClickHouse pour les positions si le volume le demande.

## Ordre d'exécution après approbation
1. Commiter le travail en cours (rapports, skills Pocock ajoutés, `CLAUDE.md`) et copier la grille de critères dans
   `reports/criteres-jugement-crise.md`.
2. Recherche Keenable approfondie sur la géométrie exacte du Forum (plans, dimensions, portes, capacités) et extraction OSM
   complète avec géométrie, gardée en local pour ne pas dépendre du réseau.
3. Maquette v2 dans le scratchpad : vrai Forum, vues commutables, collisions, moteur v1 branché derrière la couture
   « mouvement », pour que l'équipe se voie dans le produit ; itération avec Adem.
4. Création des 6 tickets « Lot » avec coutures, puis socle traversé de bout en bout avant tout travail en parallèle.

## Vérification
- Maquette et lots : `node tools/verif.mjs` vert, plus `node bench/sim.mjs` (100 % des personnes sorties ou comptées
  « non sorties » à l'heure limite, 0 personne dans un mur, temps par pas mesuré à 600 puis 5 000 personnes).
- Rendu : page ouverte dans le navigateur intégré, capture, console sans erreur, une porte fermée en direct.
- Chaîne complète : `node tools/capture.mjs --demo` vert sur `demo/parcours.json` réécrit pour le Forum.
- Benchmark : fichier avant/après généré par script ; 100 % des chiffres de l'explication retrouvés dans le journal.

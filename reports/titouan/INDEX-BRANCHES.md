# Branches poussées par Titouan (22 oct. 2026, 12h40) : où regarder

Rien n'est sur `main`. Chaque branche est autonome ; les prototypes des lots d'autres personnes ne prennent aucun ticket (adopter, adapter ou ignorer).

| Branche | Lot / sujet | Preuve rapportée (à relancer : `node tools/verif.mjs`) | Limites |
|---|---|---|---|
| `lot/decideurs` (#10) | 46 leviers, perturbations #13, 3 conflits, vérificateur de chiffres, Claude Haiku 5.5 (outils JSON) et Sonnet 5.5, rejeu | 69 tests, verif verte | faux simulateur ; Claude jamais appelé ; format de l'API à confirmer au 1er appel |
| `lot/aiven` (#11) | schéma PostgreSQL, serveur, REX, leçons, SSE, TXT couche de données | 20 tests sur base locale, verif verte | non déployé sur Aiven ; failles de l'audit en cours de correction |
| `proto/socle` (#6) | Vite, TypeScript, Dockerfile, /sante | verif verte, e2e 2/2 | Docker build non testé |
| `proto/jumeau-3d` (#7) | scène 0 à -5, grille 0,5 m, événement `contrainte` | 9 tests sur 10 (1 ignoré) | niveaux -1, -2, -5 estimés |
| `proto/foule-mouvement` (#8) | mouvement 5 000 personnes | 7 tests | 21,65 ms/pas (budget 8) ; moteur d'Adem plus rapide |
| `proto/foule-decision` (#9) | comportement, grille, benchmark, plans candidats | 17 tests ; C5 : zone de danger -53 %, t90 +10 % | scène illustrative |
| `proto/pitch` (#12) | script, slide, voix off, questions pièges | n/a | rien d'exécuté ; champs A_REMPLIR |
| `proto/ui` | écran du juré « Matrix » | vu dans le navigateur | chiffres d'exemple |
| `proto/adaptateurs-pg` | stockages PostgreSQL pour les décideurs | 7 tests sur base locale | rôle `enseigne_ecriture` à autoriser sur Aiven |
| `proto/memoire` | REX, calibration, rejeu contrefactuel | 11 tests | avec/sans mémoire : aucun effet mesuré |
| `proto/integration` | chaîne complète avec notre moteur | 3 tests | trop lent en direct (12 à 87 ms/pas) |
| `proto/lieu` | générer un lieu depuis une adresse ; 5 rue La Boétie | 15 contrôles | intérieur estimé ; Overpass saturé parfois |
| `sync/titouan` | recherches 01 à 19 | n/a | recherche, pas du code |

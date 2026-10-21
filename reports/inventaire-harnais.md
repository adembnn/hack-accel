# Inventaire des harnais Claude Code (Voodoo et Build Challenge)

Date : 21 oct. 2026. Lecture seule : aucun fichier des deux harnais n'a été modifié.
Cible : hackathon d'un jour, web app + agents IA + base Aiven, 4 personnes, démo le soir.
Version lue : Build Challenge sur la branche `claude/project-thread-78e20q` (celle qui est ouverte). Une version plus récente existe sur `origin/lot/atelier` (commits du 15 au 16 oct.) : codeur, petites-mains, revue-ux-2taps, testeur-identification et verificateur-wording n'existent que là ; revue-finale y passe en Sonnet ; settings y met `model: opus`, `effortLevel: medium` et `CLAUDE_CODE_SUBAGENT_MODEL: sonnet` ; verifier_claude.py y refuse un Opus en sous-agent. Les verdicts tiennent compte des deux.
Runtimes présents sur ce PC : python3 (3.14.2, alias WindowsApps), node 25.6.0, git 2.53, gh 2.98, bash (Git Bash).

## 1. Tableau par composant

Légende : n/a = pas d'agent (hook, script, skill, config). Modèle = celui déclaré dans l'en-tête de l'agent.

### Voodoo (jeu web, 1 jour) : C:\Users\Adem\repos\Voodoo-Hack

| Fichier | Rôle | Modèle | Verdict (et ce qu'il faut changer) |
|---|---|---|---|
| CLAUDE.md | règles, boucle de travail, horaire | n/a | ADAPTER : garder les règles 1, 2 et 7 (démo d'abord, rien de fini sans l'avoir vu, build cassé bloquant) ; retirer Three.js, Gemini et l'horaire du 26 sept. |
| LISEZMOI.md | mode d'emploi, installation, agents | n/a | ADAPTER : une page pour 4 personnes, Git configuré sur chaque PC. |
| .claude/settings.json | permissions allow, ask, deny ; 3 hooks | n/a | REPRENDRE la structure (deny .env, ask sur push, deny sur push forcé) ; ajouter les motifs de la base Aiven. |
| hooks/debut-session.mjs | SessionStart : heure, temps avant gel, état git | n/a | ADAPTER : date codée en dur (2026-09-26), donc périmée : il n'affiche que « Préparation ». Lire la date dans un fichier. |
| hooks/garde-fou.mjs | PreToolUse : bloque push forcé, lecture ou ajout de .env, rm -rf, git clean -f | n/a | ADAPTER : bon principe (code 2) ; ajouter DATABASE_URL et les mots de passe en clair. C'est une regex, donc contournable. |
| hooks/fin-de-tour.mjs | Stop : build obligatoire, puis commit auto à chaque réponse | n/a | ADAPTER : garder le blocage « build cassé » ; abandonner le commit auto sur une branche partagée (4 personnes, conflits). |
| agents/auditeur-juice.md | vérifie le retour de chaque action | Sonnet | ABANDONNER : spécifique au jeu (hitstop, trauma). |
| agents/chasseur-de-wow.md | 7 idées de surprise chiffrées en minutes | Opus | ADAPTER : passer en Sonnet (Opus réservé à l'orchestration, votre règle) ; garder le format « coût en minutes ». |
| agents/coupeur.md | gardien du temps et du périmètre | Sonnet | REPRENDRE TEL QUEL : utile pour une démo d'un jour (voir section 4). |
| agents/critique-aaa.md | note /10, refus sous 7 puis sous 8 | Opus | ABANDONNER : une note chiffrée ne mesure rien. Garder « 5 corrections max, précises ». |
| agents/directeur-artistique.md | 3 directions visuelles, jugement de captures | Opus | ABANDONNER pour un jour (3 directions et planches = demi-journée). Garder l'exigence de références fournies par Adem. |
| agents/inspecteur-harnais.md | audit du harnais lui-même | Opus | ABANDONNER : verifier_claude.py (Build Challenge) fait les contrôles mécaniques sans Opus. |
| agents/jury-simule.md | 3 juges simulés, seconde de décrochage | Sonnet | ADAPTER : utiliser les critères réels du jury. Jamais présenté comme une validation. |
| agents/playtesteur.md | QA par profils de joueurs, script Playwright | Sonnet | ADAPTER : garder le test piloté par script, réduire à 2 profils (spammeur, utilisateur perdu). Possède Write. |
| agents/red-team-ia.md | 25 attaques contre l'IA du jeu | Sonnet | ADAPTER : envoie 25 requêtes à l'IA réelle, interdit sans votre accord. Prévoir un mode cache. |
| skills/anti-slop | liste noire AI slop (3D, HUD, texte, IA) | n/a | ADAPTER : garder les sections HUD et texte-IA, fusionner avec creatif-anti-slop. |
| skills/demo-2min | script 2 min, mode démo, régie F1 à F9, vidéo de secours | n/a | REPRENDRE TEL QUEL : le plus transférable des deux harnais. |
| skills/direction-artistique | méthode 3 directions, figer les tokens | n/a | ABANDONNER pour un jour. Garder la palette de 5 tokens. |
| skills/discipline-code | règles git, build, travail à deux | n/a | ADAPTER : réécrire la partie git (branches, pas d'auto-commit partagé) ; garder « état exposé aux tests » et modules de moins de 300 lignes. |
| skills/game-feel | table chiffrée de juice | n/a | ABANDONNER. |
| skills/ia-en-jeu | l'IA interprète en JSON borné, le code arbitre ; latences ; injection | n/a | REPRENDRE le principe et la table de latence. Fournisseur (Gemini) à valider par vous. |
| skills/moments-wow | 4 ressorts de surprise, banque d'idées | n/a | ADAPTER : garder les 4 ressorts et « le jury crée ». Le reste est spécifique au jeu. |
| skills/rendu-premium | recettes Three.js, budgets GPU | n/a | ABANDONNER. |
| skills/son | identité sonore | n/a | ABANDONNER (sauf un son de démo si le temps le permet). |
| tools/capture.mjs | Playwright : captures, erreurs console, images/s ; code 1 si erreur | n/a | ADAPTER : paramètre d'URL, sortie dans reports/ (votre règle), retirer les métriques de contraste propres au jeu. |
| tools/planche.mjs | compare captures et références art | n/a | ABANDONNER. |
| tools/installer.ps1 | installe deps, Playwright, scripts npm, pack externe | n/a | ADAPTER : garder l'idée. Retirer le pack externe installé sans version figée, et le Read-Host. |
| demo/SCRIPT.md | tableau de 5 moments : temps, touche, voit, dit, wow | n/a | REPRENDRE TEL QUEL. |
| demo/parcours.json | étapes rejouées par capture.mjs | n/a | REPRENDRE le format ; réécrire le contenu. |
| src/art/tokens.js | valeurs visuelles dans un seul fichier | n/a | ADAPTER : palette, polices, durées. |
| art/references/LISEZMOI.txt | dépôt d'images de référence | n/a | ABANDONNER. |

### Build Challenge (app iOS, 2 jours, 3 personnes) : C:\Users\Adem\Build Challenge\repo

| Fichier | Rôle | Modèle | Verdict (et ce qu'il faut changer) |
|---|---|---|---|
| CLAUDE.md (18,6 Ko) | faits du dépôt, décisions datées d'Adem | n/a | ADAPTER : garder le format « décision datée » ; retirer le contenu Apple, MWM et Poké ; 2 pages au plus, car chargé à chaque session. |
| .claude/settings.json | allow, deny, ask ; 4 hooks | n/a | ADAPTER : garder deny sur .env, push vers main, push forcé et --no-verify ; retirer XcodeBuildMCP et console-mwm-ai. |
| hooks/contexte.py | SessionStart : injecte lot, fiche, dossiers, test | n/a | ADAPTER : un fichier de 4 lignes par personne, au lieu du parseur de tableau. |
| hooks/garde-lot.py | PreToolUse : écriture hors du dossier du lot refusée | n/a | REPRENDRE LA LOGIQUE (c'est ce qui sépare 4 personnes qui codent) ; adapter la lecture de la table. |
| hooks/preuve.py | Stop : bloque l'arrêt tant que la vérification est rouge (3 refus) | n/a | ADAPTER : une réponse qui finit par « ? » passe sans test. Faille à boucher. |
| hooks/formate.sh | PostToolUse : swift format | n/a | ABANDONNER (Swift seulement). |
| agents/relecteur-code.md | relecture : frontières, plantages, tests | Sonnet | ADAPTER : remplacer les règles Swift par celles de votre stack. Garder ✓ ou ✗ et les points [BLOQUANT]. |
| agents/relecteur-apple.md | refus probables App Store | Sonnet | ABANDONNER. |
| agents/relecteur-regles.md | règles de pêche sourcées | Sonnet | ABANDONNER. Le motif « l'IA propose, la table décide » reste utile. |
| agents/revue-finale.md | relecture de main contre la check-list et la démo | Opus (branche lue), Sonnet (origin/lot/atelier) | ADAPTER : garder la partie démo, retirer Apple. Modèle à trancher (question 1). |
| agents/testeur-ecran.md | constate « vu ou pas vu » avec le texte lu | Sonnet | ADAPTER : Playwright au lieu du simulateur. Garder « constate, ne corrige pas ». |
| agents/banc-utilisateur.md, banc-avocat.md | faux utilisateurs, 3 passages, consensus 2 sur 3 | Sonnet | ABANDONNER pour un jour (9 profils de 3 passages, trop de temps et de jetons). |
| skills/lot/SKILL.md | rappel du lot, plan de 4 lignes, attente du ok | n/a | ADAPTER : garder le plan de 4 lignes (votre règle). |
| skills/fusion/SKILL.md | relecteurs, vérification, fusion | n/a | ADAPTER : un seul relecteur de code suffit pour un jour. |
| skills/point/SKILL.md | point de 3 lignes avec la sortie de preuve | n/a | REPRENDRE TEL QUEL (c'est votre règle de point d'étape). |
| skills/ecran/SKILL.md | lance testeur-ecran, ouvre les captures | n/a | ADAPTER : Playwright. |
| skills/banc, skills/envoi | banc d'essai ; envoi TestFlight | n/a | ABANDONNER. |
| githooks/pre-commit | refuse commit hors lot, .env, mot interdit | n/a | ADAPTER : garder le refus de .env ; retirer Apple et Poké. |
| githooks/pre-push, pre-merge-commit | refuse tout push direct vers main | n/a | REPRENDRE TEL QUEL : protège le coéquipier qui code sans Claude. |
| scripts/verif.sh | sections ✓ ✗ · sauté ; jamais de vert silencieux | n/a | ADAPTER : sections build, tests, lint, e2e. |
| scripts/fusionner.sh | seul chemin vers main : merge, contrôle du diff, vérif, push | n/a | ADAPTER : garder le contrôle « le diff reste dans le lot » ; retirer l'étiquette v1.0-soumise et le nom de branche codé en dur. |
| scripts/lot.sh | crée un worktree git par lot | n/a | ADAPTER : une branche par personne suffit sur 4 PC (worktree = plusieurs sessions sur un même PC). |
| scripts/env.sh | crée .env vide depuis env.exemple, sans lire les valeurs | n/a | REPRENDRE TEL QUEL (votre règle « Secrets ») ; sous Git Bash, `code .env` ouvre l'éditeur. |
| env.exemple | noms de variables | n/a | ADAPTER : noms de la base Aiven et des clés IA. |
| scripts/docteur.sh | diagnostic ✓ ✗ avec commande de réparation | n/a | ADAPTER : Node, npm, git, gh, claude, accès Aiven. Le reste est Mac. |
| scripts/envoi.sh, cloud-pret.sh, donnees.sh | TestFlight, Docker Swift, téléchargement de release | n/a | ABANDONNER. |
| .github/workflows/verif.yml | CI Linux swift:6.4 à chaque push | n/a | ABANDONNER pour un jour (Swift). |
| .mcp.json | XcodeBuildMCP et MCP MWM | n/a | ABANDONNER. |
| .gitignore | .env*, données générées, build Apple | n/a | ADAPTER : garder .env* et les données générées. |
| docs/lots.md | tableau : branche, dossier, test qui bloque, personne | n/a | ADAPTER : 4 lignes, une par personne. |
| docs/parcours-demo.md | étapes E1 à E9, test « fini » par étape | n/a | REPRENDRE le concept (critère commun de tous les lots) ; 5 à 7 étapes. |
| docs/README.md | plan, choix par défaut, questions | n/a | ADAPTER : une page. |
| docs/fiches/ (24 fiches, H0 lue) | gabarit : avant de commencer, dossiers, consigne, test, pièges | n/a | ADAPTER : garder le gabarit ; les fiches sont trop longues pour un jour. |
| outils/atelier/verifier_claude.py (hors liste, appelé par les hooks) | contrôle des agents : modèle, pas d'Opus en sous-agent, pas de Write pour les relecteurs, pas de tiret cadratin | n/a | REPRENDRE : vérifie vos agents en une commande. La version de la branche lue ne refuse pas Opus. |
| outils/atelier/lots.py (hors liste) | parseur de docs/lots.md | n/a | ABANDONNER : remplacé par un tableau de 4 lignes. |

### Skills personnels (claude-config)

| Fichier | Rôle | Modèle | Verdict (et ce qu'il faut changer) |
|---|---|---|---|
| kickoff-projet/SKILL.md | cadrage, terrain, divergence, crash-test jury, emballage, nom | Sonnet ; Opus à l'étape 4 | ADAPTER : budget de 2 h trop long pour un jour (section 3). |
| creatif-anti-slop/SKILL.md | idéation sans convergence, interdits, critique neuf | n/a | REPRENDRE TEL QUEL. |

## 2. Mécanismes-clés

### Voodoo (10 points)
1. Démarrage : debut-session.mjs donne l'heure, le temps avant le gel de 18 h et l'état git (périmé, voir section 4).
2. Garde-fou : garde-fou.mjs bloque (code 2) le push forcé, la lecture ou l'ajout de .env, rm -rf et git clean -f.
3. Fin de réponse : si src/ a changé, `npm run build` doit passer, sinon Claude doit réparer avant de s'arrêter (une seule relance grâce à stop_hook_active).
4. Sauvegarde : build vert, puis git add -A et commit « auto HH:MM » à chaque réponse ; annulé si un .env est indexé.
5. Pilotage par script : window.gameState (JSON) et window.gameHooks (actions) permettent aux agents de tester sans cliquer. C'est le contrat à reprendre pour une web app.
6. Les yeux des agents : tools/capture.mjs ouvre la page (Playwright), capture, relève les erreurs console et les images/s ; code 1 si erreur ou écran vide.
7. Critère unique : demo/SCRIPT.md au seconde près ; demo/parcours.json rejoue les étapes. Règle : hors script, c'est brut, jamais montré.
8. Mode démo : ?demo=1 fige la graine, met l'IA en cache, ajoute une régie clavier F1 à F5 et F9 de panique ; npm run video fait la vidéo de secours.
9. Jugement : 9 agents, dont 4 en Opus ; critique-aaa prend la plus basse de 6 notes, refuse sous 7 puis sous 8, une fois par heure au plus.
10. IA en jeu : l'IA interprète en JSON à schéma borné, le code arbitre ; latences 100 ms, 300 ms (attente habillée), 2,5 s puis réponse de secours ; le texte du joueur est encadré comme donnée.

### Build Challenge (10 points)
1. Propriété : un lot = une branche lot/<nom>, une personne, des dossiers permis, le tout dans docs/lots.md (source unique).
2. garde-lot.py : refuse Edit ou Write hors des dossiers du lot ; .env et le projet Xcode sont toujours refusés ; ATELIER_LIBRE=1 lève le contrôle et le signale à chaque écriture.
3. contexte.py : à l'ouverture de session, injecte le lot, sa fiche, les dossiers permis, la commande de test et 4 règles (9 000 caractères au plus).
4. preuve.py : à la fin de réponse, lance verif.sh --rapide ; rouge = Claude ne peut pas s'arrêter, 3 refus au plus ; une réponse qui finit par « ? » passe sans test.
5. verif.sh : sections documents, lots, atelier, Core, App ; une partie non lancée est écrite « · sauté », jamais de vert silencieux.
6. fusionner.sh : seul chemin vers main. Arbre propre, merge de origin/main, refus si le diff sort du lot, vérification complète, push ; le crochet pre-push refuse tout autre envoi vers main.
7. Crochets git (.githooks) : mêmes règles pour un coéquipier sans Claude (pas de commit sur main, fichiers du lot, pas de .env). Contournables par --no-verify, sauf deny côté Claude.
8. Relecteurs en lecture seule (Sonnet) : verdict ✓ ou ✗, points [BLOQUANT] ou [à voir], 10 points au plus, « Non vérifié : » pour ce qui n'est pas prouvé.
9. Preuve à l'écran : testeur-ecran et /ecran rendent « vu » ou « pas vu » avec le texte exact lu. Le banc signale, il ne valide jamais.
10. Secrets et modèles : env.sh crée .env vide sans lire les valeurs ; verifier_claude.py (branche origin/lot/atelier) refuse un Opus en sous-agent ; deny sur .env et sur push vers main.

## 3. Ce que les skills imposent

kickoff-projet (phases et sorties, dans l'ordre) :
- Étape 0, cadrage, 10 min : 5 questions (brief mot pour mot, ambition a, b ou c, équipe, savoir d'Adem, avantage injuste). Sortie : kickoff/0-cadrage.md, 20 lignes au plus, avec la carte de rejet.
- Étape 1, terrain : 4 agents Sonnet (officiel, cas réels, existant et jury, communautés), 150 lignes au plus chacun. Sortie : kickoff/1-terrain.md, une page. Arrêt court pour Adem.
- Étape 2, diverger : 6 angles en sous-agents neufs, 6 à 8 idées chacun, avec % LLM. Sortie : kickoff/2-idees.md et un top 10. Si la liste est trop sage, on relance tout.
- Étape 3, creuser : Adem coche 2 à 4 pistes, un agent Sonnet par piste. Pas de section, de nom ni de pitch. Arrêt : Adem choisit le concept.
- Étape 4, crash-test jury : un critique Opus en contexte neuf. Sortie : 5 failles, 3 questions dures avec réponse, parades réintégrées dans kickoff/3-concept.md.
- Étape 5, emballer : 3-concept.md (une page), 4-demo.md (3 min, colonnes écran et voix), 5-pitch.md (prose, sans puces), formats imposés comptés, passage par creatif-anti-slop.
- Étape 6, nom : brief en 3 lignes, 20 noms avec %, vérification de disponibilité, 5 noms présentés à Adem.
- Pilotage : point de 3 lignes après chaque étape ; budget de 2 h pour les étapes 0 à 4 ; si l'étape 2 est relancée deux fois, retour au cadrage.

creatif-anti-slop (impose et interdit) :
- Impose : connaître le terrain avant l'idée ; 2 ou 3 références d'Adem ; au moins 30 idées avec % LLM, dont 10 sous 10 % ; angles séparés (contrainte, inversion, avantage injuste, expert, transfert) ; test de l'IA décorative ; converger avec un critique neuf qui garde 3 idées ; recommencer plutôt qu'itérer.
- Interdit : chatbot, dashboard, « plateforme qui aide X », assistant généraliste, extension qui alerte, garde-fou d'agents IA. Textes : « ce n'est pas X, c'est Y », triplets, ton promo, « en conclusion », tirets cadratins en rafale, emojis dans les titres. Design : Inter, Roboto, Space Grotesk, dégradé violet vers bleu, hero centré, cartes identiques, grille à trois colonnes. Code : commentaires qui répètent le code, catch qui ne fait que logger.
- Impose une cible positive : une police, deux couleurs, une seule audace.

## 4. Différences entre les deux harnais et apprentissages

Différences :
1. Taille : Voodoo = un dépôt, un jour, une personne à la fois. Build Challenge = 3 personnes, 2 Mac, cloud, 2 à 3 jours, App Store.
2. Propriété des fichiers : Voodoo = convention écrite (CLAUDE.md, ligne 32). Build Challenge = appliquée par hook, table et crochet git.
3. Commits : Voodoo commit à chaque réponse. Build Challenge = un commit par lot, fusion gardée par script.
4. Jugement : Voodoo = notes /10 et seuils. Build Challenge = verdicts binaires, preuve citée, « Non vérifié ».
5. Modèles : Voodoo = 4 agents en Opus, 5 en Sonnet, aucun Haiku. Build Challenge = Sonnet en sous-agent, Haiku pour le mécanique, Opus dans la session principale seulement.
6. Écriture : Voodoo a des agents avec Write (playtesteur, red-team, auditeur) ; Build Challenge met ses relecteurs et testeurs en lecture seule.
7. Coupe : Voodoo garde coupeur (« supprimer avant d'ajouter ») ; Build Challenge l'a retiré le 15 oct. (« on ne coupe pas »). Pour une démo d'un jour, la coupe reste utile.

Apprentissages visibles (décisions datées d'Adem dans le CLAUDE.md de Build Challenge) :
- Convention devenue garde-fou : le découpage de Voodoo est devenu garde-lot.py, pre-push et lots.md.
- Coût : « ça crame trop de tokens » (15 oct., 18 h 19) a produit Sonnet en sous-agent, contrôlé par verifier_claude.py.
- Preuve : « jamais fini sans la sortie » est répété dans le contexte injecté, dans /point et /fusion, et bloqué par preuve.py.
- Honnêteté : « non vérifié veut dire non fusionné » ; une partie sautée est dite ; le banc ne valide jamais.
- Secrets : Voodoo filtre par regex ; Build Challenge ajoute deny, hook et env.sh (ouvre l'éditeur, ne lit jamais les valeurs).
- Public : chaque skill commence par « Tu parles à une personne débutante ». Voodoo, règle 8, en est la version de départ.
- Démo : « parcours de démo d'abord » (Voodoo) devient docs/parcours-demo.md, critère commun de tous les lots.

Anomalies à corriger avant de reprendre :
- Build Challenge : la branche lue n'a ni codeur, ni petites-mains, ni les agents repris, alors que la fiche H0 les décrit sur origin/lot/atelier. Reprendre depuis cette branche.
- revue-finale est en Opus sur la branche lue, alors que CLAUDE.md dit « jamais d'Opus en sous-agent » ; /envoi le lance en Opus.
- Build Challenge preuve.py : la sortie par « ? » permet d'éviter la vérification.
- Voodoo debut-session.mjs : date périmée. Voodoo installer.ps1 : pack externe installé sans version figée.
- fusionner.sh (branche lue) : nom de branche codé en dur.

## 5. Questions pour vous (à trancher avant de construire)

Décor : les deux harnais servent de base, et ces 5 choix changent les hooks et le temps passé.
1. Modèle de la revue finale : a) Opus, votre règle globale pour la revue finale ; b) Sonnet, décision du projet Build Challenge (15 oct.). Ma reco : b, pour le coût sur un jour. Par défaut : b.
2. Fournisseur IA du hackathon : a) Gemini, comme dans Voodoo ; b) autre API (à nommer) ; c) cache seul, sans appel réel. Le choix vous revient. Par défaut : a.
3. Git à 4 : a) une branche par personne, un PC chacun (ma reco) ; b) worktrees, comme Build Challenge. Par défaut : a.
4. Kickoff : a) étapes 0 à 4 compressées à 1 h 30 (ma reco) ; b) budget de 2 h du skill. Par défaut : a.
5. Coupe : a) garder coupeur (ma reco pour un jour) ; b) le retirer, comme Build Challenge. Par défaut : a.

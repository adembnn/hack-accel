# Audit du harnais (inspecteur-harnais, 21 oct. 2026)

**Note : 5/10.** La structure est saine : les 4 étiquettes existent sur GitHub, tous les `.mjs` passent `node --check`, les `.githooks` passent `sh -n`, tous les agents sont en Sonnet, les skills Pocock n'appellent que des skills présents. Mais les trois verrous qui font la promesse du harnais (garde-fou, preuve, fusion) ont chacun un trou prouvé par test, et le chemin « ticket créé par /to-tickets » casse le garde-fou.
Méthode : copie jetable du dépôt (sans remote, sans `.env`), entrées JSON simulées, `GH_REPO` vers le vrai dépôt en lecture seule. Rien posté, rien fusionné, aucun ticket touché.

## Sorties des tests (extraits)
```
node --check x10 .mjs : OK · sh -n .githooks/* : OK · settings.json, parcours.json : JSON valide
garde-fou, commandes (code de sortie 2 = bloqué) :
[2] push --force origin main            [2] push --force-with-lease (variante sûre)
[2] git push -u origin lot/x && gh pr create -f   <- FAUX POSITIF (-f = --fill)
[2] git add src/config.env               <- FAUX POSITIF
[2] git commit -m "fix: more .env.local handling"  <- FAUX POSITIF (lecture .env)
[2] echo "git push --force est interdit" > notes.txt <- FAUX POSITIF (même ma session d'audit a été bloquée 2 fois)
[0] push origin +main  [0] push --delete origin main  [0] grep KEY .env  [0] sed -n p .env
[0] node -e readFileSync(.env)  [0] Select-String -Path .env  [0] cp .env /tmp/x  [0] rm -rf ./*
[0] rm -fr .  [0] git clean --force  [0] commit --no-verify  [0] git config core.hooksPath /dev/null
garde-fou, éditions (ticket #1 = lot/ingestion, Dossiers src/ingest/) :
main : [2] src/ingest/a.ts  [2] package.json  [0] tools/verif.mjs  [0] .claude/hooks/garde-fou.mjs
lot/ingestion : [0] src/ingest/a.ts  [2] src/ecran/a.ts (n'autorise que src/ingest/)
  [0] backend/server.ts  [0] services/api/index.ts  [0] scripts/seed.ts  [0] tests/ingest.test.ts  [0] index.ts
  [0] .claude/worktrees/impl-1/src/ecran/a.ts  [0] ../hack-accel-wt/src/ecran/a.ts  [0] package.json
lot/nouveau : [2] aucun ticket ouvert ne mentionne `lot/nouveau` ; cache écrit {"trouve":false}
cache négatif posé il y a 5 min sur lot/ingestion (ticket #1 existe) : [2] aucun ticket ouvert ne mentionne `lot/ingestion`
fin-de-tour, règle « preuve » (20 phrases françaises) : faux positifs 9, faux négatifs 3
FAUX+ « La variable DATABASE_URL est définie dans .env.example. »   FAUX+ « Je teste d'abord le flux, puis je vérifie »
FAUX+ « Pas encore terminé ni fini »   FAUX+ « Règle : « fini » = vérification verte »   FAUX+ « Quand le lot sera fini, lance… »
RATÉ « Ça marche, j'ai testé à la main. »  RATÉ « Le ticket #4 est vérifié. »  (\b ASCII : é et ç ne sont pas des lettres)
fin-de-tour, vérification et .env :
1. test rouge non commité, 1er Stop      -> exit 2 (« ❌ test a échoué : 1 failing »)
2. même état, stop_hook_active=true      -> exit 0   3a. .env indexé -> exit 2   3b. idem, 2e Stop -> exit 0
4. test rouge COMMITÉ, arbre propre      -> exit 0 (aucune vérification lancée)
gh avec corps multi-ligne (execSync, comme fin-de-tour.mjs:36) : Windows/cmd.exe -> « gh non appelé », aucune erreur ;
  sh (macOS/Linux) -> le texte du log entre ``` est EXÉCUTÉ (« echo COMMANDE_EXECUTEE » a tourné, « command not found »)
Coût mesuré : journal.mjs 277 ms par appel d'outil (node vide 86) · garde-fou 95 ms · debut-session 5,1 s pour 2 tickets
  (5 appels gh : 3 list + 2 view, environ 1 s chacun) · etat-build 1,9 s (2 appels gh) · preparer 0,8 s (1 appel gh)
```

## Défauts, par gravité

**Bloquants**
1. `garde-fou.mjs:20-33,41` → « tout via les tickets » ne s'applique qu'aux outils Edit/Write et à 9 dossiers : `cat > src/x`, `sed -i`, `backend/`, `services/`, `scripts/`, `tests/`, la racine passent (tests [0]) → inverser : tout chemin hors liste blanche du harnais (`.claude/ tools/ docs/ kickoff/ demo/ reports/ *.md`) est du code ; et dans `fusionner.mjs` refuser si `git diff --name-only origin/main...HEAD` sort des Dossiers du ticket (seule barrière qui voit aussi la voie Bash).
2. `garde-fou.mjs:39-45` → les agents travaillent en worktree : chemin hors dépôt (`..`) ou sous `.claude/worktrees/` = libre, et `git branch --show-current` lit la branche du dépôt principal, pas celle du worktree → résoudre la racine git du fichier (`git -C <dossier> rev-parse --show-toplevel`) et lire la branche de cette racine. Non vérifié en vrai worktree Claude, seulement par chemins simulés.
3. `skills/to-tickets/SKILL.md:107-117` → la surcouche ne donne pas le format que les outils lisent : `**Lot** : \`lot/<nom>\``, `**Dossiers** :` (`garde-fou.mjs:62`), `## Bloqué par` (`etat-build.mjs:18` ; le modèle anglais `## Blocked by` n'est pas lu). `gh issue create` ignore `.github/ISSUE_TEMPLATE`, donc pas d'étiquette non plus. Résultat : garde-fou refuse tout code (`:72`), état du build devine le lot depuis le titre → coller le corps modèle dans la surcouche + `--label ready-for-agent`.
4. `fin-de-tour.mjs:35-36` et `fusionner.mjs:35` → `gh` appelé par `execSync(chaîne)` avec un corps multi-ligne : sous Windows le commentaire rouge et la fermeture du ticket ne partent jamais (échec silencieux, `done` posé mais ticket ouvert) ; sous sh le log est exécuté → `execFileSync('gh', [..., '--body-file', '-'], { input })`.
5. `fin-de-tour.mjs:16` → `stop_hook_active` sort avant tout : test rouge et `.env` indexé passent à la 2e fin de réponse ; `:63` ne vérifie que l'arbre sale, un commit avant la fin de réponse échappe à la vérification → ne court-circuiter que la règle « preuve » ; vérifier aussi `origin/main...HEAD` quand l'arbre est propre.
6. `fin-de-tour.mjs:80` → règle « preuve » : 9 faux positifs sur 20 phrases (défini, je teste, je vérifie, « fini » cité) et « testé/vérifié/terminé/ça marche » jamais vus (`\b` ASCII) → flag `u`, `(?<![\p{L}])`, retirer `fini` nu, viser `(est|sont|c'est) (fini|terminé|testé|vérifié)e?s?`, ignorer ce qui est entre « » ou après `>`.
7. `verif.mjs:12-13` → package.json sans script lint/typecheck/test/build : « rien à vérifier », exit 0 : vérification verte vide. La commande propre au lot (`lot.md:8`) n'est lancée par personne (`fusionner.mjs:21`) → échouer si package.json existe sans script ; lire la ligne **Vérification** du ticket et la lancer.
8. Modèles non épinglés : `code-review/SKILL.md:60` (2 sous-agents) et `research/SKILL.md:6` n'imposent pas `model: sonnet` → ils héritent d'Opus ; `journal.mjs:118` ne fait que noter « hérité ». La règle `CLAUDE.md:29` n'est appliquée par rien → hook PreToolUse sur `Agent` qui refuse un `model` absent ou `opus`, et une ligne de surcouche dans ces deux skills.
9. `.githooks/pre-commit` et `pre-push` sont en mode 100644 dans l'index (`git ls-files -s`) : git les ignore sur macOS/Linux → `git update-index --chmod=+x` et `chmod` dans `preparer.mjs`.

**Majeurs**
10. `implement/SKILL.md:4`, `implement-spec/SKILL.md:4`, `to-tickets/SKILL.md:4`, `retro`, `handoff` : `disable-model-invocation: true`. Claude ne peut pas les appeler (absents de sa liste de skills) alors que `CLAUDE.md:36`, `LISEZMOI.md:26` et `etat-build.mjs:80` lui disent de les appliquer → retirer le drapeau sur les trois premiers (à valider avec Adem) ou écrire « tape /implement-spec #N ».
11. `debut-session.mjs:24` → « frontière » fausse : #2 (bloqué par #1) s'affiche prêt alors que `etat-build` dit « attend #1 » ; `:32-37` un `gh issue view` par ticket : ~1 s l'appel, 3+N appels (12 tickets = 15 s), timeout 30 s (`settings.json:16`) et `console.log` seulement à la fin (`:44`) : si le temps est dépassé, aucune sortie. Pas de timeout sur `git fetch` (`:13`) → un seul `gh issue list --json comments,labels,body`, filtre sur `## Bloqué par`, `timeout:` sur fetch.
12. `garde-fou.mjs:55-72` → cache négatif de 30 min : un ticket créé après un refus reste refusé (test ci-dessus) ; la recherche GitHub `in:body` est par mots, donc `lot/api` peut retrouver `lot/api-gateway` → ne pas cacher `trouve:false`, lister par étiquette et filtrer le corps en local.
13. `garde-fou.mjs:23-29` → motifs non ancrés : faux positifs `gh pr create -f`, `--force-with-lease`, `git add x.env`, messages de commit, tout `echo` qui cite une règle ; contournements listés plus haut → ancrer au début de commande ou après `; & |`, `-f` seulement après `git push`, ajouter `+ref`, `--delete`, `--no-verify`, `core.hooksPath`. Pour `.env` c'est une barrière de bonne foi, pas étanche (`grep`, `sed`, `node -e`) : ajouter les `deny` correspondants dans `settings.json`.
14. `.claude/`, `tools/verif.mjs`, `.githooks/` sont éditables par tout agent sans condition (tests [0]) : un implementer peut verdir sa propre vérification → `ask` sur `Edit(.claude/**)`, `Edit(tools/**)` dans `settings.json`.
15. `fusionner.mjs:24-28` → push de `main` (`:28`) sans rattrapage : si un coéquipier a poussé entre-temps, exception non gérée, on reste sur `main` avec un merge local. Pas de contrôle des critères cochés ni des bloquants fermés → try/catch, `git reset --hard ORIG_HEAD`, retour sur la branche du lot, relancer.
16. `capture.mjs:38` → `networkidle` ne se termine pas avec un flux SSE/WebSocket (le produit en aura) ; `:57` toute erreur console, même un 404 favicon, rend la capture rouge, or `SCRIPT.md:23` exige « tout vert » ; `:19` Playwright absent = exit 0, et `preparer.mjs` ne l'installe pas → `domcontentloaded` + attente de sélecteur, ignorer les erreurs hors domaine, installer Playwright au premier `package.json`.
17. `kickoff-projet` (`CLAUDE.md:17`) et `creatif-anti-slop` (`CODING_STANDARDS.md:13`, `chasseur-de-wow.md:23`) vivent dans le `~/.claude` d'Adem : les trois autres machines ne les ont pas → les copier dans `.claude/skills/`.
18. Aucun fichier ne dit de lancer `node tools/journal-push.mjs` (long, avec `ETAT_BUILD=1` sur une seule machine, `journal-push.mjs:126`) : sans cela, pas d'« État du build » sur Discord malgré `LISEZMOI.md:32` → l'ajouter à `LISEZMOI.md`, ou le démarrer depuis `debut-session.mjs`.

**Mineurs**
19. Références fantômes : `/setup-matt-pocock-skills` (`code-review:13`, `implement-spec:9`, `to-tickets:11,60`), `/to-spec` (`implement-spec:3`), `/grill-with-docs`, `/improve-codebase-architecture` (`docs/agents/domain.md:11`), `/triage`, `/wayfinder` (`issue-tracker.md:19,39`) → les supprimer.
20. Contradictions : `CLAUDE.md:36` (tdd aux coutures du ticket) contre `implement-spec:29` (tdd sur chaque ticket) et `tdd:22` (confirmer les coutures avec l'humain, impossible pour un sous-agent) ; `GLOSSARY.md:11` (fusionneur = sous-agent, branche d'intégration) contre `CLAUDE.md:38` et `fusionner.mjs` (script, direct sur `main`) ; `CLAUDE.md:48` puce orpheline sous « Standards de code ».
21. Horaires contre `CLAUDE.md:18` : `jury-simule.md:8` (« c'est 16h30 »), `SCRIPT.md:1` et `:19` (« 16h », « 15h30 »).
22. Rapports : `red-team-agents.md:11` écrit dans `docs/notes/`, la règle d'Adem dit `reports/` ; `captures/test-parcours.mjs` et `captures/red-team.mjs` sont dans un dossier gitignoré (`.gitignore:6`) donc perdus pour les autres machines.
23. Étiquettes : les 4 noms sont identiques partout et existent sur GitHub. Reste : `bloque` ne dit pas de retirer `in-progress` (`CLAUDE.md:39`) ni qui retire `bloque` ; `debut-session.mjs:28-29` liste ce ticket « en cours » et « bloqué » ; un ticket oublié avec `ready-for-agent` + `in-progress` est listé prêt (`:24`) ; `to-tickets:116` ne cite pas `bloque`.
24. Coût : `journal.mjs:22,29` lance 2 `git` à chaque outil (277 ms contre 86 ms) → mémoriser la branche ; `fin-de-tour.mjs:63-66` relance lint+types+tests+build à chaque fin de réponse tant que l'arbre est sale. `journal.mjs:21` lit `.env` (seulement PRENOM, mais `CLAUDE.md` dit « jamais lu »). `parcours.json:2` annonce que le champ `lot` sert à l'état du build : aucun outil ne le lit. `preparer.mjs` crée `.env` mais ne l'ouvre pas dans l'éditeur (règle globale d'Adem). `settings.json:9` : `git push` en `ask` bloque les sous-agents en arrière-plan.
25. Hors dépôt : les tickets GitHub #1 et #2 « Test harnais » (dont un faux commentaire « 🔴 vérification rouge ») apparaîtront dans l'État du build → les fermer avant le hack.

## Les 3 corrections à faire en premier
1. Garde-fou et fusion : liste blanche inversée (défaut 1), racine git du worktree (défaut 2), contrôle des Dossiers dans `fusionner.mjs` sur le diff, plus `execFileSync` pour `gh` (défaut 4).
2. Chaîne ticket : corps modèle dans la surcouche `to-tickets`, cache négatif supprimé, frontière filtrée par « Bloqué par » en un seul appel `gh` (défauts 3, 11, 12) ; sinon le premier ticket créé par un coéquipier bloque tout le code.
3. Fin de réponse : `stop_hook_active` limité à la règle « preuve », regex Unicode réécrite, `verif.mjs` rouge sans script (défauts 5, 6, 7), puis le hook qui impose `model: sonnet` sur `Agent` (défaut 8).

---

# Deuxième passe (commit ecae81f, 21 oct. 2026)

**Nouvelle note : 7/10** (avant : 5). Les trois verrous tiennent sur les cas réels testés. Il reste des contournements par Bash, une règle « preuve » trop indulgente avec « pas de souci », et la chaîne ticket n'a pas été exécutée de bout en bout (création de ticket et fusion interdites pendant l'audit).
Méthode : `git clone` du commit dans `audit/repo2`, sans remote, faux `gh.exe` (tickets fictifs, journal d'appels, rien envoyé à GitHub), vrai `git worktree`. `fusionner.mjs` relu, pas lancé.
GitHub mesuré ce soir (3 passes) : `gh issue list` 2,4 s / 1,1 s / 1,6 s, `git fetch` 3,3 s, `gh auth status` 0,8 s. Pas de 14 à 18 s au moment de ma mesure ; j'ai simulé 15 s par appel avec le faux gh.

## Verdict, défaut par défaut
1. Bash et liste blanche : **PARTIEL**. Sur main, `backend/`, `scripts/`, `index.ts`, `package.json` : [2] ; `cat > src/a.ts`, `echo >> backend/server.ts`, `tee`, `mkdir && echo > src/x/index.ts` : [2]. Passent encore [0] : `sed -i s/a/b/ src/a.ts` (le script s'intercale, `garde-fou.mjs:58`), `node -e writeFileSync`, `python -c open(..,'w')`, `git apply`, `npm install zod`, `> scripts/seed.sh` (extension absente de la liste).
2. Worktrees : **CORRIGÉ**. Vrai worktree, principal sur main : `lot/ingestion src/ingest/a.ts` [0], `src/ecran/a.ts` [2] (n'autorise que `src/ingest/`), branche `feat/hors-lot` [2], dossier inexistant `newdir/deep/a.ts` [2].
3. Corps de ticket : **CORRIGÉ** par lecture (`CORPS-TICKET.md`, `--label ready-for-agent --body-file -`). Non exécuté.
4. `gh` sans shell : **CORRIGÉ**. Le faux gh a reçu le commentaire multi-ligne par `--body-file -`, blocs ``` intacts, rien exécuté. `fusionner.mjs` en `execFileSync` : lu, non lancé.
5. Relance et commits : **PARTIEL**. `.env` indexé : [2] puis [2] à la 2e fin de réponse. Rouge : [2] puis [0] avec « Toujours rouge après relance » (voulu). Rouge commité à l'instant : [2] et commentaire posté. Rouge commité il y a plusieurs heures, arbre propre : [0] (fenêtre de 10 min, `fin-de-tour.mjs:67`).
6. Regex « preuve » : **PARTIEL**. 20 phrases : 0 faux positif (avant 9), 1 faux négatif (« J'ai testé le parcours et il fonctionne »). Mais `nie` (`:93`) est trop large : « Pas de souci : c'est fini. » [0], « Il n'y a pas de bug, le lot est terminé. » [0], « Non, je ne triche pas : tout est testé. » [0].
7. `verif.mjs` : **CORRIGÉ**. `package.json` sans script : exit 1 « une vérification vide n'est pas verte » ; test vert : exit 0 ; commande du ticket verte : `✅ lot ingestion` ; rouge : exit 1. Voir N4 et N6.
8. Modèles : **PARTIEL**. Agent sans model [2], opus [2], fable [2], sonnet [0], haiku [0] ; surcouches `code-review` et `research` en place. Mais `model: "inherit"` [0] (N5), et `subagent_type: coupeur` sans `model` [2] alors que le fichier de l'agent déclare Sonnet.
9. Crochets : **CORRIGÉ**. `git ls-files -s .githooks` : 100755 x2. Non testé sur macOS.
10. Skills invocables : **CORRIGÉ**. `grep disable-model-invocation` : seuls `handoff` et `retro` le gardent.
11. `debut-session` : **CORRIGÉ**. 1 appel gh (avant 5). #12 « attend #11 », frontière = #13 seul. Avec gh à 15 s : première ligne après 302 ms, fin après 15,5 s. Non vérifié : si le hook est tué, Claude Code garde-t-il ce qui est déjà sorti ?
12. Cache négatif et préfixe : **PARTIEL**. Ticket absent : [2] et aucun fichier cache. `lot/api` ne retrouve plus `lot/api-gateway` dans `garde-fou.mjs:97`. Mais `verif.mjs:26`, `fusionner.mjs:23` et `fin-de-tour.mjs:35` font `includes("lot/<nom>")` : sur la branche `lot/ingest`, `verif.mjs` a lancé la commande du ticket `lot/ingestion` (« ❌ lot ingest a échoué »).
13. Motifs : **PARTIEL**. Les 5 faux positifs sont partis (`gh pr create -f`, `--force-with-lease`, `git add src/config.env`, message de commit, `echo` qui cite une règle : tous [0]) ; `grep`, `sed`, `node -e`, `Select-String`, `cat < .env` : [2]. Restent [0] : `push --delete origin main` (`:42` exige `main` collé à `--delete`), `cp .env`, `python -c open('.env')`, `source .env`, `ReadAllText`, `sh -c '…--force…'`, `git -C . push --force`, et `git push origin main` direct (`git push *` est passé en `allow`, `settings.json:5`).
14. Verrous : **PARTIEL**. Avec `user.name=Titouan` : Write sur `tools/verif.mjs`, `.claude/hooks/garde-fou.mjs`, `.githooks/pre-push` [2], `echo x > tools/verif.mjs` [2]. Mais `sed -i … tools/verif.mjs` [0] et `git config user.name Adem` [0] : l'identité est un réglage git modifiable (`garde-fou.mjs:79,111`).
15. `fusionner.mjs` : **CORRIGÉ** par lecture : bloquants, Dossiers sur `origin/main...HEAD`, 3 essais de push avec retour sur le lot, `execFileSync`. Critères non cochés : simple avertissement ; GitHub injoignable : fusion sans contrôle de ticket (`:24`). Non exécuté.
16. Capture : **PARTIEL**. `domcontentloaded` et filtre favicon/tiers en place. `preparer.mjs` n'installe toujours pas Playwright (aucune occurrence) ; `capture.mjs:19` sort toujours en 0 sans lui.
17. Skills d'Adem : **PARTIEL**. `creatif-anti-slop` copié ; `kickoff-projet` (`CLAUDE.md:17`) reste dans ton `~/.claude`.
18. `journal-push` : **CORRIGÉ** dans `LISEZMOI.md:32` (une machine, `ETAT_BUILD=1`). Reste à lancer à la main.
19. Références fantômes : **PARTIEL**. `/setup-matt-pocock-skills` retiré de 3 endroits ; restent `/to-spec` (`implement-spec/SKILL.md:3`), `/setup-matt-pocock-skills` (`to-tickets/SKILL.md:59`), `/triage` et `/wayfinder` (`issue-tracker.md:19,39,54`).
20. Contradictions : **NON**. `CLAUDE.md:36` contre `implement-spec/SKILL.md:28` (tdd) et `GLOSSARY.md:11` (fusionneur) inchangés ; 3 puces de décision orphelines (`CLAUDE.md:48-50`) sous « Standards de code ».
21. Horaires : **NON**. `jury-simule.md:8` (« 16h30 »), `SCRIPT.md:1` et `:19`.
22. Rapports et scripts : **NON**. `red-team-agents.md:11` écrit toujours dans `docs/notes/` ; `captures/*.mjs` toujours gitignorés.
23. Étiquettes : **PARTIEL**. La frontière exclut les tickets `in-progress`. Inchangés : `bloque` sans retrait de `in-progress` (`CLAUDE.md:39`), `to-tickets:116` sans `bloque`.
24. Coût : **PARTIEL**. `journal.mjs` 277 → 163 ms par appel, branche lue dans `.git/HEAD` (lot « ingest » correct), `.env` plus lu (`PRENOM=Zorglub` dans `.env`, `qui` reste `adembnn`). Inchangés : `parcours.json:2` (champ `lot` jamais lu), relance complète de `verif` à chaque fin de réponse sale.
25. Tickets de test : **CORRIGÉ**. `gh issue list --state all` : #1 et #2 CLOSED.

## Nouveaux défauts
- N1 `garde-fou.mjs:104` et `fusionner.mjs:33-34` : un ticket avec Dossiers refuse `package.json`, `tsconfig.json`, `compose.yaml`, `tests/` (tous [2] sur `lot/ingestion`) : un lot ne peut ni ajouter une dépendance ni fusionner. Les mettre en liste libre, ou les déclarer dans les Dossiers.
- N2 `garde-fou.mjs:58,71` : les chemins relatifs de Bash sont résolus depuis `CLAUDE_PROJECT_DIR`, pas depuis `input.cwd`, et le texte d'un heredoc ou d'un `echo` est lu comme une commande. Trois de mes commandes ont été refusées à tort « code sur main » (deux lancées depuis le scratchpad, une dont le texte citait `sed -i … src/a.ts`).
- N3 `garde-fou.mjs:21` : `gh` sans `timeout`. Avec 15 s par appel : 15,4 s pour la première édition d'un lot (0,3 s ensuite, cache), sous la limite de 20 s ; à 21 s le hook est tué. Ajouter `timeout: 8000` et laisser passer en prévenant.
- N4 `verif.mjs:22` lit `verification` dans `journal/lot-<nom>.json`, mais `garde-fou.mjs:101` n'y écrit jamais ce champ : un appel gh à chaque `verif` sur une branche lot, donc à chaque fin de réponse sale (plus un second pour le commentaire de ticket au premier rouge).
- N5 `garde-fou.mjs:28-30` : `model: "inherit"` passe. Préférer une liste blanche `sonnet|haiku` à la liste noire `opus|fable`, et laisser passer un `subagent_type` dont le fichier déclare son modèle.
- N6 `verif.mjs:27-28` : le modèle de ticket non rempli (`<commande propre au lot, optionnelle>`) est exécuté tel quel : rouge « La syntaxe de la commande n'est pas correcte ». Une seule commande de lot est lue : une 3e commande sur la ligne est ignorée, en vert.
- N7 `preparer.mjs` : `start "" .env` ouvre l'application associée à `.env` ; sur Windows sans association, c'est la boîte « Ouvrir avec » (non observé directement ; la commande a bien été lancée sur ma copie). Remplacer par `code .env`, seulement si `code` existe.

## Les 3 corrections à faire ensuite
1. Un seul module `lot.mjs` (trouver le ticket par regex `lot/<nom>(?![\w-])`, Dossiers, Vérification, cache avec `timeout`) utilisé par garde-fou, verif, fusionner et fin-de-tour : règle N3, N4, N6 et le défaut 12.
2. Fichiers partagés de lot (N1), `input.cwd` et heredocs (N2), puis `sed -i` avec script, `--delete origin main`, et `git push origin main` hors fusionneur.
3. Règle « preuve » : `nie` limité à la même proposition (pas de franchissement de `:` ni `,`) ; puis les défauts 20, 21 et 22, de la prose qui coûte dix minutes.

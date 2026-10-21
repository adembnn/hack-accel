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

# Hack Accel : comment on travaille (à lire en 3 minutes)

Tu clones, tu ouvres Claude Code dans le dossier, et c'est tout. Le harnais fait le reste : au premier démarrage il branche les crochets git, crée ton `.env` depuis le modèle, installe les dépendances, et t'affiche les tickets prêts.

```bash
git clone https://github.com/adembnn/hack-accel.git
cd hack-accel
claude
```

Il faut sur ta machine : Node 20 ou plus, git avec ton nom (`git config --global user.name "Prénom"`), et `gh` connecté (`gh auth login`, une fois). Si quelque chose manque, le message « Préparation : … » en début de session te dit quoi faire.

## Les règles, en une image
Un **lot** = un **ticket GitHub** + une **branche `lot/<nom>`** + des **dossiers** à toi + une **commande de vérification** + une **étape du script de démo**. Tout le reste en découle :
- Tu ne codes jamais sur `main` ni sans ticket : le garde-fou te bloque, avec le message qui dit quoi faire.
- Tu ne touches pas au dossier d'un autre lot : tu commentes son ticket.
- « Fini » n'existe pas sans `node tools/verif.mjs` vert, sortie collée. Le hook de fin de réponse renvoie Claude sinon.
- On rejoint `main` seulement par `node tools/fusionner.mjs`.
- `.env` : jamais lu par Claude, jamais commité, jamais collé dans le chat. Tu le remplis dans ton éditeur.

Le détail : `CLAUDE.md` (règles et boucle de travail), `GLOSSARY.md` (les mots), `demo/SCRIPT.md` (le critère unique).

## Ta journée, en 5 commandes
1. **Prendre un ticket** (Claude le fait quand tu lui dis « prends le ticket #N ») :
   `gh issue edit N --add-label in-progress --remove-label ready-for-agent --add-assignee @me` puis `git switch -c lot/<nom>`.
2. **Construire** : dis à Claude « implémente le ticket #N » ; il lance ses sous-agents (Sonnet), coche les critères du ticket avec la preuve, et applique `implement` / `tdd` / `code-review`.
3. **Vérifier** : `node tools/verif.mjs` (Claude le lance tout seul à chaque fin de réponse).
4. **Voir la démo** : `node tools/capture.mjs --demo` (captures du parcours dans `captures/`).
5. **Fusionner** : `node tools/fusionner.mjs` (vert obligatoire ; ferme le ticket).

## Suivre l'équipe
- Discord `#agents` : « État du build » toutes les 5 min (qui est sur quoi, critères cochés, vérification rouge, lots sans signe de vie, étapes de démo couvertes). Il est publié par la machine d'Adem (`node tools/journal-push.mjs` dans un terminal, avec `ETAT_BUILD=1` dans son `.env`) ; une seule machine le fait. `node tools/etat-build.mjs` l'affiche à la main sur n'importe quelle machine.
- Discord `#tickets` : chaque ticket, commentaire, branche poussée, fusion (GitHub en direct).
- Besoin de quelqu'un ? Commente son ticket, son Claude le voit à sa prochaine session.

## Comment travailler : harnais d'orchestration et d'exécution, en parallèle

Ta session Claude Code est l'**orchestrateur** de ce lot (modèle Opus). Elle ne code pas tout elle-même : elle découpe et fait travailler des sous-agents en parallèle, exactement comme la session d'Adem.

1. **Démarrer** : `git pull`, puis `gh issue edit <n> --add-label in-progress --remove-label ready-for-agent --add-assignee @me` et `git switch -c lot/<nom>` depuis `main` à jour. Lance la boucle `/loop 5m` du LISEZMOI.
2. **Griller d'abord** : skill `grill-with-docs` sur les coutures de ce ticket avec les lots voisins (commente leurs tickets) ; consigne les décisions en commentaire ici.
3. **Découper** en morceaux indépendants (dossiers disjoints, une vérification par morceau). Si les morceaux ne sont pas indépendants, on ne parallélise pas.
4. **Paralléliser** : un sous-agent par morceau, **lancés dans le même message**, chacun dans **son worktree** (`isolation: "worktree"`), chacun avec un **modèle nommé** : Sonnet pour coder, chercher, tester ; Haiku pour inventorier et extraire ; jamais Opus en sous-agent. Skills : `implement` pour un morceau, `tdd` aux coutures, `research` pour une question.
5. **Suivre en direct** : chaque sous-agent écrit une ligne dans `avancement/<agent>.txt` (dans le scratchpad) à chaque changement de tâche (« tâche · % · temps restant ») ; l'orchestrateur les surveille avec `Monitor` (`tail -F`) et met à jour sa liste d'étapes.
6. **Recherche web** : Keenable (`search_web_pages`, puis `fetch_page_content`), plusieurs recherches à la fois ; chaque recherche nomme la décision qu'elle débloque et tient en 200 lignes ; rapports dans `reports/`.
7. **Avant le parallèle** : un cas réel traverse toute la chaîne (vraie donnée, vraie clé, vrai compte).
8. **Finir** : coche chaque critère avec la sortie de commande ; `node tools/verif.mjs` vert ; `code-review` une fois ; PR avec le skill `pr` ; `node tools/fusionner.mjs`. Pousse sur GitHub à chaque étape.
9. **Jamais** : de clé dans le chat ou dans un commit (tout vient de `.env`) ; d'appel payant à un LLM (Jev, Claude) sans l'accord d'Adem ; de modification du code d'un autre lot (un commentaire sur son ticket).

## La boucle de 5 minutes (chaque coéquipier, dans sa session Claude Code)
Les agents se parlent par les commentaires des tickets GitHub. Pour que ça tourne tout seul, lance une fois dans ta session :

```
/loop 5m Point de 5 min sur mes lots : 1) lis les nouveaux commentaires des tickets où je suis assigné ou mentionné (gh issue list --assignee @me, gh search issues --mentions @me --repo adembnn/hack-accel --state open) et réponds-y ; 2) coche dans mon ticket les critères passés, avec la sortie de commande en commentaire ; 3) si j'ai besoin d'un autre lot, je commente son ticket, je ne touche pas à son code ; 4) je poste sur mon ticket un point de 3 lignes : fait, bloquant, prochain.
```
Les tickets de décision (étiquette `bloque`) attendent Adem : ne les tranche pas à sa place, commente-les.

## Les agents critiques (dis juste leur nom à Claude)
`coupeur` (coupe ce qui ne sert pas la démo) · `jury-simule` (Accel, Aiven, l'utilisateur) · `testeur-parcours` (joue la démo, casse tout) · `red-team-agents` (attaque l'agent par la donnée) · `chasseur-de-wow` (moments de surprise en moins d'une heure) · `inspecteur-harnais` (audite le harnais).

## Sans Claude Code
Les mêmes règles tiennent par les crochets git : pas de `.env` ni de code sur `main` au commit, vérification verte au push. Les tickets se lisent sur GitHub, les commentaires aussi.

## Si ça bloque
- Le garde-fou refuse quelque chose : lis son message, il dit la manip.
- GitHub injoignable : les hooks laissent passer en prévenant ; continue, pousse plus tard.
- Playwright absent pour `capture` : `npm i -D playwright && npx playwright install chromium`.
- Tu es bloqué plus de 15 min sur une décision qui n'est pas la tienne : étiquette `bloque` sur le ticket, commentaire, et prends-en un autre.

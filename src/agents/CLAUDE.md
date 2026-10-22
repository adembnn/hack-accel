# Brancher Claude (étapes pour Titouan)

Décision d'Adem (22 oct.) : plus de Jev. Claude Haiku 5.5 (`claude-haiku-5-5`) fait les choix des décideurs : les questions oui/non, choix et score sont des outils à schéma JSON, imposés par `tool_choice`. Claude Sonnet 5.5 (`claude-sonnet-5-5`) rédige l'explication, les messages par zone et l'ordre de service, avec des jetons `{{cle}}` remplacés par le code (le vérificateur de chiffres rejette tout nombre libre). Une seule clé : `ANTHROPIC_API_KEY`. Par défaut rien n'est appelé : `DECIDER_BACKEND=rules` (règles déterministes, aucun réseau).

1. **Créer la clé** : console.anthropic.com, Settings, API Keys, « Create key ». La copier dans `.env` sous `ANTHROPIC_API_KEY=` (jamais dans le chat ni dans un commit).
2. **Poser un budget** dans la Console (Settings, Limits) : 5 à 10 $ suffisent pour la démo et les répétitions ; les crédits de l'événement (100 $ par personne) couvrent largement.
3. **Autoriser les appels payants** dans `.env` : `MODE_PAYANT=oui` (garde commune à tous les transports ; sans elle, rien ne part).
4. **Lancer le test de fumée une seule fois** :
   `node --env-file=.env src/agents/smoke-claude.mts --oui-payant`
   Il fait UN petit appel Haiku (une question à trois options), affiche la réponse et le nombre de jetons, et l'écrit dans `fixtures/claude/smoke.json`. Sans `--oui-payant` ou sans clé il refuse.
5. **Activer Claude** pour la boucle : `DECIDER_BACKEND=claude` dans `.env` et, dans le code appelant, `creerClientsDecision({ autorise_payant: true, cache: 'fixtures/claude/cache.json' })`. Le cache de rejeu scellé est consulté avant tout appel : un second passage identique ne coûte rien. Une erreur 401, 429, 529 ou un délai (15 s) fait retomber la décision sur les règles. `MODELE_DECIDEURS` change la version du modèle des décideurs.

Les rédacteurs : `RedacteurClaude` (API, Sonnet 5.5) et `RedacteurClaudeCli` (`claude -p` sans outils, abonnement) exigent la même garde. Rédaction utilisable sans réseau : `RedacteurRejeu` (cache) ou `RedacteurGabarit`.

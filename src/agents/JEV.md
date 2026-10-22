# Brancher Jev (étapes pour Titouan)

Jev est le modèle de décision de TypeSafe : il ne rédige pas, il répond par probabilités à des questions typées. Voie retenue : les 120 $ de crédits Vercel AI Gateway offerts aux participants (Jev y est servi sous `typesafe-ai/jev-1.14.0`, 0,04 $ par million de jetons d'entrée, sortie gratuite). Par défaut, rien n'est appelé : `DECIDER_BACKEND=rules` (règles déterministes, aucun réseau).

1. **Activer les 120 $** : demander au staff Accel/Iterate à l'accueil comment les activer (la remise n'est pas documentée publiquement), sur l'équipe Vercel du hackathon.
2. **Créer la clé** : tableau de bord Vercel, onglet AI Gateway, nouvelle clé API. La copier dans `.env` sous `AI_GATEWAY_API_KEY=` (ne jamais la coller dans le chat ni dans un commit).
3. **Poser un budget** de 1 à 2 $ dans Vercel (Budgets de l'AI Gateway). La démo complète coûte environ 0,02 $.
4. **Lancer le test de fumée une seule fois**, avec l'accord d'Adem :
   `node --env-file=.env src/agents/smoke-jev.mts --oui-payant`
   Il fait UN appel (une question à trois options), affiche la réponse et le nombre de jetons, et l'écrit dans `fixtures/jev/smoke.json`. Sans `--oui-payant` ou sans clé il refuse. Variante TypeSafe direct : ajouter `--direct` avec `TYPESAFE_API_KEY`.
5. **Activer Jev** pour la boucle : `DECIDER_BACKEND=jev-gateway` dans `.env` et, dans le code appelant, `creerClientsDecision({ autorise_payant: true, cache: 'fixtures/jev/cache.json' })`. Le cache de rejeu est consulté avant tout appel : un second passage identique ne coûte rien. Une erreur 401, 429 ou un délai (8 s) fait retomber la décision sur les règles.

Format vérifié le 22 oct. 2026 (pages Vercel « TypeSafe API with AI Gateway » et docs.typesafe.ai/api) : `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone`, `Authorization: Bearer <AI_GATEWAY_API_KEY>`, corps `{model, state, questions}`, question oui/non = `noul` (pas `boolean`), réponse `{model, answers, usage, provider_metadata}`.

# Jev (TypeSafe) : accès gratuit et légitime, hackathon du 22/10/2026

Recherche du 22 oct. 2026 (complète `07-jev-typesafe.md`, non refait). Aucun compte créé, aucun appel, aucune clé lue.
Légende : [E] établi par une page officielle (TypeSafe, Vercel, OpenRouter, Luma de l'événement) ; [T] source tierce non officielle ; [?] supposé ou non vérifié.

## 1. Réponse courte
1. **Voie la plus sûre : les 120 $ de crédits Vercel AI Gateway offerts à chaque participant** [E], utilisés pour appeler Jev via Vercel. Jev y est facturé comme n'importe quel modèle, sans surcoût [E]. Adem dit déjà les avoir (CLAUDE.md, cité par le fichier 07).
2. Le coût réel est de toute façon quasi nul : 0,042 $ par million de jetons d'entrée, sortie gratuite [E] https://docs.typesafe.ai/models. La démo estimée à ~0,02 $ (fichier 07) tient dans le moindre crédit.
3. **Il n'y a plus de crédit gratuit TypeSafe direct pour les nouveaux comptes** depuis le 27 sept. [T, relayant des posts @typesafeai non relus par nous] : https://madewithjev.com/jev-access, https://jevainews.com/news/typesafe-signups-paused (compte neuf vu à 0,00 $ le 6 et le 8 oct.). Les pages qui promettent « 5 $ gratuits sur console.typesafe.ai » (https://jev-ai.live/get-access, https://explainx.ai/blog/jev-general-availability-no-waitlist-2026) datent du 20-22 sept. et sont périmées [T]. Une seule source (jevainews) montre un « 5 $ free monthly credits » le 25 sept. : cas isolé, ne pas compter dessus.
4. Aucun code partenaire ni crédit TypeSafe propre à Accel Paris trouvé : la page Luma de l'événement ne cite pas TypeSafe [E] https://luma.com/0v3c010v.

## 2. Options, de la meilleure à la moins bonne

### Option A. Vercel AI Gateway avec les 120 $ de l'événement (recommandée)
- **Preuve** [E] : « What every builder gets : $120 Vercel AI Gateway credits » + prix Vercel 12 000 $ de crédits AI Gateway : https://luma.com/0v3c010v et https://aihackclub.com/hackathon/paris-accels-ai-innovate-series-hackathon-2026-10.
- **Jev sur Vercel** [E] : modèles `typesafe-ai/jev` (alias) et `typesafe-ai/jev-1.14.0` (dispo depuis le 14 oct.), entrée 0,04 $/M. Pages : https://vercel.com/changelog/typesafe-ais-jev-1-14-is-now-available-on-ai-gateway ; https://vercel.com/ai-gateway/models/jev-1.14.0.
- **Deux façons d'appeler** [E] https://vercel.com/changelog/ai-gateway-now-supports-typesafe-clients-and-http-api-for-jev et https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe :
  1. Garder le SDK TypeSafe : `new TypeSafeClient({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: 'https://ai-gateway.vercel.sh/typesafe' })`. Les appels `systemOne` et `noul` ne changent pas. **Cela colle au code prévu dans le fichier 07** (seuls la clé et l'URL changent).
  2. HTTP : `POST https://ai-gateway.vercel.sh/v1/evaluate`, modèle `typesafe-ai/jev`, types de question `boolean | choice | score`. Attention : les noms diffèrent (`boolean` au lieu de `noul`, champ `probability`). Ne pas mélanger les deux formats.
  3. AI SDK : `experimental_decide` (changelog 1.14) ou `experimental_evaluate` (changelog antérieur). Les deux noms apparaissent dans les pages Vercel : tester lequel existe dans la version installée [?].
- **Démarches (à faire par Titouan ou Adem, pas par moi)** :
  1. Se connecter à Vercel (équipe qui reçoit les 120 $). Si les crédits sont arrivés par un code ou un lien le matin de l'événement, les activer dans le tableau de bord AI Gateway : https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway [?] la méthode exacte de remise n'est pas documentée publiquement ; demander au staff Accel/Iterate à l'accueil.
  2. Onglet AI Gateway, créer une clé API (`AI_GATEWAY_API_KEY`) et la mettre dans `.env`. **La saisie de la clé est à faire par Titouan ou Adem.**
  3. Poser un plafond de dépense (budget) dans Vercel : https://vercel.com/docs/ai-gateway/observability-and-spend/budgets [E]. Cela respecte la règle « aucun appel payant sans accord ».
- **Délai** : 5 à 10 minutes si l'équipe Vercel est déjà créée et créditée. **Risque** faible : le montant est négligeable, les limites de débit existent (429), le SDK relance seul.
- **Piège** : les crédits « gratuits » du plan gratuit Vercel ne valent que pour une liste de modèles éligibles et sont limités en débit [E] https://vercel.com/docs/ai-gateway/pricing. Jev n'est pas confirmé dans cette liste (page lue : aucune mention de Jev, mais la liste a pu être tronquée [?]). Les 120 $ de l'événement sont des crédits de la passerelle : ils doivent couvrir tout modèle payant, y compris Jev [?] à vérifier par un premier appel minuscule avec accord d'Adem.

### Option B. Plan gratuit Vercel : 5 $ par mois
- [E] « $5/month included », même tarif sans marge, limites de débit plus basses, BYOK indisponible. Acheter des crédits fait passer au plan payant et supprime le crédit mensuel : https://vercel.com/docs/ai-gateway/pricing.
- [T] Une carte bancaire doit être enregistrée sinon erreur `customer_verification_required` : https://jevaiguide.com/faq/is-jev-free. Si c'est exact, **c'est une démarche que Titouan ou Adem doivent faire eux-mêmes** (je ne saisis aucune donnée de paiement).
- 5 $ couvrent des millions d'appels Jev, donc suffisant en volume ; le risque est le débit limité en démo.

### Option C. TypeSafe en direct (console.typesafe.ai)
- [E] Clé sur https://console.typesafe.ai/keys, Playground sans code sur https://console.typesafe.ai/playground (https://docs.typesafe.ai/introduction/quickstart).
- Crédit offert : non, pour les comptes créés après le 27 sept. [T]. Il faut ajouter des fonds (carte) : démarche personnelle, payante. À ne choisir que si Vercel échoue. Un compte déjà créé avant le 22 sept. peut avoir gardé 5 $ [?].
- Le Playground est le seul moyen de **tester gratuitement sans code** (quota non documenté [?]). Utile pour calibrer les questions du fichier 07 avant de coder.

### Option D. OpenRouter
- [E] `typesafe/jev-1.14` (ou `~typesafe/jev-latest`), « billed to your OpenRouter account » : https://openrouter.ai/docs/guides/community/jev ; prix 0,042 $/M entrée, sortie gratuite : https://openrouter.ai/typesafe/jev-1.14. Pas de compte TypeSafe requis [E] (cité par madewithjev).
- Pas de palier gratuit pour Jev [T] https://jevaiguide.com/errors/402-insufficient-credits : il faut déjà des crédits OpenRouter. Utile seulement si Adem en a.
- **Code « 1 000 $ de crédits » via OpenRouter** : annoncé sur https://joinsecret.com/jev-ai (partenaire Secret) [T]. Conditions : startup produit IA, site actif, page LinkedIn société avec équipe, amorçage jusqu'à série B, e-mail du domaine de la société, agences exclues, revue par OpenRouter. **Hors de portée aujourd'hui** (revue humaine, délai inconnu, nous n'avons pas de société) ; inutile pour le hackathon. Ne pas s'y inscrire pour cela.

### Option E. OpenCode Zen, `jev-1.13-free`
- [T] « limited time », endpoint `https://opencode.ai/zen/v1/systemone`, nécessite un compte et une clé OpenCode : https://jevaiguide.com/faq/is-jev-free, https://goldie.agency/jev-1-13-free. Je n'ai pas pu confirmer sur la page officielle OpenCode (la page lue ne liste pas les modèles Jev dans l'extrait). Fin de l'offre inconnue.
- À garder comme **filet d'appoint**, jamais comme dépendance de la démo. Création de compte à faire par Titouan ou Adem.

### Autres passerelles (non retenues)
- Cloudflare (`typesafe/jev`, prix sur tableau de bord), Netlify (clé injectée, crédits Netlify, plans à crédits), Pydantic AI Gateway, LiteLLM (nécessite une clé TypeSafe) [T] https://madewithjev.com/jev-access. Aucune n'offre de crédit Jev gratuit documenté.
- **n8n Cloud** : Jev était gratuit jusqu'au 10 oct. 23:59 UTC, **terminé** [E] https://community.n8n.io/t/typesafes-jev-is-now-in-n8n-free-on-cloud-via-gateway-credits-until-october-10/317957. Le perk de l'événement (1 mois de n8n Cloud Pro) existe, mais les tarifs en crédits s'appliquent maintenant.
- Promotion gratuite Vercel Jev : **terminée le 25 sept.** [T] https://jevaiguide.com/faq/is-jev-free (la page Vercel « free until September 25th » le confirme [E] https://vercel.com/changelog/ai-gateway-now-supports-typesafe-clients-and-http-api-for-jev).
- Programme étudiants ou startups propre à TypeSafe : **rien trouvé** (aucune page officielle). Sur ESSEC : aucune piste vérifiée. TypeSafe a rejoint l'AWS Generative AI Accelerator en 2024 : sans lien avec nous.
- Modèles ouverts équivalents : la page d'accueil et un dépôt tiers évoquent des modèles ouverts « System One » (https://github.com/OmniJev/awesome-jev) [T], rien d'éprouvé. Ne pas en dépendre.

## 3. Ce que Titouan ou Adem doivent faire (je ne le fais pas)
1. Demander au staff à l'accueil (08:00) comment activer les 120 $ Vercel AI Gateway si ce n'est pas déjà fait, et si l'organisation a un contact TypeSafe (peu probable [?]).
2. Créer ou ouvrir l'équipe Vercel, créer la clé AI Gateway, la coller dans `.env` (jamais dans le chat ni le dépôt), fixer un budget de 1 à 2 $.
3. Si Vercel exige une carte pour le plan gratuit : décision d'Adem, saisie par lui.
4. Donner l'accord pour **un seul premier appel** de test, puis cacher la réponse (cache de rejeu du fichier 07 §7).
5. Ajouter `AI_GATEWAY_API_KEY=` à `.env.example` (le fichier 07 parlait de `TYPESAFE_API_KEY` ; prévoir les deux pour pouvoir basculer).

## 4. Établi, supposé, contradictions
- **Établi** : prix de Jev ; Jev sur Vercel et OpenRouter ; 120 $ Vercel par participant ; plan gratuit Vercel 5 $/mois ; fin des promos n8n et Vercel.
- **Supposé** : que les 120 $ s'appliquent à Jev ; que Jev est ou non dans les « modèles éligibles » du plan gratuit ; que `jev-1.14.0` accepte les mêmes questions que 1.13 via Vercel ; durée de vie de `jev-1.13-free`.
- **Contradiction** : crédits de 5 $ oui/non. Tranché sur la date : oui du 20 au 22 sept., non depuis le 27 sept. [T]. Le plus sûr reste de ne pas compter dessus.
- Beaucoup de sites tiers (jev-ai.live, jevstation.com, jevai.website, etc.) sont des guides indépendants, parfois affiliés, aux chiffres incohérents : ne pas y créer de compte ni y payer.

## 5. Plan B sans Jev (à garder dans le lot `decideurs`)
Principe : **le choix est déjà du code, Claude rédige.** Aucun appel externe pendant le pitch.
1. **Règles déterministes** par décideur, dans `leviers.<role>.ts` : seuils de densité en niveaux nommés (fluide, dense, critique), tendance (monte, stable, baisse), sorties libres. Table de décision simple :
   `critique + monte` → fermer ; `dense + monte` → fermer par étapes ; sinon rester ouvert. Guidage en niveaux selon le même tableau ; confinement `oui` si aucune sortie libre. Même interface que l'appel Jev (`choice`, `score`, `noul`) pour basculer d'un fournisseur à l'autre en changeant une seule fonction.
2. **Probabilités factices mais honnêtes** : sorties des règles avec confiance fixée par la marge au seuil (calcul en code). Afficher « règle déterministe » et non « Jev » à l'écran, sans prétendre à une calibration.
3. **Claude via abonnement** pour la rédaction : explication, ordre de service, messages au public, à partir de la décision typée. Aucun coût d'API supplémentaire si lancé depuis Claude Code (abonnement de Titouan) ; pas de clé exposée.
4. **Rejeu** : mêmes fixtures que le fichier 07 (`fixtures/decideurs/`), `npm run test:decideurs` sans réseau.
5. **Argument de jury** : Jev n'est pas partenaire d'Accel Paris (fichier 07 §6) ; la valeur est dans la décision traçable et le jumeau 3D. Le pitch doit dire « décision typée, validée par l'humain », avec ou sans Jev.
6. **Bascule** : variable `DECIDER_BACKEND=rules|jev`. Par défaut `rules` ; `jev` seulement après un premier appel réussi et mis en cache.

## Sources
- Officielles : https://docs.typesafe.ai/models · https://docs.typesafe.ai/introduction/quickstart · https://vercel.com/docs/ai-gateway/pricing · https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe · https://vercel.com/changelog/typesafe-ais-jev-1-14-is-now-available-on-ai-gateway · https://vercel.com/changelog/ai-gateway-now-supports-typesafe-clients-and-http-api-for-jev · https://vercel.com/ai-gateway/models/jev-1.14.0 · https://openrouter.ai/docs/guides/community/jev · https://openrouter.ai/typesafe/jev-1.14 · https://luma.com/0v3c010v · https://community.n8n.io/t/typesafes-jev-is-now-in-n8n-free-on-cloud-via-gateway-credits-until-october-10/317957
- Tierces : https://madewithjev.com/jev-access · https://jevainews.com/news/typesafe-signups-paused · https://jevaiguide.com/faq/is-jev-free · https://joinsecret.com/jev-ai · https://jev-ai.org/blog/is-jev-free

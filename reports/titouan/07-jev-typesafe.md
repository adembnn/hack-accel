# Jev / TypeSafe : comment le lot `decideurs` doit l'appeler

Recherche du 22 oct. 2026. **Décision débloquée** : comment les quatre décideurs (préfecture, RATP, sécurité du centre, directeur) choisissent sur des leviers typés via `TYPESAFE_API_KEY`, sans appel payant tant qu'Adem n'a pas dit oui (ticket #10, adembnn/hack-accel). Aucune clé lue, aucun appel fait. Légende : [E] établi par la doc officielle `docs.typesafe.ai` ; [T] source tierce non officielle ; [?] supposé ou non vérifié.

## 1. Constat sur le dépôt
- `grep` de « Jev » / « Typesafe » dans `CLAUDE.md`, `GLOSSARY.md`, `kickoff/`, `reports/` : **aucune occurrence**. Le ticket #10 est la seule trace. `.env.example` ne contient pas encore `TYPESAFE_API_KEY` (il faut l'ajouter, lot `decideurs`).
- `reports/partenaires.md` ne cite pas TypeSafe : Jev n'est **pas** un partenaire du hackathon d'après nos sources (voir §6). C'est un choix d'Adem, pas une obligation.
- `reports/contraintes-forum-des-halles.md` (cité par le ticket pour les leviers réels) n'existe pas dans `reports/` au moment de la lecture. [?] Il vient peut-être d'un autre lot ; à vérifier.

## 2. Ce qu'est Jev (en français simple)
- Jev est le premier « modèle System One » de TypeSafe AI (San Francisco, lancé le 15 sept. 2026). [E] `docs.typesafe.ai/models` ; [T] presse : https://read0nly.net/2026/09/17/typesafe-ai-launches-jev-its-first-system-one-model-with-self-reported-speed-claims
- Il **n'écrit aucun texte**. On lui envoie un `state` (texte ou JSON) et des **questions typées** ; il renvoie des réponses typées avec probabilités, en environ 70 à 500 ms (chiffre du fournisseur, non vérifié par nous). [E] https://docs.typesafe.ai/primitives ; [T] https://jevapi.dev
- Trois types de question [E] :
  - **Choice** : une option parmi N, sans ordre. Renvoie `choice`, `probabilities` (une par option), `confidence`. `criteria` = objet `{option: description}`. Ex. rester ouvert / fermer par étapes / fermer.
  - **Score** : un niveau sur une échelle ordonnée (2 à 10 niveaux). Renvoie `score` (peut tomber entre deux niveaux), `legend`, `probabilities`, `confidence`. `criteria` = tableau ordonné. Ex. intensité du guidage.
  - **Noul** : oui/non. Renvoie `noul` (probabilité entre 0 et 1, pas de `confidence`). Ex. activer le confinement.
- Un `Box` apparaît dans le schéma de l'API (position dans une image) ; il exige l'en-tête `TypeSafe-Danger-Zone-Images: true`. Inutile pour nous. [E]
- Les clés des questions sont des noms libres qui **ne sont pas envoyés au modèle** : tout le sens doit être dans `instructions` et `criteria`. [E] https://docs.typesafe.ai/primitives/choice

## 3. L'API (contrat officiel)
- `POST https://api.typesafe.ai/v1/systemone`, en-tête `Authorization: Bearer $TYPESAFE_API_KEY`, JSON UTF-8. Seule autre route : `GET /v1/models`. Pas de streaming ni de lot asynchrone. [E] https://docs.typesafe.ai/api ; [T] https://learnjev.com/reference
- Corps : `model` (obligatoire, ex. `jev-1.13.0`, `jev-1.14.0`, alias `jev-latest`), `state` (chaîne, objet ou tableau), `questions` (objet nom → question). Réponse : `model`, `answers` (même noms), `usage {input_tokens, output_tokens}`. [E]
- **Tous les questions d'une requête voient le même `state` et sont évaluées en parallèle** ; la doc recommande de poser toutes les questions utiles en une seule requête et de trier ensuite dans le code (« speculative fan-out »). [E] https://docs.typesafe.ai/patterns/fan-out
- SDK officiels : Node `@typesafe-ai/sdk` (Node 22 ou plus ; helpers `choice`, `score`, `noul`, `TypeSafeClient`, lit `TYPESAFE_API_KEY`) et Python `typesafe-sdk`. Les SDK relancent seuls sur 429/529. [E] https://docs.typesafe.ai/sdk/javascript. Le SDK JS refuse de tourner dans un navigateur : clé côté serveur uniquement. [T] https://madewithjev.com/jev-access
- Erreurs : 400 (dont `max_tokens_exceeded`), 401 clé invalide, 413 corps > 32 MiB, 415 compression, 422 question mal formée, 429 limite de débit, 529 surcharge. [E] https://docs.typesafe.ai/api/errors

## 4. Limites, tarifs, accès
| Sujet | Fait | Statut |
|---|---|---|
| Prix | 0,042 $ par million de jetons d'entrée ; sortie gratuite | [E] https://docs.typesafe.ai/models |
| Contexte | 64k par requête, 32k par question (état + une question) ; 262k avec l'en-tête `TypeSafe-Danger-Zone-Long-Context: true` (plus lent, moins juste) | [E] idem |
| Modèles | `jev-1.13.0` et `jev-1.14.0` (1.14 dispo depuis le 14 oct. 2026) | [E] idem |
| Alias `jev-latest` | pointait sur 1.13.0 au 9 oct. ; **peut avoir basculé sur 1.14** depuis le 14 oct. | [T] https://developersdigest.tech/blog/typesafe-jev-system-one-models-release-guide-2026 ; [?] état actuel |
| Débit | Limites par organisation, visibles dans la console (`console.typesafe.ai/rate-limits`). Chiffres tiers contradictoires (100k jetons/s et 80 req/s vs 250k jetons/s et 1 200 req/min) | [E] principe ; [?] valeurs |
| Crédit gratuit | Des sites tiers parlent de 5 $ offerts (jusqu'au 20 sept.) ; **depuis le 27 sept. les nouveaux comptes n'ont plus de crédit gratuit** (relayé depuis des posts officiels @typesafeai). Donc l'usage est payant dès le premier appel | [T] https://madewithjev.com/jev-access ; contredit https://jev-ai.live/get-access |
| Accès | Console `console.typesafe.ai` (clés, Playground sans code, onglet « Danger zone » pour images) | [E]/[T] |
| Passerelles | Vercel AI Gateway, OpenRouter, Cloudflare servent aussi Jev [T]. Adem a 120 $ de crédits Vercel AI Gateway (CLAUDE.md) : une clé Vercel pourrait servir à payer Jev. [?] à confirmer, et le code actuel vise `TYPESAFE_API_KEY` direct |

**Coût estimé pour la démo** [supposé, calcul simple] : 4 décideurs × 60 minutes simulées = 240 requêtes ; à 2 000 jetons d'entrée chacune, 480 000 jetons, soit environ 0,02 $. Le coût est négligeable : le vrai frein est le **principe d'Adem « aucun appel payant sans mon accord »**, pas le montant.

## 5. Ce que Jev sait mal faire (important pour nos décideurs) [E]
Source : https://docs.typesafe.ai/model-jaggedness/jev-1.13 (revue le 2 oct. 2026).
1. **Lecture littérale** : il répond à la question écrite, pas à l'intention. Écrire la condition exacte.
2. **Nombres et calculs** : il ne compte pas, n'interpole pas. Garder l'arithmétique dans le code ; lui passer des niveaux nommés (« densité : critique ») plutôt que des chiffres bruts.
3. **Dates et heures** : comparer dans le code.
4. **État volumineux et bruité** : filtrer avant d'envoyer.
5. **Ordre des options Choice** : il peut influencer ; permuter et vérifier la stabilité.
6. **Pas de génération** : l'explication et l'ordre de service restent à Claude.
Conséquence : **Jev choisit, le code calcule, Claude rédige.** Cela correspond au partage prévu par le ticket #10.

Risque de fond : une étude (arXiv 2610.24649, Jev 1.13 comme contrôleur d'un agent Claude) conclut que consulter Jev aux points de décision **augmente le coût sans améliorer le succès** sur Terminal-Bench. [T, snippet seulement, article non lu en entier] https://arxiv.org/pdf/2610.24649v1. Ne s'applique pas directement à notre cas (choix de leviers, pas contrôle d'agent), mais nous ne devons pas promettre que Jev « décide mieux » qu'un autre choix : à présenter comme décision typée, calibrée et rapide.

## 6. Hackathon Accel AI Innovate Paris : rôle de TypeSafe
- Aucune source trouvée ne cite TypeSafe ou Jev comme partenaire de Paris. Les partenaires confirmés restent Aiven et Lovable (CLAUDE.md, `reports/partenaires.md`). Pages vues : https://ai.info/it/events/paris-accel-s-ai-innovate-series-hackathon-2026-10-22, https://aihackclub.com/hackathon/paris-accels-ai-innovate-series-hackathon-2026-10. La page Luma des perks (https://luma.com/0v3c010v) n'a pas pu être relue (délai dépassé) ; le CLAUDE.md liste déjà les crédits reçus, sans TypeSafe.
- Un « JEVATHON » existe mais sans lien avec Accel [T] https://gmicloud.ai/en/blog/hacking-on-jev-notes-from-jevathon. Ne pas en tirer d'avantage de jury.
- **Établi** : rien n'oblige à utiliser Jev. **Supposé** : Adem l'a choisi pour la nouveauté (modèle sorti le 15 sept.) et pour le côté « décision typée » face aux interdits du hack.

## 7. Recommandation de conception pour `src/agents/`
1. **Un fichier de leviers par décideur** (`leviers.<role>.ts`) : chaque levier réel = une question typée. Exclusif → `choice` ; graduel (guidage, nombre de portes) → `score` ; marche/arrêt → `noul`. Le mot « plan » {rester ouvert / fermer par étapes / fermer, portes, phasage, guidage, messages, confinement} se reconstruit en code à partir des réponses.
2. **Une requête par décideur et par minute simulée**, toutes ses questions en une fois (fan-out). Quatre requêtes par minute simulée au total.
3. **`state` préparé par le code** : résumé de la grille, mais avec valeurs déjà converties en niveaux nommés et les contraintes du jumeau 3D en phrases claires. Pas de tableau de milliers de cases.
4. **Seuil d'action en code** : agir seulement si `confidence` ≥ seuil (ex. 0,6) ou `noul` hors de la zone 0,35–0,65 ; sinon garder la décision précédente (évite le clignotement minute après minute).
5. **Version figée** : `jev-1.13.0` ou `jev-1.14.0` explicitement, jamais `jev-latest`, sinon le rejeu change de comportement.
6. **Mode rejeu** : clé de cache = hash(`model` + `state` + `questions`) → réponse JSON stockée dans `fixtures/jev/`. `npm run test:decideurs` lit seulement le cache et échoue si absent ; pas de réseau.
7. **Un cas réel d'abord** (règle 7 du ticket) : un seul appel de bout en bout, avec accord d'Adem.

## 8. Exemple minimal d'appel (non exécuté)
```ts
// src/agents/jev.ts  (clé lue depuis .env par le SDK, jamais écrite ici)
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient(); // lit TYPESAFE_API_KEY

const res = await client.systemOne({
  model: "jev-1.13.0",
  state: {
    role: "préfecture",
    minute: 42,
    zone_critique: "Salle d'échanges, niveau -3",
    densite: "critique",        // niveau nommé, calculé en code
    tendance: "monte",
    sorties_libres: ["Rambuteau", "Lescot"],
  },
  questions: {
    plan: choice("Quelle décision globale prendre maintenant ?", {
      rester_ouvert: "Maintenir l'accès, aucun risque de crush identifié",
      fermer_par_etapes: "Limiter les entrées par paliers, la densité monte",
      fermer: "Fermer l'accès, la densité est critique et continue de monter",
    }),
    guidage: score("Quel niveau de guidage vers les sorties ?",
      ["aucun", "messages sonores", "agents sur place", "évacuation dirigée"]),
    confinement: noul("Faut-il confiner les personnes sur place plutôt que les évacuer ?"),
  },
});
console.log(res.answers.plan.choice, res.answers.plan.confidence);
```
Le même appel en curl : `POST https://api.typesafe.ai/v1/systemone` avec les mêmes trois champs ; `criteria` d'un `choice` = objet `{option: description}`, d'un `score` = tableau ordonné. [E] https://docs.typesafe.ai/primitives/score

## 9. Risques
| Risque | Gravité | Parade |
|---|---|---|
| Aucun crédit gratuit, appel payant sans accord d'Adem | Haute (règle du ticket) | Rejeu par cache ; un seul appel réel après accord ; plafond de requêtes dans le code |
| Signups ou capacité TypeSafe instables (pause du 22 au 27 sept.), 429/529 en démo | Moyenne | Cache pré-rempli avant 16h ; repli sur le dernier plan connu ; pas de dépendance réseau pendant le pitch |
| `jev-latest` change de version en cours de journée | Moyenne | Version figée |
| Réponses incohérentes d'une minute à l'autre | Moyenne | Seuil de confiance, mémoire de la décision précédente, permutation de l'ordre des options testée une fois |
| Jev mal noté sur chiffres et dates | Moyenne | Pas de chiffres bruts dans `state` ; niveaux nommés ; vérificateur « 100 % des chiffres retrouvés » côté Claude |
| Sujet sensible (sécurité de foule, ordres d'évacuation) : décision typée présentée comme fiable | Haute (crédibilité jury) | Dire « aide à la décision, validée par l'humain » ; afficher probabilités et confiance |
| Documentation tierce abondante et parfois contradictoire (chiffres de débit, crédits, champs de réponse `probability` vs `noul`) | Basse | Ne croire que `docs.typesafe.ai` ; champ officiel du Noul : `noul` |
| Clé exposée (navigateur, commit, chat) | Haute | Appels côté serveur seulement ; `.env` ; jamais en clair |

## 10. Questions à poser à Adem
1. La clé `TYPESAFE_API_KEY` existe-t-elle déjà dans `.env`, avec **quel solde** ? Les nouveaux comptes n'ont plus de crédit gratuit depuis le 27 sept. : qui paie ?
2. Combien d'appels réels maximum avons-nous le droit de faire (un cas réel + répétition de démo) ? Un plafond à coder, par exemple 300 requêtes, te convient-il ?
3. Veux-tu passer par la clé TypeSafe directe ou par Vercel AI Gateway (120 $ de crédits) ? Les deux sont possibles côté Jev, le code actuel suppose la clé directe.
4. Version à figer : `jev-1.13.0` (la plus documentée) ou `jev-1.14.0` (sortie le 14 oct., moins de recul) ?
5. Jev est-il imposé pour le pitch (argument de jury, lien avec un partenaire) ou peut-on, en repli, simuler le choix des décideurs par des règles + Claude si Jev tombe en panne ?
6. Où est `reports/contraintes-forum-des-halles.md` (leviers réels de chaque décideur) ? Il manque dans `reports/`.
7. Les quatre décideurs jouent-ils chaque minute simulée à partir d'un même état résumé, ou chacun reçoit-il une vue filtrée (ce qu'il sait réellement) ? Cela change la forme du `state`.
8. Seuil de confiance en dessous duquel le décideur garde son plan précédent : 0,6 te convient-il, ou veux-tu voir toutes les hésitations à l'écran (plus parlant en démo) ?
9. Le « plan » doit-il montrer à l'écran les probabilités de Jev (transparence, démo) ou seulement la décision finale ?
10. Veux-tu que `.env.example` reçoive `TYPESAFE_API_KEY=` dès maintenant (modification hors du lot `decideurs`, donc à toi de décider) ?

## Sources principales
- Officielles : https://docs.typesafe.ai/api · /models · /primitives · /primitives/choice · /primitives/score · /patterns/fan-out · /api/errors · /sdk/javascript · /model-jaggedness/jev-1.13
- Tierces, utilisées avec réserve : https://madewithjev.com/jev-access · https://developersdigest.tech/blog/typesafe-jev-system-one-models-release-guide-2026 · https://jevapi.dev · https://learnjev.com/reference · https://arxiv.org/pdf/2610.24649v1

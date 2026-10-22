# Expérience : réactions de 10 modèles de langage face aux mêmes situations (22 oct. 2026)

Lot preuve (#41). Commande : `node --env-file=.env src/sim/behavior/reactions/experience.ts` (cache local ignoré par git, ~0,05 $).
Même consigne pour tous, 10 situations du Forum des Halles le soir du 19 oct., 2 profils, liste fermée de 15 réactions décrites de façon neutre (le mot « panique » n'apparaît pas).
Modèles (OpenRouter, prix relevés le 22 oct.) : chinois Qwen3-235B, DeepSeek V3.1, Kimi K2, GLM-4.5-Air ; américains Llama 3.3 70B, Claude Haiku 5.5, GPT-4o-mini, Gemini 2.5 Flash-Lite ; européens Mistral Large, Mistral Small.

## Résultats (200 cas, % des réponses lisibles)

| Réaction | chinois | américains | européens | tous |
|---|---|---|---|---|
| s'informer | 39 | 39 | 50 | 41 |
| suivre la consigne | 28 | 30 | 25 | 28 |
| aider | 9 | 11 | 8 | 10 |
| suivre la foule | 5 | 11 | 8 | 8 |
| choisir seul | 9 | 7 | 4 | 7 |
| rester à l'abri | 5 | 0 | 4 | 3 |
| fuite précipitée | 0 | 1 | 0 | 1 |
| réponses invalides | 1 | 11 | 40 | 13 |

## Lecture
- **Pas de « panique » spontanée** : 1 % de fuite précipitée (un seul modèle, GPT-4o-mini), aucune bousculade. Cohérent avec la littérature (la panique de masse est rare, `instantane-4` §5).
- **Les modèles suivent la consigne** quand un agent guide ou qu'un message est clair : 97 %, proche des ~90 % mesurés en réalité virtuelle (Fire Technology 2025).
- **Les modèles sous-estiment l'entraide** : 11 % contre 65 % de personnes qui cherchent à évacuer avec d'autres dans une enquête après incendie (`maths-3` §1.5).
- **Différences entre modèles** : DeepSeek choisit « rester à l'abri » dans 20 % des cas (seul à ce niveau) ; Gemini Flash-Lite répond « s'informer » dans 64 % des cas.

## Limites
- Mistral Large : limité par OpenRouter (erreurs 429) sur une grande partie des appels ; Gemini Flash-Lite : 45 % de réponses illisibles. Ces deux colonnes sont fragiles.
- Aucun modèle de langage n'a été comparé à des choix humains réels : ceci mesure des différences entre modèles, pas le comportement des gens.

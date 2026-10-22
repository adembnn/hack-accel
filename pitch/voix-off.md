# Voix off du MP4 (3 minutes)

Source du texte : `demo/SCRIPT.md`, section « Texte de voix off continu ». Un bloc par plan du MP4 (`pitch/mp4-plan.md`). Le script `pitch/generer-voix.mjs` lit ces blocs : ne pas changer les titres `## Plan N`.

Voix : ElevenLabs, plan gratuit (10 000 caractères par mois, pas de licence commerciale). Vérifier l'usage avant toute diffusion commerciale.

## Plan 1 · 20 s
Lundi 19 octobre, plus de 3 000 spectateurs évacués des Halles. Une seule personne décide : le directeur du centre. On l'entraîne.

## Plan 2 · 30 s
Voici le Forum, réel, du niveau 0 au -5 et les rues autour. Les données arrivent dans Aiven : sorties, métro, personnes.

## Plan 3 · 40 s
L'agent rejoue la soirée avec des personnes simulées selon des modèles publiés de mouvement de foule. Il mesure écrasement, personnes non sorties, sorties en zone de danger.

## Plan 4 · 30 s
À vous : fermez une sortie. La foule réagit, les mesures bougent.

## Plan 5 · 30 s
Quatre décideurs proposent chacun un plan. On les rejoue, on garde le meilleur. Claude explique et rédige l'ordre de service ; chaque chiffre est vérifié.

## Plan 6 · 20 s
Résultat mesuré : A_REMPLIR. Clients : centres commerciaux, salles, villes. Prochaine semaine : un entretien sûreté.

## Comptage (caractères envoyés à ElevenLabs)

| Plan | Durée | Caractères |
|---|---|---|
| 1 | 20 s | 130 |
| 2 | 30 s | 120 |
| 3 | 40 s | 173 |
| 4 | 30 s | 65 |
| 5 | 30 s | 154 |
| 6 | 20 s | 116 |
| **Total** | 170 s | **758** |

Quota gratuit : 10 000 caractères par mois. Une génération complète consomme 758 caractères, soit 7,6 % du quota ; environ 13 générations complètes restent possibles dans le mois.

Bloquant : le plan 6 contient `A_REMPLIR`. Le script refuse de générer tant que ce marqueur est présent. Les chiffres sont à remplir depuis `bench/resultats.csv`.

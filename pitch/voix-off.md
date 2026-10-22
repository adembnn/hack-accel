# Voix off du MP4 (3 minutes)

Source du texte : `demo/SCRIPT.md`, section « Texte de voix off continu ». Un bloc par plan du MP4 (`pitch/mp4-plan.md`). Le script `pitch/generer-voix.mjs` lit ces blocs : ne pas changer les titres `## Plan N`.

Voix : **sans appel payant** (décision du 22 oct. : ElevenLabs non nécessaire). Deux options : lecture humaine par Titouan, ou synthèse vocale du navigateur (`speechSynthesis`, voix française) enregistrée avec l'écran. `pitch/generer-voix.mjs` n'est à utiliser qu'avec l'accord d'Adem (plan gratuit : 10 000 caractères par mois, pas de licence commerciale).

## Plan 1 · 20 s
Lundi 19 octobre, selon la presse, plus de 3 000 spectateurs évacués des Halles. Une seule personne décide : le responsable du lieu. On l'entraîne.

## Plan 2 · 30 s
Voici le Forum, du niveau 0 au -5, et les rues autour. Géométrie réelle, capacités estimées. Les données viennent d'OpenStreetMap et de la BD TOPO.

## Plan 3 · 40 s
On rejoue la soirée avec des personnes simulées selon des modèles publiés. Deux mille personnes, douze minutes en six secondes. Chaque personne reçoit sa consigne. Modèle simplifié, non certifié.

## Plan 4 · 30 s
À vous : fermez une sortie, posez un colis suspect. La menace est une zone, pas un personnage. La foule réagit.

## Plan 5 · 30 s
Quatre décideurs proposent, la simulation départage, Claude rédige l'ordre de service, chaque chiffre est vérifié. Ici, enregistré.

## Plan 6 · 20 s
Mesuré : 73 sorties vers la zone de danger contre 4, mais 14 secondes de plus. Le directeur choisit. Premier client visé : le Forum des Halles. Grande cible : les lieux soumis à la Martyn's Law.

## Comptage (caractères du texte)

| Plan | Durée | Caractères |
|---|---|---|
| 1 | 20 s | 147 |
| 2 | 30 s | 147 |
| 3 | 40 s | 195 |
| 4 | 30 s | 111 |
| 5 | 30 s | 131 |
| 6 | 20 s | 194 |
| **Total** | 170 s | **925** |

Les chiffres cités (73 contre 4, 14 secondes, deux mille personnes, douze minutes en six secondes) viennent de `bench/integration-adem/resultats.json` ; voir `demo/SCRIPT.md` pour les deux côtés et la mention « modèle simplifié, non certifié, scène illustrative » qui doit être à l'écran pendant les plans 3 et 6.

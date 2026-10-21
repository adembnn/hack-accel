# Script de démo (3 minutes, 8 équipes passent)

Le critère unique : chaque ticket sert une étape numérotée ci-dessous. Une tâche qui n'en sert aucune est coupée.
Pour un jury qui ne connaît rien au sujet. Un moment où le jury agit. Un moment où l'on voit la donnée bouger dans Aiven.
À remplir dès que le concept est choisi (`kickoff/4-demo.md` en est la source), puis figé : on ne change plus le script, on le fait passer.

| N | Temps | Écran (ce que le jury voit) | Voix (ce qu'on dit) | Lot qui le fait passer |
|---|---|---|---|---|
| 1 | 0:00–0:20 | | La douleur, chiffrée, en une phrase. L'utilisateur, nommé. | |
| 2 | 0:20–0:50 | | La donnée entre (flux, source). On la voit arriver dans Aiven. | |
| 3 | 0:50–1:30 | | L'agent fait ce qu'une requête ne peut pas faire. | |
| 4 | 1:30–2:00 | | **Le jury agit** (il pose une question, déclenche un événement, change une donnée). | |
| 5 | 2:00–2:30 | | Le résultat cite sa source. L'agent s'est amélioré depuis la dernière exécution. | |
| 6 | 2:30–3:00 | | Qui paie, premiers utilisateurs identifiés, ce qu'on fait la semaine prochaine. | |

## Plan B
- Réseau coupé : `?demo=1` (graine fixe, réponses IA en cache, données déjà chargées).
- Aiven indisponible : base locale en conteneur, même schéma, et on le dit.
- Vidéo de secours : `demo/secours.mp4`, enregistrée avant la répétition, depuis les captures.

## Répétition
Chronométrée, deux fois, avec `node tools/capture.mjs --demo` qui doit être tout vert avant.

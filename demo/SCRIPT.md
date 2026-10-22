# Script de démo (3 minutes, 8 équipes passent)

Le critère unique : chaque ticket sert une étape numérotée ci-dessous. Une tâche qui n'en sert aucune est coupée.
Pour un jury qui ne connaît rien au sujet. Un moment où le jury agit. Un moment où l'on voit la donnée bouger dans Aiven.
À remplir dès que le concept est choisi (`kickoff/4-demo.md` en est la source), puis figé : on ne change plus le script, on le fait passer.

| N | Temps | Écran (ce que le jury voit) | Voix (ce qu'on dit) | Lot qui le fait passer |
|---|---|---|---|---|
| 1 | 0:00–0:20 | Le vrai Forum des Halles en 3D, de nuit, lundi 19 oct. 20h00 ; la foule calme, le cinéma plein | « Le 19 octobre, 3 000 spectateurs ont été évacués de l'UGC des Halles en pleine séance, stations fermées, manifestations dehors. Le chef de poste de la société de sécurité avait une radio et un plan papier. » | jumeau-3d, sols, mannequins, horloge |
| 2 | 0:20–0:50 | Les stations ferment (flux RATP), des cortèges arrivent dans les vraies rues, la chronologie s'allume (« zone bouchée ») ; la donnée part dans Aiven | « Les données publiques entrent en direct : métro, arrêtés, foule ; tout est gardé dans Aiven pour la suite. » | gare, cortège, alertes, aiven |
| 3 | 0:50–1:30 | Les personnages IA (sécurité, police, pompiers, RATP) reçoivent leurs consignes du PC et guident la foule ; on clique trois personnes : leur trajet, ce que l'agent le plus proche leur dit | « Chaque agent de terrain a un cerveau Claude : il voit sa zone, reçoit l'ordre, guide. Pas une requête : une équipe qui agit. » | agents, cerveau, guidage, individu |
| 4 | 1:30–2:00 | **Le jury agit** : il dit à voix haute « une manifestation arrive rue Berger, ferme la porte Rambuteau » ; la foule se réorganise | « Vous êtes le chef de poste : donnez un ordre. » | directeur (ordres), leviers, navigation |
| 5 | 2:00–2:30 | Les 3 meilleurs plans rejoués en accéléré, avec non sortis, personnes en zone et écrasement ; le chef de poste valide, la décision part aux agents et au registre ; la mémoire des crises passées (Aiven) | « Chaque chiffre vient de la simulation ; le plan est validé par un humain ; l'outil apprend de chaque crise. » | plans, explorateur, dispositif, décideurs, mémoire |
| 6 | 2:30–3:00 | Une slide : les sociétés de sécurité privée, prix par site, premiers clients | « Nous vendons aux sociétés de sécurité qui protègent ces lieux : un abonnement par site, et un pilote en 4 semaines. » | pitch |

## Plan B
- Réseau coupé : `?demo=1` (graine fixe, réponses IA en cache, données déjà chargées).
- Aiven indisponible : base locale en conteneur, même schéma, et on le dit.
- Vidéo de secours : `demo/secours.mp4`, enregistrée avant la répétition, depuis les captures.

## Répétition
Chronométrée, deux fois, avec `node tools/capture.mjs --demo` qui doit être tout vert avant.

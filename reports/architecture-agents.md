# Architecture des agents : qui est un algorithme, qui a un modèle, qui décide (22 oct. 2026)

Proposition de l'orchestrateur, à valider par Adem. Sources : `instantane-3-agents-decisionnels.md`, `instantane-4-decision-humaine.md`,
`catalogue-decisions-leviers.md`, `catalogue-contraintes.md`, `criteres-jugement-crise.md`.

## En une image
Un centre de crise miniature. **Les passants** sont des personnes simulées par des formules publiées (pas d'IA). **Le veilleur** lit en
continu les flux publics et les traduit en perturbations. **Les décideurs** (préfecture, RATP, sécurité du centre, directeur, UGC) choisissent
chacun parmi leurs vrais leviers avec un modèle de décision (Jev). **Le simulateur** joue les conséquences, **le juge** les note, et
**le rédacteur** (Claude) écrit l'explication, les messages par zone et l'ordre de service. Les chiffres viennent toujours du code.

## Les rôles

| Rôle | Combien | Moteur | Ce qu'il fait | Pourquoi ce moteur |
|---|---|---|---|---|
| Passants (spectateurs, clients, voyageurs, salariés) | 3 000 à 5 000 | **Algorithme** : départ log-logistique, choix de sortie logit (Lovreglio), groupes, suivisme, changement d'avis, hésitation ; mouvement en forces sociales, collisions | Réagit aux annonces, aux portes fermées, à la foule | Comportements publiés et calés ; un LLM par personne serait trop lent et trop cher, et aucune étude ne montre qu'il imite mieux les vrais choix d'évacuation |
| Profils de passants | ~8 profils | Algorithme (paramètres) | Mobilité réduite, familles, touristes non francophones, salariés, voyageurs pressés, groupes agités | Les perturbations humaines du catalogue (E1 à E6) deviennent des paramètres |
| Veilleur | 1 | **Code** qui interroge les flux en parallèle + **Jev** pour classer chaque alerte ou article en perturbation codée et en lieu | Transforme « Station fermée, mesures demandées par la Préfecture » en C1 sur l'accès concerné | Classer est une décision typée : Jev répond en millisecondes avec une probabilité, sans inventer de texte |
| Décideurs | 5 (préfecture, RATP, sécurité, directeur, UGC) + pompiers en contrainte | **Jev** (questions typées : oui/non, choix, score) sur l'état résumé + **règles codées** pour le droit et les délais | Chacun choisit parmi ses leviers (46 au total), dans l'ordre réel : préfecture → RATP → directeur → sécurité et UGC | Les décisions sont bornées et traçables ; Jev donne une probabilité par option |
| Simulateur | 1 | Code | Joue chaque plan sur la vraie géométrie, plus vite que le temps réel | Pas d'IA dans la physique |
| Juge | 1 | Code | Grille de l'état de l'art : non sortis à 22h/23h, exposition à la zone de danger, écrasement (personnes-minutes au-dessus de 5 pers./m², pression de foule) | Mesurable et vérifiable |
| Rédacteur | 1 | **Claude** | Explique le plan choisi, rédige les messages par zone (sonorisation, ouvreurs, agents) et l'ordre de service ; un vérificateur rejette tout chiffre absent du journal | Le seul endroit où il faut écrire du français naturel |
| Mémoire | 1 | PostgreSQL (Aiven) | Garde chaque run et son résultat ; les décideurs reçoivent les cas proches dans leur état | Le critère « la donnée au cœur » : mémoire et amélioration au fil des exécutions |

## La boucle (chaque minute simulée)
1. Le veilleur met à jour les perturbations (flux en direct, ou juré qui en pose une dans le menu).
2. Les décideurs décident dans l'ordre, chacun voit les choix des précédents sur le tableau commun.
3. Le simulateur joue la minute suivante pour le plan retenu et, en accéléré, pour 2 ou 3 alternatives.
4. Le juge note ; si un critère se dégrade, les décideurs re-décident.
5. Le rédacteur met à jour l'explication et les messages par zone.

## Qui a un « LLM »
- **Jev** (modèle de décision, pas de texte libre) : le veilleur et les 5 décideurs.
- **Claude** (modèle de langage) : seulement le rédacteur.
- **Personne d'autre**, et surtout pas les passants.

## Ce que ça donne à l'écran
Le Forum texturé, ses niveaux écartés en tiroirs, des milliers de petits bonshommes qui sortent par les vraies portes et les escalators ;
un fil d'alertes du veilleur ; le tableau des décideurs avec leurs probabilités ; la grille qui bouge ; les messages par zone.

# foule-decision : décision humaine, grille de critères, benchmark avant/après

Prototype du lot `foule-decision` (ticket #9). **Modèle simplifié, non certifié** : scène illustrative, mouvement de test,
poids tirés d'expériences de laboratoire (cinéma en exercice, réalité virtuelle), jamais d'un couvre-feu réel.

## Commandes (Node 24, aucune dépendance, aucun appel payant)
- `npm run test:behavior` : 17 tests (`node --test`).
- `npm run bench:avant-apres` : 20 graines, consigne du 19 oct. contre plan des décideurs, écrit `bench/resultats.csv`
  (moyenne et intervalle de confiance à 95 %, différence appariée) et `bench/resultats-par-graine.csv`. Environ 15 s.

## Ce qui est dedans
- `src/sim/behavior/depart.ts` : départ log-logistique (cinéma, médiane 40,5 s, forme 5,8) ; effet des messages et du guidage.
- `sortie.ts` : choix de sortie logit (poids de Lovreglio, logit mixte pour le suivisme), changement d'avis (logit binaire).
- `simuler.ts` : `simuler(plan, graine, duree_s)` ; groupes (le plus lent donne le rythme), suivisme, hésitation devant une issue
  fermée (5 à 30 s puis nouveau choix), messages par zone. Rend le journal par minute `{t_s, personnes_dehors, personnes_restantes,
  densite_max_par_zone, sorties_saturees[], t90_s}` et la grille.
- `types.ts` : l'interface abstraite `Mouvement` (`init`, `pas`, `restantes`) et les types de couture. Le lot `foule-mouvement`
  fournit le vrai ; `mouvement-simple.ts` n'est qu'un mouvement de test (file servie à 1,3 pers./s/m).
- `src/sim/metrics/grille.ts` : non sortis à 22 h et 23 h (dont mobilité réduite), zone de danger, écrasement (personnes-minutes
  au-dessus de 5 pers./m2), pression de Helbing, t90/t99, continuité, total. Ordre d'Adem (#15) ; poids du total = hypothèse.
- `bench/` : plans `PLAN_AVANT` et `PLAN_APRES` (`scenarios.ts`) et le benchmark.

## Limites à dire au jury
Les réglages marqués « hypothèse » dans le code (distance normalisée, constantes du changement d'avis, multiplicateurs de délai,
durée de séjour dehors, notes de la grille) ne sont pas des mesures. La pression de Helbing du mouvement de test est un proxy.
La scène (distances, largeurs, 3 000 personnes en 6 salles) est illustrative, pas un relevé du Forum. Dans nos sources, les modèles
d'évacuation s'écartent jusqu'à 30 % entre eux (RiMEA) : lire les écarts avant/après comme un ordre de grandeur.

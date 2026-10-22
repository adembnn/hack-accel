# Recherche d'un plan meilleur sur tout

**Modèle simplifié, non certifié.** Scène illustrative (3 000 personnes, 5 issues aux chiffres posés, pas un relevé du Forum), mouvement de test, poids de laboratoire. Lancer : `node bench/plans.ts` (environ 2 min), écrit `bench/resultats-plans.csv`. Plans : `src/sim/behavior/plans-candidats.ts`.

## Méthode
- 9 plans candidats, construits avec les seuls leviers réels : messages par salle, répartition selon les débits, phasage, guidage, fermeture d'une porte. Aucune issue de secours légitime fermée : seule la rue de la Ferronnerie l'est (elle débouche dans le périmètre interdit) ; le métro n'est fermé qu'à 400 s, juste avant sa fermeture réelle (420 s dans la scène).
- Entraînement : graines 1 à 20. Test : graines 101 à 120, jamais utilisées pour choisir. Grille inchangée (ordre d'Adem : non sortis, zone de danger, écrasement, puis t90 et continuité).
- Règle de choix fixée avant de lancer : un plan n'est « meilleur sur tout » que s'il ne dégrade, par rapport au défaut (consigne du 19 oct.), ni les non-sortis, ni la zone de danger, ni l'écrasement, ni t90.

## Résultat honnête
**Aucun des 9 plans ne bat le défaut sur t90.** Le défaut fait 315 s ; le meilleur candidat 346 s (+10 %). Il n'y a donc pas de plan « meilleur sur tout » dans ce modèle. Nous avons ajouté, après coup et en le disant, une règle de repli : le plus bas en zone de danger parmi ceux qui ne dégradent ni les non-sortis ni l'écrasement. C'est le plan C5.

| Moyenne (personnes-minutes pondérées / s) | Zone de danger | t90 | t99 | Continuité (sortis vers un lieu sûr) | Note totale |
|---|---|---|---|---|---|
| Défaut AVANT, entraînement | 17 718 | 315 s | 362 s | 1 699 | 86,8 |
| Plan décideurs APRÈS, entraînement | 13 374 | 501 s | 550 s | 1 663 | 88,9 |
| **C5, entraînement (1-20)** | **8 296** | **346 s** | 387 s | 2 170 | 93,1 |
| Défaut AVANT, test | 17 809 | 316 s | 365 s | 1 691 | 86,7 |
| Plan décideurs APRÈS, test | 13 413 | 502 s | 546 s | 1 659 | 88,8 |
| **C5, test (101-120)** | **8 309** | **346 s** | 388 s | 2 169 | 93,1 |

Non sortis à 22 h et 23 h, et écrasement : 0 pour tous les plans, donc ces critères ne départagent rien dans cette scène. Le test confirme l'entraînement à moins de 1 % : pas de sur-ajustement visible (il n'y a d'ailleurs que 9 plans testés et peu de paramètres réglés).

## Ce qui change dans C5, et pourquoi
- **Fermer la Ferronnerie dès le début** : c'est le gros gain. Cette sortie mène au périmètre interdit (danger 2 par personne) ; seule, cette mesure fait passer la zone de danger de 17 718 à 9 199 (C1).
- **Messages clairs répartis selon les débits** (métro, hall, escalators, secours) : danger 8 706, t90 350 s (C2). Le plan décideurs répartissait « à peu près » et sans le métro, d'où ses 501 s.
- **Métro fermé à 400 s** : sans effet mesurable ici (C3 = C2), car presque tout le monde est sorti avant ; il évite seulement l'entrée dans un cul-de-sac si le départ traîne.
- **8 agents guident vers la sortie de secours**, sous-utilisée parce que peu connue : danger 8 296, t90 346 s.
- **Ce qui n'aide pas** : phasage en 3 vagues de 60 s (C7 : t90 368 s, danger 9 268, pire que sans phasage) ; plus de clarté (0,97 contre 0,9 : rien) ; guider vers le hall (C9 : danger 9 200). Le phasage du plan décideurs est donc la cause principale de ses 501 s : il retarde des salles sans que les issues soient saturées.

## Compromis qui restent
- **t90 +31 s (+10 %) par rapport au défaut**, inévitable ici : fermer la Ferronnerie retire 2,3 pers./s de débit sur 13 pers./s. Mieux vaut le dire que le cacher : on échange 10 % de temps contre 53 % de personnes-minutes en zone de danger en moins.
- C5 bat le plan décideurs sur tout (danger, t90, t99, continuité, note), sauf qu'il dépend de 8 agents effectivement présents et crus.
- Le métro est utilisé jusqu'à 400 s : cela suppose une coordination avec l'exploitant, que nous ne pouvons pas garantir.

## Ce qui n'est PAS prouvé
- La scène est illustrative : distances, largeurs, surfaces, la répartition 500 par salle et la sûreté « derrière » chaque issue sont posées, pas relevées.
- Le gain principal vient d'une hypothèse de la grille (derrière la Ferronnerie = danger 2, séjour dehors 10 min) : si cette hypothèse change, la conclusion change.
- Le mouvement est un modèle de file (1,3 pers./s/m), sans conflits ni piétinement ; l'écrasement et la pression de Helbing n'apparaissent donc pas. Ce benchmark ne dit rien sur le risque d'écrasement.
- Le choix de plan est fait sur ce modèle seul. Les modèles d'évacuation s'écartent entre eux jusqu'à 30 % (RiMEA) : un écart de 31 s sur t90 est dans cet ordre de grandeur. Test sur 20 graines : variation aléatoire seulement, pas variation du modèle.
- Les 9 candidats sont ceux que nous avons pensé à essayer ; pas une recherche exhaustive. Aucune validation sur un exercice réel.

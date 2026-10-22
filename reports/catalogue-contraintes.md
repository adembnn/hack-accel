# Catalogue des contraintes réelles (22 oct. 2026)

Index de trois rapports détaillés, sourcés ligne à ligne :
- `catalogue-perturbations.md` : 43 perturbations qui peuvent toucher un événement, d'après l'état de l'art (DIM-ICE et RAMP de Keith Still, Green Guide, Purple Guide, guides français), chacune avec son effet, son indicateur, sa représentation dans le simulateur et un exemple réel.
- `catalogue-donnees-perturbations.md` : les flux publics qui détectent ces perturbations à Paris, testés quand c'est possible.
- `catalogue-decisions-leviers.md` : les 46 leviers des 6 décideurs, leurs délais, leurs contraintes et leurs conflits.

Décision débloquée : la liste des contraintes que le simulateur représente (#8, #9), que le juré ou l'opérateur peut poser (#7, #13), et que les décideurs prennent en compte (#10).

## 1. Les 43 perturbations, par famille (codes du rapport détaillé)

| Famille | Codes | Source de la donnée |
|---|---|---|
| Foule (8) | A1 densité excessive · A2 contre-flux · A3 goulot · A4 bousculade et chute · A5 mouvement de panique · A6 rumeur · A7 vague de sortie groupée · A8 pression sur une porte fermée ou filtrée | calculées par le simulateur (densité, pression de foule, débits) |
| Infrastructure (9) | B1 issue de secours bloquée · B2 porte coupe-feu fermée · B3 escalator arrêté · B4 escalator en sens inverse · B5 ascenseur en panne · B6 éclairage coupé · B7 alarme générale · B8 désenfumage ou fumée · B9 sol glissant ou obstacle | posées par le juré ; ascenseurs : état IDFM et Ville de Paris |
| Transport (6) | C1 station fermée · C2 trafic interrompu · C3 correspondance coupée · C4 quai saturé · C5 train retenu ou sans arrêt · C6 travaux de nuit | messages de trafic PRIM en direct, archive ratpstatus pour rejouer le 19 oct., accès IDFM |
| Extérieur (9) | D1 manifestation · D2 troubles, dégradations · D3 couvre-feu · D4 barrage de police · D5 colis suspect · D6 alerte Vigipirate · D7 incendie voisin · D8 météo · D9 travaux de voirie | arrêtés de la préfecture saisis en polygones ; fermetures de voirie et chantiers (opendata.paris.fr) ; météo Open-Meteo ; Vigipirate saisi |
| Humain (6) | E1 malaise ou blessé · E2 personnes à mobilité réduite · E3 enfants perdus, familles · E4 touristes non francophones · E5 téléphones sans réseau · E6 alcool, groupes agités | profils de personnes dans le simulateur ; panne de réseau saisie |
| Organisation (5) | F1 information tardive · F2 effectif de sécurité insuffisant · F3 défaut de coordination · F4 consigne contradictoire · F5 doctrine inadaptée | paramètres du scénario (délais, effectifs) |

Les 5 qui pèsent le plus pour le Forum (classement de l'agent, à valider) : C1 station fermée, F1 information tardive, D2/D3 zones à éviter autour des portes Berger et Rambuteau, A7 vague de sortie du cinéma, B1/B3 capacité verticale réduite.

## 2. Ce qui se lit en direct et ce qui se pose à la main

- **En direct ou en rejeu (8 flux)** : messages de trafic PRIM (clé `PRIM_API_KEY`, compte à créer par Adem) et archive ratpstatus du 19-20 oct. ; accès IDFM ; fermetures de voirie ; chantiers ; agenda « Que faire à Paris » ; Vélib ; météo Open-Meteo ; arrêtés de la préfecture saisis une fois en polygones.
- **Posé par le juré ou l'opérateur** : bouches de métro fermées (parmi les 18 accès), issues bloquées, escalators arrêtés, ascenseurs hors service, polygone et horaires du couvre-feu ou de la manifestation, colis suspect, niveau Vigipirate, panne de réseau, jauge de salle, foule initiale.
- Téléchargement en attente d'accord : CSV complet de l'archive ratpstatus (76 Mo).

## 3. Les décideurs : 46 leviers

Préfecture 8 (pose les bornes) · RATP 8 (exécute, peut proposer) · sécurité du centre 10 · directeur 9 (décide, répond de la sécurité) · UGC 7 · pompiers (BSPP) 4. Chaque levier a un délai, une contrainte et un type de choix (oui/non, choix dans une liste, score) prêt pour Jev.

**Trois conflits à coder comme événements du scénario** :
1. Le métro ferme à 22h sur demande de la préfecture : plus le centre ferme tard, plus la pression monte sur les derniers trains.
2. Fermer ou confiner sans incendie : aucun texte public ne dit qui l'emporte entre préfecture et directeur.
3. L'UGC se vide d'un coup quand le centre étale, avec une information en retard. Le 21 oct., le tribunal administratif a ordonné de publier les arrêtés de couvre-feu au moins 12h avant leur entrée en vigueur.

## 4. Points non vérifiés à ne pas présenter comme des faits
- « L'UGC a été prévenu par la Ville et non par la préfecture » : aucune source confirmée ; modélisé comme un retard d'information réglable.
- Aucune fréquence chiffrée par perturbation n'est publiée ; la Green Guide, le Purple Guide et RAMP n'ont été lus que par extraits.

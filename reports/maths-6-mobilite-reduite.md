# Mobilité réduite (PMR) : règle, vitesses, aide

Lot preuve, ticket #41. Recherche faite le 22 oct. 2026 avec l'API Keenable. **[lu]** = la page a été récupérée et le chiffre y figure ; **[?]** = non vérifié ou lu seulement dans un extrait de résultat. Modèle simplifié, non certifié. Le code est dans `src/sim/behavior/pmr.ts` et `simuler.ts`.

## 1. Règle française (ERP)

- L'évacuation est la règle pour qui peut rejoindre l'extérieur ; pour les autres, la règle prévoit l'**évacuation différée** : on crée à chaque niveau des **espaces d'attente sécurisés** (EAS), des cheminements praticables vers les sorties ou vers les EAS, et une alarme perceptible. [lu] https://sdis-vendee.com/media/13-solution-pour-l-evacuation-differee-des-personnes-a-mobilite-reduite-1.pdf
- Définition d'un EAS : zone à l'abri des fumées, des flammes et du rayonnement thermique où la personne, si elle ne peut pas poursuivre, attend son évacuation « grâce à une aide extérieure ». [lu] même source.
- Le dispositif tient compte « de l'aide humaine disponible en permanence » dans l'exploitation. [lu] même source. L'article GN 8 reprend ce principe dans la notice de sécurité : https://sdis54.fr/images/PDF/Prevention/NOTICE_DE_SECURITE_V_3.pdf [lu].
- L'arrêté du 25 juin 1980 (texte consolidé, modifié par l'arrêté du 24 sept. 2009) range les EAS dans les articles CO 57 à CO 60 : https://legifrance.gouv.fr/loda/id/LEGITEXT000020303557 [lu pour le plan du texte]. Le texte de l'arrêté du 24 sept. 2009 lui-même n'a pas été lu [?].
- Escalators : CO 49 § 4 autorise au plus 50 % des escaliers mécaniques à compter dans les dégagements du public. https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020303939 [lu]. **Je n'ai pas trouvé un texte qui « interdise » l'escalator en évacuation** : il compte comme dégagement dans la limite de 50 %. Pour une personne en fauteuil, il est de toute façon inutilisable ; pour les autres PMR, on retient qu'on ne le prend pas (prudence, **hypothèse**).
- Ascenseurs : le chapitre IX distingue les ascenseurs « destinés à l'évacuation des handicapés physiques » (AS 4 et AS 5) [lu, titre de section]. L'interdiction des ascenseurs ordinaires en cas d'incendie est la pratique connue [?], non lue dans le texte. La scène illustrative n'a pas d'ascenseur.

## 2. Vitesses mesurées (sur le plat sauf mention)

- Fauteuil manuel sans aide : 0,67 m/s (± 0,12) sur cheminement extérieur plat ; poussé par une autre personne : 1,03 m/s (± 0,08). Rampe 1:12 : 0,22 à 0,26 sans aide, 0,82 à 0,96 avec aide. [lu] https://doi.org/10.1371/journal.pone.0335663 (PLOS ONE 2025, campus chinois, tableau 2).
- Fauteuil manuel, vie courante : vitesse médiane 0,43 m/s par trajet [lu, extrait] https://pmc.ncbi.nlm.nih.gov/articles/PMC3403062. Plus lent que l'évacuation, retenu seulement comme borne basse.
- Personnes ayant un trouble de la locomotion : 0,8 m/s en moyenne à l'horizontale et 0,33 m/s en escalier, contre 1,25 et 0,75 pour des valides (Boyce, Shields et Silcock 1999, 155 personnes, cité par Shields et al., sur le 11 septembre). [lu] https://sciencedirect.com/science/article/pii/S0379711209000502
- Escalier, évacuation d'immeubles (Kuligowski et al. 2014, NIST) : 0,31 ± 0,16 m/s (de 0,07 à 0,91). Détail : 0,25 avec canne, 0,21 aidé par un habitant, 0,11 aidé par un pompier, 0,21 avec chaise d'escalier. [lu] https://nist.gov/publications/stair-evacuation-people-mobility-impairments et la synthèse https://tandfonline.com/doi/abs/10.1080/23311916.2018.1506304
- Malvoyants : 25 à 50 % plus lents que la moyenne des évacués dans les exercices observés. [lu, source de seconde main] https://pmc.ncbi.nlm.nih.gov/articles/PMC12511302. Étude danoise sur 40 malvoyants (Wiley, Fire and Materials) trouvée, chiffres non lus [?] https://onlinelibrary.wiley.com/doi/10.1002/fam.2200.
- Non trouvé : vitesse d'un fauteuil **électrique** en évacuation [?]. Les tableaux de Boyce 1999 par type d'aide (canne, béquilles, fauteuil) ne figurent pas dans les pages récupérées [?] ; seules les moyennes ci-dessus sont lues.
- Franchir une porte : jusqu'à 71 % des utilisateurs de fauteuil manuel échouent sur une porte à tirer, 29 % sur une porte à pousser [lu, extrait] (même synthèse tandfonline). Non modélisé (voir limites).

## 3. Délais d'aide

- Exercice d'évacuation de 4 immeubles de 6 à 7 étages (Proulx 1995), 20 % de personnes handicapées : délai avant de quitter l'appartement de 0 à 25 min, **6 min en moyenne**. [lu] https://tandfonline.com/doi/abs/10.1080/23311916.2018.1506304
- 170 personnes à mobilité réduite dans deux exercices (Peacock et al. 2017) : 6,6 à 28,5 min, moyenne 14,2 min, qui inclut l'attente d'aide. [lu, extrait de la même synthèse]
- Dans les exercices, attendre, aider et se préparer allongent nettement le délai avant mouvement (NIST, note technique 1664). [lu, extrait seulement] https://nist.gov/document/tn1664pdf
- Entraide spontanée : aucune mesure en évacuation trouvée [?]. Repère hors danger : dans le métro de New York (Piliavin et al. 1969), l'homme à canne qui tombe est aidé presque à chaque fois en environ 5 s. [lu, extrait de seconde main] https://simplypsychology.org/piliavin.html

## 4. Part de PMR dans la foule

- 4 % : « troubles du mouvement chez près de 4 % des adultes » aux États-Unis. [lu, extrait] https://link.springer.com/article/10.1007/s10694-017-0668-9
- 8,4 % des 16 à 64 ans déclarent en 2019 un handicap ou une gêne dans la vie quotidienne en France (toutes natures, pas seulement moteur). [lu] https://www.statistiques.developpement-durable.gouv.fr/media/6882/download?inline
- 14 à 17 % des résidents d'Angleterre sont handicapés (Boyce et al. 1999), toutes natures. [lu, extrait de la synthèse tandfonline]
- Conclusion : 4 % est cohérent avec la part des troubles de la marche, mais reste une **hypothèse** pour un public de cinéma (les personnes très peu mobiles sortent moins). À balayer de 2 % à 8 %.

## 5. Valeurs retenues dans le code

| Quoi | Valeur | Statut |
| --- | --- | --- |
| Vitesse fauteuil | 0,67 ± 0,12 m/s ; poussé 1,03 | lu (PLOS ONE 2025) |
| Vitesse canne | 0,8 ± 0,15 m/s | moyenne lue (Boyce 1999), écart-type hypothèse |
| Vitesse autre (malvoyant...) | 0,75 ± 0,15 m/s | milieu de « 25 à 50 % plus lent », hypothèse |
| Plancher de vitesse | 0,3 m/s | hypothèse |
| Répartition fauteuil / canne / autre | 25 / 45 / 30 % | hypothèse, à balayer |
| Part de PMR | 4 % (inchangée) | hypothèse |
| Attente d'un agent | loi exponentielle, moyenne 360 s / nombre d'agents (plancher 30 s) | 360 s lu (Proulx), division par les agents hypothèse |
| Attente d'un proche | exponentielle, moyenne 20 s après son propre départ | hypothèse (borne haute de Piliavin) |
| Issues | escalator interdit ; accès métro (niveau différent) avec aide ; les autres libres | hypothèse de la scène illustrative |

## 6. Ce que fait le modèle

- Une PMR a un profil (fauteuil, canne, autre) et une vitesse tirés sur leur **propre flux aléatoire** (canal 7) : les tirages des autres personnes ne bougent pas. Test : `pmr.test.ts`.
- Elle ne choisit que les issues qu'elle peut prendre (escalator jamais ; escalier seulement aidée). Sans issue utilisable au moment de partir, elle passe à l'état `refuge` (EAS).
- Au refuge, l'aide arrive d'un **agent de guidage** (si le plan en met : `guidage.personnel`) ou d'un **proche du même groupe** encore dans le centre (option `entraide`). Le premier arrivé gagne. Une fois aidée, elle peut prendre l'escalier ; le fauteuil est poussé à 1,03 m/s ; l'aidant proche marche à la vitesse de la personne aidée.
- Si une issue accessible rouvre, elle repart seule (revérification toutes les 10 s).
- Journal `stats` : `pmr_total`, `pmr_sortis`, `pmr_en_refuge`, `pmr_temps_moyen_s` (instant de sortie moyen des PMR sorties), `pmr_aides_agent`, `pmr_aides_voisin`, `aidants` (proches distincts + aides d'agents).
- Grille : critère `pmr_sortis_ou_abri_22h` (PMR ni sortie ni au refuge à 22 h). Il ne remplace pas `non_sortis_22h_mobilite_reduite` et **n'entre pas dans le total** : décision de pondération pour Adem.
- Option : `pmr: { actif, part, profils, entraide, delai_agent_moyen_s, delai_voisin_moyen_s }` ; `{ actif: false }` redonne l'ancien comportement (PMR à 0,6 m/s, mêmes issues que tout le monde).

## 7. Limites connues

- Un agent peut aider un nombre illimité de PMR en parallèle (pas de file d'attente d'agents).
- L'aidant proche garde son issue déjà choisie ; seule sa vitesse change.
- Aucune panne de porte (porte à tirer) ni de pente ; l'escalier est une issue entière « avec aide », sans vitesse d'escalier propre (0,2 à 0,3 m/s mesurés en escalier non utilisés).
- Le refuge est supposé sûr tant que la durée de l'attente le permet ; aucune dégradation (fumée, foule) n'est simulée dans l'EAS.
- L'attente illimitée d'une PMR sans agent ni proche (arrivée des secours) n'est pas modélisée.

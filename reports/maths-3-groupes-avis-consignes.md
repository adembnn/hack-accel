# Maths 3 : groupes, changement d'avis, issue fermée, messages et guidage

Ticket #9, lot foule-decision. Recherche du 22 oct. 2026, aucun LLM payant, aucun code modifié. `[lu]` = chiffre lu dans le texte de la source ; `[?]` = non vérifié (titre ou résumé seulement, ou source de seconde main). Code relu : `src/sim/behavior/simuler.ts`, `sortie.ts`.

## 0. Version simple

1. **Groupes** : garder « le plus lent donne le rythme » et « on attend le dernier prêt » ; ça colle aux mesures (écart de 0 à 0,08 m/s). Corriger la **taille** des groupes (loi de Poisson tronquée au lieu de 2 à 4 uniforme) ; part de 70 % conservée comme cas central, balayée de 55 à 85 %.
2. **Changement d'avis** : la structure du code est bonne, mais le « logit binaire de Haghani » n'a **pas** de coefficients mesurés : ses valeurs (−7,5 ; 3,5 ; 0,8 ; 0,8) ont été choisies « par essais et erreurs » par les auteurs. Il faut le dire et recaler la constante par balayage. Le « 7 à 15 % » vient de la VR ; en vraies foules en laboratoire c'est **0 à 7,5 %**.
3. **Issue fermée** : aucune durée d'hésitation mesurée trouvée. Le 5 à 30 s reste un paramètre balayé, à présenter comme tel.
4. **Personnel** : +2,739 vérifié (VR métro, 131 personnes). Un agent amène à environ 90 % le choix de la porte indiquée. **Aucune mesure** « message précis par zone vs message général » trouvée : c'est une hypothèse de plan, pas un résultat.
5. **Honnêteté** : tout vient de laboratoire, de VR ou d'exercices incendie, aucune mesure d'un couvre-feu. Le modèle est défendable comme point de départ, pas comme prédiction.

## 1. Groupes

### 1.1 Part de personnes en groupe
- Rue commerçante de Toulouse, vidéo : **55 %** des piétons en groupe un jour de semaine l'après-midi (densité 0,03 pers./m²), **70 %** un samedi dans une allée commerçante très fréquentée (0,25 pers./m²) [lu] https://pmc.ncbi.nlm.nih.gov/articles/PMC2850937 (Moussaïd et al. 2010, PLoS ONE ; 1 098 et 3 461 piétons suivis).
- « 95 % en groupe lors de grands événements » : cité par von Krüchten et Schadschneider, référence de seconde main [?] https://arxiv.org/html/1703.08340v1
- **Cinéma ou centre commercial le soir : aucune mesure directe trouvée** [?]. Le samedi (70 %) est le meilleur proxy « sortie de loisir ». Les groupes sont plus fréquents dans les lieux de loisir (shopping, plage) [lu, même article Moussaïd].
- Le code a déjà 0,7 par défaut. Le commentaire du code dit « étude citée par un article secondaire » : on peut maintenant citer la source primaire.

### 1.2 Taille des groupes
- Moussaïd 2010 : la taille suit une **loi de Poisson tronquée à zéro** (p = 0,06 au test du khi-deux en semaine ; le samedi il y a moins de personnes seules et plus de paires que Poisson ne prédit, p < 0,01) ; groupes de 2 à 4 les plus fréquents, 5 et plus rares [lu]. Les valeurs de λ ajustées sont illisibles dans le texte extrait [?].
- Coleman et James 1961 (« The equilibrium size distribution of freely-forming groups ») : titre vu seulement, la loi vient de Moussaïd qui cite James 1953 [?] https://jstor.org/stable/10.2307/2785927
- **Lien exact (calculé ici, vérifié par tirage de 200 000 groupes)** : pour une Poisson tronquée de paramètre λ, la part de personnes seules vaut e^(−λ). Donc **λ = −ln(1 − part_groupes)**.

| part en groupe | λ | seuls (parmi les unités) | paires | trios | quatre | 5 et + | taille moyenne des groupes |
|---|---|---|---|---|---|---|---|
| 55 % | 0,80 | 65 % | 26 % | 7 % | 1,4 % | 0,2 % | 2,3 |
| 70 % | 1,20 | 52 % | 31 % | 12 % | 3,8 % | 1,1 % | 2,5 |
| 85 % | 1,90 | 34 % | 32 % | 20 % | 9,5 % | 4,8 % | 2,9 |

Le code actuel (tailles 2, 3, 4 à égalité, taille moyenne 3) surestime les trios et quatuors et n'a aucune paire dominante. Mesuré : les paires dominent.

### 1.3 Vitesse de groupe
- Moussaïd 2010 : la vitesse baisse linéairement avec la taille x du groupe : **v = −0,04·x + 1,26 m/s** (faible densité) et **v = −0,08·x + 1,24 m/s** (densité modérée) [lu]. Le modèle de force prédit −17 % de vitesse moyenne avec interaction de groupe réaliste.
- Test de la règle du code « vitesse du groupe = minimum des membres » (vitesses N(1,2 ; 0,2) bornées 0,8-1,6), tirage de 100 000 :

| taille | min des membres (code) | Moussaïd densité modérée | Moussaïd faible densité |
|---|---|---|---|
| 2 | 1,09 | 1,08 | 1,18 |
| 3 | 1,04 | 1,00 | 1,14 |
| 4 | 1,00 | 0,92 | 1,10 |

**Verdict : garder.** Écart de 0 à 0,08 m/s. La règle est même un peu optimiste pour 4 personnes en foule. Réserve : ces mesures sont en marche normale, pas en évacuation.

### 1.4 Effet des groupes sur l'évacuation
- Bode, Holl, Mehner, Seyfried 2015 (laboratoire, 2 sorties ouvertes) : temps de réponse **1,88 s en groupe contre 1,21 s seul** (+55 %) ; temps de sortie moyen 7,02 contre 5,82 s ; temps pour vider la salle 9,25 contre 7,85 s (environ +18 %) [lu] http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0121227. Cause : plus de pré-mouvement, chemins plus longs (59 % vers la sortie la plus proche contre 75 % seul), pas de différence une fois devant la porte.
- von Krüchten et Schadschneider 2017 (élèves, 32 à 46 personnes, porte de 0,8 ou 1,2 m) : de **grands** groupes (4, 6, 8) évacuent plus vite que des paires, par auto-ordonnancement ; un comportement coopératif fort ralentit (vitesse d'environ 0,5 contre 0,7 m/s) et rend la sortie « en rafales » [lu] https://arxiv.org/html/1703.08340v1. Les sources se contredisent : le signe de l'effet dépend du contexte.
- Test du « on attend le dernier prêt » (loi log-logistique de départ du code, maximum de k membres) : **+17 % (paire), +27 % (trio), +34 % (quatuor)** sur le délai moyen d'une personne seule. Même ordre de grandeur que Bode (+55 % sur une échelle de secondes). **Garder.**
- Modèle affiliatif de Sime (1983, 1985) : les liens proches se regroupent avant de fuir, les groupes mixtes d'amis se dispersent plus [lu via l'article suivant] ; texte original non lu [?] https://journals.sagepub.com/doi/abs/10.1177/0013916585176003

### 1.5 Revenir chercher un proche
- Incendie d'un immeuble de bureaux de 21 étages avec centre commercial (enquête auprès des occupants, une semaine après) : **65 %** ont cherché d'autres personnes pour évacuer ensemble, 35 % seuls ; quand un membre est perdu, **28,2 %** seulement le cherchent, beaucoup d'autres exhortent les autres à sortir [lu] https://doi.org/10.2224/sbp.6946 (Social Behavior and Personality, auteurs et année à confirmer [?]).
- Sime 1983 (148 rescapés d'un incendie de complexe hôtelier) : conflit danger/proches, l'affiliation passe souvent avant la fuite [lu via l'article ci-dessus].
- Le code n'a pas de séparation de groupe : tout le groupe part ensemble, même cible. Conforme au 65 %. Un « retour en arrière » à 28 % ne serait codé que si le Mouvement sait séparer un groupe ; sinon **ne pas coder** (limite à citer).

## 2. Changement d'avis

### 2.1 D'où vient le 7 à 15 %
- Bode et Codling 2013 (Animal Behaviour 86:347-358, expériences de réalité virtuelle) : **7 % à un peu plus de 15 %** des sujets changent de sortie selon le traitement ; moins s'ils se sentent sous pression ou en compétition [lu via Haghani et Sarvi 2019] https://sciencedirect.com/science/article/pii/S0968090X18307393. Article original non relu [?] https://doi.org/10.1016/j.anbehav.2013.05.025
- Liao et al. 2017 (J. R. Soc. Interface 14:20160684, vraies foules en laboratoire) : seulement **0 à 7,5 %** des piétons de chaque essai changent de route ; ils changent de décision en moyenne **à 30-60 % du temps passé dans la salle** [lu] https://pmc.ncbi.nlm.nih.gov/articles/PMC5332561
- Donc la fourchette « 7 à 15 % » est **la partie haute** ; en conditions réelles de laboratoire c'est moins. Proposition : cible **3 à 12 %** de personnes qui changent, centre autour de 7 %.

### 2.2 Le « logit binaire » : ce que la source dit vraiment
Haghani et Sarvi 2019, Transportation Research Part C (doi 10.1016/j.trc.2019.04.009), modèle de **simulation** [lu] https://sciencedirect.com/science/article/pii/S0968090X18307393 :
```
P(changer) = 1 / (1 + exp(−V))
V = Inertie + β1·CongRatio + β2·VIS + β3·SocInf
CongRatio = (CONG_actuelle − CONG_min) / CONG_actuelle       (entre 0 et 1)
VIS       = 1 si une issue moins encombrée est visible, sinon 0
SocInf    = 1 si quelqu'un a quitté la MÊME issue dans les t dernières secondes, sinon 0
```
- Valeurs de base : **Inertie = −7,5 ; β1 = 3,5 ; β2 = 0,8 ; β3 = 0,8 ; t = 2 s** ; chance de révision toutes les 100 cycles de 0,004 s, soit **0,4 s** ; seuls les agents « éligibles » (pas coincés dans la foule) peuvent changer ; l'issue quittée est exclue du nouveau choix [lu].
- **Ces valeurs ont été « choisies arbitrairement par essais et erreurs »** pour avoir des motifs plausibles, pas estimées sur données [lu, section 3.3]. Le papier ne donne pas la part de personnes qui changent dans ce réglage.
- Apport du module (comparaison simulation/expérience) : corrélation des parts par sortie 0,4 → 0,8, écart moyen 35 % → 20 % ; temps d'évacuation : écart 70 % → 30 % [lu]. Argument fort pour **garder** le module.
- Haghani et al. 2020 (Safety Science) estiment, sur données, un modèle de changement avec les mêmes familles de variables (congestion, visibilité, influence sociale à 1 s) mais le tableau des coefficients est tronqué dans la page lue : **coefficients non lus** [?] https://sciencedirect.com/science/article/pii/S092575352030076X
- **Lovreglio n'est pas la source du logit binaire de changement.** L'attribution dans `simuler.ts` / `sortie.ts` (« Haghani et Sarvi 2019 ; Haghani 2020 ») est correcte, la mention « Lovreglio » de la question est à écarter.
- Le « 7 à 15 % » du code est cité à Bode et Codling 2013 : correct.

### 2.3 Écarts avec le code
| Élément | Code | Source |
|---|---|---|
| Écart entre files | minutes d'écart `des`, coefficient 0,6/min | rapport relatif (att_cur − att_best)/att_cur, coefficient 3,5 |
| Visibilité | absente (filtre `!fermee_connue` seulement) | VIS binaire, +0,8 |
| Rafale | compteur +0,1 par changement, décroissance 0,97/s (demi-vie 23 s), coefficient 1,0, plafond 2 | binaire, fenêtre 2 s, coefficient 0,8 |
| Constante | −6,4, évaluation toutes les 15 s | −7,5, évaluation toutes les 0,4 s |
| Une fois au plus | oui | non précisé dans la source ; choix de modélisation raisonnable, garde-fou contre le « flip-flop » que la source cherche à éviter |

Conversion de fréquence (petite probabilité) : passer de 0,4 s à 15 s multiplie le risque par 37,5, soit un décalage de la constante de **ln(37,5) = +3,6**. Mais avec le plafond « une fois au plus », il faut **balayer** : ne pas transplanter −7,5.

## 3. Hésitation devant une issue fermée ou bloquée
- **Durée mesurée de l'hésitation : introuvable** [?]. Les recherches (blocage de porte, issue verrouillée, demi-tour) ne donnent aucune distribution chiffrée exploitable.
- Données voisines : temps de réponse en laboratoire 1,2 à 1,9 s (Bode 2015) ; le sujet reste souvent immobile un moment au point de « rupture de trajectoire » avant de repartir (Haghani 2020, qualitatif) [lu].
- Déclencheur de re-planification mesuré (Liao 2017) : on reconsidère son choix quand la **vitesse tombe sous la moitié de la vitesse souhaitée** (embouteillage) ; les personnes au centre d'une file dense ont du mal à partir, celles en périphérie partent facilement [lu].
- Bousculade et contre-flux : Philpot et Levine 2022 (vidéo d'une explosion dans un métro, 40 passagers) : 42,5 % (17/40) courent, 2 cas de conduite antisociale (pousser), les gestes d'entraide sont fréquents [lu] https://journals.sagepub.com/doi/full/10.1177/00139165211031193. Pas de taux de demi-tour.
- **Décision : garder le 5 à 30 s**, l'étiqueter « hypothèse balayée, aucune mesure ». Le renvoi vers un nouveau choix qui exclut l'issue fermée est conforme à Haghani et Sarvi (l'issue quittée est exclue).

## 4. Messages, personnel, signalétique

### 4.1 Personnel
- Fire Technology 2025 (Lu, Rodriguez, …, Lovreglio ; VR station de métro ; 131 participants, 1 048 choix ; logit multinomial) : **βI = 2,739** (écart-type 0,225, z = 12,17) pour un agent qui indique une sortie ; équivaut à environ **78** évacués virtuels allant à l'autre porte (βNPC = 0,035) ; habit de pompier +0,559 (z = 1,70, p = 0,09, peu sûr) ; constante côté droit 0,263 ; 77 % des choix retrouvés (806/1 048) [lu] https://link.springer.com/content/pdf/10.1007/s10694-025-01746-6.pdf. **Valeur confirmée.**
- Avec un agent, la probabilité de choisir la sortie indiquée monte de 50-60 points, pour atteindre **environ 90 %** (scénarios 5 à 12 contre 1 à 4) [lu, même source].
- Vidéos d'incidents réels (126 vidéos) : retard de réponse **20,0 % avec guidage contre 41,9 % sans** (rapport de cotes 0,35) ; alarme seule 48,8 % de retard contre 28,2 % (rapport 2,42) [lu] https://pmc.ncbi.nlm.nih.gov/articles/PMC10620751. Une alarme sans explication est donc **pire** qu'un guidage humain.

### 4.2 Signalétique dynamique
- Signalétique statique : **38 %** des gens la « voient » dans une situation présumée d'urgence en lieu inconnu, même placée devant eux ; panneau dynamique à DEL : **77 %** la voient et **100 % de ceux qui la voient la suivent** [lu, résumé] https://gala.gre.ac.uk/id/eprint/14393/1/14393_GALEA_Dynamic_Signage_Systems_2014.pdf (Galea et al. 2014). Lire : x2 en détection, observance parfaite en cas de détection.
- Signe dynamique « cette issue n'est plus viable » : enquête internationale, **plus de 90 %** comprennent le but du panneau [lu, résumé Galea 2014, même URL]. Panneaux dissuasifs (croix rouge, enquête sur 46 personnes, Olander et al. 2017) : classement de lisibilité seulement, pas de taux de suivi [lu] https://pubmed.ncbi.nlm.nih.gov/27890163 ; une route à lumières vertes clignotantes est plus utilisée (Fridolf 2013, cité) [lu via]. Effet chiffré en foule : non retenu.
- Pour la sortie du cinéma : les gens repartent par la porte d'entrée (+0,795, voir rapport 4) ; les feux verts clignotants peuvent déplacer ce choix (rapport 4, §2).

### 4.3 Message précis par zone ou général
- Messages vocaux enregistrés plus courts en temps de préparation et plus fiables qu'une sirène (centre commercial, théâtre, immeuble) ; on écoute le message entier, parfois sa première répétition, avant de partir [lu, résumé] https://link.springer.com/chapter/10.1007/978-3-642-04504-2_9 (Purser et Bensilum 2001 ; chiffres non lus [?]).
- **« Message ciblé par zone contre message général » : aucune mesure comparative trouvée** [?]. Le guide NIST TN 1827 (communication d'urgence dans les bâtiments) est à lire pour un cadre qualitatif https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1827.pdf [?].
- Conséquence : dans `simuler.ts`, le poids du message (`confiance × clarté × 2,739`) est une **hypothèse**. Ce que la littérature permet de dire : un message qui nomme une sortie réduit le retard et oriente le choix, effet plus faible qu'un agent présent [hypothèse, ordre non mesuré].

### 4.4 Taux d'observance (récapitulatif)
| Situation | Taux | Source |
|---|---|---|
| Choix de la sortie indiquée par un agent (VR métro) | environ 90 % | Fire Technology 2025 [lu] |
| Suit un panneau dynamique, s'il est vu | 100 % | Galea 2014 [lu, résumé] |
| Voit un panneau statique | 38 % | Galea 2014 / Xie 2011 [lu, résumé] |
| Retard de réponse, guidage / sans | 20,0 % / 41,9 % | vidéos réelles [lu] |
| Compréhension d'un panneau « flèche vers le haut = tout droit » | 90 % | https://sciencedirect.com/science/article/pii/S0925753521000552 [lu] |
- **Retours d'expérience réels** (gares, stades) : rien de chiffré et fiable obtenu dans le temps imparti (les résultats étaient des guides, articles de presse et rapports généraux) [?]. À ne pas citer au jury.

## 5. Formules à mettre dans le code

```
// Groupes (creerPopulation)
lambda = -ln(1 - part_groupes)                    // part_groupes = 0,70 -> 1,20
taille = tirage Poisson(lambda) rejeté si 0, plafonné à 6   // 1 = seul
// vitesse = min des membres ; délai = max des membres : INCHANGÉS

// Changement d'avis (probaChangement)
R   = max(0, (att_cur - att_best) / att_cur)      // entre 0 et 1, remplace `des` en minutes
VIS = 1 si l'issue la moins chargée est visible (sinon 0)
Soc = 1 si quelqu'un a quitté la même issue dans les 2 dernières secondes
V   = c + 3.5*R + 0.8*VIS + 0.8*Soc
P   = 1 / (1 + exp(-V))     // c balayé de -4,5 à -3,5 pour viser 3 à 12 % (valeur d'origine -7,5 pour 0,4 s)
```

## 6. Ce qu'on change dans le code

| Constante | Fichier | Ancienne | Nouvelle | Source |
|---|---|---|---|---|
| taille des groupes | `simuler.ts` (`2 + rng.entier(3)`) | 2 à 4 uniforme | Poisson tronquée, λ = −ln(1 − part) | Moussaïd 2010 [lu] |
| `part_groupes` | `simuler.ts` | 0,7 | **0,7 cas central, balayage 0,55 / 0,7 / 0,85** | Moussaïd 2010 [lu] ; soir de cinéma [?] |
| vitesse/délai de groupe | `simuler.ts` | min / max | **inchangé** | Moussaïd 2010, Bode 2015 [lu] |
| `CHANGEMENT.constante` | `sortie.ts` | −6,4 | à balayer (départ −4,0) pour 3-12 % | Haghani et Sarvi 2019 : arbitraire [lu] |
| `desequilibre_par_minute` | `sortie.ts` | 0,6 par minute | `ratio` sans unité, **3,5** | Haghani et Sarvi 2019 [lu] |
| visibilité | `sortie.ts` | absente | **+0,8** | idem |
| `rafale` | `sortie.ts` + `simuler.ts` | compteur +0,1, ×0,97/s, coeff. 1,0, plafond 2 | binaire sur 2 s, **+0,8** | idem |
| cible de changement | commentaire | « 7 à 15 % » | « 3 à 12 % (0-7,5 % labo, 7-15 % VR) » | Liao 2017, Bode et Codling 2013 [lu] |
| hésitation 5 à 30 s | `simuler.ts` | 5 + 25·u | **inchangé**, marqué « hypothèse, aucune mesure » | [?] |
| `personnel` | `sortie.ts` | 2,739 | **inchangé** (confirmé) | Fire Technology 2025 [lu] |
| poids du message | `simuler.ts` | confiance × clarté × 2,739 | à marquer « hypothèse, non mesuré » ; essai de sensibilité à 50 % de l'agent | [?] |

Lancer ensuite le balayage de `c` et vérifier `stats.part_ayant_change` (3 à 12 %).

## 7. Ce qu'on dit au jury

1. « Nos groupes suivent des mesures de terrain : 55 à 70 % des gens marchent en groupe, la taille suit une loi de Poisson tronquée, et la vitesse du groupe colle à une loi publiée à moins de 0,1 m/s près. »
2. « Seuls 3 à 12 % des gens changent d'avis (jusqu'à 15 % en réalité virtuelle, 7,5 % en laboratoire), et ce module améliore l'accord avec l'expérience : l'erreur sur le temps d'évacuation passe de 70 % à 30 %. »
3. « Un agent de guidage fait choisir la bonne sortie à environ 90 % des gens en réalité virtuelle ; en revanche, la durée d'hésitation devant une porte fermée et l'effet d'un message ciblé par zone ne sont pas mesurés dans la littérature : nous les balayons et nous les affichons comme hypothèses. »

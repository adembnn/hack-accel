# Proportions de la foule du Forum des Halles, lundi 19 oct. 2026 vers 20 h

Décision débloquée : combien de personnes de chaque type, dans chaque population (spectateurs UGC, clients, voyageurs), et quelle taille de groupe, à mettre dans le moteur.
Note : `reports/comportements-individuels-foule.md` est introuvable dans le dépôt ; je n'ai pas pu la relire. Les chiffres « population générale » (55-70 % en groupe, 12-17 % de handicap) viennent de la tâche et des sources ci-dessous.

Étiquettes : [mesuré] chiffre publié pour ce sujet ; [estimé à partir de X] calcul à partir d'un chiffre publié ; [hypothèse] aucune mesure trouvée, valeur de travail à tester.

## 1. Version simple

À 20 h, le Forum est presque vide de clients : les boutiques ferment à 20 h (lun.-sam., source de seconde main, à vérifier sur le site Westfield). Il reste le cinéma, ouvert jusqu'à minuit, et la gare. La foule est donc surtout des spectateurs, en couple, entre amis ou en famille (trois sur quatre ne sont pas seuls). Les voyageurs, eux, sont surtout seuls et connaissent les lieux. Les personnes vraiment lentes pèsent 3 à 5 %, pas 12-17 %.

## 2. Combien de monde à 20 h

| Population | Base | Fourchette | Étiquette et calcul |
|---|---|---|---|
| Spectateurs UGC | 2 200 | 1 500 - 3 000 | [estimé] voir 2.1 ; la presse dit 3 000 |
| Clients et restauration du centre | 800 | 500 - 1 500 | [hypothèse] boutiques en fermeture, restaurants ouverts |
| Voyageurs dans le périmètre du Forum (hors quais) | 1 000 | 500 - 2 000 | [estimé] voir 2.3 |
| Total | 4 000 | 2 800 - 6 500 | |

Verdict : 3 200 n'est ni absurde ni trop grand. C'est plutôt bas. La répartition actuelle (55 / 20 / 25 %) donne 1 760 spectateurs, ce qui reste dans la fourchette. Mais si on retient les 3 000 spectateurs de la presse, le cinéma seul fait déjà 94 % de 3 200. Recommandation : paramétrer le moteur par le nombre de spectateurs (2 200 par défaut, 3 000 en « version presse ») et ne pas figer le total.

### 2.1 Cinéma (le chiffre le plus solide)
- 27 salles, plus de 3 800 fauteuils, 2 599 667 entrées en 2025, environ 70 000 séances par an [mesuré] ([Boxoffice Pro](https://www.boxofficepro.fr/ugc-cine-cite-les-halles-paris-premier-cinema-mondial-en-frequentation/), [AlloCiné](https://www.allocine.fr/article/fichearticle_gen_carticle=1000185325.html)).
- Moyenne : 2,6 M / 70 000 = 37 spectateurs par séance, soit 26 % de remplissage moyen ; environ 7 100 entrées par jour [estimé, division simple].
- Un lundi de vacances, la part des entrées du jour dont la séance est en cours à 20 h (début 17 h 45 - 20 h) est de l'ordre de 30 %, soit 2 100 à 3 100 ; par les fauteuils (16 à 19 salles occupées à 35-45 %), plutôt 1 000 à 1 500, plus le hall. D'où 2 200 [estimé, deux méthodes qui se recoupent mal : fourchette large].
- Presse : « 3 000 personnes » évacuées vers 20 h ([BFM](https://www.bfmtv.com/culture/cinema-series/gardez-votre-ticket-quand-le-couvre-feu-a-paris-interrompt-des-seances-a-l-ugc-cine-les-halles_AN-202610200618.html), [Ouest-France](https://www.ouest-france.fr/cinema/un-cinema-ugc-evacue-en-pleines-projections-a-paris-a-cause-du-couvre-feu-les-spectateurs-en-colere-9713fd42-cd4f-11f1-af51-804fa8efc454)). Le chiffre vient d'un témoignage relayé, pas de l'exploitant : c'est 79 % des fauteuils, très au-dessus de la moyenne. Plausible comme plafond, pas comme valeur centrale.
- Accessibilité : les salles 2, 3, 7, 8 et 9 ne sont pas accessibles aux PMR ([UGC](https://www.ugc.fr/cinema.html?id=10)). Poussettes, grosses valises et trottinettes interdites (Vigipirate, même source) : pas de poussettes dans le cinéma.

### 2.2 Forum (centre commercial)
- Fréquentation annuelle : sources discordantes, 37 M ([Paris Authority](https://parisauthority.com/en/attractions/forum-des-halles), 150 000 par jour), 42 M (2017, Wikipédia), 50 M (Wikipédia), 58,4 M ([FashionNetwork](https://us.fashionnetwork.com/news/Urw-sells-15-stake-in-forum-des-halles-to-caisse-des-depots%2C1689886.html)). La fourchette dépend de si on compte les passants de la gare. Aucun profil horaire trouvé.
- À 20 h, la fermeture des boutiques fait chuter le nombre de clients : 800 est une valeur de travail [hypothèse].

### 2.3 Gare Châtelet-Les Halles
- 750 000 voyageurs par jour ouvré, dont 493 000 pour le RER seul, correspondances comprises [mesuré] ([Wikipédia, d'après RATP](https://en.wikipedia.org/wiki/Ch%C3%A2telet%E2%80%93Les_Halles)).
- Profil horaire non trouvé. Hypothèse : 4 à 6 % du jour sur l'heure de 20 h, soit environ 37 000 passages, avec 5 minutes de présence : environ 3 000 personnes dans tout le pôle, dont un tiers dans les couloirs du Forum, d'où 1 000 [hypothèse]. À partir de 20 h 07 les stations du Forum sont fermées : plus d'arrivées, et le flux sortant est l'enjeu.

## 3. Taille et composition des groupes

Mesures publiées :
- Moussaïd 2010 : 55 % des piétons en groupe sur un site peu dense, 70 % sur une rue commerçante ; groupes de 2 à 4 surtout, 5 et plus rares ; loi de Poisson tronquée, λ proche de 0,83 sur le site peu dense ([PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0010047), [résumé](https://ennepo.ai/lecture/82e1b0ba-b782-4d56-a012-6b011b36e8a3)). Sur le site commerçant, moins de solitaires et plus de duos que Poisson.
- Recalcul à partir de λ = 0,83 [estimé] : parts des personnes : seul 44 %, duo 36 %, trio 15 %, quatuor 4 %, 5+ 1 %. Parmi les personnes en groupe : duo 64 %, trio 27 %, quatuor 7 %, 5+ 2 %.
- Cinéma, avec qui : seul 19,2 %, couple 32,3 %, famille 33,8 %, amis ou collègues 14,8 % ; seul 26,7 % dans l'agglomération parisienne, 33,3 % chez les assidus [mesuré] ([Boxoffice Pro, CNC 2026](https://www.boxofficepro.fr/les-pratiques-cinematographiques-un-public-plus-reactif-et-de-plus-en-plus-connecte/)). Version 2025 : seul 23,5 %, couple 32,5 %, famille 29,3 %, amis 14,7 % ([CNC](http://scare.fr/wp-content/uploads/2025/11/Les-pratiques-cinematographiques-des-Francais-en-2025.pdf)). Adolescents : 16,1 % seuls, 28,6 % entre amis.
- Taille moyenne du groupe au cinéma : non publiée dans ce que j'ai trouvé.
- Vacances : la Toussaint 2026 va du samedi 17 octobre au lundi 2 novembre pour les trois zones, donc le 19 oct. est le 3e jour de vacances à Paris (zone C) [mesuré] ([Charente Libre](https://charentelibre.fr/culture-et-loisirs/vacances-scolaires-2026-2027-toussaint-noel-hiver-printemps-voici-toutes-les-dates-30533162.php)). Plus d'enfants et d'adolescents, mais à 19-20 h un lundi, moins de familles avec petits qu'à une séance de l'après-midi.

## 4. Mobilité réduite

- Population générale : 12 % de la population métropolitaine a au moins une limitation sévère (vue, ouïe, marcher 500 m, escaliers) en 2019 ([DREES](https://drees.solidarites-sante.gouv.fr/sites/default/files/2022-09/DD102.pdf)) ; 6 % de 15 ans et plus sont fortement restreints, 4,2 % entre 15 et 64 ans et 12,5 % à 65 ans et plus ([sports.gouv.fr, d'après DREES](https://sports.gouv.fr/sites/default/files/2024-10/t-l-charger-le-rapport-la-pratique-sportive-des-personnes-en-situation-de-handicap--10241.pdf)) ; difficulté à marcher : 9 % en métropole ([BEH](http://beh.santepubliquefrance.fr/beh/2022/9-10/2022_9-10_4.html)) [mesuré]. Ces taux comptent la vue et l'ouïe : ce n'est pas du ralentissement en évacuation. Les 12-17 % cités dans la tâche sont des taux de handicap tous types, à ne pas appliquer.
- Effet de sélection : les personnes les plus limitées sortent moins, surtout le soir, seules et vers un cinéma de centre-ville, et 5 salles sur 27 leur sont fermées. Je divise le taux de marche difficile par 2 à 3.
- Vitesses [mesuré] : 0,7 m/s en fin de marche de 6 minutes pour des personnes avec sclérose en plaques contre 1,9 m/s ([Fire Technology](https://link.springer.com/article/10.1007/s10694-017-0668-9)) ; escalier à la descente 0,36 m/s sans aide, 0,32 avec canne (Boyce, Shields et Silcock 1999) ; seniors environ 40 % plus lents que les adultes en couloir bondé ([Safety Science 2021](https://sciencedirect.com/science/article/pii/S0925753521001387)) ; fauteuil 1,0 à 1,5 m/s dans un modèle (valeur de simulation, pas une mesure : [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12511302)).
- Moyenne marche libre adulte 1,2 à 1,5 m/s ; retenir pour les lents 0,7 - 1,0 m/s à plat et 0,3 m/s en descente d'escalier.

## 5. Recherche d'un proche

- Mawson : la réponse typique au danger est de chercher la proximité des proches, et la séparation d'avec eux est un stress plus fort que le danger physique ([PubMed](https://pubmed.ncbi.nlm.nih.gov/16247853)). Les groupes très liés partent plus tard (WTC 1993, 350 entretiens, [Psychology Today](https://psychologytoday.com/us/blog/slightly-blighty/202009/how-people-panicked-over-the-pandemic)) ; avec des proches présents, le temps de pré-évacuation est plus long ([Social Behavior and Personality](https://doi.org/10.2224/sbp.6946)).
- WTC 2001, tour 1, parmi ceux qui ont retardé sans être bloqués : 33 % cherchaient ou fermaient des dossiers, 27 % aidaient ou attendaient de l'aide, 19 % restaient ([Fujipress](https://www.fujipress.jp/main/wp-content/themes/Fujipress/phyosetsu.php?ppno=DSSTR000600060009)) [mesuré].
- Aucun pourcentage « personnes séparées qui cherchent leur proche » trouvé. Raisonnement : au moment de l'ordre d'évacuer, un groupe assis ensemble n'est pas séparé ; les séparés sont dans le hall, aux toilettes, à la confiserie ou dans une autre salle, soit 5 à 10 % des membres de groupes [hypothèse] ; la grande majorité tente de rejoindre l'autre (Mawson) [hypothèse, 60-80 %]. D'où 3 % de l'ensemble, fourchette 1 à 6 %.
- Recommandation : « cherche un proche » ne doit pas être un profil fixe mais un état déclenché quand un membre du groupe est perdu de vue. Même remarque pour « suiveur » et « indépendant » : ce sont des styles de décision, qui se déduisent de la familiarité (personne seule qui connaît le lieu : indépendante ; seule et ne connaît pas : suiveuse).

## 6. Familiarité avec les lieux

Aucune donnée publique trouvée sur la part de touristes ou d'habitués du Forum ou de la gare (essayé : fréquentation, clientèle, enquêtes touristes ; seul chiffre voisin : 50 M de touristes par an en Île-de-France, la moitié d'étrangers, [CCI Paris IDF](https://www.cci-paris-idf.fr/sites/default/files/2026-06/DYST_LIVRET_PERSONAE.pdf), non localisé). Le public du cinéma compte 17,1 % d'assidus à Paris contre 11 % en moyenne, 73,6 % d'occasionnels au niveau national ([Boxoffice Pro](https://boxofficepro.fr/le-public-du-cinema-en-2025-les-occasionnels-et-la-province-gagnent-du-terrain)). Les parts ci-dessous sont des hypothèses ; à valider auprès de l'exploitant du centre, qui a ces comptages.

## 7. Tableau population x profil (parts de chaque population)

| Profil | Spectateurs UGC | Clients du centre | Voyageurs |
|---|---|---|---|
| En groupe (2 et plus) | 73 % (68-78) [estimé, CNC agglo. parisienne : 26,7 % seuls] | 60 % (50-70) [estimé, Moussaïd 55-70 %, baissé pour le soir] | 30 % (20-45) [hypothèse, navetteurs] |
| dont couple et duo d'amis | 62 % des groupés | 66 % | 70 % |
| dont famille ou trio | 20 % | 22 % | 20 % |
| dont 4 et plus | 18 % (en 5+ : 6 %) | 12 % | 10 % |
| Seul | 27 % (22-32) [estimé, CNC] | 40 % | 70 % |
| dont connaît le lieu (-> indépendant) | 60 % [hypothèse] | 55 % | 85 % |
| dont ne connaît pas (-> suiveur) | 40 % | 45 % | 15 % |
| Mobilité lente, dont canne, déambulateur, senior fragile, femme enceinte avancée | 4 % (2-6) [estimé à partir de 9 % de DREES/BEH, divisé par la sélection] | 5 % (3-8) [estimé, plus de seniors] | 2,5 % (1-4) [estimé, âge actif] |
| dont fauteuil roulant | 0,4 % (0,2-0,8) [hypothèse] | 0,4 % | 0,2 % |
| Cherche un proche (état, pas profil) | 3 % (1-6) [hypothèse] | 2 % | 1 % |

Lecture : la mobilité lente et la recherche d'un proche se superposent aux autres lignes (une personne âgée peut être en couple). Les parts de composition (groupe, seul) sont exclusives et font 100 % pour chaque colonne. Les groupes de 5 et plus sont découpés par la foule réelle en sous-groupes de 2 à 3 ([Safety Science 2017](https://sciencedirect.com/science/article/pii/S0378437117301188)) : on peut les plafonner à 4 dans le moteur.
Taille moyenne d'un groupe : environ 2,4 à 2,6 personnes pour le cinéma [hypothèse, famille tirant vers 3-4].

## 8. Ce que ça change

1. Moteur paramétré par `nbSpectateurs` (2 200 par défaut, 3 000 version presse), `nbClients` (800), `nbVoyageurs` (1 000).
2. Remplacer PMR 12-17 % par 3-5 % de mobilité lente dont moins de 0,5 % en fauteuil, et mettre les fauteuils dans les salles accessibles.
3. Séparer trois axes : composition sociale, mobilité, familiarité ; déduire suiveur/indépendant de la familiarité.
4. Groupes : taille 2 à 4 (parts du tableau), cohésion plus forte pour les familles que pour les amis.

## 9. Limites

- Non trouvé : profil horaire du Forum et de la gare, part de touristes, taille moyenne de groupe au cinéma, part de séparés qui cherchent leur proche. Les trois populations (800 clients, 1 000 voyageurs) reposent sur des hypothèses.
- Le lundi 19 oct. suit un week-end de manifestations (550 000 personnes selon le ministère le 17 oct.) : l'affluence réelle a pu baisser ; aucune mesure.
- Les 3 000 de la presse viennent d'un témoignage relayé : à ne pas citer comme chiffre officiel.

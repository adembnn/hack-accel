# Types de réaction individuelle dans la foule : proportions publiées, déclencheurs, règles pour notre moteur

Décision débloquée : quels types d'individus implémenter, avec quelles règles de bascule, sans tirage au sort quand la littérature n'en donne pas.
Recherche faite le 22 oct. 2026 (Keenable). Étiquettes : **[mesuré]** = chiffre observé sur des humains ; **[modèle publié]** = équation ou règle d'un article ; **[hypothèse]** = notre choix, à régler sur le terrain.
Je n'ai lu que les résumés et extraits des sources, pas les articles entiers : les chiffres cités viennent de ces extraits. À revérifier dans l'article avant de les afficher au jury.

## 1. Réponse courte

- **Il n'existe presque aucune probabilité publiée du type « x % des gens paniquent ».** La littérature dit même que la panique collective est rare. Ce qui est publié : des proportions de groupes sociaux, de personnes à mobilité réduite, de personnes qui continuent leurs activités, et des *lois de réaction* (impatience, densité, contagion).
- **Donc ton intuition est la bonne** : on ne tire pas « 5 % de paniqués » au hasard, on fait *monter un niveau de stress* chez chacun selon sa situation (attente, densité, menace visible, voisins en détresse), et on change son comportement quand ce niveau passe un seuil.
- Le seul tirage restant : un **trait fixe par personne** (sensibilité, patience), tiré une fois au début, comme dans les modèles OCEAN (Durupinar). Le reste est déterministe.
- Image : chacun a une jauge de stress. La jauge se remplit quand on est bloqué, serré, qu'on voit le danger, que les voisins sont affolés. Le type de comportement dépend de la hauteur de la jauge et du caractère de la personne.

## 2. La « panique » de masse existe-t-elle ?

(« Panique » = fuite irrationnelle et égoïste, contagieuse, de toute la foule.)

- **[mesuré] Elle est rare ; coopération et aide dominent.** Quarantelli (2001) : la fuite n'est pas la panique ; le problème des catastrophes est plutôt de faire partir les gens. Drury, Cocking & Reicher (2009, *Br. J. Soc. Psychol.*, 21 survivants de 11 événements dont Hillsborough) : 12 décrivent de l'unité, 9 du « chacun pour soi » ; ceux qui ressentent l'unité rapportent plus d'aide et plus d'ordre (files). Attentats de Londres 2005 (plus de 90 survivants) : comportements égoïstes rares, aide mutuelle plus fréquente.
- **[mesuré] WTC 11 sept. 2001** (Proulx & Fahy, 745 récits de 435 survivants) : seul un tiers rapporte des voisins en détresse (pleurs, cris) ; 57 % décrivent les autres calmes et ordonnés ; la moitié rapporte des obstructions ; l'aide mutuelle apparaît dans 46 % des récits. La panique y était individuelle, pas collective.
- **[mesuré] Revue de 483 études** (Philpot, Levine & Drury, 2023, citée dans *Br. J. Soc. Psychol.*) : le comportement le plus fréquent est d'aider les autres.
- **[mesuré] Attaque au couteau, métro de Londres 2015** (Leytonstone, 27 caméras) : fuites rapides quand la menace monte, mais à chaque phase des passants interviennent de façon coordonnée.
- **Ce qu'on observe vraiment : des ruées locales et des écrasements causés par la physique**, pas par la méchanceté. Love Parade 2010 : « le désastre n'a pas exigé de mauvaise intention » (Helbing & Mukerji 2012, *EPJ Data Science*) ; témoins : l'écrasement vient du tassement, la poussée active n'est citée que dans 16 témoignages, l'aide est le comportement le plus cité (*Safety Science* 2023). Itaewon 2022 : densité moyenne de 7,6 pers./m² (pointe 9,95) dans la ruelle, selon une reconstruction par simulation ; des appels à la police signalant des gens qui se poussent arrivent à 20h09, après environ 1h30 de congestion qui commence vers 18h34 (PLOS ONE 2024, *Unraveling the causes of the Seoul Halloween crowd-crush*, empirique + simulation).
- **Nuance pour notre moteur** : Mawson (2005/2007) ne nie pas les deux « vrais » états extrêmes (course folle, immobilité) ; ils apparaissent quand on croit le danger réel ET les issues limitées ou en train de se fermer. C'est exactement le cas « une seule issue, la moitié des bouches de métro fermées » : on a donc le droit de monter en stress, mais sur des *conditions*, pas par tirage.
- **[modèle publié] Faster-is-slower** (Helbing, Farkas, Vicsek, *Nature* 2000) : si les gens veulent aller plus vite, la sortie se bouche (arches, friction) et le débit baisse. Les mêmes auteurs listent les traits de la « panique » simulée : vitesse accrue, poussées, goulots incoordonnés, issues alternatives négligées, tendance à faire comme les autres.

## 3. Modèles de stress et de contagion (ce qu'on peut brancher)

(« Contagion » = le stress d'un voisin se transmet au suivant.)

| Modèle | Idée | Paramètres publiés | Pour nous |
|---|---|---|---|
| **Impatience, Helbing 2000** [modèle publié] | `p(t) = 1 − v(t)/v0` : plus on avance lentement par rapport à sa vitesse voulue, plus on est impatient. Vitesse voulue `v0(t) = (1−p)·v0(0) + p·vmax` | `v0(0)` et `vmax` dans l'article ; le texte relie impatience, contre-flux et déclenchement de « panique » | **Déclencheur n°1** : il mesure exactement « bloqué depuis longtemps » sans seuil arbitraire en minutes |
| **ASCRIBE, Bosse et al.** [modèle publié] | Émotion continue `q` dans [0,1] ; elle s'écoule entre voisins comme la chaleur (intensité émise × force du canal × ouverture du récepteur) | Une émotion qui se dilue au contact de voisins calmes | **Recommandé pour la contagion** : déterministe, continu, pas de tirage |
| **Durupinar et al.** (chap. 6, Pelechano/Durupinar) [modèle publié] | Contagion par seuil (Dodds & Watts) : la probabilité d'être contaminé monte avec le nombre de voisins contaminés ; personnalité OCEAN ; empathie `ε = 0,354·O + 0,177·C + 0,135·E + 0,312·A + 0,021·N` (corrélations de Jolliffe & Farrington) ; l'émotion décroît `e(t) = e(t−1) − β·e(t−1)·dt` | Coefficients ci-contre ; `β` à régler | Utile pour les **traits fixes** (qui est sensible). Sa partie « probabiliste binaire » est moins bonne que ASCRIBE |
| **ESCAPES, Tsai et al.** [modèle publié] | Plus on a peur, plus on va vite ; la peur est héritée du voisin le plus effrayé, en plus de la connaissance des issues (on ne connaît souvent que l'issue d'entrée) | Peur → vitesse | Idée de **vitesse selon la peur** et de **mémoire des issues** (déjà notre logique « issue d'entrée ») |
| **Comparaison Tsai et al. 2013** [mesuré sur vidéo] | Sur 35 personnes filmées dans une vraie scène de panique, ASCRIBE bat Durupinar de 14 % par agent et par image sur 15 s | — | Argument pour choisir ASCRIBE |
| **HiDAC, Pelechano** | Panique/impatience comme paramètres de comportement par agent | Valeurs non retrouvées dans mes extraits | À consulter si besoin ; non utilisé ici |
| **SIR/SIS (épidémie)** | S'applique à l'émotion (sain / contaminé / remis) | `β`, `γ` libres, aucun jeu mesuré sur humains | **[hypothèse]** seulement ; ne pas présenter comme mesuré |

## 4. Typologies et proportions mesurées

- **Groupes** [mesuré] : 55 % (population A) à 70 % (population B) des piétons d'une rue commerçante marchent en groupe ; les groupes de 2 à 4 sont les plus fréquents (Moussaïd et al., *PLOS ONE* 2010). Dans l'incendie du Station Nightclub (2003, 465 personnes) : 10 % seuls, 29 % des groupes à 2 personnes, 32 % à 3-4, 39 % à 5 et plus ; la mortalité croît presque en ligne droite avec la taille du groupe (Aguirre et al. ; modèle de calcul dans *JASSS* 2017).
- **Chercher un proche, rester avec lui** [mesuré, mais discuté] : Mawson (2005) : la réponse typique au danger est l'affiliation (rejoindre les proches), pas la fuite ; séparation d'un proche = plus gros stress que le danger physique. WTC 1993 (350 entretiens) : les groupes aux liens les plus forts partent le plus tard. Étude de survivants (173 personnes, PMC3814431) : être avec des proches est associé à un départ retardé. Séisme d'Émilie 2012 : 72,7 % étaient avec leur famille, mais le contexte social n'a PAS changé le comportement d'évacuation (contre-exemple). Station Nightclub : hommes et femmes séparés se cherchent dans des sens opposés et créent des nœuds qui bloquent (Aguirre ; *JASSS* 2017).
- **Suivre la foule ou l'éviter** [mesuré, contradictoire] :
  - Haghani & Sarvi (*Animal Behaviour* 2017 ; *Safety Science* 2019 ; expériences réelles, n = 117) : la tendance dominante est d'ÉVITER l'issue choisie par beaucoup, pas de la suivre ; l'imitation n'apparaît qu'avec une forte incertitude. « Suiveur / non-suiveur » est une dichotomie trop simple.
  - Sous urgence élevée (Haghani et al., *Safety Science* 2020) : réaction plus rapide, environ **deux fois plus de changements d'issue**, même tendance à éviter la foule ; un changement d'issue déclenche une **rafale** de changements chez les voisins (imitation du CHANGEMENT, pas du choix initial). Facteurs du changement : déséquilibre de files entre issues, visibilité, influence sociale, inertie.
  - En réalité virtuelle, quand 100 % des personnages virtuels vont du même côté, environ 69-73 % des sujets les suivent (Frontiers in Psychology 2025, 162 sujets) ; trois tendances se compensent : suivre la majorité, éviter l'encombrement, éviter une issue que personne ne prend (*Physica A* 2021).
  - Aux croisements et aux issues, le suivisme est le plus net, surtout si on est mal informé (étude d'exercices d'évacuation, *Current Psychology* 2024).
- **Ne pas partir tout de suite** [mesuré] : la durée avant de bouger suit une loi log-normale ou log-logistique (40 exercices, 2 486 mesures, *Fire Technology* 2019) ; c'est le « départ log-logistique » que nous avons déjà. Au WTC, 15 % des survivants interrogés ont continué leurs activités après la 1re tour touchée (Kuligowski, cité par NIST IR 7914). Le modèle de Kuligowski : pas de risque perçu → on continue ; un peu de risque → on s'informe (« milling » : tourner en cherchant à comprendre) ; assez de risque → on agit.
- **Mobilité réduite** [mesuré] : environ 12-17 % de la population a un handicap ; au WTC, environ 23 % des évacués avaient une limitation (mobilité, vue ou autre) (Sci. Rep. 2025). Vitesses : marcheur moyen 1,2-1,5 m/s ; fauteuil 1,0-1,5 m/s ; malvoyant environ 1,0 m/s ou moins ; personnes avec sclérose en plaques 0,7 m/s en fin de parcours contre 1,9 pour les témoins (*Fire Technology* 2017). Même une petite part de PMR allonge l'évacuation et crée des poches de lenteur.
- **Aide** [mesuré] : dans 9 conflits publics sur 10, au moins un passant intervient (Philpot et al. 2020, 219 cas filmés). Station Nightclub : 7 employés sur 12 ont aidé les clients.
- **Personnes qui filment, refus d'évacuer, retour en arrière** : **aucune fréquence chiffrée trouvée** dans cette recherche. Le retour en arrière pour retrouver un proche est documenté (Bryan 2002 ; Chu & Law 2013 : détours et allers-retours allongent l'évacuation). Bataclan 2015 : la littérature trouvée est surtout des témoignages (jouer le mort, se cacher, s'entraider pour sortir par un conduit) ; aucune proportion exploitable.
- **Comportements antisociaux (vol, agression)** [mesuré] : rares en catastrophe (Perry & Lindell ; Drury, Novelli & Stott 2013) ; le « mythe du désordre civil » est l'un des trois mythes. Les poussées visibles dans les écrasements sont surtout un effet physique (Helbing & Mukerji).

## 5. Attente, densité et information : seuils

| Variable | Seuil / effet | Statut |
|---|---|---|
| Densité 4 pers./m² | Mouvement restreint, on « traîne les pieds » ; risque élevé selon Still | [mesuré/expert], Still |
| Densité 5 pers./m² | Contact de plusieurs côtés, ondes de choc possibles ; seuil « partir tout de suite » | idem |
| Densité 6 pers./m² et plus | Perte du contrôle de son mouvement, « turbulence de foule » (Helbing et al., 2007, La Mecque) | [mesuré] |
| Densité environ 7 pers./m² | La foule se comporte presque comme un fluide ; les intentions individuelles n'y changent plus rien (Helbing & Mukerji ; PLOS ONE 2024) | [mesuré/modèle] |
| Pression | 1 000 N/m durable ou 2 500 N/m instantané : gêne grave ; poussée possible d'un individu 30-75 % de son poids ; 200-400 N à 6-10 pers./m² dans le modèle | [mesuré], cité par PLOS ONE 2024 |
| Durée d'attente avant poussée | Itaewon : poussées signalées après environ 1h30 de congestion à densité très haute ; **aucun seuil de durée universel publié** | [mesuré, un cas] |
| Contre-flux + attente | Déclenchent l'impatience puis la « panique » dans le modèle (Helbing 2000) | [modèle publié] |
| Information | Les départs sont plus tardifs avec une information vague ; les gens ne suivent pas les mesures quand les messages sont incomplets (Perry & Lindell) ; les consignes d'un membre du personnel augmentent le choix de l'issue indiquée (étude de bibliothèque, Massey 2024) | [mesuré] |
| Visibilité | Dans une foule on est quasi aveugle, ce qui nourrit l'anxiété (Helbing & Mukerji) ; la visibilité des issues compte dans le choix et le changement d'issue | [mesuré] |

**Lecture honnête** : « bloqué depuis 10 minutes → panique » n'a pas de source. Le seuil de 10 min est une **[hypothèse]**. La version publiée est l'impatience `p(t)` de Helbing, qui monte avec le temps passé à avancer moins vite que voulu, et qui dépend de la densité.

## 6. Le perturbateur (« casseur ») dans la foule

Garde-fou : cette section décrit uniquement l'effet sur la foule et la réponse de sécurité. Rien sur la façon de nuire.

- **Dans les modèles** : les perturbateurs sont représentés soit par un agent « antisocial » avec des paramètres de comportement différents (exemples vus dans les agents à stratégie « défecteur » ou « chercheur de risque », Carleton 2022), soit par une **perturbation locale** (zone qui repousse). Pas de jeu de paramètres mesuré trouvé.
- **Effet mesuré sur les voisins** : mal documenté en laboratoire. En situation réelle (Leytonstone 2015) les gens fuient quand la menace monte, mais une partie intervient (barrage, aide, alerte) ; en conflit public, 9 fois sur 10 quelqu'un aide.
- **Représentation proposée [hypothèse]** : un agent « perturbateur » = une **zone d'évitement** (rayon environ 3-5 m) qui repousse les voisins avec une force sociale répulsive et ajoute de la peur à ceux qui la voient (ASCRIBE, avec un émetteur fort). Pas de comportement offensif optimisé : on mesure seulement comment la foule réagit et quelle réponse du directeur de centre limite les dégâts (fermer une zone, annoncer, ouvrir une issue).
- **Compatible avec ce que dit Adem** : « fauteurs de trouble » = zones ou issues impraticables dans le jumeau, jamais un scénario d'attaque (décision du 22 oct., ticket #13).

## 7. Proposition pour notre moteur

### 7.1 Variables par personne

- **Traits fixes (tirés une fois au début, seul tirage permis)** : `sensibilité` (ouverture à la contagion), `patience` (pente de l'impatience), `suivisme` (poids du voisin dans le choix d'issue), `autonomie` (aller seul). Source des corrélations : Durupinar (empathie à partir d'OCEAN) [modèle publié] ; distribution des traits [hypothèse], à régler pour retrouver les observations (Haghani : plutôt éviteurs que suiveurs).
- **Jauge de stress `s` dans [0,1]**, mise à jour à chaque pas de temps :

```
ds/dt =  a · p_i(t)                       impatience de Helbing   [modèle publié]
       + b · clamp((ρ − 4) / (6 − 4))     densité locale 4→6      [seuils mesurés, forme = hypothèse]
       + c · menace_visible               vue de la zone de danger, bruit, annonce alarmante [hypothèse]
       + d · (s_voisins_moyen − s_i)·sensibilité   contagion ASCRIBE [modèle publié]
       − e · s_i                          retour au calme (Durupinar : décroissance) [modèle publié]
       − f · (info_claire + proche_retrouvé)       l'information et la présence d'un proche calment (Mawson) [modèle publié/mesuré]
```
Coefficients a-f : **[hypothèse]**, à régler pour que deux repères sortent juste : (1) pas de poussée en dessous de 4 pers./m² ; (2) poussées après de longues attentes à haute densité (cas Itaewon).

### 7.2 Les types, leur règle de bascule, leurs effets

| Type | Règle de bascule (situation, pas tirage) | Mouvement modifié | Contagion | Statut |
|---|---|---|---|---|
| **Calme coopératif** (état par défaut, majorité) | `s < 0,4` | `v0` normal, distance personnelle normale, cède le passage ; peut aider | calme les voisins (ASCRIBE, peur diluée) | [mesuré] comportement dominant |
| **Hésitant / s'informe** | Avant le départ : risque perçu faible ; durée log-logistique (déjà implémentée) ; part qui continue ses activités ≈ 15 % (WTC) | Reste ou tourne en cherchant l'info (« milling ») | observe les voisins ; se met en mouvement si un voisin part | [mesuré] 15 % WTC ; reste [modèle publié] |
| **Suiveur** | Incertitude haute (issue inconnue, rien de visible) ET `suivisme` élevé | Choix d'issue = majorité locale, pondérée ; **mais** évite une issue déjà très encombrée (Haghani) | rafale de changements si un voisin change | [mesuré] mixte ; poids [hypothèse] |
| **Loup solitaire (autonome)** | Issue connue ou visible ET `autonomie` élevée, ou voie encombrée et alternative libre | Choisit l'issue la moins chargée, change d'issue quand les files diffèrent beaucoup (Haghani) ; pas de contre-flux brutal | peu sensible | [mesuré] tendance à éviter la foule ; seuil de changement [hypothèse] |
| **Paniqué** | `s ≥ 0,7`, avec hystérésis (retombe sous `s < 0,5`) ; déclencheurs : impatience, densité > 5, menace visible | `v0` vers `vmax` (Helbing, ESCAPES), distance personnelle réduite, pousse (force de contact accrue), néglige les issues alternatives, **contre-flux plus probable** | émet un fort signal de peur (rayon 3-5 m) ; effet faster-is-slower naturellement | [modèle publié] ; seuils [hypothèse] |
| **Chercheur de proche** | A un proche (groupe) hors de vue ET `s` modéré | Cible = dernière position du proche ; **peut aller à contre-courant**, ralentit puis s'arrête | crée des nœuds locaux (Station) | [mesuré] affiliation ; 55-70 % en groupe ; proportion qui cherche : [hypothèse] |
| **Groupe** (2 à 4, parfois plus) | Toujours, selon la composition réelle de la foule | Reste ensemble, vitesse du plus lent, attend les retardataires | partage le stress du groupe | [mesuré] 55-70 % en groupe ; tailles 2-4 |
| **Filmeur** | Menace visible ET `s` faible (curiosité) | Vitesse réduite, regarde la menace, s'arrête, bloque un peu le passage | peut attirer les curieux | **[hypothèse]**, aucune proportion trouvée |
| **PMR / lent** | Fixé au départ (≈ 12-23 % ayant une limitation, dont une part moindre en fauteuil) | `v0` 0,7-1,5 m/s selon le cas ; ne passe pas les escaliers ; reste dans les poches ; aidé par un voisin | ralentit le flux derrière lui | [mesuré] part et vitesses (Sci. Rep. 2025) |
| **Réfractaire** | Ne perçoit pas le risque (jauge basse longtemps) ET proche à l'extérieur ou occupation en cours | Reste ou repart plus tard ; ignore les consignes mal formulées | peu de contagion | [mesuré] ≈ 15 % continuent (WTC) ; partie « refus » [hypothèse] |
| **Perturbateur** | Posé par le directeur (zone/issue) ou par le scénario, jamais généré au hasard dans la foule | Zone d'évitement (§6) | émetteur fort de peur dans la zone | [hypothèse], garde-fou §6 |

### 7.3 Règles de non-tirage

- Aucune proportion de « paniqués » n'est donnée en entrée : la proportion de paniqués est une **sortie**, qui dépend de la densité, de l'attente et de l'information.
- Les seules proportions en entrée sont celles qui sont mesurées sur la population de base (groupes, PMR, part qui continue ses activités) ; le jury peut y voir les sources.
- Le tirage unique des traits est fixé par graine (reproductible) ; deux exécutions avec le même scénario donnent le même film.

### 7.4 Réglages à faire avant la démo (ordre de priorité)

1. Vérifier que l'impatience `p(t)` rend bien « bloqué longtemps » (lot `foule-mouvement`).
2. Brancher la contagion ASCRIBE à la place d'un tirage ; écrire les 3 repères de calage (§7.1).
3. Ajouter les types PMR, groupe, chercheur de proche, perturbateur-zone ; filmeur et réfractaire en dernier (peu de données).
4. Afficher dans l'interface le type/état de quelques personnes cliquées (stress, déclencheur, source) : réponse directe à « la VRAIE vie ».

## 8. Ce que cette recherche ne prouve pas

- Aucun seuil publié de type « 10 minutes bloqué → panique » ni de proportion de « loups solitaires » ou de « filmeurs ».
- Les extraits viennent de résumés ; certains chiffres (12-17 %, 23 %) sont des synthèses secondaires (Sci. Rep. 2025) et non des mesures directes.
- Les seuils de densité de Still viennent d'un site de vulgarisation qui cite Still et Helbing ; à croiser avec les articles avant citation.
- Les études de suivisme se contredisent (suivre vs éviter) ; la règle proposée (éviter une issue très chargée, suivre sous forte incertitude) est un compromis, pas un fait établi.

## Sources principales

- Helbing, Farkas, Vicsek, *Simulating dynamical features of escape panic*, Nature 407 (2000), arXiv cond-mat/0009448.
- Helbing & Mukerji, *Crowd disasters as systemic failures: analysis of the Love Parade disaster*, EPJ Data Science 1:7 (2012) ; Helbing, Johansson, Al-Abideen, *Dynamics of crowd disasters*, Phys. Rev. E (2007).
- Moussaïd, Helbing, Theraulaz, *How simple rules determine pedestrian behavior and crowd disasters*, PNAS 108 (2011) ; Moussaïd, Perozo et al., *The walking behaviour of pedestrian social groups*, PLOS ONE 5(4) (2010).
- Haghani & Sarvi, *Following the crowd or avoiding it?*, Animal Behaviour 124 (2017) ; *Herding in direction choice-making*, Safety Science (2019) ; Haghani et al., Safety Science (2020, urgence haute/basse) ; *Simulating adaptive exit-choice changing*, TRID 1606037.
- Mawson, *Understanding mass panic and other collective responses to threat and disaster*, Psychiatry (2005), PubMed 16247853.
- Drury, Cocking, Reicher, *Everyone for themselves?*, Br. J. Soc. Psychol. 48 (2009) ; *The nature of collective resilience: London bombings 2005*, IJMED 27 (2009) ; Drury, Novelli, Stott (2013).
- *Human collective reactions to threat*, WIREs Cogn. Sci. (2015), PubMed 26263225 (synthèse, dont Proulx & Fahy sur le WTC).
- Quarantelli, Panic, sociology of (2001) ; Fahy et al. (2012), cité dans les extraits.
- Kuligowski / Gwynne, *Evacuation Decision Model*, NIST IR 7914 (2013) ; *The variation of pre-movement time in building evacuation*, Fire Technology (2019).
- Tsai et al., *ESCAPES* (2011) ; Tsai et al., *Empirical evaluation of computational fear contagion models in crowd dispersions*, JAAMAS (2013) ; Durupinar et al. dans Pelechano et al. (chap. 6, 2016) ; Bosse et al. (ASCRIBE) ; Durupinar, arXiv 2607.25140 (2026, version LLM, seulement pour comparaison).
- Aguirre et al. (2011), Station Nightclub ; étude de calcul du Station Nightclub, JASSS 20(4) (2017), jasss.org/20/4/10.html.
- *Unraveling the causes of the Seoul Halloween crowd-crush disaster*, PLOS ONE (2024), PMC11244771 ; Hwang & Kim, *Virtual reenactment of the Itaewon crowd crush*, Computer Animation and Virtual Worlds (2025).
- Philpot et al., *Would I be helped?*, American Psychologist 75 (2020) ; étude CCTV de Leytonstone, Br. J. Soc. Psychol. (2024-25).
- *Inclusive crowd evacuation modeling under heterogeneous mobility constraints*, Sci. Rep. (2025) ; *Egress efficacy of persons with MS*, Fire Technology (2017).
- Still, G. K., échelle de densités (gkstill.com) ; relayée par survipedia.com (2026).

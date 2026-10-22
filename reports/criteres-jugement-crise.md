# Critères pour juger un plan d'évacuation / de crise (Forum des Halles)

> Contenu destiné à /Users/adem/Accel/reports/criteres-jugement-crise.md. Écrit ici car le mode plan interdisait toute autre écriture : à copier tel quel.

Décision débloquée : la liste des critères (et leur formule) qui note un plan, et comment les combiner en un verdict défendable devant un jury. Rien n'est choisi pour l'équipe : ce sont des propositions. Recherche du 22 oct. 2026, sources publiques. `[?]` = non vérifié à la source primaire ; « calcul » = fait par moi, à refaire à la main. Garde-fou : protection des personnes uniquement ; les zones dangereuses sont des données d'entrée posées par le directeur ou la préfecture, jamais un scénario d'attaque.

## 0. Version simple

Juger un plan, c'est comme corriger un examen à trous : un seul chiffre (« temps d'évacuation ») ne dit pas si quelqu'un a été écrasé ou envoyé dans la mauvaise rue. Les ingénieurs de sécurité utilisent donc plusieurs jauges et un ordre de priorité. Je propose 5 jauges :
1. **Écrasement** : jamais trop de monde au mètre carré, jamais trop longtemps.
2. **Pas sortis à l'heure** : combien de personnes sont encore dedans à 22 h (métro fermé) et 23 h (couvre-feu), et de combien de minutes de marge on dispose.
3. **Sortis au mauvais endroit** : combien de personnes passent du temps dans une zone dangereuse ou arrivent à une station fermée.
4. **Délai** : le temps pour vider (90 % et 99 % des gens).
5. **Continuité** (secondaire) : combien attrapent encore un métro ouvert.
Règle : d'abord une « ligne rouge » d'écrasement et des contraintes dures (élimination), puis on classe dans l'ordre 2, 3, 1, 4, 5 avec des tolérances, sur le pire cas (les 5 % de simulations les plus mauvaises), pas sur la moyenne.

## 1. Comment l'ingénierie de sécurité juge une évacuation

Termes. **ASET** = temps disponible avant que le lieu devienne intenable ; **RSET** = temps nécessaire pour que tout le monde soit en sécurité ; **marge** = ASET − RSET. **Pré-mouvement** = délai entre l'alerte et le premier pas (comprendre, finir son film, chercher ses proches). **Déplacement** = marche + attente aux goulots.

- Formules officielles britanniques : PD 7974-6 (éq. 1) marge = ASET − RSET ; (éq. 2) RSET = détection + alarme + (pré-mouvement + déplacement). Le pré-mouvement est donné en deux chiffres, 1er et 99e centile ; il domine en général le RSET ([FireStrategy, résumé de PD 7974-6](https://firestrategy.ai/tools/aset-rset-calculator), ISO/TR 16738 cité par [PyroRisk](https://pyrorisk.net/blog/aset-vs-rset-the-inequality-behind-every-evacuation-plan)). Secondaire, non vérifié sur la norme payante `[?]`.
- Marge exigée : pas de valeur universelle. Pratique courante : facteur ASET/RSET de 1,5 à 2 ([PyroRisk](https://pyrorisk.net/blog/aset-vs-rset-the-inequality-behind-every-evacuation-plan), [ScienceDirect 2014](https://sciencedirect.com/science/article/pii/S1877705814004433) : « plus de 1, pas plus de 3, typiquement 1,5 à 2 »). Italie : marge ≥ 100 % du RSET (10 % avec données d'exercice) ; Singapour : facteur ≥ 1,2 (PyroRisk, secondaire).
- **Adaptation à notre cas (calcul)** : ici l'échéance n'est pas un incendie mais l'heure. Avec T0 = 19 h 20 (annonce), « ASET » métro = 22 h − 19 h 20 = 160 min ; couvre-feu = 23 h − 19 h 20 = 220 min. Facteur 1,5 : RSET au 99e centile ≤ 107 min (métro) ou ≤ 147 min (couvre-feu). Le terme « ASET » est emprunté ; le dire au jury.
- Déplacement : vitesse libre 1,19 m/s sous 0,54 pers/m² ; vitesse nulle vers 3,8 pers/m² ; débit maximal de porte ~1,3 pers/s par mètre de largeur (SFPE Nelson & MacLennan / Gwynne & Rosenbaum, via [PyroRisk](https://pyrorisk.net/blog/aset-vs-rset-the-inequality-behind-every-evacuation-plan) ; [chapitre Springer](https://link.springer.com/chapter/10.1007/978-1-4939-2565-0_59)). Still : débit soutenable max 82 pers/m/min ([EIAI](https://eiai.ie/crowd-risk-analysis-and-crowd-safety)), cohérent avec 1,3 × 60 = 78 (calcul). Exemple (calcul) : 3 000 personnes sur 10 m utiles à 82 pers/m/min = 820 pers/min, soit ~3,7 min : le goulot pur n'est pas le facteur dominant, le pré-mouvement et les escaliers le sont `[?]`.
- **Niveaux de service de Fruin** : A à F selon la densité ; F = plus de 2,17 pers/m² (moins de 0,46 m²/pers). F veut dire « circulation rompue », pas « mortel » ([résumé](https://crowdmanagementindia.com/post/crowd-density-and-level-of-service-the-science-behind-safe-crowd-management), secondaire ; [Fruin 1971, HRR 355](https://nyc.gov/assets/planning/download/pdf/plans/transportation/td_pedloschaptertwo.pdf) pour l'équivalent HCM).
- **Allemagne, DIN 18009-2** : on fixe d'abord des « objectifs de protection » avec l'autorité, puis des critères mesurables ; les plus courants : temps de dégagement (clearance time) et analyse des bouchons, **durée et taille de congestion** ([accu:rate](https://accu-rate.de/en/innovation/normen-und-regeln/din)). C'est la référence la plus proche de notre grille.
- **RiMEA** : 14 scénarios de test pour valider un simulateur ; dans un exercice de comparaison, 8 modèles sur un même amphi donnent jusqu'à 30 % d'écart de temps d'évacuation ([RiMEA 2025](https://rimea.de/wp-content/uploads/2025/10/2025-10-15-rimea-workshop-vortrag-hoersaalbeispiel.pdf), [Springer](https://link.springer.com/article/10.1007/978-3-319-27753-0_8)). Conséquence : toute marge inférieure à ~30 % est du bruit de modèle. **À afficher en démo.**
- **Cinq éléments à valider dans un modèle** (NIST TN 1822) : pré-évacuation, mouvement, choix des sorties, disponibilité des routes, contraintes de flux ([NIST](https://nvlpubs.nist.gov/nistpubs/technicalnotes/NIST.TN.1822.pdf)).
- **Règlement ERP français** (dimensionnement, pas jugement) : unité de passage (UP) = 0,60 m (0,90 m pour 1 UP, 1,40 m pour 2 UP) ; plus de 200 personnes : pas de dégagement normal sous 2 UP ; 1 UP par 100 personnes ; 1 sortie de plus par 500 ([Légifrance CO 36-38](https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020303939), [FFB](https://ffbatiment.fr/techniques-batiment/reglementation-construction/reglementation-securite-incendie/dossier-bam/cheminements-d-evacuation-en-erp-dispositions-constructives-liees-aux-degagements)). Escaliers mécaniques : 0,80 m = 1 UP (même source). NFPA 101 / SFPE : non lus en détail `[?]`. Texte français sur un ordre préfectoral sans incendie : aucun trouvé (rapport contraintes-forum-des-halles §1).

## 2. Risque d'écrasement

Termes. **Densité** = personnes par m². **Pression de foule** (Helbing) = densité × variance des vitesses locales : un indicateur de « bousculade » plus fin que la densité seule. **Turbulence** = poussées dans tous les sens, juste avant les chutes.

| Repère | Valeur | Source |
|---|---|---|
| Redline foule mobile (Still) | plus de 3 pers/m² | [EIAI](https://eiai.ie/crowd-risk-analysis-and-crowd-safety) |
| Redline foule statique (Still) | plus de 5 pers/m² | idem |
| Guides britanniques (Green/Purple) | 4 pers/m² (40 pour 10 m²) mobile ; 4,7 (47) debout | [Still, thèse ch. 2](https://gkstill.com/CV/PhD/Chapter2.html) |
| Flux maximal puis chute | densité critique 2 à 3 pers/m² | [Still, flux/densité](https://gkstill.com/Support/crowd-flow/DensityFlow.html) |
| Turbulence (Helbing, Mina 2006) | pression > 0,02 s⁻² ; débit moyen < 0,8 pers/m/s déjà 30 min avant ; accident ~10 min après le début de la turbulence | [arXiv 0810.4590 (résumé)](https://paperlayer.ai/abs/0810.4590v1), [PRE 2014](https://link.aps.org/doi/10.1103/physreve.90.042816) |
| Force sur le corps (Still) | 1 112 N tenus 4 à 6 min = asphyxie ; 6 227 N pendant 15 s | [Still, effondrement progressif](http://gkstill.com/CV/Modelling/CrowdCollapse.html) |
| Reconstitution d'Itaewon (simulation) | densité moyenne 7,57, max 9,95 pers/m² ; pression moyenne 1 063, max 1 961 N/m ; gêne notable à 1 000 N/m prolongé ou 2 500 N/m instantané | [PLOS ONE 2024](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0306764&type=printable) |
| Échelle de risque 1 à 6 | 0-3 sûr ; 3-5 attention ; 5-6 prudence ; 6-7 turbulence ; 7-9 danger ; 9+ critique | [Unity, 2024](https://link.springer.com/content/pdf/10.1007/s42452-024-06451-7.pdf) (le risque dépend aussi de la **durée** de la pression forte) |

Points de vigilance. (a) La durée compte autant que le pic : les seuils de force de Still sont assortis de minutes. (b) Beaucoup de simulateurs à grille plafonnent la densité (6,25 pers/m²) alors que les foules réelles atteignent 7 à 10 : un tel outil ne pourra jamais montrer le danger ([Still, via Safety Docs](https://podcasts.safetydocs.org/2501851/episodes/19489226-it-was-never-a-stampede-the-deadly-physics-of-human-crowds), secondaire). Il faut donc un moteur capable de monter à 8-10 pers/m² ou, à défaut, déclarer « ≥ 6 = alerte rouge » sans le simuler. (c) Seuils « 5 pers/m² = mortel » : synthèses secondaires ; ne pas l'afficher comme loi (rapport foules urbaines §2).

**Formules calculables (propositions)**, sur une grille de 1 m² (ou noyau de 1 m² autour de chaque personne, comme le [métrique IEEE CG&A 2017](https://doi.org/10.1109/mcg.2017.3271454)) :
- ρ_i(t) = densité locale autour de la personne i.
- **C1a = Σ_i ∫ 1[ρ_i(t) ≥ 5] dt** en personnes-minutes à ≥ 5 pers/m² (et même formule à ≥ 3 sur les voies en mouvement, ≥ 6 en « rouge »).
- **C1b = durée continue maximale** passée par une même personne à ≥ 6 pers/m² (en secondes).
- **C1c = max P(x,t)** avec P = ρ · Var(v) sur une fenêtre spatio-temporelle (1-2 m, ~10 s ; taille de fenêtre non tranchée `[?]`) ; comparé à 0,02 s⁻².
- **Ligne rouge proposée** : C1c > 0,02 s⁻² ou C1b > 60 s (le 60 s est ma proposition `[?]`, à caler avec les 4 à 6 min de Still en prenant une marge).

## 3. Personnes non sorties à l'échéance

Termes. **EAS** = espace d'attente sécurisé (CO 34 §6) : zone protégée où une personne qui ne peut pas descendre attend les secours. **Centile 99** = temps en dessous duquel 99 % des personnes sont sorties.

- Comptage standard : le RSET s'arrête quand « le dernier » est à l'abri ; en pratique on prend le 99e centile (PD 7974-6) et on regarde la **queue de la courbe** « personnes sorties selon le temps ». Un temps moyen cache les derniers ([Nature Sci. Rep. 2025](https://nature.com/articles/s41598-025-19403-x) : 20 % de personnes à mobilité réduite = +50 % de temps total, 6 % laissées à l'intérieur ; chiffres issus d'une simulation à 50 agents, indicatifs).
- **RiSET** (« RSET inclusif ») : prend en compte les personnes qui ont besoin d'aide, modélisées comme une file d'attente (personnel, règle de priorité, matériel) ; valeur retenue = 99e centile ([Fire Safety J. 2022, résumé](https://sciencedirect.com/science/article/abs/pii/S0379711221002526)).
- Refuge : un EAS n'est pas « sorti », c'est « à l'abri sur place » ; les guides l'ont prévu parce que les escaliers sont un piège pour les fauteuils (même source). Classer les personnes en 3 états est donc plus honnête : sorties vers un lieu sûr / à l'abri sur place / ni l'un ni l'autre.
- **Formules** (T ∈ {22 h métro, 23 h couvre-feu}) : t_i = instant où i atteint un lieu sûr (ou ∞).
  - **C2a = #{ i : t_i > T }** (personnes ni sorties ni à l'abri), total et **par groupe** (PMR, familles, touristes) ; la valeur utilisée est celle du **pire groupe**, pour qu'une moyenne ne cache pas les fragiles.
  - **C2b = marge = (T − T0) − centile99(t_i − T0)** et **ratio = (T − T0) / centile99** ; seuil de référence 1,5 (courant), 2 (prudent).
  - Compte rendu de la queue : t90, t99, et nombre de personnes présentes à T0 + 60 min.
- Rappel (rapport contraintes) : le vrai butoir est 22 h, pas 23 h.

## 4. Sortis vers une zone de danger

Constat honnête : **je n'ai trouvé aucun indicateur publié** qui compte « le nombre de personnes déversées vers une zone à risque » dans la doctrine française de gestion de foule `[?]`. Ce que la doctrine dit :
- Maintien de l'ordre : principes de nécessité, proportionnalité, gradation, mise à distance ; l'encerclement (« nasse ») n'est permis que contre des violences graves et imminentes, pour une durée strictement nécessaire, et **doit ménager un point de sortie contrôlé** ([vie-publique](https://vie-publique.fr/eclairage/279024-maintien-de-lordre-une-doctrine-en-debat), [Conseil d'État 2023](https://conseil-etat.fr/publications-colloques/rapports-d-activite/bilan-d-activite-2023/securite-le-juste-equilibre-avec-les-libertes)). Aucun seuil chiffré ; la doctrine parle de légalité et de voie de sortie, pas de quantité de personnes.
- Les retours d'expérience français sont qualitatifs (section 5).

Ce qui existe ailleurs et se transpose : la **dose cumulée** le long d'un trajet. En incendie, le « fractional effective dose » (FED) accumule l'exposition d'une personne au fil du temps, et un modèle récent du NIST choisit la sortie qui minimise cette dose plutôt que la distance ([Test Bench Report, 2026](https://testbenchreport.com/articles/nist-s-safe-step-ai-ranks-fire-exits-by-toxic-gas-dose-not-distance-a6c1e57d), secondaire). En évacuation nucléaire, on minimise la dose collective Σ (temps × débit de dose) sur le trajet ([ScienceDirect 2020](https://sciencedirect.com/science/article/pii/S030645492030342X)). En séisme, un routage compare l'exposition aux dangers et la distance et réduit nettement l'exposition au prix de trajets plus longs ([MDPI 2020](https://mdpi.com/2220-9964/9/7/432)).

**Formule proposée (analogie, à dire comme telle)** : chaque zone z a un niveau h_z fixé par la préfecture ou le directeur (0 sûre, 1 vigilance, 2 interdite/barrée ; station fermée = cul-de-sac).
- **C3a = Σ_i Σ_z h_z · minutes_{i,z}** (personnes-minutes pondérées passées en zone à risque après la sortie).
- **C3b = #{ i arrivées à une station fermée ou une rue barrée }** (déversement « cul-de-sac »).
- Les zones sont des données (périmètre couvre-feu, rues Berger/Rambuteau/Sébastopol, stations fermées à 22 h : rapport contraintes §3) ; le coefficient h_z est une **décision humaine**, pas une valeur de la littérature.

## 5. Comment la gestion de crise évalue ses décisions

- Les RETEX (retours d'expérience) français et belges sont **qualitatifs et par objectifs fixés d'avance** : un RETEX d'exercice se juge sur des objectifs d'apprentissage écrits avant l'exercice (phrase courte, verbe d'action) ; niveaux 1 à 3 selon gravité et nouveauté ; conduit 1 à 3 semaines après ([guide ULiège](https://orbi.uliege.be/bitstream/2268/299854/1/Guide%20ope%CC%81rationnel%20.pdf), [guide ministériel](https://www.mementodumaire.net/wp-content/uploads/2012/07/guide_methodo_REX.pdf), [SDIS 35](https://sapeurs-pompiers35.fr/content/uploads/2017/08/RO-11-Guide-de-gestion-du-retour-dexperience-REX.pdf)). Obligation de RETEX après activation ORSEC : affirmée par un cabinet de conseil, non vérifiée sur le code `[?]`.
- Je n'ai pas trouvé de grille chiffrée d'exercice (préfectures, SDIS, ministère, OTAN/UE) `[?]`. Donc : **notre grille est un outil de préparation, pas la reproduction d'une grille officielle**. Elle se rapproche de DIN 18009-2 (objectifs de protection définis avec l'autorité, puis critères mesurables).
- Comparer des plans sous incertitude (déjà résumé dans le rapport 3 §3) : moyenne insuffisante ; pire cas ou regret maximal ; **CVaR 95 %** (moyenne des 5 % pires résultats) ; mêmes graines aléatoires pour tous les plans ; intervalle de confiance sur la différence par paires ; annoncer « P(A meilleur que B) ».

## 6. Verdict proposé

### 6.1 La grille (4 jauges de sécurité, 1 secondaire, 1 filtre)

| # | Critère | Formule (sortie du simulateur) | Seuil / référence | Source |
|---|---|---|---|---|
| G0 | Faisabilité (filtre oui/non) | Plan compatible avec l'ordre préfectoral, sorties réglementaires non condamnées, escalators à 50 %, effectif d'agents ≤ dispo | oui/non | rapport contraintes §1, §5 ; CO 34 |
| C1 | Écrasement | C1a (pers-min ≥ 5/m²), C1b (durée continue ≥ 6/m²), C1c (ρ·Var v) | rouge : C1c > 0,02 s⁻² ou C1b > 60 s [?] ; redlines 3 mobile / 5 statique | Still, Helbing, Fruin |
| C2 | Pas sortis à l'heure | C2a (#t_i > T, pire groupe), C2b (marge et ratio) | ratio ≥ 1,5 ; zéro personne vulnérable sans prise en charge | PD 7974-6, RiSET |
| C3 | Exposition zone de danger | C3a (pers-min pondérées), C3b (arrivées en cul-de-sac) | seuil : aucun, c'est un classement | analogie dose (FED, dose collective) |
| C4 | Délai | t90, t99, attente moyenne | informatif | DIN 18009-2 |
| C5 | Continuité (secondaire) | personnes qui attrapent un métro avant 22 h | informatif | rapport contraintes §6 |

### 6.2 Règle de combinaison (lexicographique avec tolérances)

1. **Filtre G0** : un plan non faisable est écarté (pas de note).
2. **Ligne rouge C1** : un plan est écarté si, dans les 5 % de pires simulations (CVaR 95 %), la ligne rouge d'écrasement est franchie. On ne « compense » jamais un écrasement par un gain de temps.
3. **Classement des survivants, dans cet ordre** : C2 (pire groupe, CVaR 95 %) ; à égalité à une tolérance près, C3 ; puis C1a ; puis C4 ; puis C5. « À une tolérance près » = écart inférieur au bruit de simulation (intervalle de confiance par paires) ou à 30 % d'écart de modèle (RiMEA) ; en dessous, on passe au critère suivant.
4. Sortie affichée : pour chaque plan les 5 nombres, le critère qui a départagé, et P(A meilleur que B) sur graines communes. Les phrases du LLM ne contiennent que des champs remplis depuis le journal de calcul (rapport 3 §6).

Pourquoi lexicographique plutôt que pondérée : peser vies, minutes et pertes commerciales dans un seul score oblige à fixer des poids qu'aucune source ne donne, et masque les compromis. L'ordre C2 > C3 > C1a reste une **décision de valeur à confirmer par Adem** (le rapport contraintes §6 donne : sécurité, ordre préfectoral, pas de déversement vers la zone de trouble, correspondances, image). Alternative pondérée possible, plus faible : composite type IEEE 2017 (temps total, temps moyen, vitesse, densité locale), mais ses poids sont ceux des auteurs. Autre alternative : ordre C1 avant C2 si l'équipe juge l'écrasement prioritaire à tout.

### 6.3 Limites à dire franchement
- Les seuils viennent d'événements ouverts (stades, rues) ; le Forum est un lieu souterrain à plusieurs niveaux, validation sur place non faite.
- Capacités de sortie et effectifs : hypothèses (rapport contraintes §7).
- Les chiffres comparent des plans ; ils ne prédisent pas de victimes.

### 6.4 Phrase pour le jury
« Nous jugeons chaque plan avec les mesures que les ingénieurs de sécurité utilisent déjà : la densité et la pression de foule pour le risque d'écrasement, la marge entre l'heure limite et le temps où 99 % des gens sont sortis, le nombre de personnes pas sorties à 22 h et 23 h, et l'exposition cumulée aux zones dangereuses, mesure empruntée aux calculs de dose ; un plan qui franchit la ligne rouge d'écrasement est éliminé quoi qu'il gagne ailleurs, les autres sont classés par ordre de gravité sur leurs 5 % de pires simulations, et ces chiffres servent à comparer des plans, pas à prédire des victimes. »

## 7. Trous de recherche
- Normes payantes (PD 7974-6, ISO/TR 16738, NFPA 101) lues via des résumés ; Green Guide via la thèse de Still.
- Aucun indicateur officiel « déversement vers zone de danger » ; grille chiffrée d'exercice préfectoral/OTAN/UE introuvable.
- Taille de fenêtre pour la pression de Helbing et seuil de durée (60 s) non établis.
- Ordre des critères C2/C3/C1a : valeur à trancher.

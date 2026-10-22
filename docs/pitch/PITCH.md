# Pitch : Accel AI Innovate Paris, 22 oct. 2026

Matériel de pitch (brouillon). Aucun nom n'est décidé : la section 1 propose, l'équipe tranche. Les chiffres viennent de `README.md`, `demo/SCRIPT.md` et `reports/` ; `[hyp]` = hypothèse, pas un fait publié ; `[à vérifier]` = à confirmer avant de le dire.

## 1. Le nom : cinq propositions

Probabilité = chance qu'un autre LLM propose le même nom (estimation, pas une mesure). Seuil de mise en avant : moins de 20 %.

| # | Nom | Pourquoi | Proba. autre LLM |
|---|---|---|---|
| 1 | **Issue** | Mot du chef de poste (par où sort-on ?) et mot du résultat. Court, dit en une syllabe | 12 % |
| 2 | **Dégagement** | Terme du règlement ERP pour le couloir qui mène à la sortie. Distinctif, un peu long | 5 % |
| 3 | **Contre-flux** | Le moment où deux foules se croisent, que le moteur sait mal rendre et que le chef de poste redoute | 8 % |
| 4 | **Pire cas** | Notre méthode : chaque plan est classé sur sa pire variante. Se dit mal en anglais | 10 % |
| 5 | **Veilleur** | Le métier de celui qui surveille. Trop courant | 35 % |

Recommandation : **Issue**. Réserve : en anglais, « issue » veut dire problème ; pour un fonds londonien et le marché britannique, vérifier la prononciation et le sens avant d'imprimer le nom sur la slide. Option la plus forte écartée : **Dégagement**, la plus originale, mais difficile à prononcer pour un jury non francophone. Disponibilité du nom et du domaine : `[à vérifier]` (non cherchée).

Dans la suite, « Issue » est un nom provisoire.

## 2. Pitch en une ligne

« Issue rejoue en 3D l'évacuation d'un vrai lieu, essaie des centaines de plans, et donne au chef de poste de la société de sécurité les trois meilleurs, classés sur leur pire cas. »

## 3. Le pitch parlé, 3 minutes, 6 blocs

Rythme visé : 140 mots par minute, ton de conversation. Les blocs suivent la vidéo de démo (`demo/SCRIPT.md`). Environ 430 mots à dire. Le bloc 2 (une minute) se découpe en deux demi-blocs pour obtenir six blocs.

**Bloc 1, 0:00 à 0:30 : le 19 octobre** (écran : le Forum des Halles de nuit, lundi 19 oct., 20 h)

« Lundi dernier, vers 20 heures, le cinéma UGC des Halles est évacué en pleine séance. Plus de 3 000 spectateurs. Un couvre-feu vient d'être annoncé, les stations ferment l'une après l'autre, des cortèges passent dans les rues autour. Le chef de poste de la société de sécurité décide seul, avec une radio et un plan papier. Personne ne lui a jamais montré ce que donnerait son ordre avant qu'il le donne. »

**Bloc 2a, 0:30 à 1:00 : le lieu et les agents** (écran : étapes 2 et 3 de `demo/SCRIPT.md`)

« Voici le même lieu, le vrai : les niveaux, 528 portes, 107 escalators, tirés d'OpenStreetMap et des accès officiels d'Île-de-France Mobilités. 3 200 personnes s'y déplacent avec des modèles de foule publiés. Les stations ferment, un cortège arrive rue Berger. Tout est enregistré dans Aiven. Une trentaine de personnages tiennent un rôle : sécurité, pompiers, RATP, police. Chacun reçoit sa consigne et décide, avec Claude Haiku. »

**Bloc 2b, 1:00 à 1:30 : le jury donne un ordre** (écran : étape 4)

« Maintenant, vous êtes le chef de poste. Donnez un ordre à voix haute. Par exemple : une manifestation arrive rue Berger, ferme la porte Rambuteau. Claude Sonnet comprend l'ordre, la porte se ferme, la foule se réorganise sous vos yeux. Nous avons testé vingt ordres : vingt compris. »

**Bloc 3, 1:30 à 2:15 : l'explorateur** (écran : étape 5, les trois meilleurs plans rejoués)

« Un ordre, c'est un pari. Alors nous en jouons des centaines. Nous avons essayé 71 plans, chacun contre 8 variantes qui cumulent de 6 à 14 perturbations. Cela fait 550 simulations. Chaque plan est classé sur sa pire variante, pas sur sa moyenne.

Résultat : le meilleur plan envoie 534 personnes vers les perturbations. L'instruction du 19 octobre, telle que la presse la rapporte et rejouée chez nous, en envoie 1 387. À dix minutes, 132 personnes sont encore à l'intérieur, contre 245. Le meilleur plan demande deux agents de plus, et le système le dit. Aucun modèle de langage ne choisit le plan : c'est du calcul, et le chef de poste valide. »

**Bloc 4, 2:15 à 2:45 : le marché et les premiers clients** (écran : la slide, ou les captures)

« Qui paie ? Les sociétés de sécurité privée, comme Securitas ou Fiducial, qui gèrent ces crises sur place pour des dizaines de sites. Notre premier site est le Westfield Forum des Halles. Au Royaume-Uni, la Martyn's Law impose en 2027 un plan écrit à 24 300 lieux de 800 personnes et plus. Nous estimons environ 24 000 lieux de cette taille en France. Avec un abonnement de 9 000 à 24 000 euros par site et par an, la France représente de l'ordre de 240 millions d'euros. »

**Bloc 5, 2:45 à 3:00 : la demande et l'angle Aiven** (écran : slide finale)

« Nous avons besoin de trois présentations à des responsables de sécurité de sites. Nous proposons un pilote de quatre semaines. Le produit tourne sur Aiven Runtime, la mémoire des crises dans Aiven PostgreSQL : chaque incident rend le suivant plus prévisible. »

Mots par bloc, estimation à vérifier au chrono : 1 environ 70 ; 2a environ 65 ; 2b environ 50 ; 3 environ 120 ; 4 environ 80 ; 5 environ 40. Total environ 425. Si le chrono dépasse 3 minutes, couper dans le bloc 3 la phrase « Aucun modèle de langage ne choisit le plan », puis dans le bloc 2a la mention des 528 portes et 107 escalators.

### Contrôles avant de monter sur scène
- « Tout est enregistré dans Aiven » et « le produit tourne sur Aiven Runtime » : `README.md` classe encore ces deux points « prévu » et `reports/deploiement-aiven-runtime.md` n'existe pas. Ne dire ces phrases que si le déploiement est fait et vu à l'écran ; sinon dire « conçu pour Aiven » et utiliser le plan B de `demo/SCRIPT.md` (base locale en conteneur, et on le dit). `[à vérifier]`
- « 1 387 » : c'est l'instruction de la presse rejouée dans notre simulateur (ticket #16), pas une mesure de ce qui s'est passé. Garder la mention « telle que la presse la rapporte ».
- Les 550 simulations ont tourné en 38 minutes sur un PC portable (`README.md`). Ne pas dire « en direct » ; dire « préparées à l'avance ».
- Les 24 000 lieux français sont une extrapolation du chiffre britannique `[hyp]`, avec une marge de plus ou moins 50 % (`reports/qui-achete-4-marche-gtm.md`). Les 9 000 et 24 000 € sont des hypothèses de `reports/qui-achete-3-concurrence-prix.md` (formules Site Essentiel et Site Pro), non testées par un appel. Le chiffre de 240 M€ suppose 10 k€ par lieu (`reports/qui-achete-synthese.md`) : le dire « de l'ordre de ».
- « Vingt ordres sur vingt » : le `README.md` renvoie à un test de 11 ordres réels. Relancer le test et dire le nombre que la sortie affiche. `[à vérifier]`
- « Securitas, Fiducial » : cités comme acheteurs visés, aucun n'est client ni contacté.
- Réalisme : ne pas dire « fidèle ». Dire « dans la fourchette publiée jusqu'à environ 1,5 personne par m² » (`reports/validation-moteur-foule.md`).

## 4. La slide finale

Format 16:9, fond nuit (#0E1116), texte clair. Police IBM Plex Sans Condensed, seule famille. Deux couleurs d'accent, celles de la régie : rouge #FF4D4F et ambre #F5B83D. Aucune autre couleur. Marges de 64 px, grille de 12 colonnes.

**Zone titre** (haut, colonnes 1 à 12, 20 % de la hauteur) : à gauche, le nom provisoire « Issue » en 28 pt, gras. En dessous, en 44 pt : « Les trois meilleurs plans d'évacuation du Forum des Halles, classés sur leur pire cas. » À droite, en 14 pt gris : « Accel AI Innovate Paris, 22 oct. 2026 ».

**Zone chiffres** (colonnes 1 à 5, trois lignes empilées, chacune avec un chiffre en 72 pt et une légende en 16 pt) :
1. **1 387 → 534** (1 387 en rouge, 534 en ambre). Légende : « personnes envoyées vers les perturbations : instruction du 19 oct. rejouée, puis meilleur plan ».
2. **550** (blanc). Légende : « simulations : 71 plans contre 8 variantes de 6 à 14 perturbations ».
3. **24 300** (blanc). Légende : « grands lieux britanniques soumis à la Martyn's Law en 2027 ; environ 24 000 estimés en France ».

**Zone visuelle** (colonnes 6 à 12, 65 % de la hauteur) : la vue 3D du Forum en style cartoon, tirée de la capture de l'explorateur (`docs/images/05-explorateur.png`). Deux moitiés côte à côte, séparées par un trait vertical fin : à gauche, le plan du 19 oct., foule en rouge dans le couloir bloqué ; à droite, le meilleur plan, foule en ambre répartie sur plusieurs sorties. Sous chaque moitié, une ligne en 14 pt : « à 10 min : 245 personnes dedans » et « à 10 min : 132 personnes dedans ».

**Pied de slide** (bas, une ligne en 14 pt gris) : « Aiven Runtime, Aiven PostgreSQL · Claude Sonnet 5.5 et Haiku 5.5 · Premier site : Westfield Forum des Halles · Pilote de 4 semaines ». Retirer la partie Aiven tant que le déploiement n'est pas vu à l'écran.

Rien d'autre : pas de logo de concurrent, pas de graphique de marché, pas de liste à puces.

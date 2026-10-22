# Maths 4 : pression de foule (Helbing), écrasement et diagramme fondamental

Ticket #9, lot foule-decision. Recherche seule : aucun code modifié. Marques : **[lu]** = vérifié dans la source primaire (PDF/page lue en entier ou en passage clé) ; **[?]** = source secondaire ou non vérifiée.
Termes. **Densité** = personnes par m². **Pression de Helbing** = densité × variance des vitesses (unité s⁻²), ce n'est PAS une force. **Voronoi** = on donne à chaque personne la zone du plan plus proche d'elle que de toute autre.

## 0. Version simple

- La pression de Helbing mesure « à quel point ça bouscule » : densité locale × agitation des vitesses. Seuil publié : 0,02 s⁻² = début de la « turbulence » (Mina 2006), l'accident commence ~10 min après. [lu]
- Ce seuil dépend du rayon de lissage R et du type de foule (Helbing le dit lui-même). Il n'est pas universel : en expériences contrôlées sûres, la pression dépasse largement 0,02. [lu]
- Notre simulateur actuel n'a pas de vitesses individuelles : la « pression » du code (σ = 0,15·(ρ−3)) est une invention de réglage qui dépasse 0,02 dès 3,5 pers./m² alors que Mina était à 6-10. Il faut la requalifier en indicateur, pas en preuve.
- L'écrasement en personnes-minutes à plus de 5 pers./m² est défendable (seuil Still, Green Guide 5,4) et plus robuste que la pression : c'est le critère à mettre en avant.
- Le diagramme de Weidmann (v0 = 1,34 m/s, γ = 1,913, ρmax = 5,4) sert de test de réalisme : débit max attendu ≈ 1,22 pers./m/s vers 1,75 pers./m².

## 1. Pression de foule : définition exacte (Helbing, Johansson, Al-Abideen 2007)

Source : PRE 75, 046109 ; texte lu : https://arxiv.org/pdf/physics/0701203 [lu]. Complément (même équipe, détails, Eq. 2 du chapitre) : https://arxiv.org/pdf/0810.4590 [lu].

**Densité locale** (Eq. 1-2) au point r et à l'instant t, noyau gaussien de rayon R :
`ρ(r,t) = Σ_j f(r_j − r)`, avec `f(d) = exp(−‖d‖²/R²) / (π R²)`. Le poids intégré vaut 1 ; 63 % du poids est dans le disque de rayon R. [lu]
**Vitesse locale** (Eq. 6) : `V(r,t) = Σ_j v_j f(r_j − r) / Σ_j f(r_j − r)` (moyenne pondérée par le même noyau, un vecteur). [lu]
**Pression** (Eq. 9) : `P(r,t) = ρ(r,t) · Var(V)`. Unité : (1/m²)·(m²/s²) = s⁻². [lu]

Deux variantes de variance, toutes deux dans l'article [lu] :
- Carte spatiale (Fig. 2c) : variance **temporelle** en chaque point, `Var = <‖V(r,t) − U(r)‖²>_t` avec `U(r) = <V(r,t)>_t`, sur 11h45-12h30 (45 min).
- Série temporelle (Fig. 3c) : variance **spatiale** à chaque instant, `Var = <‖V(r,t) − <V>_r‖²>_r`, sur la zone centrale 20 m × 14 m, multipliée par la densité moyenne ρ(t) de cette zone.

Paramètres et seuils :
- R : l'article calcule les densités locales avec **R = 1 m** (Fig. 1a, densités locales > 10 pers./m²) ; Fig. 3d utilise R = 10/√ρ. Le R exact de la courbe de pression de la Fig. 3c n'est pas donné `[?]`. Règle empirique citée : densité locale max ≈ 2 × densité moyenne. [lu]
- Fenêtre temporelle : aucune fenêtre glissante n'est définie ; vidéo à 8 images/s, résolution 25 px/m, lissage gaussien en espace et en temps pour les densités (légende Fig. 2). [lu]
- Seuil : « la transition vers la dynamique turbulente commence à 12h19, quand la pression dépasse 0,02 s⁻² » ; l'accident commence quand la pression atteint son pic, ~10 min après le début de la turbulence, et > 30 min après que le débit moyen est passé sous 0,8 pers./m/s (début du stop-and-go). [lu]
- Mise en garde de l'auteur : « les valeurs critiques dépendent du choix de R » et « du type de foule » ; il propose de les recalibrer. Un franchissement bref du seuil n'est « pas un problème ». [lu] (https://arxiv.org/pdf/0810.4590)
- Note [51] de l'article : c'est une pression « gaz-cinétique », à distinguer de la pression mécanique ressentie ; une relation croissante entre les deux est « probable ». [lu]
- Vitesses moyennes non nulles même à 10 pers./m² : les gens bougent toujours un peu, d'où des variances très faibles. Pour P = 0,02, l'écart-type de vitesse implicite vaut √(0,02/ρ) : 0,071 m/s à ρ = 4, 0,058 à 6, 0,050 à 8, 0,045 à 10 (calcul).

**Calcul pas à pas sur une simulation** (positions et vitesses de chaque personne à chaque pas de 1 s) :
1. Poser une grille de nœuds r_k dans la zone (pas 0,5 m, seulement zones praticables).
2. À chaque nœud : poids `w_j = exp(−d²/R²)/(πR²)` avec R = 1 m (ignorer les j à d > 3R) ; `ρ_k = Σ w_j` ; `V_k = Σ w_j v_j / Σ w_j`.
3. `V̄ = moyenne_k V_k` ; `Var = moyenne_k ‖V_k − V̄‖²` ; `ρ̄ = moyenne_k ρ_k`.
4. `P(zone,t) = ρ̄ · Var` (variante Fig. 3c). Ne garder que les nœuds où ρ_k > 1 pers./m² pour ne pas diluer `[?]`.
5. Lisser sur 10 s (choix à nous `[?]`, dit « franchissement bref toléré ») et prendre le maximum sur zones et temps → `pression_max`.

**Mini exemple** (R = 1 m, un seul point r = (0,0), 5 personnes, variance pondérée des vitesses individuelles, pour illustrer ; ce n'est pas la variante Fig. 3c) : positions (0,0), (0,5;0), (0;0,5), (1;1), (2;0), vitesses (0,1;0), (0;0,1), (0,2;0), (−0,1;0), (0,5;0). Poids : 0,318 ; 0,248 ; 0,248 ; 0,043 ; 0,006 → ρ = 0,86 pers./m², V = (0,093 ; 0,029), Var = 0,0108 m²/s², P = 0,0093 s⁻² (< 0,02).
Note : une personne seule donne ρ = 1/(πR²) = 0,32 (elle se compte elle-même) ; sans effet à 5 pers./m².

## 2. Critiques et limites

- **Love Parade 2010** (Helbing et Mukerji 2012, https://arxiv.org/pdf/1206.5856 [lu]). Les auteurs reprennent la pression comme « densité × variabilité des mouvements du corps », l'attribuent à la « turbulence de foule », et citent l'asphyxie par compression comme cause des décès (21 morts, plus de 500 blessés). Ils ne calculent PAS de pression numérique ni de seuil 0,02 sur ce cas (recherche textuelle : aucune occurrence). Ils proposent plutôt une échelle qualitative de criticité à 8 niveaux (niveau 1 : densité < 2-3 pers./m² ; stop-and-go ; pressions ; turbulence = « blessés et morts probables »). Rapport cité : à plus de 4-5 pers./m², les embouteillages se forment vite et les chutes deviennent probables. [lu]
- **Feliciani et Nishinari 2018** (Transportation Research C 96, https://sciencedirect.com/science/article/pii/S0968090X18304133 [lu]) : en expériences contrôlées sûres (densité jusqu'à ~4,5 pers./m², grille 0,2 m, fenêtre 2,5 s), la pression de Helbing atteint des valeurs « bien plus hautes » que 0,02, avec un maximum vers 4-5 pers./m² puis une baisse ; son comportement change avec la géométrie. Conclusion des auteurs : valeurs élevées « pas forcément liées à une situation dangereuse ». Ils notent que Helbing aurait vu des morts au-dessus de 0,04 s⁻² : ce 0,04 ne figure pas dans l'article de Helbing lu (0,02 = début de turbulence) → à ne pas citer `[?]`.
- **Alternative Feliciani « crowd danger »** : `danger = niveau de congestion × densité` (niveau = rotationnel du champ de vitesse, divisé par la vitesse moyenne, ROI circulaire de 1,4 m). Seuil de prudence arbitraire : 15 m⁻³ ; il correspond à la densité de 8,9-9,1 pers./m² (flux unidirectionnel), 6,9-7,8 (bidirectionnel), 5,5-6,6 (multidirectionnel). [lu] Utile comme argument : plus le flux est chaotique, plus le seuil de densité baisse (vers 5,5-6).
- **Garcimartín et al. 2017** (Sci. Rep. 7, 10792, https://nature.com/articles/s41598-017-11197-x.pdf [lu]) : dès que le contact est soutenu, la densité ne suffit plus ; il faut au moins une autre grandeur, la « contrainte cinétique » σ_k (analogue de la pression de Helbing), qui monte avec la compétitivité alors que la densité ne change pas. Il rapporte aussi que les foules réelles passent du laminaire au turbulent vers 7 pers./m². [lu] Définition exacte de σ_k : dans leurs « méthodes », non lue `[?]`.
- **Sieben, Seyfried** : pas lu en entier `[?]`. D'après l'introduction de Feliciani [lu], des densités proches de 10 pers./m² ont été atteintes en expérience sûre (Sieben et al. 2017) et dans des événements sans accident (Dambalmath 2016) : la densité seule ne mesure donc pas le danger, et la pression non plus.
- **Voronoi** (Steffen et Seyfried 2010, https://arxiv.org/abs/0911.2165 [lu]) : `ρ_i = 1/|A_i|`, A_i = cellule de Voronoi de la personne i, découpée par les murs. Bien moins de dispersion que le comptage par rectangle ; défaut : cellules énormes en bordure de groupe (il faut les borner). [lu]
- **Temps passé** : Still donne 1 112 N tenus 4-6 min, pour l'asphyxie (Hopkins et al. 1993, repris sur https://crowdrisks.com/research.html [lu]) ; 6 227 N pendant 15 s [?] (https://wiki.ubc.ca/Documentation:FIB_book/Compressive_Asphyxiation:_The_Dynamics_and_Consequences_of_Large_Crowds, secondaire). Kroll, Still et al. 2017 : 2 550 ± 250 N statiques pour un thorax défoncé (flail chest) [lu, résumé sur la même page].

**Verdict.** La pression mesure l'agitation (précurseur de chutes), pas la force sur le thorax, et son seuil n'est pas portable d'une méthode à l'autre. Pour le jury : la densité × durée est le critère « de dose », la pression un signal d'alerte.

## 3. Écrasement : seuils publiés et justification

| Repère | Valeur | Source |
|---|---|---|
| Guide britannique (Green Guide) terrasses | 54 pers. / 10 m² = 5,4 ; Bolton 1946 : 6,5 → Wheatley 5,4 | HSE annexe 4 https://hse.gov.uk/foi/releases/hillsborough/annexe4.pdf [lu] |
| Densités de terrasse estimées sur vidéo par le HSE (match non précisé dans l'extrait lu, pas forcément le 15 avril 1989) | 6 à 10-11 pers./m², ~8 au centre | idem [?] |
| Still : « redline » | au-dessus de 5 pers./m², risque de surge et d'effondrement, la pression n'existe qu'avec le contact | https://eiai.ie/crowd-risk-analysis-and-crowd-safety [lu] |
| Flux maximal puis chute (densité critique) | 2-3 pers./m² | https://gkstill.com/Support/crowd-flow/DensityFlow.html [lu] |
| Fruin | ~7 pers./m² : « presque une masse fluide » | cité dans Helbing-Mukerji 2012 [lu] |
| Mina 2006 | densités locales > 10 ; sous 6 le débit local chute d'un facteur ≥ 3 | Helbing 2007 [lu] |
| Itaewon 2022 | max 10,74 (ruelle), 12,09 (rue au-dessus) selon la police ; experts : étouffement vers 7 | https://nhk.or.jp/nhkworld/en/news/20230113_28 [?] |
| Itaewon (reconstitution) | moyenne 7,57, max 9,95 ; compression dès 5-8, turbulence 7-12 | https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0306764&type=printable [lu en partie] |
| Mina 2015 | 7-9 (un expert cité par CACM) ou 6-8 (Templeton, Newsweek) | https://cacm.acm.org/news/201876-avoiding-the-crush/fulltext [?] |

**Justification de « personnes-minutes à plus de 5 pers./m² ».**
- Le 5 est le seuil à la fois de la jurisprudence (Green Guide 5,4 après Hillsborough) et de la pratique (Still). En dessous, le contact est rare, au-dessus apparaissent surges et effondrements. Les accidents sont à 7-10 : 5 est un seuil d'alerte précoce, pas un seuil de mort.
- Le temps compte : l'asphyxie demande des minutes de force soutenue (4-6 min à 1 112 N), donc une dose cumulée (personnes × minutes) est plus informative qu'un pic. 15 s à 6 227 N : un pic extrême suffit aussi, d'où garder `densité max` comme second repère.
- Caveat : le seuil de 5 vaut pour une densité mesurée sur une surface de plusieurs m². Avec un noyau R = 1 m, les maxima locaux sont ~2 × la moyenne (Helbing) : un seuil à 5 sur densité locale est plus sévère que le 5 « moyen ». À dire dans la fiche méthode.
- Les 6-7 pers./m² sont la zone où l'asphyxie devient plausible : proposer un second niveau « rouge » à 6 en minutes (déjà dans le rapport criteres-jugement-crise §2).

## 4. Diagramme fondamental (vérification du réalisme)

**Weidmann (1993)**, forme donnée dans https://arxiv.org/pdf/0810.4590 (Eq. 2) [lu] :
`v(ρ) = v0 · [1 − exp(−γ (1/ρ − 1/ρmax))]`, avec **v0 = 1,34 m/s**, **γ = 1,913 pers./m²**, **ρmax = 5,4 pers./m²** (v = 0 au-delà). Données d'origine : Weidmann, Transporttechnik der Fußgänger, 1993 (IVT n° 90), cité dans https://arxiv.org/pdf/physics/0506170 [lu]. Débit spécifique `J = ρ·v` (pers./m/s). Calcul :

| ρ (pers./m²) | 0,5 | 1 | 1,5 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|---|
| v (m/s) | 1,30 | 1,06 | 0,81 | 0,61 | 0,33 | 0,16 | 0,04 |
| J (pers./m/s) | 0,65 | 1,06 | 1,21 | 1,21 | 0,99 | 0,63 | 0,19 |

Maximum de J ≈ **1,22 pers./m/s à ρ ≈ 1,75** (calcul). Vitesse libre : 1,34 m/s en moyenne, écart-type 0,37 ; navetteurs 1,45, shopping 1,04, touristes 0,99 (Daamen, cité dans https://sciencedirect.com/science/article/pii/S0191261516301655 [?]).
Limites : Weidmann s'arrête à 5,4 ; à Mina 2006 la vitesse locale ne tombe jamais à 0 jusqu'à 10 pers./m², avec un 2e maximum de flux vers 9 (Helbing 2007 [lu]) ; Feliciani trouve des ρmax non physiques (> 100) en ajustant ce modèle sur ses expériences [lu]. Weidmann = repère de réalisme en régime fluide (ρ < 5), pas loi universelle.
SFPE et Jülich : courbes non relues `[?]` (SFPE, Nelson-Mowrey : v = k(1 − a·ρ), valeurs k et a non vérifiées ; Jülich : https://www.accu-rate.de/en/innovation/modell-und-theorie/fundamentaldiagramm/ [?] confirme seulement l'usage de Weidmann en validation).
**Test proposé** : simuler un couloir de largeur L, vérifier qu'à ρ ≈ 1,75 le flux est ≈ 1,2 × L pers./s (tolérance ±20 %) et que v(ρ=4) ≈ 0,16 m/s.

## 5. Formules pour grille.ts

État actuel du code : `simuler.ts` ajoute `file_par_issue × PAS_S/60` à l'écrasement quand `densite_par_zone > SEUIL_ROUGE` (zone, pas de positions) ; `mouvement-simple.ts` calcule `pression = rho × (0,15·max(0, rho−3))²`.
Cette formule de pression dépasse 0,02 à ρ = 3,5 et donne 1,2 s⁻² à ρ = 6 (60 × le seuil) : sans lien avec Mina. [calcul]

**Écrasement (formule cible, un pas Δt = 1 s) :**
`ecrasement_personnes_minutes = Σ_t Σ_i 1[ρ_i(t) > 5] · Δt / 60`
avec `ρ_i` = densité locale gaussienne, R = 1 m, évaluée à la position de la personne (voir §1, sans la vitesse) ; variante Voronoi `ρ_i = 1/A_i` (cellule bornée par les murs, ρ_i plafonnée à 10 `[?]`).
Exemple : 120 personnes à ρ_i > 5 pendant 90 s → 120 × 90 / 60 = **180 personnes-minutes** ; la note vaut 100 / (1 + 180/100) = 35,7 avec la courbe actuelle de grille.ts.
Sans positions individuelles (modèle à files) : garder `file_par_issue × Δt/60` quand `ρ_zone > 5` : c'est la même somme, avec une densité moyenne de zone (plus basse que le local ; le dire).

**Pression (si le moteur donne les vitesses individuelles) :** §1, étapes 1-5. Sinon, ne pas prétendre la mesurer.

### Ce qu'on change dans le code

| Constante / fonction | Ancienne valeur | Nouvelle valeur | Source |
|---|---|---|---|
| `SEUIL_ROUGE` | 5 | 5 (inchangé) | Green Guide 5,4 ; Still 5 [lu] |
| `SEUIL_PRESSION_HELBING` | 0,02, commentaire « Helbing, Mina 2006 » | 0,02 s⁻², commentaire « R = 1 m, dépend de R et de la foule ; début de turbulence, accident ~10 min après » | Helbing 2007 [lu] |
| Rayon de lissage `R_DENSITE_M` (nouveau) | n/a | 1 m | Helbing 2007, Fig. 1a [lu] |
| Lissage de la pression (nouveau) | n/a | moyenne glissante sur 10 s | choix à nous [?] |
| `pression` dans mouvement-simple.ts | `rho × (0,15·max(0,rho−3))²` | marquer « proxy, non calibré, ne pas comparer à 0,02 » ou la supprimer de la grille tant qu'il n'y a pas de vitesses individuelles | calcul ci-dessus |
| Commentaire de tête de grille.ts | « Helbing, Mina 2006 » | « Helbing, Johansson, Al-Abideen 2007 (PRE 75, 046109), Mina 2006 » (c'est la publication de 2007) | arXiv physics/0701203 [lu] |
| Test de réalisme (nouveau) | n/a | Weidmann : v0 = 1,34 ; γ = 1,913 ; ρmax = 5,4 ; J max ≈ 1,22 à ρ = 1,75 | arXiv 0810.4590 [lu] |

### Ce qu'on dit au jury

1. « Nous mesurons le danger d'écrasement en personnes-minutes passées au-dessus de 5 personnes par mètre carré, le seuil des guides britanniques après Hillsborough, parce que l'asphyxie demande des minutes de compression. »
2. « La pression de Helbing, densité fois variance des vitesses, repère le début de la turbulence à 0,02 s⁻² ; mais ce seuil dépend de la méthode de mesure, nous la présentons comme un signal d'alerte, pas comme une preuve. »
3. « Nous vérifions que la foule simulée marche comme dans la réalité avec la courbe de Weidmann, et nous affichons une fourchette plutôt qu'un chiffre unique. »

## Trous restants

- R exact de la courbe de pression de la Fig. 3c (Helbing) ; définition de σ_k chez Garcimartín ; SFPE et Jülich ; lecture complète de Sieben et al. 2017 ; densités de Mina 2015 et d'Itaewon sur sources primaires.
- Le repo n'a pas de bibliothèque Voronoi : le noyau gaussien avec hachage spatial (cases de 3 m) suffit, coût O(n).

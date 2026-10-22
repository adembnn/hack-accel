# Validation du moteur de foule (sim.js) : réalisme mesuré

Commande : `node src/explorateur/validation/valider.mjs` (40 s, 44 runs, 10 fils). Code : `src/explorateur/validation/`.
Variante avec correctifs essayés : `--reco=K1|K2|K3|K4` (copie de sim.js en mémoire, fichier jamais touché).

## Réponse courte pour le jury
Le moteur est réaliste en flux courant jusqu'à environ 1,5 personne/m² : vitesse libre, débit maximal d'un couloir,
débit des portes larges, escalators et escaliers. Il ne l'est pas au-delà de 2 p/m² (effondrement du flux, corps
empilés) ni en croisement de deux flux (pas de files). Cela se corrige par quelques paramètres (section finale).
Ne pas affirmer « réaliste » sans cette réserve : au-delà de 2 p/m², les densités affichées sont des artefacts.

## Méthode et limites (à dire honnêtement)
- Géométries synthétiques au format navgrid.json (`geometrie.mjs`), sim.js chargé tel quel dans un bac à sable, graines fixes.
- Couloir en anneau : l'axe x est rendu périodique par deux remplacements dans une copie de sim.js (voisinage et distance modulo
  la longueur). La physique est inchangée. Mesure sur une fenêtre de 20 m loin de la couture, après 25 s de chauffe.
- Densité nominale = nombre / (longueur x 4 m), alors que les centres ne disposent que de 3,52 m (rayon 0,24 m de chaque côté).
- Découvert en route : sim.js tronque vers zéro, donc x entre -1 et 0 est lu comme la case 0 (praticable à tort). Sans effet sur
  Châtelet (origine -330), mais piège pour tout test : le constructeur ajoute 2 cases de mur.
- Les références sont celles de la consigne ou citées de mémoire (Weidmann 1993, Seyfried 2009, Kretz 2006, Fruin 1971,
  Al-Sharif 1996, Helbing et Molnár 1995, Zhang et al. 2012) : à re-vérifier à la source avant de les projeter.
- Les tolérances (colonne « tolérance ») sont fixées par moi avant lecture des résultats ; elles sont dans valider.mjs.
- Non fait : plusieurs graines au-delà de 2 (3 pour les portes), mesure de Voronoi, escaliers avec montée/descente séparées.

## Résultats : sim.js tel quel (sortie du runner)
| Mesure | Mesuré | Référence | Verdict |
|---|---|---|---|
| 1 Vitesse v(rho), 0,5 / 1 / 1,5 p/m² | 1,38 / 1,24 / 0,75 m/s | Weidmann 1,30 / 1,06 / 0,81 | PASS |
| 1 Vitesse v(rho), 2 / 3 / 4 / 5 p/m² | 0,07 / 0,02 / 0,01 / 0,01 m/s | Weidmann 0,62 / 0,60 / 0,60 / 0,60 (à rho mesuré 2,0) | ÉCART |
| 1 Débit maximal du couloir | 1,24 p/m/s | SFPE/Fruin 1,3 (±25 %) | PASS |
| 2 Goulot, portes 1,2 à 2,4 m | J_s 1,31 à 1,84 p/m/s | Seyfried/Kretz 1,6-1,9 ; dimensionnement 1,3 | PASS |
| 2 Goulot, portes 0,8 m et 1 m | 1,10 et 1,14 p/m/s | idem | ÉCART (voir note) |
| 3 Escalier, vitesse le long de la pente | 0,55 m/s | 0,5-0,7 | PASS |
| 3 Escalier, débit | 1,94 p/s (= paramètre 2,0) | SFPE 1,0-1,3 p/m/s x 1,5-2,5 m | PASS, mais circulaire |
| 3 Escalator, débit / vitesse | 1,19 p/s / 0,74 m/s | 1,0-1,4 p/s / 0,75 m/s | PASS |
| 4 Centres de marcheurs dans une case non praticable | 0 | 0 | PASS |
| 4 Chevauchements, régime courant | 2,68 % des marcheurs-pas | < 1 % | ÉCART |
| 4 Chevauchements, couloir dense (>= 2 p/m²) | 55,7 %, jusqu'à 45 p/m² lissés | < 1 %, <= 8 p/m² | ÉCART |
| 5 Contre-flux : paramètre d'ordre Phi | 0,05 (aléatoire : 0,03) | files nettes (Phi > 0,5) | ÉCART |
| 5 Contre-flux : progression nette | 0,38 m/s, soit 31 % du flux unique | >= 70 % | ÉCART |

Notes :
- Portes étroites : sur la grille de production (1 m par case), une porte de 1 m laisse 0,52 m de largeur utile pour le centre d'un
  corps de 0,48 m. Le débit à 1 m (1,14 p/m/s) est donc limité par la résolution de la carte, pas par la physique.
- Escaliers : le débit mesuré redonne le paramètre `debit` (2,0 et 1,25) : le test vérifie l'implémentation, pas le réalisme.
  La largeur de l'escalier n'existe pas dans le modèle ; 2 p/s correspond à 1,5-2 m de large.
- Chevauchement hors couloir dense : 2,7 % des observations, concentrés contre les murs, causés par le pas de temps (voir ci-dessous).
- Hexagonal maximal pour des disques de 0,48 m : 5,01 p/m². La « limite physique 6-8 » de la consigne est donc trop large pour ce
  modèle ; au-delà de 5 p/m² de densité lissée, il y a forcément recouvrement.

## Ce qui correspond / ce qui s'écarte
Correspond : vitesse libre (1,34 m/s) ; vitesse et débit à 0,5-1,5 p/m² ; débit de pointe d'un couloir ; débit des portes de 1,2 m et plus
(≈ 1,3-1,8 p/m/s) ; vitesses et débits des liens verticaux ; aucun marcheur dans un mur.
S'écarte : (a) effondrement à 2 p/m² ; (b) pas de files en contre-flux (les deux sens se bloquent, progression 0,38 m/s) ;
(c) corps qui se recouvrent, jusqu'à l'empilement (45 p/m²) dans les foules denses ; (d) porte d'un mètre limitée par la grille.

## Causes trouvées (mesurées, pas supposées)
1. Pas de temps : la répulsion (A = 25 m/s², B = 0,08 m) est raide, et simStep(.1) l'intègre en Euler explicite. Avec dt = 0,05 s,
   le chevauchement à 1 p/m² passe de 1,2 % à 0,00 % (mesuré avec le banc, une graine).
2. Effondrement à 2 p/m² : le poids d'anisotropie `.3+.7*(1+cos)/2` rend la force non réciproque (devant 1,0, derrière 0,3). Une file
   serrée est freinée plus qu'elle n'est poussée ; la vitesse retombe à 0,07 m/s. Mesure à 2 p/m² (une graine, dt 0,1) : poids .75 donne
   0,97 m/s, poids 1 donne 1,25 m/s (trop vite : la file se pousse elle-même), poids .5 donne 0,46 m/s. Weidmann : 0,62.
3. Contre-flux : aucune règle latérale, donc chacun fonce sur l'axe de son vis-à-vis.

## Modifications recommandées dans sim.js (recommandations, non appliquées)
| # | Changement | Effet mesuré | État de la preuve |
|---|---|---|---|
| 1 | Appeler `simStep(.05)` deux fois par image au lieu de `simStep(.1)` | chevauchement 1,2 % -> 0,00 % à 1 p/m² ; coût CPU x2 | mesuré (exp. 1, 1 graine) |
| 2 | Après `ax+=F*nx;az+=F*nz;` ajouter : `if(cos>.5&&b.vx*ex+b.vz*ez<-.3){const q=2*Math.exp(-(d-2*R)/.5);ax+=q*ez;az+=-q*ex;}` | Phi 0,15 -> 0,90-0,95 ; progression 0,13 -> 0,5-1,1 m/s (q = 1, 2 ou 4) ; portes inchangées (1,59 vs 1,68) | mesuré (exp. 5, 1 graine, 100 s) |
| 3 | Remplacer `.3+.7*(1+cos)/2` par `.75+.25*(1+cos)/2` | supprime l'effondrement à 2 p/m² (0,07 -> 0,97 m/s) mais ne le règle pas : trop rapide, et à 3 p/m² la foule se bloque encore | mesuré, partiel |
| 4 | Option non retenue : vitesse désirée = `a.v0*max(.4, 1-exp(-1.913*(1/ρloc-1/5.4)))`, ρloc = `(a.dens+1)/4.01` | corrige le couloir jusqu'à 3 p/m² (0,43 vs 0,33 m/s) mais divise par deux le débit des portes (J_s 0,9 au lieu de 1,7) | mesuré ; à ne pas livrer tel quel |
| 5 | Largeur de lien : ajouter `k.largeur` et `debit = 1,1 p/m/s x largeur` | rend le test d'escalier non circulaire | proposé, non testé |

À propos de l'item 3 et du couloir dense : aucun jeu essayé ne tient à la fois le couloir à 3-4 p/m², les portes (1,6-1,9) et le
contre-flux. La réciprocité au contact (`d<.6?1:...`) fait monter les portes à 2,1-2,3 et envoie le couloir à 3,4 p/m/s (non physique).
Le correctif propre est un vrai modèle de contact (force de corps linéaire, friction) ou une résolution des chevauchements itérative
(plusieurs passes de projection, avec glissement le long des murs : la projection est aujourd'hui annulée quand elle sortirait de la
zone praticable, ce qui laisse des corps superposés contre les murs). Non essayé, faute de temps.

## Ce qui manque (état au moment du rendu)
- Les configurations `--reco=K1..K4` du runner sont écrites mais je n'ai pas relancé le banc complet pour chacune ; les chiffres de
  la section précédente viennent de balayages partiels (une graine, runs courts). Lancer `--reco=K2` donne le tableau complet.
- Pas d'intervalle de confiance : 2 graines (couloir, escaliers, contre-flux), 3 (portes).
- Pas de validation sur la vraie carte de Châtelet (débits aux escalators réels, temps d'évacuation) : aucune donnée de terrain en main.

## Phrase défendable devant le jury
« Nous avons testé le moteur contre Weidmann, Seyfried et les débits d'escalators : il est dans la fourchette publiée jusqu'à 1,5 p/m²
et pour les portes de 1,2 m et plus. Au-delà de 2 p/m² il ne reproduit pas la compression d'une foule dense ; nous le savons, nous l'avons
mesuré, et nos alertes de densité haute sont lues comme des seuils d'alerte, pas comme des mesures physiques. »

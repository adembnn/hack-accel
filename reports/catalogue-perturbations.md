# Catalogue des perturbations du Forum des Halles

Décision débloquée : quelles perturbations le simulateur doit savoir représenter et le juré peut déclencher. Rien n'est choisi pour l'équipe. `[?]` = non vérifié. Recherche du 22 oct. 2026, sources publiques. Garde-fou : protection des personnes uniquement ; une menace = une zone à éviter ou une issue indisponible, jamais un mode opératoire ni un point faible d'un lieu réel.

## 0. Version simple

Presque tous les drames de foule viennent d'une même mécanique : **plus de gens arrivent à un passage que celui-ci n'en laisse sortir**. Les perturbations ne sont que des façons différentes de réduire un passage, d'en fermer un, ou de pousser trop de monde vers lui. Le simulateur n'a donc besoin que de **6 leviers** : fermer une zone, fermer une issue, réduire un débit, ajouter un flux entrant, ralentir des gens, retarder une information. Les 43 perturbations ci-dessous sont des combinaisons de ces 6 leviers (colonne « Représentation »).

Deux choses à savoir avant de lire :
- Les rapports sérieux écartent la « panique » comme cause principale (Love Parade : une étude parle de « turbulence de foule », pas de panique, [Wikipedia](https://en.wikipedia.org/wiki/Love_Parade_disaster)). La panique reste utile à représenter comme **effet** (rumeur, bruit) mais pas comme moteur du modèle.
- Aucune statistique de fréquence par perturbation n'est publiée pour les Halles. Les fréquences ci-dessous sont des exemples datés, pas des taux `[?]`.

## 1. Cadres de référence : comment les experts classent les risques

*Termes : **ingress** = entrée du public ; **circulation** = déplacements à l'intérieur ; **egress** = sortie.*

| Cadre | Idée | Classement des risques | Source |
|---|---|---|---|
| DIM-ICE (G. Keith Still) | Un événement = 3 phases (ingress, circulation, egress) x 3 influences (Design = capacités et débits, Information = signalétique, annonces, réseaux sociaux, Management = procédures) x 2 modes (normal, urgence) | Matrice : on remplit chaque case et on colore les risques. Né de l'analyse d'accidents mondiaux | [gkstill.com](https://gkstill.com/Support/WhyModel/dimice.html) |
| DIME-ICE (norme américaine ANSI ES1.9) | DIM-ICE + « Expectations » (ce que les gens croient pouvoir faire) | Même matrice, 4 influences | [eventstaff](https://eventstaff.com/blog/the-crowd-management-plan-template-for-live-events) |
| RAMP (Still) | Analyse des risques en 4 blocs : site (Design), mouvements (arrivée/départ), profil de la foule (composition, histoire, communication) | Débits normaux puis d'urgence par route | [CUNY, cours](https://openlab.citytech.cuny.edu/event-safety/crowd-flow) ; texte RAMP original non lu `[?]` |
| Green Guide (Royaume-Uni, stades) | Capacité = surface x densité adaptée ; densité maximale 4,7 pers./m² debout ; débit de sortie max 82 pers./m/min | Facteurs de risque ajustent la densité (ex. cricket : 4,0) | [FA](https://thefa.com/-/media/cfa/cheshirefa/files/facilities/green-guide.ashx), [SGSA](https://sgsa.org.uk/wp-content/uploads/2024/02/Worked-Example-B-Cricket.pdf), [ScienceDirect](https://sciencedirect.com/science/article/pii/S0379711220300448) |
| Purple Guide (Royaume-Uni, événements) | Écrasement, piétinement, suffocation = dangers de la dynamique de foule ; surveiller par stewards et caméras ; chacun sait qui peut arrêter l'événement | Évaluation des risques par danger, rôles écrits | [HSE/Dorset](https://dorsetcouncil.gov.uk/documents/35024/295806/HSE+purple+guide.pdf/4d4626a7-9062-d246-b901-f7b26a7b2b9e) |
| Event Safety Alliance (États-Unis) | Guide en 39 chapitres : plan d'urgence, foule, météo, communication, site ; abri sur place vs évacuation selon le scénario | Scénarios météo/urgence avec scripts d'annonce écrits d'avance | [ESA](https://eventsafetyalliance.org/standards-guidance-1), [Entertaining Safety](https://entertainingsafety.com/knowledge-base/severe-weather-communication-evacuation-live-events) |
| France : ERP et règlement de sécurité | Type (M magasin, L salle) x catégorie (1re = plus de 1 500 pers.) ; évacuation « rapide » ou « différée » | Par règle écrite, pensée pour l'incendie | [`contraintes-forum-des-halles.md`](contraintes-forum-des-halles.md) §1 |
| France : événements, Vigipirate, ORSEC | Guide national des événements rassemblant du public (14 fiches dont gestion des flux piétons) ; Vigipirate 3 niveaux (vigilance, sécurité renforcée, urgence attentat) ; ORSEC = plan préfectoral de secours | Par niveau de menace et par fiche | [Préfecture de l'Ain](https://ain.gouv.fr/Actions-de-l-Etat/Securite/Protection-civile/Grands-rassemblements-et-Vigipirate/Posture-Vigipirate-hiver-printemps-2026), [Gironde](https://gironde.gouv.fr/Actions-de-l-Etat/Securite/Securite-interieure/Menace-terroriste/Posture-Vigipirate-le-niveau-urgence-attentat-declare) |

**Réserve** : l'expertise de Still sur la Love Parade a été jugée « inutilisable » par un tribunal de Duisburg ([Wikipedia](https://en.wikipedia.org/wiki/Love_Parade_disaster)). DIM-ICE reste un cadre d'enseignement répandu, pas une loi. Les seuils de densité varient selon les auteurs : 4 à 6 pers./m² = risque accru ([Guardian](https://theguardian.com/world/2022/nov/01/how-do-crowd-crushes-happen-stampede-myth-what-happened-in-the-seoul-itaewon-halloween-crush)). Le texte original de la Green Guide 6e édition et du Purple Guide n'a pas été lu en entier `[?]`.

**Ce que la matrice nous apporte** : classer chaque perturbation par phase (entrée/circulation/sortie) et par influence (Design, Information, Management). Le Forum du 19 oct. est un cas d'**egress forcé** où l'Information (annonce tardive) et le Management (qui coordonne) pèsent autant que le Design.

## 2. Famille A : foule (8)

*Densité = personnes par m². Contre-flux = deux courants opposés dans le même passage. Turbulence = ondes de poussée dans une foule très dense.*

| # | Perturbation | Effet sur la foule | Indicateur | Représentation | Exemple réel |
|---|---|---|---|---|---|
| A1 | **Densité excessive** : trop de monde dans une zone | Marche ralentie, puis immobilisation ; au-delà de ~5/m² risque de compression | Densité locale, temps de séjour | Capacité de zone réduite ou flux entrant ajouté | Itaewon 2022 : ~7,6/m² en moyenne, ~10/m² au pic, 159 morts ([Wikipedia](https://en.wikipedia.org/wiki/Seoul_Halloween_crowd_crush), [Grokipedia](https://grokipedia.com/page/Seoul_Halloween_crowd_crush)) |
| A2 | **Contre-flux** | Les deux courants se bloquent ; le plus dense gagne ; blocage en quelques secondes dans un couloir étroit | Vitesse nette, débit par sens | Deux flux opposés dans la même arête du graphe | Itaewon : collision de flux dans une ruelle de 3,2 m ([WADEM](https://wadem.org/wp-content/uploads/2023/11/Itaewon-Crowd-Crush.pdf)) |
| A3 | **Goulot d'entonnoir** (large vers étroit) | Une file se forme en amont et remonte | Longueur de file, temps d'attente | Capacité de l'arête réduite | Love Parade 2010 : une seule rampe d'entrée et de sortie, 21 morts ([Wikipedia](https://en.wikipedia.org/wiki/Love_Parade_disaster)) |
| A4 | **Bousculade et chute** | Une personne tombe, les suivantes tombent dessus ; en quelques secondes une zone se bloque | Nombre d'obstacles au sol, vitesse nulle | Obstacle mobile ou zone à vitesse nulle, sur place | Itaewon : chute en cascade sur une pente ; Bethnal Green 1943 : 173 morts sur un escalier ([Wikipedia](https://en.wikipedia.org/wiki/Bethnal_Green_Disaster)) |
| A5 | **Mouvement de panique** | Fuite dans la direction opposée au bruit ; se propage de proche en proche à la vitesse de la marche | Part de la foule en fuite, direction | Paramètre « agitation » des agents, sans le faire gouverner tout le modèle | Châtelet, 21 avr. 2017 : un « énorme bruit » provoque un mouvement de panique dans la station ([Le Parisien](https://www.leparisien.fr/info-paris-ile-de-france-oise/transports/metro-chatelet-un-enorme-bruit-cree-un-mouvement-de-panique-21-04-2017-6875079.php)) ; place de la République, nov. 2015 ([Le Monde](https://www.lemonde.fr/attaques-a-paris/article/2015/11/15/mouvements-de-panique-place-de-la-republique-apres-une-alerte-a-la-fusillade_4810479_4809495.html)) |
| A6 | **Rumeur** (fausse information qui circule) | Part de la foule change de direction ; se propage par réseaux sociaux en minutes | Part des agents ayant « entendu », délai | Information propagée entre agents, vraie ou fausse | Même cas 2017 et 2015 `[?]` : le déclencheur exact (bruit/alerte) est cité, pas la rumeur en soi |
| A7 | **Vague d'arrivée groupée** | Pic de débit sur une porte ou un escalator | Débit entrant par minute | Flux entrant ponctuel (rafale) | Stade de France 2022 : 10 000 à 15 000 personnes retenues au préfiltrage, risque d'écrasement ([Sénat](https://www.senat.fr/rap/r21-776/r21-776_mono.html)) |
| A8 | **Pression sur une porte fermée ou filtrée** | Les gens derrière poussent ; ceux devant sont compressés | Densité devant la porte | Issue fermée + flux entrant continu | Hillsborough 1989 (97 morts) ; Stade de France 2022 ; voir [`etat-art-4`](etat-art-4-foules-urbaines.md) §2 |

## 3. Famille B : infrastructure (9)

*Coupe-feu = porte qui retarde le feu. Désenfumage = extraction mécanique de la fumée.*

| # | Perturbation | Effet sur la foule | Indicateur | Représentation | Exemple réel |
|---|---|---|---|---|---|
| B1 | **Issue de secours bloquée ou condamnée** | Capacité totale de sortie réduite ; report vers les autres issues, qui saturent | Débit de sortie total, temps d'évacuation | Issue fermée (arête supprimée) | Kanjuruhan 2022 : portes étroites ou verrouillées, 135 morts ([Al Jazeera](https://www.aljazeera.com/news/2022/11/2/police-tear-gas-main-cause-of-indonesia-football-tragedy-report)) |
| B2 | **Porte coupe-feu fermée** | Coupe un cheminement, réduit un couloir | Distance détour | Arête supprimée ou capacité réduite | `[?]` pas de cas public pour les Halles |
| B3 | **Escalator arrêté** | Il devient un escalier : vitesse ~0,7 m/s, capacité baisse | Débit de l'escalier | Capacité réduite, vitesse réduite | Étude : évacuer par escalators arrêtés réduit le nombre de passagers piégés (423 contre 562) ([Wiley](https://onlinelibrary.wiley.com/doi/10.1002/fam.1097)) ; règle CO 34 : 50 % au plus comptent comme sorties |
| B4 | **Escalator en sens inverse** | Contre-flux imposé dans l'escalier | Débit net | Sens de l'arête inversé | Pratique d'exploitant, texte réglementaire non lu `[?]` |
| B5 | **Ascenseur en panne** | Les personnes à mobilité réduite n'ont plus de chemin | Nombre de personnes sans itinéraire | Nœud supprimé pour les profils PMR | Plusieurs sorties métro n'ont que des escalators ([Bonjour RATP](https://bonjour-ratp.fr/en/lieux/forum-des-halles)) |
| B6 | **Éclairage coupé** | Vitesse réduite, regroupements, hésitation | Vitesse moyenne | Vitesse réduite dans la zone | Bethnal Green 1943 : escalier peu éclairé `[?]` |
| B7 | **Alarme générale (ou restreinte)** | Tout le bâtiment réagit ; évacuation simultanée de tous les niveaux | Nombre de personnes qui bougent en même temps | Information diffusée à toutes les zones (générale) ou à une seule (restreinte) | Règle MS 61-67 : alarme générale vs restreinte ([Légifrance](https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020317664)) |
| B8 | **Désenfumage ou fumée** | Zone rendue impraticable, visibilité nulle | Surface impraticable | Zone interdite qui s'étend | `[?]` pas de cas public récent |
| B9 | **Sol glissant ou obstacle** | Vitesse réduite, risque de chute (voir A4) | Vitesse | Vitesse réduite locale | `[?]` générique |

## 4. Famille C : transport (6)

| # | Perturbation | Effet sur la foule | Indicateur | Représentation | Exemple réel |
|---|---|---|---|---|---|
| C1 | **Station fermée** | La foule ne peut plus sortir par là ; elle se reporte sur les autres stations ou reste | Capacité de sortie des stations restantes | Nœud de transport inaccessible à une heure donnée | 19 oct. 2026 : stations Châtelet, Les Halles, RER fermées dès 22 h ([Le Parisien](https://leparisien.fr/info-paris-ile-de-france-oise/transports/couvre-feu-a-paris-des-stations-de-metro-et-rer-fermees-les-correspondances-pas-assurees-19-10-2026-FQUX6KCXZZFYZOJT4S7JONXZ3M.php)) |
| C2 | **Trafic interrompu sur une ligne** | Quais saturés, voyageurs dans le Forum | Nombre de voyageurs en attente | Flux entrant dans le Forum + capacité de quai | Colis suspect à Châtelet, 17 déc. 2021 : RER A, B, D interrompus ([actu.fr](https://actu.fr/ile-de-france/paris_75056/colis-suspect-sur-le-rer-a-a-paris-le-trafic-en-partie-interrompu_47310649.html)) ; panne RER B/D, avr. 2017 (Le Parisien, ci-dessus) |
| C3 | **Correspondance coupée** | Les voyageurs doivent sortir et marcher | Distance à pied | Arête de correspondance supprimée | 19 oct. 2026 : « aucune correspondance » ([Sortiraparis](https://sortiraparis.com/actualites/a-paris/articles/355161-couvre-feu-a-paris-les-stations-de-metro-et-de-rer-fermees-ce-20-octobre-2026)) |
| C4 | **Quai saturé** | Risque de chute sur les voies, blocage des escaliers d'accès | Densité sur le quai | Capacité de quai, remontée de file | `[?]` cas public non trouvé |
| C5 | **Train retenu ou sans arrêt** | Les voyageurs attendent en vain | Temps d'attente | Départs supprimés de l'horaire | 19 oct. : trains sans arrêt dans les stations fermées |
| C6 | **Travaux de nuit programmés** | Offre réduite avant même l'incident | Offre restante | Horaire modifié | RER B coupé après 22 h 45 vers le nord jusqu'au 10 nov. ([Sortiraparis EN](https://sortiraparis.com/en/news/in-paris/articles/355189-paris-curfew-which-routes-to-take-to-get-back-to-the-suburbs)) |

## 5. Famille D : extérieur (9)

| # | Perturbation | Effet sur la foule | Indicateur | Représentation | Exemple réel |
|---|---|---|---|---|---|
| D1 | **Manifestation** | Rues bloquées, flux de passants, foule qui grossit ou se disperse | Surface de voirie praticable | Zone à éviter mobile + flux entrant | 17-19 oct. 2026 : 855 puis 351 interpellations ([Le Parisien](https://leparisien.fr/paris-75/couvre-feu-a-paris-secteurs-heures-personnes-ce-que-lon-sait-du-dispositif-deploye-face-aux-violences-urbaines-19-10-2026-LVGEYQYDN5DRNCBNCJEWKGDDUM.php)) |
| D2 | **Troubles, dégradations, pillage** | Rues impraticables ; repli de la foule vers l'intérieur | Nombre de portes donnant sur une zone à éviter | Zone interdite autour d'une issue | Pillages « secteur Châtelet/Les Halles », rue Berger, rue du Renard (même source) |
| D3 | **Couvre-feu** | Heure limite de présence dehors ; périmètre de rues | Délai restant avant l'heure | Polygone interdit activé à une heure | 19 oct. 2026 : 23 h-6 h, rues Berger, Rambuteau, Sébastopol (franceinfo, [contraintes](contraintes-forum-des-halles.md) §3) |
| D4 | **Barrage ou dispositif de police** | Accès aux rues réduit, contrôles qui ralentissent | Débit aux points de contrôle | Capacité réduite sur une arête | Camions et canons à eau barrant des accès ([franceinfo](https://franceinfo.fr/replay-jt/france-2/20-heures/17-octobre-des-quartiers-et-des-villes-places-sous-couvre-feu_8244514.html)) |
| D5 | **Colis suspect** | Évacuation d'une zone, périmètre, gare fermée ; l'arrêt dure ~1 à 2 h | Surface évacuée, durée | Zone fermée pour N minutes | Forum évacué le 2 nov. 2017 (> 600 personnes, ~1 h) ([Paris Match](https://www.parismatch.com/Actu/Societe/Paris-le-Forum-des-Halles-evacue-1384190), [Ouest-France](https://www.ouest-france.fr/ile-de-france/paris-75000/paris-le-forum-des-halles-evacue-apres-deux-colis-suspects-5353954)) ; l'évacuation est « très rare », on préfère un périmètre |
| D6 | **Alerte Vigipirate** (niveau « urgence attentat » depuis 2026) | Contrôles d'accès, limitation des flux | Débit aux entrées | Capacité d'entrée réduite | Posture du 5 janv. 2026, maintenue « jusqu'à nouvel ordre » ([Ain](https://ain.gouv.fr/Actions-de-l-Etat/Securite/Protection-civile/Grands-rassemblements-et-Vigipirate/Posture-Vigipirate-hiver-printemps-2026)) |
| D7 | **Incendie voisin** | Fumée, rue barrée | Zone fermée | Zone interdite | `[?]` pas de cas public pour les Halles |
| D8 | **Météo (pluie, canicule, froid)** | Les gens restent à l'abri ou se pressent vers l'intérieur | Part des gens refusant de sortir | Profil d'agent « réticent à sortir » | Itaewon et Bethnal Green : nuit et pluie cités `[?]` ; Entertaining Safety : abri sur place vs évacuation ([lien](https://entertainingsafety.com/knowledge-base/severe-weather-communication-evacuation-live-events)) |
| D9 | **Travaux de voirie** | Trottoirs rétrécis | Largeur utile | Capacité de rue réduite | RATP : bulletin de travaux ([Bonjour RATP](https://bonjour-ratp.fr/actualites/articles/bulletin-travaux-17-octobre)) |

## 6. Famille E : humain (6)

| # | Perturbation | Effet sur la foule | Indicateur | Représentation | Exemple réel |
|---|---|---|---|---|---|
| E1 | **Malaise ou blessé** | Un obstacle immobile ; les secours doivent entrer à contre-courant | Temps d'arrivée des secours | Obstacle fixe + agent à contre-flux | Itaewon : secours gênés par la foule ([Wikipedia](https://en.wikipedia.org/wiki/Seoul_Halloween_crowd_crush)) |
| E2 | **Personnes à mobilité réduite** | Vitesse réduite, besoin d'ascenseur ; attente en espace sécurisé (EAS) | Temps d'évacuation du groupe | Profil de vitesse ~0,5-0,8 m/s `[?]`, nœuds ascenseur seulement | EAS : CO 34 ([Légifrance](https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020303940)) |
| E3 | **Enfants perdus, familles** | Groupes qui s'arrêtent et rebroussent chemin | Part de groupes dispersés | Agents en groupe avec point de ralliement | Vacances de Toussaint depuis le 17 oct. ([Sortiraparis](https://sortiraparis.com/actualites/a-paris/articles/291320-metro-rer-manifestations-et-perturbations-du-12-au-18-octobre-2026)) |
| E4 | **Touristes non francophones** | N'entendent pas ou ne comprennent pas les annonces | Part informée en fonction de la langue | Information propagée seulement à une part des agents | `[?]` annonce du 19 oct. faite à voix haute par un employé ([HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html)) |
| E5 | **Téléphones sans réseau** | Plus d'information, plus d'alerte | Part des agents sans information | Information propagée uniquement par voie locale | `[?]` pas de cas documenté aux Halles |
| E6 | **Alcool, groupes de jeunes** | Poussées, moindre coopération | Part d'agents « agités » | Profil d'agent, paramètre | Love Parade et Itaewon (alcool cité, quantité non établie) |

## 7. Famille F : organisationnel (5)

| # | Perturbation | Effet sur la foule | Indicateur | Représentation | Exemple réel |
|---|---|---|---|---|---|
| F1 | **Information tardive** | Moins de temps pour sortir ; départ simultané | Délai entre décision et sortie | Information retardée (la foule bouge N minutes après) | 19 oct. : annonce ~19 h 20, cinéma vidé 19 h 30-20 h ([BFM](https://www.bfmtv.com/culture/cinema-series/gardez-votre-ticket-quand-le-couvre-feu-a-paris-interrompt-des-seances-a-l-ugc-cine-les-halles_AN-202610200618.html)) ; cinéma prévenu « à la dernière minute » (Télérama) |
| F2 | **Effectif de sécurité insuffisant** | Portes non tenues, flux non guidés | Agents par porte | Paramètre : nombre d'agents | Itaewon : 137 policiers pour un afflux attendu de 100 000 (Grokipedia, ci-dessus `[?]`) |
| F3 | **Défaut de coordination exploitant / préfecture / RATP** | Décisions incompatibles (cinéma vide à 20 h alors que le métro ferme à 22 h) | Écart entre horaires | Heures de déclenchement décalées | Stade de France 2022 : commandement éclaté, filtrage à deux niveaux ([Sénat](https://www.senat.fr/rap/r21-776/r21-776_mono.html)) |
| F4 | **Consigne contradictoire** | La foule hésite, revient | Retours en arrière | Deux informations dans des zones voisines | Love Parade : consignes contradictoires, foule ignorant l'ordre de rebrousser chemin ([Wikipedia](https://en.wikipedia.org/wiki/Love_Parade_disaster)) |
| F5 | **Doctrine inadaptée** | Règlement incendie appliqué à un ordre administratif | Choix évacuer / confiner | Choix du directeur à évaluer | [`contraintes-forum-des-halles.md`](contraintes-forum-des-halles.md) §1 : aucun texte public sur un ordre préfectoral sans incendie `[?]` |

## 8. Combinaisons et cascades

Une perturbation en déclenche souvent une autre. Les cascades à jouer en démo :

| Cascade | Enchaînement | Effet |
|---|---|---|
| **19 oct. 2026** | F1 (annonce tardive) + D3 (couvre-feu) + A7 (3 000 spectateurs sortent d'un coup) + C1 (stations fermées à 22 h) + D1 (manifestation) | Le temps de sortie se réduit à ~2 h ; les portes côté rue Berger/Rambuteau mènent vers une zone à éviter ; tout le monde veut le métro en même temps |
| **Colis + station fermée** | D5 + C2 + C3 | Les voyageurs du RER se reportent dans le Forum, qui se remplit au moment où on veut le vider (cas Châtelet 2017/2021) |
| **Issue condamnée + escalator arrêté** | B1 + B3 | Deux réductions de capacité sur le même niveau : la file remonte en moins de 5 minutes (ordre de grandeur `[?]`) |
| **Bruit + foule dense** | A5 + A1 + A2 | Une fuite locale rencontre un contre-flux : chute en cascade (cas Itaewon, mais sans lien avec le Forum) |
| **Annonce vague + touristes + PMR** | F1 + E4 + E2 | Une partie de la foule ne sait pas, une autre ne peut pas partir vite |
| **Filtrage + arrivée groupée** | D6 + A7 + A8 | File devant les portes, pression sur les premiers (cas Stade de France 2022) |

## 9. Garde-fou : ce que le simulateur ne fait pas

- Aucune perturbation n'est un « scénario d'attaque » : une menace est une **zone à éviter** ou une **issue indisponible**. Pas de lieu, d'heure ou de mode d'action optimisé pour nuire.
- Aucune donnée non publique (plans de sécurité, positions d'agents, capacités réelles des issues) : valeurs en **hypothèse**, marquées comme telles.
- Pas de nombre de victimes ni de probabilité d'accident. On mesure temps de sortie, densité maximale, file.

## 10. Synthèse

| Famille | Nombre |
|---|---|
| A foule | 8 |
| B infrastructure | 9 |
| C transport | 6 |
| D extérieur | 9 |
| E humain | 6 |
| F organisationnel | 5 |
| **Total** | **43** |

**Les 5 plus importantes pour le Forum** (hypothèse de l'agent, à valider avec Adem) : C1 station fermée, F1 information tardive, D2/D3 zone à éviter autour des portes Berger et Rambuteau, A7 vague d'arrivée groupée (sortie du cinéma), B1/B3 réduction de capacité verticale (issue ou escalator).

**Lacunes** : aucune fréquence chiffrée par perturbation ; Green Guide 6e édition, Purple Guide et RAMP original non lus en entier ; les cas B2, B8, B9, D7 n'ont pas d'exemple public ; l'efficacité des mesures (délai d'une cascade) relève de l'hypothèse tant qu'on ne l'a pas simulée.

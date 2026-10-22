# Design d'un poste de crise : ce que montrent les interfaces de défense et de sécurité civile

Décision que ce document débloque : choisir l'organisation du premier écran de la maquette Châtelet (planches A, B, C dans `reports/maquettes/design/`).
Utilisateur : le directeur du Forum des Halles et le chef de poste du PC sécurité, en cellule de crise, qui parle à l'outil.
Recherche faite le 22 oct. 2026 avec Keenable. Les choses vérifiées sont sourcées ; ce qui est une déduction de ma part est marqué « déduction ».

## 1. Version simple

Un poste de crise sert à trois choses, dans cet ordre : voir ce qui se passe (perception), comprendre ce que ça veut dire (compréhension), prévoir ce qui va arriver (projection). C'est le modèle de conscience de situation d'Endsley, repris par la littérature de commandement (Springer 2021, chapitre « User-Centered Design Supports Situation Awareness »). Environ 75 % des erreurs d'opérateur viennent de la perception : l'information n'était pas là, ou noyée (même source).

Tout le reste de ce document découle de ça : un écran calme quand tout va bien, une couleur qui crie seulement quand il faut agir, et un seul endroit où l'on décide.

## 2. Ce que montrent les interfaces regardées

| Famille | Ce qui est toujours à l'écran | Ce qu'on en retient pour nous |
|---|---|---|
| Palantir Maven Smart System et Gotham | Une carte partagée en direct ; les détections de l'IA apparaissent en cadres jaunes que l'opérateur valide ou rejette ; le passage de l'observation à l'action se fait sans changer d'outil (CSIS). Gotham combine carte, graphe de liens et frise chronologique, avec la provenance de chaque donnée (Golding Research). | Les propositions de l'agent sont des cadres à valider, pas des ordres. Chaque chiffre montre d'où il vient. |
| Anduril Lattice | Interface web (React) avec une vue opérateur `/c2`, une console développeur à part (changelog Anduril, 16 oct. 2026). Une équipe « Sand Table » recrute des développeurs de jeux pour un centre de commande en 3D, parce que le web seul ne rend pas l'image vivante (Falcon). La critique de designfordefense.com : cinq écrans ou un seul n'est pas la question ; l'opérateur ne doit pas être seul à faire la fusion des données, un écran doit proposer une recommandation et laisser la source accessible. | La 3D est le décor, pas l'interface. Une recommandation s'accompagne de sa source, ouvrable en un geste. |
| ATAK / TAK (armée américaine, secours) | Carte, symboles normalisés (APP-6), position des équipes en direct, alertes de géorepérage et bouton panique, chat, zones à éviter dessinées sur la carte (battlepolicy.com ; EDR Magazine 2023). | Les zones de danger se dessinent sur la carte et se lisent d'un coup d'oeil. Un langage de symboles fixe. |
| ESRI ArcGIS (Operations Dashboard, Watch Center) | Une carte et des indicateurs à côté ; le principe répété par les villes qui l'utilisent (Inglewood, Coupe du monde 2026) : plus de données ne font pas de meilleures décisions, c'est l'image commune que tous les partenaires voient qui compte. | Tout le monde, directeur comme PC sécurité, regarde la même image. |
| Everbridge Crisis Management | Une page d'événement unique : tableau de bord opérateur, journal d'incident, listes de tâches assignées à une personne ou une fonction, tâches ajoutées en pleine crise (fiche produit Everbridge). | Le journal et la liste « qui fait quoi » sont des objets de premier rang. |
| Industrie de process (norme ISA-101, EEMUA 191, ISA-18.2) | Fond gris neutre ; couleur réservée à l'anormal : rouge pour l'alarme prioritaire, jaune pour l'avertissement, bleu pour un état manuel ; pas de vert « tout va bien » ; une bannière d'alarme toujours visible ; une anomalie doit se repérer en moins de 5 secondes (plcprogramming.io, hmilibrary.com, industrialmonitordirect.com). | Le meilleur modèle de lisibilité sous stress. À copier presque tel quel. |
| PC sécurité d'ERP, SSI (NF S 61-931) | Le CMSI (centralisateur de mise en sécurité incendie) reçoit l'ordre de mise en sécurité et le commande ; des niveaux d'accès distinguent voir, acquitter un signal sonore, réarmer (ssiap.pro). Je n'ai pas trouvé de source ouverte sur la disposition à l'écran des synoptiques de PC sécurité ni des salles de régulation RATP/SNCF : non vérifié, déduction : un synoptique est un plan du site avec des voyants d'état par zone. | Vocabulaire officiel (alarme générale, levée de doute, mise en sécurité) et niveaux d'accès : le chef de poste valide. |

Limite honnête : les écrans de Maven et de Lattice sont rarement publics. Ce qui est sourcé vient de descriptions, d'articles de presse spécialisée et de critiques de designers, pas de captures officielles.

## 3. Ce qui revient partout

1. **Une image commune.** Une carte ou une vue du site que tous voient, avec des couches qu'on allume ou éteint (TAK, ArcGIS, Gaia de Palantir).
2. **Un fil du temps.** Journal d'incident daté (Everbridge), frise chronologique (Gotham), historique de position (TAK « breadcrumbs »).
3. **Une couleur par exception.** ISA-101 : « la couleur encode un état, pas une identité ». Sept couleurs fonctionnelles au maximum ; au-delà l'opérateur ne retient plus le sens sous stress (industrialmonitordirect.com).
4. **Une alarme gérée, pas une couleur.** Priorité, acquittement, première alarme d'une cascade mise en évidence, indicateur d'inondation d'alarmes. Cible EEMUA 191 : moins d'une alarme par 10 minutes en régime normal, 10 par 10 minutes au pire de la crise.
5. **L'humain valide.** Contrôle du contrôle : les modes d'automatisation du contrôle aérien vont de « surveiller et informer » à « recommander et faire confirmer » puis « agir et prévenir, avec droit de veto » (Springer, mai 2026, adaptive automation en ATC). Pour une crise réelle, le niveau « recommander et faire confirmer » est le bon.
6. **Le détail à la demande.** Trois niveaux : vue d'ensemble, vue de zone, détail. Les données d'ingénierie sont sur un écran à part (ISA-101).
7. **Nuit et lumière ambiante.** Fond gris foncé (#1E1E1E à #2B2B2B), jamais noir pur ni blanc pur ; sur fond sombre, les gris d'objets doivent dépasser 40 % de luminosité (industrialmonitordirect.com).
8. **Redondance de la couleur.** Forme et texte en plus de la couleur (octogone, triangle, hachures), pour les daltoniens et les captures d'écran en noir et blanc.

## 4. Confirmation des ordres sous stress (déduction, appuyée sur le point 5)

- Un ordre à effet réel passe par deux gestes : « proposer » puis « valider ». Le bouton de validation dit ce qui va se passer, avec le délai réel (exemple de la maquette : effet après 5 minutes).
- L'ordre dit à voix haute apparaît en toutes lettres dans le journal avant d'agir. Le directeur voit ce que l'outil a compris, pas ce qu'il croit avoir dit.
- Refuser coûte un geste et reste au registre.
- Les ordres peu risqués (fermer une porte dans la simulation) restent à un geste ; ceux qui touchent des personnes (alarme générale) portent un avertissement de risque (mouvement de foule hors incendie).

## 5. Ce que notre écran montre en permanence

D'après le brief (directeur + chef de poste, voix, 3D, simulation) :

1. **État de la situation** en une ligne : heure simulée, phase (calme, alerte, évacuation), nombre de perturbations posées.
2. **Chiffres de sécurité** : personnes non sorties, densité maximale (pers./m²), personnes-minutes au-dessus de 5 pers./m², sorties vers la zone de danger. Ce sont les critères retenus par Adem (écrasement, non sortis, sortis en zone de danger).
3. **Journal vocal** : ce que le directeur a dit, ce que l'outil a compris, ce qu'il répond.
4. **Propositions à valider** : cadres jaunes à la Maven, avec source et délai.
5. **Dispositif en place** : ce qui existe déjà (alarme, sonorisation, issues contrôlées, liaison RATP) et ce qui est sollicité.
6. **Leviers** : épingles sur la carte (portes, issues, bouches, ascenseurs, escalators) plus liste.
7. **Chronologie** : barre de temps avec les événements passés et les effets prévus (délais).

## 6. Cinq principes pour notre outil

Probabilité qu'un autre LLM propose le principe : estimation à dire d'expert, pas une mesure. En gras, ceux sous 20 %.

| # | Principe | Probabilité |
|---|---|---|
| 1 | **Un écran gris tant que rien ne bouge.** Aucune couleur dans l'état calme : la foule, le plan et les voyants restent en gris ; rouge, ambre et bleu n'apparaissent que sur une anomalie, un avertissement ou un état manuel (ISA-101). La première démo montre un écran presque sans couleur, puis la perturbation du juré allume le premier rouge. | **12 %** |
| 2 | **Une seule file d'attente de décisions.** Toute demande qui attend une réponse humaine (proposition au PC sécurité, alerte, ordre mal compris) va dans la même colonne, numérotée, la plus urgente en haut, sans autre fenêtre. | **15 %** |
| 3 | **Chaque ordre est lisible avant d'agir.** Phrase dite, phrase comprise, effet prévu, délai réel, validation par une personne nommée, ligne au registre. | 35 % |
| 4 | **La 3D sert de preuve, pas de tableau de bord.** Les chiffres vivent dans une bande fixe, la 3D montre où ; on peut la cacher d'une touche sans perdre aucune information (la source de la critique Anduril : l'image vivante ne remplace pas la recommandation). | **18 %** |
| 5 | **La chronologie montre aussi le futur.** Une frise unique avec le passé (ce qui a été fait, à quelle seconde) et l'avenir (l'effet de la proposition validée arrivera à T+5 min ; la foule atteindra 5 pers./m² à tel endroit si on ne fait rien). Les outils regardés montrent le passé ; aucun ne trace le délai d'effet d'un ordre. | **8 %** |

Les principes 1, 2, 4 et 5 sont ceux à pousser. Le principe 3 est de la bonne pratique que tout le monde proposera : il reste, mais il ne fait pas la différence.

## 7. Cibles de design proposées (une police, deux couleurs, une audace)

Détail dans chaque planche. Résumé :

- **A, « Synoptique »** : nuit, fond gris charbon, rouge #FF4D4F (danger) et ambre #F5B83D (à valider) ; police IBM Plex Sans Condensed. Trois colonnes (décisions et voix, 3D, chiffres et dispositif) et un bandeau d'état. Audace : aucune couleur tant que rien ne cloche.
- **B, « Salle de régulation »** : jour, gris clair, bleu acier #1B4F94 (état, validation) et orange #D9480F (danger) ; police Barlow Semi Condensed. Une grande chronologie en bas qui trace le futur, avec et sans nos propositions. Audace : la courbe des non-sortis projetée.
- **C, « La voix d'abord »** : la 3D plein écran, la phrase dite en sous-titre géant, les propositions en cadres accrochés à la carte ; cyan #3BD4EC (voix, validation) et jaune #FFD23F en hachures (danger, aucun rouge) ; police Atkinson Hyperlegible. Audace : le sous-titre est l'interface principale. Réserve : sans rouge, le danger se lit à la forme (hachures) ; à tester sur un écran de PC sécurité.

Les trois planches sont dans `reports/maquettes/design/` (chiffres d'exemple, pas des sorties de la simulation).

## Sources

- Endsley et al., conscience de situation : https://link.springer.com/chapter/10.1007/978-3-030-47775-2_2
- CSIS, Maven Smart System : https://csis.org/analysis/what-maven-smart-system-and-what-does-it-do
- Gotham : https://goldingresearch.substack.com/p/inside-palantir-gotham ; Gaia : https://blog.palantir.com/frontend-engineering-at-palantir-redefining-real-time-map-collaboration-8845ebb928d1
- Anduril Lattice : https://developer.anduril.com/changelog ; https://falcon.so/resources/companies/anduril ; critique : https://designfordefense.com/thoughts/more-than-panes-of-glass
- TAK : https://battlepolicy.com/atak-tak ; https://issuu.com/theedrmagazine/docs/edr_may_2023_-_final_draft_final_/s/24780954
- ESRI : https://esri.com/en-us/industries/blog/articles/how-inglewood-used-arcgis-to-support-world-cup-operations
- Everbridge : https://everbridge.com/everbridge-crisis-management-lp
- ISA-101 et alarmes : https://plcprogramming.io/blog/high-performance-hmi-isa-101 ; https://hmilibrary.com/learn/hmi-color-palette.html ; https://industrialmonitordirect.com/blogs/knowledgebase/industrial-hmi-design-color-contrast-and-alarm-best-practices ; https://engineersuniverse.com/studios/scada/hmi-design-guide
- Automatisation adaptative en contrôle aérien : https://link.springer.com/article/10.1007/s10111-026-00884-3
- SSI et CMSI : https://ssiap.pro/glossaire

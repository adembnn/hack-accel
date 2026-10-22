# Idée « évacuation 3D » : preuve de paiement et concurrents

Date : 22 oct. 2026. Règle suivie : pas de source, pas d'affirmation. `[?]` = non vérifié.
Décision débloquée : l'idée passe-t-elle le filtre « un acheteur paie déjà beaucoup pour ce travail », et face à qui ?

## Verdict en deux lignes (version simple)
Les gens paient déjà pour savoir « combien de temps pour vider ce lieu ». Mais ils paient surtout un expert humain, pas un logiciel, et la loi française n'oblige presque jamais à faire cette simulation. Verdict : **tient avec réserve**.

## 1. Qui paie déjà, et combien

Mini-glossaire : *simulation d'évacuation* = un programme fait marcher des milliers de personnes virtuelles dans un plan de bâtiment pour mesurer le temps de sortie et repérer les bouchons. *Agent* (au sens simulation) = une personne virtuelle ; (au sens IA) = un programme qui enchaîne seul plusieurs actions.

**Logiciels (prix publics)**
- Pathfinder (Thunderhead, simulation d'évacuation) : licence 1 an à 2 640 USD (poste fixe) ou 3 960 USD (flottante), rabais jusqu'à 50 % dès plusieurs licences. Source : https://www.thunderheadeng.com/pathfinder/pricing
- LEGION (Bentley, flux de piétons) : à partir de 16 330 USD pour 12 mois, 1 licence. Source : https://www.bentley.com/en/products/legion . Le site liste gares, stades, aéroports. Machine exigée : 64 Go de RAM, carte graphique dédiée (https://www.bentley.com/software/legion).
- MassMotion (Arup, vendu par Oasys) : prix public introuvable `[?]`. Cas d'usage annoncés : stades, parcs, évacuation incendie. Source : https://www.oasys-software.com/products/pedestrian-simulation-software/massmotion
- Vadere : gratuit, open source, issu de la recherche. Source : https://github.com/pedestrian-dynamics-HM/vadere
- Simulex, STEPS, Crowd Dynamics (cabinet de Keith Still) : pas de prix public trouvé `[?]`. Keith Still a validé un modèle contre LEGION dans sa thèse (https://www.gkstill.com/CV/PhD/index.html), preuve que le métier existe depuis 25 ans.

Lecture : le logiciel coûte 3 à 16 k USD par an et par poste. **Ce n'est pas là que se trouve « beaucoup d'argent ».** L'argent est dans les heures d'ingénieur qui modélisent et interprètent. Tarif d'une étude de foule (cabinet) : aucune source publique trouvée `[?]`. À obtenir en appelant 2 bureaux d'études.

**Acheteurs et montants de contexte**
- JO Paris 2024 : coût global de la sécurité 1,7 Md€ (dont ~0,3 Md€ côté comité d'organisation), transport 1,35 Md€. Source : https://www.ccomptes.fr/fr/publications/les-jeux-olympiques-et-paralympiques-de-paris-2024 . Mais quelle part va à la simulation de foule : inconnue `[?]`. Ne pas citer 1,7 Md€ comme « marché » : c'est surtout des policiers et des militaires.
- Bureaux de contrôle (Socotec, Bureau Veritas) vendent déjà l'étude de sûreté obligatoire (ESSP, voir §2). Sources : https://www.socotec.fr/nos-solutions/surete-erp-sante/assistance-etude-surete-securite-publique-essp ; https://www.bureauveritas.fr/besoin/etude-de-surete-et-de-securite-publique-essp
- Assureurs, exploitants de stades, gestionnaires de transports comme payeurs de simulation : aucune preuve trouvée `[?]`.
- Les organisateurs paient à l'État les redevances du service d'ordre particulier (Code du sport). Source : https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006137764 . C'est un coût réel que de meilleurs plans pourraient réduire : angle de vente à tester, non prouvé.

## 2. Marché et obligations en France

Mini-glossaire : *ERP* = établissement recevant du public (cinéma, stade, gare, commerce). *Catégorie* = classement par capacité : 1re catégorie au-dessus de 1 500 personnes, 2e de 701 à 1 500, 3e de 301 à 700 (https://www.sdis38.fr/83-les-etablissements-recevant-du-public.htm). *Commission de sécurité* = comité (pompiers, préfecture, mairie) qui visite et donne un avis.

**Ce que la loi exige, et ce qu'elle n'exige pas**
1. Les sorties d'un stade se calculent par formule : 1 unité de passage pour 150 personnes dans les escaliers, 1 pour 300 aux sorties, 2 sorties jusqu'à 500 personnes, une de plus par tranche de 3 000. Source : https://www.legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000024845199 . **Donc la conformité se démontre sans simulation.** C'est le point faible n°1 de l'idée.
2. L'étude de sûreté et de sécurité publique (ESSP) est obligatoire pour : création d'un ERP de 1re ou 2e catégorie dans une ville de plus de 100 000 habitants, gares de 1re/2e catégorie, opérations de plus de 70 000 m². Sources : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074075/LEGISCTA000031719586 . Le permis de construire peut être refusé si l'étude est jugée insuffisante (L114-2, https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074075/LEGISCTA000031210379). Mais son contenu porte sur la délinquance et l'environnement du projet (R114-2), pas sur les temps d'évacuation.
3. Organisateurs d'événements lucratifs de plus de 1 500 personnes : déclaration obligatoire en préfecture. Source : Code du sport, https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006137764 . Qui produit quoi : l'organisateur dépose un dossier, le préfet décide du service d'ordre. Un modèle de simulation n'est pas exigé dans les textes lus.
4. Le Code de la sécurité intérieure L114-1, cité dans le brief, traite en réalité des enquêtes administratives sur les personnes, pas des études de lieux (https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051752804). À ne pas citer dans un pitch.

**Nombre de lieux** : aucun chiffre fiable trouvé pour le nombre d'ERP de 1re catégorie, de stades ou de gares en France ou en Europe `[?]`. Ne rien annoncer sans l'avoir (piste : statistiques de la Direction générale de la sécurité civile, à chercher).

**Acheteur à appeler demain soir** (profils, pas des noms vérifiés) :
- Un **ingénieur sécurité incendie** d'un bureau d'études ou de contrôle (Socotec, Bureau Veritas, Egis, Setec) : il fait aujourd'hui les ESSP et les dossiers de sécurité. Question : « combien d'heures passez-vous à modéliser un lieu, et qui paie ? »
- Un **responsable sûreté d'un stade ou d'une salle de plus de 5 000 places** : question : « qui vous demande de prouver votre plan d'évacuation, et quand ? »
- Un **chef de projet sécurité d'un grand événement** (festival, fan zone) : il dépose le dossier en préfecture.

## 3. Concurrents et IA

**Établis (modélisation manuelle, bureau d'études)** : LEGION, MassMotion, Pathfinder, Vadere, Crowd Dynamics. Leur point commun : un expert construit le modèle à la main. Il faut d'abord importer des plans (CAD, BIM = maquette numérique du bâtiment).

**Plus récents**
- uCrowds (Pays-Bas, fondée 2015) : moteur de foule et extension Unity. Source : https://tracxn.com/d/companies/ucrowds/__o5ndIhknfUhEx93ZGnAMPzIBxddNGGn9MItGkch1I78 . En juillet 2026, Esri (ArcGIS) publie un scénario « jumeau numérique d'une fan zone » avec uCrowds, de 2D vers 3D, incluant fermetures de routes et sorties simultanées de plusieurs sites. Source : https://www.esri.com/arcgis-blog/products/arcgis/public-safety/from-2d-plans-to-3d-intelligence-how-a-digital-twin-can-transform-safety-at-a-special-event . **C'est le concurrent le plus proche de votre démo** : un grand acteur du SIG + un moteur de foule. Levées de uCrowds : non trouvées `[?]`.
- Recherche : un article d'août 2026 décrit un jumeau numérique de foule piloté par un LLM (assistant de dialogue), testé sur données synthétiques seulement. Source : https://www.mdpi.com/2076-3417/16/16/8092 . Donc l'idée « agent + simulation » existe en papier, pas encore en produit prouvé `[?]`.
- Évacuation de feux de forêt : WUI-Go! (spin-off de Berkeley) a reçu 1,23 M USD de la NSF (subvention publique, pas une levée), avril 2026. Source : https://ce.berkeley.edu/news/3247 . Autre terrain (évacuation routière), même technique.
- Démos open source : « CrowdSynthetic », prototype d'un concert avec alertes (https://github.com/mksimple-blip/crowdsynthetic). Preuve que le prototype est facile à copier.
- Start-up de foule avec levée datée vérifiée : **aucune trouvée**. Ne pas affirmer « marché sans levées » ni « marché chaud » `[?]`.

**Ce qui reste libre (hypothèses à valider)**
- Reconstruction automatique en minutes à partir de données publiques : je n'ai trouvé aucun concurrent qui l'annonce. Mais la faisabilité est limitée : OpenStreetMap donne bâtiments et rues, pas les plans intérieurs (portes, escaliers, largeurs) `[?]`. Pour un stade, les plans internes sont rarement publics. Vrai terrain de jeu : l'espace public (rues, places, fan zones, abords de gares), pas l'intérieur.
- Agent qui génère et compare des scénarios : aucun produit trouvé ; mais LEGION et MassMotion peuvent le faire par script, un acteur établi peut l'ajouter.
- Licence : OpenStreetMap impose l'attribution et le partage à l'identique si la base dérivée est utilisée publiquement. Source : https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ . Compatible avec un usage interne, à cadrer pour un produit.

## 4. Réputation et éthique

Le risque : un outil qui classe les points faibles d'un lieu réel est, tel quel, la carte d'un attaquant. Le brief du hack interdit les « scénarios d'attaque contre des lieux réels » (formulation reprise de votre message, brief non relu ici).

**Rester du bon côté (règles de produit, à écrire dans la démo)**
1. Aucun scénario d'agresseur : pas de position d'attaquant, pas d'arme, pas de « où faire le plus de dégâts ». Seuls événements permis : issue bloquée, panne, incendie, malaise, fermeture de station, surcharge. La sortie est toujours un plan de protection (sorties à ouvrir, flux à rediriger, personnel à placer).
2. Lieu de démo : lieu fictif ou espace public déjà documenté, avec carte d'attribution OSM. Jamais l'intérieur sécurisé d'un site réel sans accord de l'exploitant.
3. Le rapport ne publie jamais « point faible n°1 » en clair pour un lieu réel : il le remet à l'exploitant, avec contrôle d'accès. Le propriétaire du lieu est l'utilisateur, pas le public. Cela suit la logique légale (L114-3 : l'ESSP n'est pas communicable au public ; https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074075/LEGISCTA000031210379).
4. Pas d'optimisation inverse : l'outil ne cherche pas le plan qui maximise le temps de sortie. Le score est unique : temps d'évacuation, densité maximale, sorties utilisées.
5. Phrase de jury : « Un exploitant qui modélise son lieu fait ce que la réglementation lui demande déjà : démontrer qu'on peut le vider. »

Reste une zone grise : la même carte de bouchons sert à un attaquant. Réponse honnête : ce risque existe déjà avec les plans publics, et la mitigation est l'accès réservé au propriétaire.

## 5. Verdict : tient avec réserve

| Test | Résultat |
|---|---|
| Un acheteur paie déjà | Oui pour l'expertise (bureaux d'études, ESSP). Pour le logiciel : 3 à 16 k USD par an, peu. Prix d'une étude `[?]` |
| Obligation légale de simuler | Non dans les textes lus : la conformité se prouve par formule (unités de passage) |
| Donnée accumulée | Faible au départ : plans publics = copiables. Seul actif possible : bibliothèque de plans validés + comparaisons de plans, à construire |
| Route vers clients | Crédible via un bureau d'études (produit de productivité), moins via exploitants en direct |
| Concurrent frontal | Esri + uCrowds (jumeau numérique d'événement) ; LEGION et MassMotion s'ils ajoutent un agent |

**Recommandation** : ne pas vendre « plateforme pour exploitants ». Vendre **« le brouillon de modèle en 10 minutes pour l'ingénieur sécurité »** : l'ingénieur garde la validation, l'outil retire les semaines de saisie. Terrain de démo : un événement en espace public (fan zone, abords de gare), car c'est là que les données ouvertes suffisent.

### Les 3 questions les plus dures d'un partner Accel

**1. « Qui signe le chèque et pourquoi cette année, puisque la loi n'impose pas de simulation ? »**
Réponse : le payeur n'est pas l'exploitant mais le bureau d'études, qui facture déjà des semaines de modélisation. Le produit baisse son coût de production, donc c'est un achat de productivité, pas de conformité. Preuve manquante : le tarif d'une étude et le nombre d'heures. Les 3 appels de demain servent à les obtenir. Sans ces chiffres, ne pas affirmer de taille de marché.

**2. « Un plan de bâtiment à partir de données publiques ne donne pas les portes ni les largeurs d'escaliers. Votre reconstruction est-elle fiable ? »**
Réponse honnête : non pour l'intérieur. Positionnement : extérieur et espace public automatiques ; intérieur saisi ou importé (CAD) avec reconnaissance assistée. Tout résultat affiche son niveau de confiance et ses hypothèses. Ne jamais montrer un temps d'évacuation sans marge d'erreur : une simulation fausse mais convaincante est un risque de vie, donc de responsabilité.

**3. « Esri, Bentley et Arup ajoutent un agent IA en six mois. Qu'est-ce qui vous protège ? »**
Réponse : rien aujourd'hui sauf la vitesse et la donnée. La défense à construire : chaque étude validée par un ingénieur devient un cas annoté (plan, hypothèses, correction humaine, résultat). Cette base de comparaisons validées n'existe chez personne `[?]`. À dire sans détour : le moat (avantage défendable) n'est pas encore là, c'est le plan des 12 premiers mois.

## À faire avant le jury
- Appeler 3 acheteurs (profils §2) : obtenir tarif d'étude, heures de modélisation, qui paie.
- Trouver les chiffres de lieux (ERP de 1re catégorie, stades, gares) auprès de la sécurité civile : aujourd'hui `[?]`.
- Vérifier le prix de MassMotion et les levées de uCrowds : aujourd'hui `[?]`.
- Relire le brief du hack pour la phrase exacte sur les « scénarios d'attaque ».

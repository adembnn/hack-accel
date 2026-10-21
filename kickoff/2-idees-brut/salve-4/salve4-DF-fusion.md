# Salve 4 : fusion D + F (jumeau qui prévoit, agent qui négocie)

Recherches web faites : 5 sur 5. Résultats utiles :
- PEGELONLINE (API ouverte de l'administration fluviale allemande, sans clé), station KAUB, lue le 21 oct. 2026 à 16h45 : valeur 11,0, état « low ». L'extraction n'indiquait pas l'unité. Si c'est bien 11 cm, c'est sous le record de 2022 (30 cm, 15 août 2022). **À revérifier à la main avant de s'appuyer dessus.**
- Rhin 2022 (Reuters, Euronews, S&P Global, chiffres variables selon la source) : barge-citerne Rotterdam-Karlsruhe de ~45 € à 60-70 €/t, spot ~87 €/t contre ~20 € en juin ; une barge-citerne ne charge que ~460 t à Kaub contre ~1 200 t à Duisburg. Hapag-Lloyd publie une grille de surcharge par tranche de niveau à Kaub (de 30 € à 589 € par conteneur 20 pieds).
- Concurrent côté négociation : HappyRobot (agents vocaux pour le fret : prix, prise de rendez-vous), Series B 44 M$, ~62 M$ levés au total, valorisation ~500 M$ ; FleetWorks 17 M$. Côté terminal : Portchain (~8 M$ confirmés : 5 M$ + 3,2 M$), PortXChange, Heyport, Awake.ai.
- Open-Meteo Marine : gratuit pour l'usage non commercial, sans clé, 7 jours (modèle européen 3 jours). Passer le paramètre `models` si la réponse est vide.

Piège de convergence : la plupart des idées « jumeau + négociation » de cette salve tomberont sur le port (créneaux camions) ou l'aéroport (équipes au sol). Les idées ci-dessous partent d'autres lieux. L'idée 6 est l'amorce du terminal, déplacée côté importateur, gardée pour comparaison.

---

### Le Rhin tombe, l'agent réserve
- **Pour un ami (2 phrases, zéro jargon)** : une usine chimique envoie ses produits en péniche sur le Rhin ; quand l'eau baisse, la péniche ne peut plus charger qu'un tiers de sa cargaison et les prix s'envolent. L'agent calcule jour par jour combien chaque bateau pourra porter, essaie dans la copie du fleuve plusieurs plans (couper la cargaison, passer une partie au train, avancer un stock), puis appelle les armateurs et les opérateurs ferroviaires pour réserver le meilleur plan avant que les concurrents ne prennent les places.
- **Le moment wow** : « Le niveau à Kaub est à 11 sur le vrai capteur, en direct » (à vérifier, voir plus haut). Le jumeau affiche le fleuve, chaque barge de la chaîne du client devient rouge ou verte selon sa charge possible, puis l'agent appelle devant le jury un juré qui joue l'armateur et obtient 40 % de baisse sur la surcharge en échange d'un engagement de volume sur 6 semaines.
- **Le travail remplacé** : le planificateur transport ou l'affréteur fluvial d'un site chimique, pétrolier ou sidérurgique (un à trois postes, 60-90 k€ chargés par poste [?]). Il surveille le niveau à la main et appelle cinq ou six courtiers dans l'urgence. Une alerte dit « l'eau baisse » ; elle ne dit pas ce que ça coûte par tonne selon le plan retenu, ni qui accepte quoi.
- **Qui paie, combien, combien de clients** : directions logistique des chargeurs sur le Rhin et le Danube. 30-60 k€/an par site [?]. Environ 300-500 sites chargeurs significatifs en Europe de l'Ouest et du Centre [?, non sourcé]. Argent en jeu par épisode : supplément de 25 à 65 €/t en 2022 sur des volumes de plusieurs centaines de milliers de tonnes par an pour un gros site, soit des millions d'euros par été sec [estimation à partir des ordres de grandeur ci-dessus, non mesurée]. Marché : le logiciel reste sous 100 M€/an tant qu'on reste sur le Rhin ; d'où l'extension à la Seine, au Danube et aux fleuves américains [?].
- **Donnée disponible à 9h demain** : niveaux en direct PEGELONLINE (REST, sans clé, lu aujourd'hui : 11,0 à Kaub) ; prévisions de niveau à 3-6 jours de la BfG / ELWIS [?, à vérifier] ; Open-Meteo pour les pluies sur le bassin (sans clé). Cargaison et contrats du client : on joue un client fictif et on le dit. La grille Hapag-Lloyd de 2022 donne la courbe niveau-surcharge.
- **Briques Aiven** : ClickHouse (historique des niveaux depuis des années pour caler la relation niveau-charge) ; Valkey (niveau et plan courants) ; PostgreSQL (mémoire des négociations : interlocuteur, offre, prix, délai).
- **Ce que la base sait après 1 000 clients** : pour chaque armateur, à quel niveau d'eau et à quelle heure il lâche une remise, quel volume garanti il exige, combien de temps il met à répondre. Aucun concurrent ne peut reconstruire ça sans avoir négocié les mêmes étés secs.
- **Concurrent le plus proche** : HappyRobot (négociation vocale de fret, ~62 M$ levés) : il appelle, mais ne sait pas pourquoi appeler à cette minute, ni quel plan alternatif vaut la peine. Les outils de prévision de niveau (BfG, courtiers) donnent la hauteur, pas la décision.
- **Faisable en 7 h ?** : on construit le calcul de charge selon le niveau, 3 plans comparés, la voix ElevenLabs et la mémoire. On simule la flotte et les contrats du client (déclaré). Point le plus risqué : le numéro Twilio et la qualité de l'appel ; plan B, appel en direct vers le téléphone d'un juré, scénario écrit.
- **% LLM** : 6 %

### Fenêtre météo, bateau réservé
- **Pour un ami (2 phrases, zéro jargon)** : un parc d'éoliennes en mer doit envoyer des techniciens par bateau quand la mer est assez calme, et ces créneaux sont rares. L'agent prévoit les jours où la mer le permet, simule le planning de réparations avec plusieurs jeux de bateaux, puis appelle les loueurs pour réserver le bon bateau avant le début de la fenêtre.
- **Le moment wow** : « Mardi et jeudi sont ouverts, mercredi est fermé : il vient de louer un bateau à 14 h pour mardi 6 h. » Le jury voit les vagues prévues sur la zone du parc et la carte des éoliennes arrêtées passer au vert une par une quand la réservation est confirmée.
- **Le travail remplacé** : le coordinateur de maintenance et le chargé de marine d'un exploitant de parc (2 à 4 personnes par parc [?]). Une éolienne à l'arrêt perd quelques milliers d'euros par jour (ordre de grandeur : 8 MW x 40 % x 80 €/MWh x 24 h = environ 6 k€ ; calcul à moi, non sourcé) et un bateau inutilisé coûte son tarif journalier. Une alerte météo ne choisit pas entre trois plannings.
- **Qui paie, combien, combien de clients** : exploitants et sous-traitants de maintenance en mer du Nord et Baltique. 50-150 k€/an par parc [?]. Quelques dizaines de parcs en Europe [?], plus les prestataires. Marché probablement sous 100 M€ en logiciel pur [?]. À présenter comme tête de pont vers la pose de câbles et les services offshore pétroliers.
- **Donnée disponible à 9h demain** : Open-Meteo Marine (vérifié : gratuit sans clé, vagues, houle, période, 7 jours) et vent ; positions des parcs en données ouvertes (EMODnet [?]). Ordres de travail : on les génère et on le dit.
- **Briques Aiven** : OpenSearch (retours d'expérience de pannes en texte) ; Valkey (fenêtre courante) ; PostgreSQL (offres et prix des loueurs).
- **Ce que la base sait après 1 000 clients** : tarif réel du bateau par saison et par port, délai de réponse, taux d'annulation de chaque loueur selon la météo. Sans contrats réels, personne ne l'a.
- **Concurrent le plus proche** : logiciels de planification de maintenance des constructeurs et d'intégrateurs ; aucun nom confirmé par mes recherches [?, non cherché].
- **Faisable en 7 h ?** : le calcul de fenêtre à partir des vagues réelles, le planificateur, l'agent vocal. Simulé : l'état des éoliennes et les loueurs (joués par un juré). Risque : un domaine technique que personne de l'équipe ne connaît ; il faut une fiche d'une page sur les seuils de hauteur de vague.
- **% LLM** : 8 %

### Cars et chambres avant l'annulation
- **Pour un ami (2 phrases, zéro jargon)** : quand un aéroport va se bloquer (brouillard, orage, grève), des milliers de passagers auront besoin d'un hôtel et d'un car, et les prix montent dès que la nouvelle sort. L'agent de la compagnie prévoit la panne quelques heures plus tôt, teste dans la copie de l'aéroport quels vols annuler ou décaler pour limiter les nuitées, puis appelle les hôtels et les autocaristes pour bloquer des chambres et des sièges au tarif d'avant la panique.
- **Le moment wow** : « L'agent a bloqué 180 chambres à 89 € avant que le brouillard n'arrive ; l'heure d'après, la chambre valait 240 €. » Le jury voit un brouillard prévu à 22 h sur la carte de l'aéroport et deux plannings côte à côte, puis entend l'agent appeler un hôtel (joué par un juré).
- **Le travail remplacé** : le centre de contrôle des opérations d'une compagnie et ses équipes d'assistance passagers. Obligation de prise en charge européenne (règlement UE 261) : hôtel, repas et transport à la charge de la compagnie. Un SQL ne renvoie pas un plan : il faut tester plusieurs annulations et négocier au téléphone.
- **Qui paie, combien, combien de clients** : compagnies régionales et low-cost (une centaine en Europe [?]), 80-250 k€/an [?]. Coût d'une nuit de prise en charge : 100-250 € par passager [?, ordre de grandeur non sourcé]. Marché : la gestion de perturbation dépasse 100 M€ si on compte tout le transport de passagers (train, ferry) [?].
- **Donnée disponible à 9h demain** : METAR et TAF d'aviationweather.gov (API ouverte [?, non vérifié aujourd'hui]) ; ADS-B OpenSky pour les positions d'avions en direct [?, limites d'usage anonymes à vérifier] ; horaires publiés. Les stocks de chambres sont joués.
- **Briques Aiven** : Kafka (flux METAR et positions) ; ClickHouse (historique des perturbations par aéroport) ; PostgreSQL (hôtels, prix, conditions).
- **Ce que la base sait après 1 000 clients** : par ville, quels hôtels acceptent un bloc à quel prix, combien d'heures avant, combien de fois ils ont annulé en vrai. Une carte de la capacité hôtelière qu'on ne peut acheter nulle part.
- **Concurrent le plus proche** : les modules de perturbation des grands fournisseurs de logiciels aériens (Sabre, Lufthansa Systems, Navitaire) [?, offres non vérifiées] : ils replanifient, ils n'appellent pas l'hôtel.
- **Faisable en 7 h ?** : un aéroport, une nuit rejouée avec de vraies données météo. Simulés : les hôtels. Risque : l'amorce « aéroport » est la plus fréquente ; la différence doit venir de l'hôtel et du prix, pas de la file de passagers.
- **% LLM** : 24 %

### Séchoir plein, camions déroutés
- **Pour un ami (2 phrases, zéro jargon)** : en octobre, un silo agricole reçoit tout le maïs d'un coup et le séchoir sature, alors que la pluie arrive. L'agent de la coopérative prévoit le jour où le séchoir sera plein, teste de répartir les livraisons entre coopératives voisines et transporteurs, puis appelle un autre séchoir et des chauffeurs pour envoyer le maïs ailleurs avant qu'il ne moisisse.
- **Le moment wow** : « Dimanche à 15 h, le séchoir déborde ; l'agent vient de caser 12 camions chez le voisin à 3 € de moins par tonne que le tarif affiché. » Le jury voit une carte du secteur avec trois silos qui se remplissent selon la météo, puis un voisin (joué par un juré) discuter son prix.
- **Le travail remplacé** : le responsable de collecte et le responsable logistique d'une coopérative céréalière (3-6 personnes en pointe de récolte [?]). Coût : maïs mal séché déclassé, heures d'attente des camions, séchage au prix du gaz. Ordre de grandeur non sourcé : 5 à 15 €/t [?].
- **Qui paie, combien, combien de clients** : coopératives et négoces céréaliers. 30-80 k€/an [?]. Quelques centaines en France, plus l'Allemagne, la Pologne, la Roumanie [?]. Marché : probablement sous 100 M€ pour le seul maïs ; il monte si on couvre betterave, lait et fruits [?].
- **Donnée disponible à 9h demain** : Open-Meteo prévisions (sans clé) ; l'état des silos et les contrats sont donnés par le client, donc joués. Point faible : pas d'échantillon public de remplissage de silo.
- **Briques Aiven** : Valkey (état courant des silos) ; PostgreSQL (tarifs et accords entre coopératives) ; ClickHouse (historique de récolte).
- **Ce que la base sait après 1 000 clients** : combien de tonnes chaque séchoir voisin accepte, à quel prix, quel jour de pluie. Des données entre coopératives qui ne se parlent pas.
- **Concurrent le plus proche** : logiciels de gestion de collecte des coopératives (fournisseurs historiques) [?, non cherché]. Ils enregistrent les pesées, ils ne négocient pas.
- **Faisable en 7 h ?** : la partie jumeau est simple (3 silos, une météo). La négociation reste la vraie démo. Risque principal : donnée de silo purement simulée, donc le filtre « rien à installer » n'est tenu que par la météo.
- **% LLM** : 10 %

### Escale annulée, autocars trouvés
- **Pour un ami (2 phrases, zéro jargon)** : un paquebot de 3 000 passagers ne peut plus accoster à Marseille à cause du vent et doit aller à Toulon. L'agent de l'armateur prévoit le changement quelques heures avant, calcule laquelle des solutions de repli coûte le moins, puis appelle des autocaristes et des guides pour reconstituer les excursions du lendemain.
- **Le moment wow** : « Le bateau n'est pas encore dérouté, et il a déjà 40 autocars pour Toulon. » Le jury voit la position réelle d'un navire sur la carte, les vagues prévues devant le port, puis entend l'agent appeler une société d'autocars.
- **Le travail remplacé** : l'agent maritime portuaire et le responsable des excursions à terre d'une compagnie de croisière (équipe de 5-10 personnes par région [?]). Une escale ratée coûte remboursements, mauvaise note client et frais de reprogrammation, jamais chiffrés à ma connaissance [?].
- **Qui paie, combien, combien de clients** : armateurs de croisière et agences maritimes de ports (environ 15-25 grands armateurs [?] et quelques centaines d'agences). 100-300 k€/an par armateur [?]. Marché : probablement sous 100 M€ ; il passe la barre avec les ferries et les ports de plaisance [?].
- **Donnée disponible à 9h demain** : positions de navires via AISStream (WebSocket gratuit avec clé [?, non vérifié]) ; Open-Meteo Marine (vérifié). Les prestataires de terre sont joués.
- **Briques Aiven** : Kafka (flux AIS) ; Valkey (position courante) ; PostgreSQL (carnet de prestataires).
- **Ce que la base sait après 1 000 clients** : tarif d'un autocar 50 places un jour de dérive, par port et par saison ; qui répond en moins de 20 minutes.
- **Concurrent le plus proche** : plateformes d'excursions à terre et systèmes d'agences maritimes [?, non cherché].
- **Faisable en 7 h ?** : AIS plus météo est facile. La simulation d'accostage est le point faible : on ne simule pas le port, on compare trois ports de repli à partir des vents et des profondeurs. On le dit.
- **% LLM** : 7 %

### Importateur : jours de franchise sauvés
- **Pour un ami (2 phrases, zéro jargon)** : un importateur attend 40 conteneurs, le navire a 3 jours de retard, et le compteur des frais de stationnement au port tourne dès l'arrivée. L'agent voit le retard sur la position du navire, simule les façons de recevoir la marchandise (camion décalé, autre entrepôt, rallonge du délai gratuit), puis appelle la compagnie maritime pour obtenir des jours de franchise en plus.
- **Le moment wow** : « Il a obtenu 4 jours gratuits de plus que ce qu'on lui proposait. » Le jury entend la négociation avec un juré qui joue le transitaire de la compagnie.
- **Le travail remplacé** : l'agent de transit et le responsable des importations (1-2 personnes par PME importatrice). Les frais de stationnement de conteneurs (demurrage, detention) coûtent des milliards au commerce mondial [?, non sourcé] ; une alerte « navire en retard » ne les fait pas baisser.
- **Qui paie, combien, combien de clients** : importateurs de taille moyenne et commissionnaires de transport (milliers en Europe [?]). 10-40 k€/an [?]. Marché : probablement au-dessus de 100 M€ [?].
- **Donnée disponible à 9h demain** : AIS via AISStream [?], horaires publiés ; connaissements et jours de franchise : du client, joués.
- **Briques Aiven** : Kafka (AIS) ; ClickHouse (retards historiques par ligne et par port) ; PostgreSQL (accords obtenus).
- **Ce que la base sait après 1 000 clients** : combien de jours gratuits chaque compagnie concède selon le port, le client et le motif du retard.
- **Concurrent le plus proche** : HappyRobot (prix et rendez-vous pour le fret, ~62 M$ levés) et Portchain (côté terminal, ~8 M$) ; ils servent l'autre bout de la chaîne.
- **Faisable en 7 h ?** : très. C'est aussi le défaut : amorce proche de ce que d'autres équipes proposeront.
- **% LLM** : 38 %

### Vol retardé, froid maintenu
- **Pour un ami (2 phrases, zéro jargon)** : une caisse de vaccins ou de médicaments doit rester entre 2 et 8 degrés ; le vol est retardé et la glace sèche fond. L'agent de l'expéditeur voit le retard, compare les replis (autre vol, camion réfrigéré, relais en entrepôt), puis appelle le manutentionnaire pour de la glace sèche et la compagnie pour une place.
- **Le moment wow** : « Il restait 6 heures de froid, il vient d'en acheter 14. » Le jury voit un compte à rebours de température sur la caisse et entend deux appels.
- **Le travail remplacé** : le responsable de la chaîne du froid d'un transitaire pharmaceutique (1-3 personnes par site). Perte annuelle de la pharma par écart de température : de l'ordre de plusieurs milliards [?, non sourcé].
- **Qui paie, combien, combien de clients** : transitaires pharma et laboratoires (quelques centaines en Europe [?]). 50-150 k€/an [?]. Marché : probablement sous 100 M€ [?].
- **Donnée disponible à 9h demain** : positions d'avions OpenSky [?] et METAR [?] ; températures de caisse : à simuler (le capteur n'existe pas chez nous, on le dit).
- **Briques Aiven** : Kafka (positions, température) ; Valkey (compte à rebours) ; PostgreSQL (prestataires de relais).
- **Ce que la base sait après 1 000 clients** : quels manutentionnaires livrent de la glace sèche à 3 h du matin dans chaque aéroport, et à quel prix.
- **Concurrent le plus proche** : suivi de chaîne du froid (Sensitech, Controlant) [?, non vérifié] : ils mesurent, ils n'agissent pas.
- **Faisable en 7 h ?** : oui pour le compte à rebours et l'appel. Risque : la température est entièrement simulée, donc le filtre « rien à installer » repose sur le retard de vol réel seul.
- **% LLM** : 15 %

---

## Lecture rapide (hors format)
- Les mieux chiffrées sur « l'argent perdu quand on réagit trop tard » : le Rhin (surcharges 2022 documentées par plusieurs sources). Pharma et importateur : montants à sourcer.
- Sous 20 % de probabilité LLM : Rhin 6 %, croisière 7 %, éolien offshore 8 %, séchoir 10 %, froid 15 %.
- Une seule idée s'appuie sur un fait lu aujourd'hui : le capteur de Kaub (valeur à revérifier, unité non confirmée). Les autres exigent une partie simulée, à annoncer au jury.

# Salve 4, direction D : l'agent négociateur (8 idées)

## Avant les idées : ce que j'ai écarté et ce que j'ai vérifié

**Fret routier spot par voix : écarté.** HappyRobot a levé environ 200 M$ en trois tours (série A 15,6 M$ en déc. 2024, série B 44 M$, série C 150 M$ à 1,2 Md$ de valorisation selon Forkast), avec plus de 150 clients entreprises dont DHL et Kuehne + Nagel. Un jury Accel le connaît ou le trouvera en 30 secondes. Aucune variante (côté transporteur, côté chargeur) ne change ça.
**Achats « tail spend » génériques par chat : écarté.** Pactum a levé plus de 100 M$ (série C de 54 M$ menée par Insight Partners) pour négocier par chat avec des fournisseurs réels. Toute idée « acheteur d'une grande entreprise » entre dans leur champ.

**Recherches faites (5 sur 5)** :
1. HappyRobot : voir ci-dessus (sources : forkast.news, ajot.com, pulse2.com).
2. Calendrier des arrêts de réacteurs en open data : **non confirmé**. La recherche n'a trouvé ni API ni jeu de données ODRÉ/RTE donnant les dates d'arrêt par réacteur. EDF publie des messages datés sur doaat.edf.fr (page de messages REMIT), sans documentation d'API. À traiter comme `[?]`.
3. Pactum : voir ci-dessus (tech.eu, investinestonia.com).
4. Jets privés : Limitless Sky (alertes IA sur les vols à vide, levée non trouvée) et Jet.AI (carte jet avec outil Reroute AI) existent. Rien trouvé sur les levées de Stratajet ou Avinode.
5. Béton : Koncrete (Paris, fondée 2023, amorçage 1 M€ en juin 2025, devis temps réel et comparaison fournisseurs), Flixbeton (Stuttgart), Béton Direct (Lyon, 600 k€ en 2017), Comstruct (Munich, 12,5 M€, matériaux en général), Schüttflix (sable et gravier, 50 M$).

Les huit idées couvrent : acheteur, vendeur et intermédiaire ; téléphone, e-mail, messagerie et enchère ; un à un, dix en parallèle, enchère inversée. Elles sont classées à la fin avec ma recommandation.

---

### Loger les arrêts de tranche
- **Pour un ami (2 phrases, zéro jargon)** : Quand un réacteur s'arrête six semaines pour maintenance, des centaines de techniciens arrivent et tous les hôtels, gîtes et campings à 40 km se remplissent. La personne qui doit les loger (chez le sous-traitant) passe des jours à téléphoner un par un ; l'agent appelle les hébergeurs, obtient un tarif pour 3 semaines de nuits groupées et se souvient de qui a cédé quoi.
- **Le moment wow** : « L'agent a bloqué 400 nuits autour d'une centrale avant que les prix explosent. » À l'écran : une carte autour de Pierrelatte, un compteur de nuits sécurisées, les hôtels qui passent du gris au vert. En haut-parleur, un juré joue l'hôtelier de Montélimar (« en novembre je suis plein ») ; l'agent propose 21 nuits fermes, paiement à 15 jours, contre 12 % de remise.
- **Le travail remplacé** : coordinateur logistique ou hébergement chez un sous-traitant de maintenance industrielle (environ 45 à 55 k€ chargé `[?]`), plus l'écart de prix : une chambre à 60 € hors arrêt passe à 100 € ou plus en pic `[?]`. Une requête SQL ne suffit pas : la capacité réelle d'un petit hôtel n'est dans aucune base, elle est dans la tête de la patronne, et elle se négocie.
- **Qui paie, combien, combien de clients** : sous-traitants de maintenance (Endel, Spie, Onet, équivalents) ; 40 à 80 k€/an par entreprise `[?]` ; quelques centaines d'entreprises intervenant en arrêts de sites en Europe `[?]`. Marché : ordre de grandeur pour le nucléaire français seul, 20 réacteurs/an × environ 750 intervenants hébergés × 35 nuits × 70 € ≈ 35 M€ (estimation de ma part, non sourcée). Le seuil de 100 M€ n'est atteint qu'en ajoutant les arrêts de raffineries, de chimie et d'éolien en Europe. Point faible à dire au jury.
- **Donnée disponible à 9h demain** : calendrier des arrêts : `[?]` (non confirmé par ma recherche ; pistes : messages EDF sur doaat.edf.fr, données d'indisponibilité de production RTE/ODRÉ). Repli : saisir à la main 3 arrêts annoncés publiquement et le dire. Hébergeurs : OpenStreetMap via Overpass (`tourism=hotel|guest_house|camp_site`, nombreux numéros dans le tag `phone`) `[?]` sur la couverture des numéros.
- **Briques Aiven** : PostgreSQL (fiche de chaque hébergeur : capacité, tarif obtenu, concessions, fiabilité de parole) ; Kafka (événements d'appel et réponses en direct) ; Valkey (état courant des 60 négociations en cours).
- **Ce que la base sait après 1 000 clients** : le tarif réellement signé de chaque hôtel, par semaine et par site industriel, et les chambres que l'hôtel ne met jamais en ligne mais donne à un habitué.
- **Concurrent le plus proche** : je n'en ai trouvé aucun en une recherche. Les plateformes de réservation de groupe (type HotelPlanner) existent mais ne s'occupent pas du logement d'arrêts et ne négocient pas `[?]`.
- **Faisable en 7 h ?** On construit : agent vocal ElevenLabs avec numéro Twilio, mémoire par hébergeur, carte, compteur de nuits. On simule : les 59 autres hôteliers ; ils sont marqués « non appelés » à l'écran, on n'invente pas de réponses. On n'appelle en vrai que des numéros qui ont consenti (jurés, coéquipiers). Point le plus risqué : le calendrier d'arrêts (donnée non confirmée) et le délai de la voix.
- **% LLM** : 3 %

### Béton réservé selon la météo
- **Pour un ami (2 phrases, zéro jargon)** : Un conducteur de travaux doit couler une dalle demain à 7 h ; s'il pleut ou gèle, il faut tout décaler, prévenir la centrale à béton et renégocier. L'agent appelle les centrales autour du chantier, obtient prix et créneau, puis les rappelle quand la prévision change.
- **Le moment wow** : « La prévision a changé et l'agent a refait le marché tout seul. » À l'écran : radar de pluie, quatre centrales sur une carte, transcription en direct. Le juré (centrale) dit « pas avant 10 h » ; l'agent répond : « La pluie arrive à 10 h 30, je prends 38 m³ à 6 h si vous baissez de 3 €/m³, avec un engagement de 120 m³ lundi. »
- **Le travail remplacé** : conducteur de travaux ou assistant achats d'une PME de gros œuvre, qui passe une partie de sa semaine à ces appels `[?]`. Béton environ 110 à 150 €/m³ `[?]` ; 5 % d'écart sur 3 000 m³/an font 17 à 22 k€. Une alerte météo ne suffit pas : il faut obtenir le nouveau créneau d'un humain.
- **Qui paie, combien, combien de clients** : entreprises de gros œuvre et de VRD de 20 à 200 salariés ; 6 k€/an `[?]` ; environ 8 000 en France et 60 000 en Europe `[?]`. Marché : 60 000 × 6 k€ = 360 M€ (hypothèse non sourcée).
- **Donnée disponible à 9h demain** : prévisions horaires (pluie, gel, vent) via Open-Meteo, API gratuite sans clé (je la connais, non revérifiée aujourd'hui). Centrales : OpenStreetMap (`man_made=works` + `product=concrete`) `[?]`. Prix de référence : indice INSEE du béton prêt à l'emploi `[?]`.
- **Briques Aiven** : Kafka (prévisions qui changent, événements d'appel) ; PostgreSQL (profil de chaque centrale : délais réels, remises, ponctualité) ; Valkey (créneaux tenus pour demain).
- **Ce que la base sait après 1 000 clients** : le prix payé réel par m³ et par classe de béton, centrale par centrale et heure par heure, et la ponctualité réelle de livraison. C'est un indice de prix du béton que personne ne publie.
- **Concurrent le plus proche** : Koncrete (Paris, 1 M€ d'amorçage en juin 2025) fait devis temps réel, comparaison et logistique. Flixbeton (Allemagne) fait la commande et le suivi. Aucun des deux ne rappelle ni ne renégocie quand la météo bouge. Attention : la place n'est pas vide, un jury qui connaît Koncrete le dira.
- **Faisable en 7 h ?** On construit : météo réelle, carte, un appel vocal réel vers un juré-centrale, relance automatique sur changement de prévision. On simule : les autres centrales (e-mail ou WhatsApp joués par nous, annoncé). Point le plus risqué : tenir une vraie négociation chiffrée en voix sans que l'agent dérape.
- **% LLM** : 8 %

### Avitailler les navires avant l'escale
- **Pour un ami (2 phrases, zéro jargon)** : Un cargo arrive au port dans 40 heures ; son armateur est à Athènes ou Hambourg et doit acheter vivres, eau douce, pièces, plongeur de coque, enlèvement de déchets. L'agent écrit aux fournisseurs du port, compare, négocie par e-mail, puis téléphone au meilleur.
- **Le moment wow** : « Le navire qu'on voit arriver sur la carte, l'agent l'a déjà approvisionné. » À l'écran : positions AIS en direct, un navire qui ralentit vers Rotterdam, douze e-mails partis. Un juré répond depuis son téléphone « pas moins de 4 200 € » ; en 10 secondes l'agent cite la remise obtenue à l'escale précédente du même armateur et le prix descend sous les yeux du jury.
- **Le travail remplacé** : superintendant achats ou port captain d'un armateur, ou employé d'agence maritime, environ 60 k€ chargé `[?]`. Les prix ne sont pas publics, les devis arrivent par e-mail et PDF. Une requête SQL ne sait pas écrire à douze chandlers ni répondre à leur contre-offre.
- **Qui paie, combien, combien de clients** : armateurs et gestionnaires de 10 à 60 navires, agences maritimes ; 20 à 40 k€/an `[?]` ; environ 800 armateurs/gestionnaires européens et 1 500 agences `[?]`. Marché `[?]` non sourcé.
- **Donnée disponible à 9h demain** : AIS en direct : AISStream.io (websocket, clé gratuite) ou Digitraffic Marine (Finlande, ouvert) `[?]` sur les conditions actuelles. Fournisseurs : annuaires publics de ship chandlers par port `[?]`. Catalogue d'articles : nomenclature IMPA `[?]` sur l'accès libre.
- **Briques Aiven** : Kafka (flux AIS → ETA par port) ; PostgreSQL (fiche fournisseur et historique de négociation) ; ClickHouse (prix payés par article, port et date) ; OpenSearch (retrouver un devis ou un article équivalent).
- **Ce que la base sait après 1 000 clients** : le prix réellement payé pour chaque article, dans chaque port, par type de navire : un indice de prix d'un marché opaque que même les armateurs ne voient que par flotte.
- **Concurrent le plus proche** : ShipServ (place de marché d'achats maritimes ancienne, levée `[?]`). Pactum (plus de 100 M$) négocie par chat mais pas dans le maritime. La différence : déclenchement par l'arrivée réelle du navire et mémoire par fournisseur de port.
- **Faisable en 7 h ?** On construit : flux AIS réel, déclencheur sur ETA, boîte e-mail de l'agent, négociation avec un juré. On simule : le catalogue d'articles (une liste de 15 lignes écrite par nous, dite). Point le plus risqué : l'accès AIS et l'obtention de vrais numéros ou e-mails de chandlers (sinon un juré joue le seul fournisseur).
- **% LLM** : 7 %

### Jets privés revenant à vide
- **Pour un ami (2 phrases, zéro jargon)** : Un courtier en vols privés doit trouver un avion pour son client lundi ; or beaucoup de jets rentrent à vide et leur propriétaire accepterait un prix bas pour le trajet. L'agent repère ces avions en vol, appelle l'opérateur et négocie.
- **Le moment wow** : « Le jet qu'on voit voler, l'agent l'a eu au téléphone avant qu'il atterrisse. » À l'écran : une carte ADS-B, un point qui descend vers Nice, appel en haut-parleur avec un juré qui joue l'opérateur d'un Falcon 50. L'agent obtient le retour Nice-Paris à moins 40 % du tarif catalogue.
- **Le travail remplacé** : courtier charter (commission de l'ordre de 8 à 15 % sur des vols à 20-60 k€ `[?]`), qui appelle dix opérateurs par demande. Les opérateurs ne publient pas tous leurs vols à vide ; l'information est dans la conversation.
- **Qui paie, combien, combien de clients** : courtiers charter indépendants ; 15 à 30 k€/an `[?]` ; 300 à 500 en Europe `[?]`. Marché : probablement sous 100 M€ en abonnements ; 100 M€ seulement si l'on prend un pourcentage de l'économie réalisée (charter européen de l'ordre de 3 Md€ `[?]`, 1 % = 30 M€). Point faible.
- **Donnée disponible à 9h demain** : positions d'avions : OpenSky Network (API anonyme limitée, ou compte gratuit) ou adsb.lol/adsb.fi `[?]` sur le débit. Rattachement immatriculation → opérateur : sites d'opérateurs et registres d'aéronefs `[?]` ; c'est le maillon fragile.
- **Briques Aiven** : Kafka (positions en flux) ; Valkey (état courant des avions suivis) ; ClickHouse (historique de rotations pour prédire les retours à vide) ; PostgreSQL (fiche opérateur, tarifs obtenus).
- **Ce que la base sait après 1 000 clients** : le vrai prix de repositionnement par type d'avion et par route, et la probabilité qu'un opérateur donné cède.
- **Concurrent le plus proche** : Limitless Sky (alertes IA sur les vols à vide, levée non trouvée), Jet.AI (société cotée, outil Reroute AI dans sa carte jet), Avinode (place de marché d'appels d'offres). La différence : aucun ne négocie ; ils alertent, et l'alerte est interdite à notre carte de rejet.
- **Faisable en 7 h ?** On construit : carte ADS-B live, détection de retour probable à vide, appel vocal réel à un juré, mémoire de l'opérateur. On simule : le tarif catalogue (modèle simple, dit). Point le plus risqué : faire le lien entre un avion vu en l'air et un numéro de téléphone d'opérateur à 9 h.
- **% LLM** : 12 %

### Électricité PME mise aux enchères
- **Pour un ami (2 phrases, zéro jargon)** : Un industriel dont le contrat d'électricité expire demande normalement des prix à dix fournisseurs, qui les gardent valables deux heures seulement. L'agent les relance tous en parallèle, leur dit où en sont les offres des autres, et fige le prix au bon moment de la matinée.
- **Le moment wow** : « Dix fournisseurs se battent en direct et l'agent dit leurs prix à voix haute. » À l'écran : le prix spot en direct, dix lignes qui se mettent à jour. Un juré fournisseur entend « en face on est à 91,40 € le MWh ; et vous ? » et baisse.
- **Le travail remplacé** : courtier en énergie (commission de l'ordre de 2 à 6 €/MWh `[?]`) ou acheteur énergie d'une ETI. Les offres ne sont pas publiques, elles expirent vite, et se négocient à l'oral.
- **Qui paie, combien, combien de clients** : cabinets de courtage et directions achats d'ETI ; 12 k€/an plus un pourcentage `[?]` ; environ 3 000 courtiers européens `[?]` ; marché dépassant 100 M€ plausible `[?]`.
- **Donnée disponible à 9h demain** : prix day-ahead France via Energy-Charts (Fraunhofer, API sans clé) ou ENTSO-E (jeton gratuit) `[?]` sur les conditions. Profils de consommation types : Enedis open data `[?]`.
- **Briques Aiven** : Kafka (prix et réponses fournisseurs en flux) ; ClickHouse (historique offres contre spot) ; PostgreSQL (profil de chaque fournisseur) ; Valkey (offres encore valables, avec leur compte à rebours).
- **Ce que la base sait après 1 000 clients** : l'écart entre l'offre de chaque fournisseur et le marché, par profil de consommation et par heure de la journée, et le moment où chacun devient agressif.
- **Concurrent le plus proche** : Opéra Énergie et Selectra (courtiers humains, levées non vérifiées `[?]`), Pactum (négociation par chat, plus de 100 M$, pas spécialisé énergie vocale). La différence : parallélisme et lien en direct avec le spot.
- **Faisable en 7 h ?** On construit : courbe spot, tableau d'offres, appel vocal à un juré, boucle de relance. On simule : neuf fournisseurs sur dix (joués par nous, annoncés). Point le plus risqué : l'idée est proche de ce qu'un autre LLM proposera ; un jury Accel la jugera plus plate que les autres.
- **% LLM** : 25 %

### Machines d'occasion sans prix
- **Pour un ami (2 phrases, zéro jargon)** : Sur les sites d'annonces, la moitié des machines industrielles d'occasion affichent « prix sur demande ». L'agent appelle chaque vendeur, obtient le prix, négocie en citant le prix d'adjudication de machines comparables, et se souvient de ce que ce vendeur a accepté la dernière fois.
- **Le moment wow** : « Il a découvert le prix puis l'a fait baisser en citant une vente de mardi. » Annonce « Tour CNC, prix sur demande », juré vendeur : « 48 000 ». L'agent : « La même machine est partie à 31 000 aux enchères mardi. » Accord à 36 500 sur l'écran.
- **Le travail remplacé** : acheteur ou sourcing d'un revendeur-exportateur de machines (environ 50 k€ chargé `[?]`). Le prix demandé est affiché, le prix payé jamais ; la requête SQL ne produit pas le prix qui n'existe pas.
- **Qui paie, combien, combien de clients** : revendeurs de machines d'occasion ; 15 k€/an `[?]` ; environ 5 000 en Europe `[?]` ; marché 75 M€ `[?]` (sous le seuil).
- **Donnée disponible à 9h demain** : annonces (Machinio, Exapro) et adjudications (Troostwijk, Surplex) : accès par scraping et conditions d'utilisation `[?]`. C'est la donnée la plus fragile des huit idées.
- **Briques Aiven** : OpenSearch (annonces et machines comparables par recherche vectorielle) ; ClickHouse (adjudications) ; PostgreSQL (vendeurs, prix obtenus) ; Valkey (négociations en cours).
- **Ce que la base sait après 1 000 clients** : les prix de transaction réels des machines d'occasion, qui n'existent nulle part aujourd'hui.
- **Concurrent le plus proche** : Machinio, Exapro, Surplex (places de marché d'annonces ou d'enchères, levées non vérifiées `[?]`). Aucun ne négocie.
- **Faisable en 7 h ?** On construit : recherche de comparables sur 200 annonces récupérées, appel à un juré. On simule : les adjudications si l'accès est bloqué (échantillon écrit à la main, dit). Point le plus risqué : l'accès aux données.
- **% LLM** : 18 %

### Broutards mis en concurrence
- **Pour un ami (2 phrases, zéro jargon)** : Un éleveur a 35 veaux sevrés à vendre ; il les vend toujours au même marchand, au prix qu'on lui donne. L'agent appelle huit marchands pendant que l'éleveur est dans ses champs et ramène la meilleure offre ferme.
- **Le moment wow** : « L'éleveur n'a rien appelé et son lot a pris 14 centimes au kilo. » Un juré marchand de bestiaux dit « à 3,05 je ne peux pas » ; l'agent : « Un confrère est à 3,18 avec enlèvement jeudi. »
- **Le travail remplacé** : le temps de l'éleveur, et le courtier qui prend une commission. 35 veaux × 350 kg × 3,20 €/kg ≈ 39 k€ ; 5 % d'écart ≈ 2 k€ par lot `[?]`. Une requête SQL ne fait pas bouger le prix d'un marchand.
- **Qui paie, combien, combien de clients** : éleveurs allaitants (environ 90 000 exploitations en France `[?]`) ; 1 % du lot ou 300 à 500 €/an `[?]`. Marché : plus d'un million de broutards par an en France `[?]`, mais à 1 % de commission cela reste sous 100 M€ sans extension à l'Europe. Point faible. Et l'utilisateur est « en costume » : nous n'avons pas d'éleveur dans l'équipe.
- **Donnée disponible à 9h demain** : cotations de broutards (Réseau des Nouvelles des Marchés de FranceAgriMer ou Institut de l'Élevage) `[?]`, donnée publique de l'État, à ne pas présenter comme le cœur du produit. Marchands : annuaires `[?]`.
- **Briques Aiven** : PostgreSQL (fiche de chaque marchand : ce qu'il paie, quand il cède) ; ClickHouse (historique des prix obtenus) ; Valkey (offres en cours).
- **Ce que la base sait après 1 000 clients** : le prix réel payé par marchand, par race, poids et semaine, avec sa tactique habituelle.
- **Concurrent le plus proche** : je n'en ai pas identifié `[?]` ; les marchés au cadran et les courtiers humains sont les concurrents réels.
- **Faisable en 7 h ?** On construit : appel vocal réel à un juré, mémoire du marchand. On simule : les sept autres marchands. Point le plus risqué : crédibilité du côté « éleveur », sans expert à bord.
- **% LLM** : 6 %

### Courtage de vin en vrac
- **Pour un ami (2 phrases, zéro jargon)** : Un négociant cherche 600 hectolitres de rouge pour mars ; le courtier en vins appelle 30 châteaux et caves coopératives, relève ce qui est à vendre et à quel prix, négocie, et sait qui exagère ses stocks. L'agent fait ce travail et n'oublie aucune conversation.
- **Le moment wow** : « Il lui a rappelé ce qu'il avait dit en février. » Un juré vigneron dit « je n'ai plus rien » ; l'agent : « En février vous aviez 40 hl à 1 250 € le tonneau. » À l'écran : l'historique des promesses de ce vigneron.
- **Le travail remplacé** : courtier en vins (profession à Bordeaux, rémunéré par une commission, souvent 2 % du vendeur `[?]`). Sa valeur est sa mémoire des gens ; une requête SQL n'a pas de mémoire de parole donnée.
- **Qui paie, combien, combien de clients** : négociants et caves ; 20 k€/an `[?]` ; environ 1 500 négociants français `[?]` ; marché `[?]`, probablement sous 100 M€ en abonnements.
- **Donnée disponible à 9h demain** : cours du vrac publiés par les interprofessions (par exemple le CIVB) `[?]`. Annuaire de propriétés : sites publics `[?]`.
- **Briques Aiven** : PostgreSQL (mémoire de chaque vigneron et de ses promesses) ; OpenSearch (retrouver une cuvée à partir d'une description en langage libre) ; Valkey (offres en cours).
- **Ce que la base sait après 1 000 clients** : ce que chaque vendeur a réellement vendu, à quel prix et à qui, par millésime, donc la fiabilité de chacun.
- **Concurrent le plus proche** : places d'annonces de vrac et courtiers humains ; aucune startup financée identifiée `[?]`.
- **Faisable en 7 h ?** On construit : appel vocal à un juré, mémoire des conversations. On simule : les stocks (liste écrite, dite). Point le plus risqué : l'idée reste peu « physique » et plus basée sur la mémoire que sur un flux.
- **% LLM** : 9 %

---

## Classement et recommandation

Sous 20 % de probabilité LLM : idées 1, 2, 3, 4, 6, 7, 8 (sept sur huit).

1. **Loger les arrêts de tranche** : l'idée la plus neuve et la plus visuelle (réacteur, carte, nuits qui se remplissent). Faiblesse : le calendrier d'arrêts n'est pas confirmé en open data, et le marché ne dépasse 100 M€ qu'en élargissant à toute l'industrie lourde européenne. À vérifier en premier demain à 9 h.
2. **Avitailler les navires** : flux réel (AIS), canal e-mail qui contraste avec les voix des autres équipes, marché opaque. Faiblesse : peu de chances de trouver de vrais chandlers à appeler.
3. **Jets privés revenant à vide** : le wow le plus fort de la salve (on voit l'avion, on entend l'appel). Faiblesse : marché petit et lien immatriculation → opérateur fragile.
4. **Béton selon la météo** : le plus commercialisable (PME qui achètent, 60 000 cibles) mais Koncrete et Flixbeton occupent déjà le terrain en plateforme.
5. à 8 : électricité (trop attendue), machines d'occasion (donnée fragile), broutards (utilisateur en costume), vin (peu physique).

Fusion avec la direction F : 1 et 3 se prêtent à un jumeau (centrale + hébergements autour ; avions + aéroports), 2 aussi (port + navires en approche).

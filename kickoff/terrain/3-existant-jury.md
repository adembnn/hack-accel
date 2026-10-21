# 3. Existant et jury (recherche du 21 oct. 2026)

Décision débloquée : quelles idées « agents + données » rejeter comme « déjà fait » (carte de rejet, point 2) et quoi mettre en avant devant Accel + Aiven.
Convention : `[?]` = non vérifié ou déduit. Un lien par affirmation. Les gagnants viennent de blogs de sponsors (biais : vitrine).
Lecture de 3 lignes : (1) l'agent d'analyse de données et l'agent SRE sont saturés, et Aiven vend lui-même le second depuis le 20 oct. (2) Les gagnants récents ont un expert du métier, un processus manuel coûteux et une chaîne de preuve. (3) Accel écrit « contexte + données + échafaudage » pour les apps verticales.

## 1. Déjà fait : 43 produits, 7 familles

### A. Analyste de données en langage naturel : SATURÉE (13)
- Hex : plateforme « agentic analytics » pour équipes data (notebooks + gouvernance sémantique). [PH](https://www.producthunt.com/categories/ai-data-scientist)
- Basedash : analyste IA, SQL traçable, dashboards sur demande. [PH](https://www.producthunt.com/categories/ai-data-scientist)
- Querri : « Librarian » qui construit une carte des KPI de l'entreprise, répond depuis elle. [PH](https://www.producthunt.com/products/querri)
- Mitzu : analytique produit agentique sur l'entrepôt de données du client. [PH](https://www.producthunt.com/categories/ai-data-scientist)
- Bruin : agent data qui collabore avec l'équipe (requêtes, dashboards). [PH](https://www.producthunt.com/categories/ai-data-scientist)
- Julius Slack Agent : data scientist IA dans Slack. [PH](https://www.producthunt.com/categories/ai-data-scientist)
- Databox « Routines » : analyste IA sur données live, tâches planifiées. [PH](https://www.producthunt.com/products/databox)
- Pleom (S25) : insights automatiques sur toutes les données de l'entreprise. [YC](https://ycombinator.com/companies/industry/analytics)
- Datost (printemps 2026) : analyste IA dans Slack. [YC](https://ycombinator.com/companies/industry/analytics)
- Alkera (S26) : agent data engineering/analyse dans l'IDE (Snowflake, dbt). [YC](https://ycombinator.com/companies/industry/analytics)
- nao Labs (P25) : framework open source pour déployer des agents d'analyse. [YC](https://ycombinator.com/companies/industry/analytics)
- Crunched (F25) : analyste IA pour utilisateurs avancés d'Excel. [VCBacked](https://www.vcbacked.co/yc/batch/f25)
- ClickHouse Agents (bêta juin 2026) : agents sans code ancrés dans les données ClickHouse, propulsés par Claude. [ClickHouse](https://clickhouse.com/blog/clickhouse-agents-beta)

### B. Couche « contexte / mémoire » pour agents : SATURÉE (8)
- Airweave (printemps 2025) : couche open source de récupération de contexte. [YC](https://www.ycombinator.com/companies?batch=Spring%202025)
- Nozomio Labs (S25) : couche d'augmentation de contexte. [CB Insights](https://www.cbinsights.com/research/y-combinator-summer2025)
- Hyper (printemps 2026) : « cerveau d'entreprise » pour employés IA. [YC](https://www.ycombinator.com/companies?batch=Spring%202026)
- Moda (W26) : « vos agents ne font jamais deux fois la même erreur ». [YC](https://www.ycombinator.com/companies/?batch=W26&batch=Winter%202026)
- TraceRoot (S25) : couche open source d'auto-amélioration des agents. [VCBacked](https://www.vcbacked.co/yc/batch/s25?page=5)
- Confluent Real-Time Context Engine (GA mai 2026) : contexte frais servi aux agents via MCP. [Confluent](http://confluent.io/blog/2026-q2-confluent-intelligence-update)
- Aiven DataHub (GA 23 sept.) : catalogue et lignée servis aux agents. [Aiven](https://aiven.io/press/aiven-launches-runtime-and-datahub-enabling-ai-agents)
- Signal de saturation : le 12 oct., six des dix premiers de Product Hunt vendaient « données, mémoire, jambes pour agents ». [LinkedIn via OutX](https://www.outx.ai/de/linkedin/startups/producthunt-launch) [?] (second-hand)

### C. Agent SRE / astreinte / sécurité opérationnelle : SATURÉE ET PRISE PAR LE SPONSOR (6)
- Aiven Managed Agents (20 oct., accès limité) : agent SRE permanent, exemples « base lente », « incident de 3 h du matin », lag Kafka. [Aiven](https://aiven.io/blog/aiven-agents-can-do-that-for-you)
- Confluent Streaming Agents (GA) : agents événementiels sur Flink/Kafka qui surveillent des signaux métier et agissent. [Confluent](http://confluent.io/blog/2026-q2-confluent-intelligence-update)
- Deeptrace (F25) : agents pour l'astreinte. [VCBacked](https://www.vcbacked.co/yc/batch/f25)
- Cotool (printemps 2025) : opérations de sécurité optimisées pour agents. [YC](https://www.ycombinator.com/companies?batch=Spring%202025)
- Surf AI (Accel, mars 2026) : graphe de contexte identité/cloud/RH/IT, agents de remédiation sous supervision humaine. [BusinessWire](https://www.businesswire.com/news/home/20260317476754/en/Surf-AI-Launches-with-$57-Million-in-Funding-to-Help-Enterprises-Operationalize-Security)
- Eyewitness (hackathon Elastic) : clics de rage, paniers abandonnés, ticket avec clip et trace backend. [Elastic](https://www.elastic.co/blog/mumbai-forge-the-future-hackathon-2026)

### D. Gouvernance, identité, paiement des agents : SATURÉE (6, interdite par la carte)
- Redpanda Agentic Data Plane : identité par agent, MCP gateway, journal rejouable, kill switch. [Redpanda](https://www.redpanda.com/blog/agentic-data-plane)
- Clawvisor (printemps 2026) : couche d'autorisation pour agents. [YC](https://www.ycombinator.com/companies?batch=Spring%202026)
- Agentic Fabriq (F25) : « Okta pour agents ». [VCBacked](https://www.vcbacked.co/yc/batch/f25)
- Sapiom (Accel, seed fév. 2026) : identité, portefeuille, facturation des agents. [Accel](https://accel.com/news/powering-the-agentic-economy-our-seed-investment-in-sapiom)
- valv : « votre base, sûre pour les requêtes d'agents ». [PH](https://www.producthunt.com/categories/ai-data-scientist?page=3)
- Klaimee (printemps 2026) : assurance responsabilité pour agents. [YC](https://www.ycombinator.com/companies?batch=Spring%202026)

### E. Agents verticaux « back-office d'un secteur » : DENSE (46 % du batch YC P25 sont des agents)
- Moby Analytics (printemps 2025, Paris) : auditeurs financiers IA. [YC](https://www.ycombinator.com/companies?batch=Spring%202025)
- Wedge (S25) : « Palantir pour agents de santé ». [VCBacked](https://www.vcbacked.co/yc/batch/s25?page=5)
- Veritus (S25) : agents pour le crédit à la consommation. [VCBacked](https://www.vcbacked.co/yc/batch/s25?page=5)
- Legora (Accel, série D 550 M$) : OS juridique ; 800+ clients. [Accel](https://www.accel.com/news/our-investment-in-legora-the-legal-ai-operating-system)
- Chiffre : 67 des 144 startups YC du batch printemps 2025 (46 %) sont des agents. [PitchBook](https://pitchbook.com/news/articles/y-combinator-is-going-all-in-on-ai-agents-making-up-nearly-50-of-latest-batch)

### F. Temps réel / flux vus par les vendeurs d'infra (démos « agentic » des sponsors types)
- Aiven + Kafka sans disque + LanceDB : agent de promo en temps réel, hyper-personnalisation, vidéo en magasin. [Aiven](https://aiven.io/blog/real-time-retail-context-at-scale)
- Confluent : exemple de prix concurrentiels mis à jour en continu. [Confluent](https://www.confluent.io/press-release/confluent-unlocks-scalable-agentic-ai-with-streaming-agents)
- Tinybird : ClickHouse managé avec serveur MCP hébergé. [Tinybird](https://www.tinybird.co/)
- Flow AI (racheté par Aiven, juillet 2026) : agents analytiques à intégrer dans les produits SaaS. [Aiven](https://aiven.io/blog/aiven-acquires-flow-ai)

### G. Peu peuplée (à surveiller, pas saturée)
- Squid (W26) : agents pour la planification du réseau électrique. [YC](https://www.ycombinator.com/companies/?batch=W26&batch=Winter%202026)
- Zymbly (W26) : aide à la décision pour les opérations aériennes. [YC](https://www.ycombinator.com/companies/?batch=W26&batch=Winter%202026)
- VOYGR (W26) : intelligence de lieux réels pour agents. [YC](https://www.ycombinator.com/companies/?batch=W26&batch=Winter%202026)

## 2. Gagnants de hackathons d'agents (2025-2026) et point commun

| Gagnant | Événement | Ce qu'il fait |
|---|---|---|
| Vigil | Elastic Forge the Future, Mumbai, sept. 2026 (grand prix) | Écoute des appels de vente, repère la phrase hors norme, renvoie l'horodatage et l'article SEBI/AMFI ; les audits manuels couvrent moins de 30 % des appels [Elastic](https://www.elastic.co/blog/mumbai-forge-the-future-hackathon-2026) |
| MediAudit-X | idem (3e) | Dossiers d'assurance maladie contre règles de la police, avec règles citées et journal infalsifiable [Elastic](https://www.elastic.co/blog/mumbai-forge-the-future-hackathon-2026) |
| PHAROS | Elastic Agent Builder | Rapports FDA d'effets indésirables, statistiques OMS dans ES\|QL, alertes en moins d'une minute [Elastic](https://www.elastic.co/blog/the-elasticsearch-agent-builder-hackathon) |
| Doublons VIH Kenya | idem | 1 010 dossiers réels, 131 doublons en moins de 10 s [Elastic](https://www.elastic.co/blog/the-elasticsearch-agent-builder-hackathon) |
| CrossBeam | Anthropic Opus 4.6 (1er) | Plans + lettres de correction de permis, plan d'action en 20 min ; la ville de Buena Park envisage de l'adopter [Claude](https://claude.com/resources/articles/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon) |
| TARA | idem (prix « Keep Thinking ») | Vidéo de dashcam vers évaluation d'investissement routier ; remplace une étude à 1-4 M$ [Claude](https://claude.com/resources/articles/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon) |
| Medkit | Anthropic Opus 4.7 (1er) | Simulation de consultations pour internes ; 3 facultés et 1 pharma en pilote [Claude](https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon) |
| Wrench Board | idem (2e, Français) | Schéma de carte électronique + symptômes, l'agent désigne le pad à sonder [Claude](https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon) |
| ARIA | idem (Managed Agents, 2 Français) | Surveille des machines d'usine, détecte les anomalies, génère le plan de réparation ; des entreprises ont contacté l'équipe [Claude](https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon) |
| Tekton | Anthropic Build Day, juin 2026 (1er) | Reconstruction 3D de bâtiments Tang, chaque pièce renvoie à sa source (« chaîne de preuve ») [Claude](https://claude.com/resources/articles/meet-the-winners-of-our-claude-opus-4-8-build-day-hackathon) |
| DreamPath / Koro | AI Tinkerers Paris, EPITA x GDG, juin 2026 (1er/2e) | Simulateur de conséquences d'orientation (Parcoursup) ; simulation d'étudiants pour l'assurance qualité pédagogique [AI Tinkerers](https://paris.aitinkerers.org/hackathons/h_Z5JP_fvZY_g/results) |
| Overmind | Défi Aiven, Sunstead Hack, juin 2026 (1er) | Essaim d'agents qui migre un backend Lovable/Supabase vers Aiven [terrain](C:/Users/Adem/Hack%20Accel/reports/hackathon-terrain.md) |
| Voicera, Daily Brief, Trail | Accel Stanford ALP, fév. 2026 | Fraude audio, podcasts perso, mémoire perso [Accel](https://www.accel.com/noteworthies/inside-the-first-stanford-accel-leadership-program-hackathon-with-anthropic-and-perplexity) |

Point commun (analyse sur ces 13 lignes, pas une statistique) :
- Un processus manuel cher et nommé (permis, audit d'appels, dossiers d'assurance, maintenance) plutôt qu'un « assistant ».
- Un expert du métier dans l'équipe : avocat, cardiologue, ingénieur de maintenance, réparateur. Anthropic le dit : 4 gagnants sur 5 ne sont pas développeurs. [Claude](https://claude.com/resources/articles/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon)
- Chaque sortie cite sa source (clause, horodatage, pièce) ; le calcul chiffré reste déterministe (statistiques en ES|QL pour PHAROS).
- Un artefact final concret (plan d'action, rapport PDF, ticket avec clip) et un signal d'usage réel (pilotes, ville, entreprises qui rappellent).
- Les gagnants de sponsors utilisent le produit du sponsor en profondeur (ES|QL chez Elastic, migration vers Aiven pour Overmind). [?] déduction.
- Aucun gagnant de l'étape Accel précédente n'est publié (voir hackathon-terrain.md) : le profil ci-dessus vient d'événements voisins.

## 3. Idées « typiques » qui reviennent (à éviter)
- Galerie Opus 4.6 (227 projets, 8 finalistes) : outils autour de Claude Code (graphes, tableaux blancs, « Strava pour Claude Code »), équipes de 6 à 10 agents d'analyse (WallStreet Agents, Spectra, Nexus), « agent anti-dette technique ». [Cerebral Valley](https://cerebralvalley.ai/e/claude-code-hackathon/hackathon/gallery) Lesquels ont perdu : [?] (la page ne montre pas qui sont les 8 finalistes).
- Agents personnels : mémoire, santé, podcasts (Stanford ALP) ; CV et lettres de motivation (Job Seeker gagne pourtant un événement à 3 projets). [AI Tinkerers](https://paris.aitinkerers.org/hackathons/h_PUbtKQHWTpg/showcase)
- « Chat avec Postgres », agent de requêtes lentes, « ma base va-t-elle bien ? » : c'est la démo d'Aiven elle-même. [Aiven](https://aiven.io/blog/aiven-agents-can-do-that-for-you)
- Essaim d'agents pour l'essaim : plus de rôles que de décisions utiles. [?] jugement.
- Tableau de bord Kafka, alerte d'anomalie générique : cas d'usage de la page Runtime. [Aiven](https://aiven.io/blog/deploy-your-apps-and-agents-where-your-data-lives-with-aiven-runtime)

## 4. Ce que le jury récompense

### Accel (organisateur)
- Partners Europe : Philippe Botteri (Londres, Français, IA/cloud/sécurité ; H Company, Doctolib, Payfit, Synthesia, Tessl, Cyera) [Accel](https://www.accel.com/team/philippe-botteri.md) ; Sonali De Rycker ; Harry Nelis ; Luca Bocchio (Londres) [Accel](https://www.accel.com/noteworthies/introducing-our-newest-london-partner-luca-bocchio) ; Arun Mathew, Amit Kumar, Ben Fletcher, Jakob Buchmayer (équipe Legora). [Accel](https://www.accel.com/news/our-investment-in-legora-the-legal-ai-operating-system)
- Partners Paris : aucun trouvé, aucun bureau parisien confirmé. [?] Juge connu d'un hack Accel Paris précédent : Rafael Quintanilla, VP Accel. [HF](https://huggingface.co/Agents-Hack)
- Thèse 1 : couche application, pas modèles de fondation. [TechCrunch](https://techcrunch.com/2025/05/16/build-dont-bind-accels-sonali-de-rycker-on-europes-ai-crossroads/) · Botteri : l'Europe doit viser les applications. [Sifted](https://sifted.eu/articles/philippe-botteri-accel-interview-ai-application-startups-europe)
- Thèse 2 : « ce ne sont pas des wrappers » ; la valeur est dans le contexte, les données et l'échafaudage difficiles à acquérir (juridique, comptabilité, finance). [Accel Legora](https://www.accel.com/news/our-investment-in-legora-the-legal-ai-operating-system)
- Thèse 3 : contexte comme avantage (Surf AI : graphe de contexte ; titre Accel « Context is all you need »). [Accel Botteri](https://www.accel.com/team/philippe-botteri.md)
- Thèse 4 : coworker d'équipe plutôt que d'individu (Viktor, série A 75 M$, Accel mène) ; l'infra des agents (Sapiom, Kernel, n8n). [Accel](https://accel.com/news/welcome-viktor-the-ai-coworker-for-the-modern-workplace) · [Accel news](https://www.accel.com/news/portfolio)
- Cible série : « technical builders with founder intent ». [terrain](C:/Users/Adem/Hack%20Accel/reports/hackathon-terrain.md)

### Iterate (co-organisateur)
- Hackathons de bout en bout + recrutement d'ingénieurs « prouvés » + recherche ; présent à Paris, 7 villes. [Iterate](https://iterate.inc/) Lecture : ils repèrent des builders ; un profil clair sur le GitHub compte autant que le produit [?].

### Aiven (sponsor)
- Vend « agents sur données live, gouvernées, qui ne quittent pas le périmètre » ; exemples : agents support/ops/analytics, anomalies en temps réel sur tables/logs/flux, outils internes, tâches de données (embeddings, ETL, retrait de PII). [Aiven](https://aiven.io/blog/deploy-your-apps-and-agents-where-your-data-lives-with-aiven-runtime)
- Cache sémantique Valkey : `FT.SEARCH` pour détecter les invites quasi identiques (webinaire du 7 oct.). [Aiven](https://aiven.io/)
- Vision du PDG : les agents deviennent le nouveau moyen d'interagir avec les données ; fraîcheur, fiabilité du contexte, évaluations. [Aiven](https://aiven.io/blog/aiven-acquires-flow-ai)
- Produits sortis ces jours : Runtime GA 23 sept. ; Managed Agents (accès limité) 20 oct. ; MCP pour Postgres/Kafka. [Aiven](https://aiven.io/blog/category/agentic-ai?page=2)
- Pas de produit nommé « Aiven for AI » trouvé ; la doc parle d'« AI tools on Aiven ». [GitHub docs](https://github.com/aiven/aiven-docs/blob/main/docs/ai-features.md)
- Aiven a primé un projet qui sert son produit (Overmind). [terrain](C:/Users/Adem/Hack%20Accel/reports/hackathon-terrain.md)

### 5 phrases que ce jury aimerait entendre [?] déductions
1. « [Prénom], responsable [fonction] chez [entreprise nommée], perd N heures par semaine sur X ; il nous a dit oui pour un test lundi. »
2. « Sans la donnée de ce client l'agent ne peut pas répondre ; sur N cas réels, avant : X %, après : Y %. »
3. « Chaque décision renvoie à la ligne de donnée qui l'a produite ; la donnée ne sort pas de l'environnement du client. »
4. « Plus l'agent tourne, plus la base contient ce que personne d'autre n'a : voilà pourquoi un concurrent ne peut pas copier. »
5. « Cette brique Aiven fait ce travail précis (Kafka = flux, ClickHouse = historique, Valkey = mémoire), et voici ce qui casserait sans elle. »

### 5 phrases trop entendues [?] déductions
1. « Discutez avec vos données en langage naturel. »
2. « Une équipe de N agents spécialisés qui collaborent. »
3. « Un copilote / assistant pour [métier]. »
4. « Un agent surveille votre base et vous alerte en temps réel. »
5. « Fait gagner dix heures par semaine » (sans mesure) ou « démocratise l'accès à X ».

## 5. Ce que je n'ai pas trouvé
- Gagnants de Stockholm, Amsterdam, Londres (aucune annonce). Critères et juges de Paris. [LinkedIn Hackathon Hub](https://hackathonhub.eu/events/accel-ai-innovate-paris-paris-2026)
- Un partner Accel basé à Paris ; la page équipe d'Accel ne l'affiche pas en texte.
- Gagnants du Mistral MCP Hackathon (13-14 sept. 2025, Paris), d'Agents Hack (juin 2025), de lablab 2026, de {Tech: Europe} : pages sans résultats lisibles.
- Étude de cas Aiven nommant un client avec un agent en production (hors La Redoute, migration de bases, pas d'agent).
- Liste YC complète par batch (annuaires partiels) : la liste ci-dessus n'est pas exhaustive.
- Démo live d'une cache sémantique Valkey par Aiven : webinaire annoncé, contenu non lu.

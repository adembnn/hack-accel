# Hack Accel — Accel AI Innovate: Paris (22 oct. 2026)

Faits et décisions propres à ce dépôt. À mettre à jour dans la minute qui suit chaque décision.

## Le hack
- Accel AI Innovate: Paris, 22 oct. 2026, Metafore Boétie (Paris 8e). Organisé par Accel et Iterate ; Aiven et Lovable partenaires. Hacking 9h–16h, pitch des 8 meilleures équipes à 16h, résultats 17h. Prix 1 500 / 1 000 / 500 €, 12 k$ de crédits Aiven aux 3 premiers. Détail sourcé : `reports/hackathon-terrain.md`.
- Brief : un produit qui marche où un ou plusieurs agents dépendent de données pour servir un utilisateur précis (gros jeux de données, flux d'événements, mémoire longue, sources multiples, amélioration au fil des exécutions). Déploiement sur Aiven Runtime, couche données Aiven (PostgreSQL, ClickHouse, Valkey, OpenSearch…). Comptent aussi : pensée produit, design, route crédible vers les premiers utilisateurs.
- Crédits à l'arrivée (Adem, 21 oct.) : Anthropic 100 $, OpenAI 50 $, Vercel AI Gateway 120 $, Modal 100 $, ElevenLabs 110 k crédits, Lovable, Supabase 25 $, n8n Cloud Pro 1 mois, Lightdash Cloud Pro 1 mois, Miro 1 mois. Plus nos abonnements Claude.

## L'équipe
- Adem, Titouan, Sullyvan, Alexandre : quatre builders IA et business (Adem, 21 oct.). Pas de logistique à régler avant l'idée.

## Décisions
- Ambition : b) gros système « wow » qu'on finira après le hack (Adem, 21 oct.).
- Terrain : neuf. Ne pas repartir des terrains passés d'Adem (pêche, jeux Voodoo, conseil, Avalanche, ESSEC) (Adem, 21 oct. : « on veut du nouveau »).
- Carte de rejet : voir `kickoff/0-cadrage.md`. Deux interdits propres à ce hack : « outil pour développeurs ou pour agents IA » et « chat avec tes données ».
- Méthode : skill `kickoff-projet` (cadrage → terrain → divergence → creuser → crash-test jury → emballer). Pas de nom, pas de pitch, pas de code avant le choix du concept par Adem.
- Défauts techniques retenus faute d'objection (à confirmer avant la première ligne de code) : TypeScript, Claude en API avec cache de réponses pour la démo, lots = branche + dossier + vérification bloquante, hook Stop qui bloque si le build casse. Pas de compte à rebours ni de rappel d'horaire dans le harnais (Adem, 21 oct.).
- Harnais : construit avec Adem, pièce par pièce, pas délégué à un agent (Adem, 21 oct. : « on fait le harnais ensemble »).
- Discord : un seul message, « État du build », toutes les 10 min, même sans changement ; pas de fil des actions des agents (Adem, 21 oct. : « je veux seulement l'état du build »). Le journal détaillé reste dans `journal/` pour nourrir cet état.
- Idées : la première salve de 45 idées (`kickoff/2-idees.md`, données publiques françaises, utilisateurs administratifs ou B2B) ne plaît pas à Adem (21 oct., soir). Relance complète de l'étape 2 avec une contrainte nouvelle, pas une retouche.
- Relance de l'étape 2 (Adem, 21 oct., soir) : la 1re salve est trop administrative, trop petite, et l'agent y fait trop peu. Contraintes retenues : flux mondial en direct, monde physique (caméras, capteurs, radio, satellites), donnée créée par l'usage qui enrichit la base. Référence de goût : SiteSync, 1er à Accel AI Innovate Stockholm (caméras de chantier → directeur de chantier numérique). Podiums précédents : `kickoff/terrain/5-gagnants-accel.md`.

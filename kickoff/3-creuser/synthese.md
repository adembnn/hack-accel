# Étape 3 : synthèse (21 oct. 2026, soir)

Sources : `etat-art-B-crue-canicule.md`, `etat-art-G-ilots-chaleur.md`, `innover-B-G.md`, et `../2-idees-brut/salve-4/etat-art-3D-foule.md`. `[?]` = non vérifié.

## Ce que la recherche a établi
- **La 3D est faisable demain, sans clé.** Bâtiments avec hauteur (BD TOPO), relief et hauteur des arbres au mètre (LiDAR HD, 1 km² en 1,15 s), 220 181 arbres de Paris : testés ce soir. Montée des eaux par la méthode « baignoire » : 11 ms pour un million de cases. Foule : 10 000 personnes en quasi temps réel (JuPedSim, testé). PostGIS existe sur Aiven.
- **Non joignables ce soir** : Géorisques (zones inondables, argiles), Hub'Eau, Vigicrues, DRIAS. À pré-télécharger.
- **Crue et canicule par bâtiment (B)** : l'argent existe (First Street racheté 122,6 M$ par MSCI, conclu en août 2026 ; Jupiter dès 25 k$ par contrat). Mais Climate X (GV, 18 M$), Jupiter et XDI vendent déjà le chiffrage des travaux. Trou : à Valence-Romans, moins de 6 % des 332 diagnostics d'inondation sont devenus des travaux. Personne ne rejoue une crue réelle en 3D pour prouver son modèle `[?]`.
- **Îlots de chaleur (G)** : le diagnostic devient gratuit (WRI Cool Cities Lab, Kermap) et le simulateur se vend 240 à 6 000 €/an (Infrared.city). L'argent est dans les travaux (300 k€ la cour d'école, 400 M€ pour les écoles de Paris), mais le Fonds vert baisse (834 M€ en 2026 contre 2,5 Md€ en 2024). Acheteur privé nouveau : les employeurs (décret 2025-482, aménager les lieux de travail contre le soleil dès la vigilance jaune).
- **Argiles** : 22,3 Md€ de sinistres sécheresse 1989-2023, 1,1 Md€ par an en moyenne sur 5 ans, 60 % des maisons en aléa moyen ou fort. L'arbre qui rafraîchit la rue assèche le sol et fissure la maison voisine.
- **Foule** : acheteurs surtout publics, simulateurs à 2-30 k$, pas de donnée d'intérieur. Survit en forme étroite (sortie d'un événement, évacuation d'un quartier face à la crue).

## Les concepts candidats (aucun choisi)

| # | Concept | Qui paie et pourquoi | Moment wow | Point faible | % LLM |
|---|---|---|---|---|---|
| 1 | **La crue de 2024 rejouée, puis rejouée avec les travaux** | Assureurs et mutuelles (Pas-de-Calais 2023-2024 : 430 à 550 M€ de sinistres), collectivités qui financent les diagnostics | L'eau réelle de janvier 2024 monte dans la rue en 3D, puis la même crue s'arrête au seuil des maisons équipées | Climate X, Jupiter, XDI chiffrent déjà les travaux ; notre écart est le rejeu prouvé | 20 % |
| 2 | **L'arbre qui fissure la maison** | Assureurs habitation (1,1 Md€/an de sinistres argiles), bailleurs de pavillons | Chaque arbre projette un halo de fraîcheur sur la rue et un halo de fissures sur les maisons ; l'agent déplace l'arbre de 6 m | Aucune donnée de sinistre par adresse, seuil de distance non validé, carte argiles injoignable ce soir | 5 % |
| 3 | **Le parking qui doit se couvrir** | Foncières commerciales et enseignes, obligées d'ombrager leurs grands parkings (loi APER `[?]`, à vérifier) | Le juré cite son supermarché, l'asphalte rouge vire au vert, le revenu solaire s'affiche | Obligation à confirmer ; si elle ne vise que le solaire, l'arbre devient un bonus | 12 % |
| 4 | **Le site de travail en plein soleil** | Employeurs (entrepôts, chantiers, cours logistiques), obligés depuis juillet 2025 | Le juré tape l'adresse d'un entrepôt, les heures dangereuses disparaissent | Prix payé par les entreprises inconnu | 8 % |
| 5 | **Les mobil-homes qui fuient la crue** | Groupes de campings, plans d'évacuation obligatoires en zone à risque `[?]` | La crue monte dans la vallée, les mobil-homes glissent vers les emplacements hauts | Marché supposé, emplacements non ouverts | 4 % |
| 6 | **Quel immeuble vendre avant 2032** | Fonds immobiliers et SCPI (décote de 25 à 50 points de base, reporting européen) | La valeur du portefeuille bouge en direct de +2 °C à +4 °C | Voie la plus attendue, déjà vendue (Climate X) | 25 % |
| 7 | **Le budget climat d'une ville à répartir** | Intercommunalités (750 doivent avoir un plan climat) | Le juré change le budget, la répartition entre écoles, crèches et EHPAD se recompose | Acheteur public, budget en baisse | 15 % |

Fusions possibles : 1 avec l'évacuation d'un quartier (foule) ; 2 avec 4 (deux périls, un acheteur privé) ; 3 avec 4 (parkings et cours logistiques).

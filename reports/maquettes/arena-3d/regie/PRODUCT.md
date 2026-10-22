# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Vite + TypeScript (Adem, 22 oct. 2026), three.js for the 3D scene. Lives in `reports/maquettes/arena-3d/regie/` with its own package.json until the team's `socle` lot exists, then migrates there.

## Users
Primary: the operations director and the head of the security command post (PC sécurité) of the Adidas Arena (Paris 18e, 8 000 seats, operator SAE POPB), on an event night, while 7 000+ spectators leave. They command about 80 stewards and security agents (estimated) and negotiate with RATP (metro 12, tram T3b) and the police, who are counterparts, not users.
Secondary: the Accel AI Innovate jury watching a 3-minute demo on a projector.

## Product Purpose
A live digital twin of the Arena and its streets: the real building and neighbourhood (OpenStreetMap), a crowd simulated person by person with published models, and every real lever the PC can pull, in real time: open or close gates, vomitoires, metro entrances, hold a stand, announce by zone, and give precise orders to each security team. Decision agents can propose orders (mode human, both, or AI). Success: the PC sees within seconds where people will jam and what an order changes, before giving it.

## Positioning
The crowd reacts to the PC's orders as people do (hesitation, following others, guidance by a steward, published coefficients), on the real geometry of this venue, while the clock runs. Not a report after the fact, not a static evacuation plan.

## Operating Context
- Scene: the PC sécurité at night, low ambient light, large wall screen, several people looking at once; radio orders to stewards with a delay.
- Demo scenario: end of a basketball match, the police close metro 12 Porte de la Chapelle two minutes after the final whistle; the crowd must be redirected to tram T3b and on foot.
- Related work: the team's Châtelet / Forum des Halles twin (branch maquette/chatelet-3d), same mechanism.

## Capabilities and Constraints
- Geometry: OSM (ODbL, attribution on screen); the Arena interior is mostly absent from OSM and drawn by hand, labelled "estimé".
- Crowd engine: social forces (Helbing), exit choice logit (Lovreglio guidance +2.739), log-logistic departure; numbers come from code, never from an LLM.
- No paid LLM call without Adem's agreement; decision agents planned on Jev (TypeSafe) by Titouan; until then a local rule proposer, labelled as such.
- Undecided: final product name; deployment on Aiven Runtime (team socle lot).

## Brand Commitments
None yet. French UI copy.

## Evidence on Hand
OSM extract of 22 oct. 2026 (785 buildings, 1 740 street segments, 60 stops), public facts on the Arena (8 000 / 9 000 seats, two gyms, parvis Alice Milliat, Central Chapelle 2 600 m²). No real seating plan, no real steward count, no real flow measurements: all such values are estimates and must be labelled.

## Product Principles
- Every number on screen comes from the simulation or a cited source; estimates say so.
- An order is never abstract: who, where, what, when it takes effect.
- The crowd is the interface: consequences show in people, before they show in counters.
- Disturbances are neutral constraints (zones, closures), never hostile agents.

## Accessibility & Inclusion
Readable from 3 m on a wall screen and on a projector; never rely on red/green alone for state.

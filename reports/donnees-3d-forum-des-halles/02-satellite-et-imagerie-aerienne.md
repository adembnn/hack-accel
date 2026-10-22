# 02 - Imagerie satellite et aérienne libre, focus Paris / Forum des Halles

Date de la recherche : 22/10/2026. Convention : chaque affirmation porte une URL ; sinon « à vérifier ». Les temps « première image » sont des estimations d'ingénierie (non mesurées), donc à vérifier au moment du build.

## Verdict pour le hackathon

- **Fond de carte 3D : IGN Géoplateforme, ortho 20 cm, sans clé.** C'est la seule source gratuite qui donne une résolution lisible à l'échelle d'un forum (rues, toits, bouches de métro). Sentinel-2 (10 m) ne sert qu'à un contexte large ou à des indices.
- **Toutes les données IGN de la Géoplateforme sont gratuites et sans clé depuis juillet 2021** (https://fredericpallu.com/projets/geomatique_ouverte/ign_explorer).
- **Sentinel-2 : prendre Earth Search (Element84), anonyme, COG sur AWS.** Évite le compte Copernicus et ses quotas.
- À éviter pour la démo : Mapbox / Esri (clé ou token, conditions d'usage), Maxar (événements ciblés, licence non commerciale).

## Tableau comparatif

| Source | Résolution | Revisite | Licence | Clé ? | Format / API | Première image (estim.) |
|---|---|---|---|---|---|---|
| IGN ortho (Géoplateforme) | 20 cm « HR », 50 cm BD Ortho (https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2026-02-mises-a-jour) | Campagnes par département, pas de cadence fixe (à vérifier pour Paris) | Données ouvertes IGN (licence ouverte, à vérifier pour la mention exacte) | Non (https://fredericpallu.com/projets/geomatique_ouverte/ign_explorer) | WMTS, WMS-Raster (même source), téléchargement BD ORTHO (https://data.gouv.fr/datasets/bd-ortho-r) | 5 à 10 min |
| IGN vues historiques | Photos 1965-1980 par département (https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2026-03-mises-a-jour) | Statique | idem IGN | Non | WMTS/WMS, couche `ORTHOIMAGERY.ORTHOPHOTOS.1965-1980` | 10 min (même recette) |
| Sentinel-2 | 10 à 60 m, revisite ~5 jours (https://github.com/awslabs/open-data-registry/blob/master/datasets/sentinel-2-l2a-cogs.yaml) | 5 jours | Gratuit, proprietary(free) selon Rasteret (https://mintlify.com/terrafloww/rasteret/concepts/dataset-catalog) | Non via Earth Search (https://github.com/element84/earth-search) | STAC + COG | 15 à 30 min |
| Sentinel-1 (radar) | à vérifier (~10 m, cadence ~6 jours, à vérifier) | à vérifier | gratuit Copernicus (à vérifier) | Compte CDSE | STAC/OData/Sentinel Hub (https://documentation.dataspace.copernicus.eu/Quotas.html) | > 1 h, déconseillé |
| Landsat C2 L2 | 30 m (thermique 100 m), revisite 16 j (https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2 ; https://geodataviewer.com/tools/landsat-download) | 16 jours | USGS/NASA, gratuit | Planetary Computer : anonyme possible, jeton SAS pour les données (https://planetarycomputer.microsoft.com/docs/overview/about/) ; Earth Search : auth requise pour Landsat (https://mintlify.com/terrafloww/rasteret/concepts/dataset-catalog) | STAC + COG | 20 à 40 min |
| OpenAerialMap | Variable (drones, avions) ; couverture Paris à vérifier | Aucune | Page d'accueil ne précise pas la licence (https://map.openaerialmap.org/) ; CC-BY souvent, à vérifier | à vérifier | API + tuiles (à vérifier) | à vérifier |
| NASA GIBS | à vérifier (basse/moyenne résolution, mondial) | Quotidienne pour certaines couches (à vérifier) | Données NASA ouvertes (à vérifier) | Sans clé (à vérifier) | WMTS/WMS | 10 min, mais inutile à l'échelle du Forum |
| Maxar / Vantor Open Data | Haute résolution (sub-métrique, à vérifier) | Événements ciblés | CC BY-NC 4.0 (https://github.com/awslabs/open-data-registry/blob/main/datasets/maxar-open-data.yaml) | Non (AWS public) | STAC, COG (https://registry.opendata.aws/maxar-open-data) | Paris très probablement absent (à vérifier) |
| Planetary Computer | Sentinel-2, Landsat, etc. | Idem satellites | Accès gratuit, STAC anonyme, téléchargement anonyme limité (throttled) (https://planetarycomputer.microsoft.com/docs/overview/about/) | Non pour le STAC | STAC, COG | 20 à 30 min |
| Esri World Imagery | « 1 m ou mieux » dans beaucoup de zones, Maxar 0,3 m sur certaines métropoles (https://gis.ne.gov/portal/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) | à vérifier | Tuiles via token ArcGIS (https://esri.com/arcgis-blog/products/developers/developers/open-source-developers-time-to-upgrade-to-the-new-arcgis-basemap-layer-service) ; usage OSM autorisé sans restriction (https://wiki.openstreetmap.org/wiki/Esri_World_Imagery) ; conditions générales : https://esri.com/en-us/legal/terms/web-site-service | Token requis | Tuiles image | 15 min, mais risque juridique pour la démo |
| Mapbox Satellite | Couverture mondiale jusqu'à z16 (1 à 2 m), plus fin par zones (https://docs.mapbox.com/data/tilesets/reference/mapbox-satellite) | à vérifier | Réservé à l'usage Mapbox (à vérifier) | Jeton Mapbox (à vérifier) | Tuiles raster | 10 min, jeton requis |
| Ville de Paris | Pas trouvé de jeu d'orthophotos dédié sur opendata.paris.fr (https://opendata.paris.fr/explore) | - | Licence ODbL typique du portail (à vérifier) | Non | API Opendatasoft (à vérifier) | - |

## Détails par source

### IGN (priorité 1)
- **Couches utiles** : `ORTHOIMAGERY.ORTHOPHOTOS` (assemblage « ortho »), `ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO` (50 cm), `ORTHOIMAGERY.ORTHOPHOTOS.IRC` (infrarouge couleur), toutes en WMS-Raster et WMTS (https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2026-02-mises-a-jour). La couche `HR.ORTHOIMAGERY.ORTHOPHOTOS` (haute résolution) est aussi utilisée avec le GetCapabilities WMTS de la Géoplateforme (https://giro3d.org/latest/examples/camera-controls-integration).
- **Endpoint** : `https://data.geopf.fr/wmts` (même source).
- **Intégration web** : un exemple MapLibre (viewer Panoramax) charge l'ortho IGN comme source raster WMTS (https://docs.panoramax.fr/web-viewer/tutorials/aerial_imagery).
- **Altimétrie** : la couche `ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES` est lisible via le WMTS (format BIL, noData -1000) (https://giro3d.org/latest/examples/ign-data). Le LiDAR HD (MNT, MNS, MNH) est téléchargeable en licence ouverte (https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2025-03-lidarhd-et-produits-derives). Un MNH (hauteur des bâtiments) est précieux pour extruder la scène 3D ; vérifier que la dalle Paris 1er est publiée.
- **Quotas** : non documentés dans mes sources, à vérifier. Prévoir un cache local des tuiles de la zone.
- **Date de l'ortho sur Paris** : à vérifier dans les métadonnées de la couche.

### Copernicus Data Space (Sentinel-1 et 2)
Quotas mensuels du palier gratuit (https://documentation.dataspace.copernicus.eu/Quotas.html) :
- Sentinel Hub : 10 000 requêtes et 10 000 unités de traitement par mois, 300 requêtes et 300 PU par minute.
- Accès HTTP direct aux COG : 50 000 requêtes par mois.
- S3, OData, STAC : 2 000 requêtes par minute, 4 connexions simultanées, 12 To par mois.
- openEO : 12 requêtes par minute, 2 simultanées.
Un compte gratuit est nécessaire (à vérifier pour les étapes exactes). Sentinel-1 radar : utile pour la détection de bâti ou d'eau, mais hors périmètre d'une démo de 10 h.

### Earth Search / Planetary Computer / Landsat
- **Earth Search** est une API STAC gratuite indexant le registre AWS Open Data. Les assets en bucket public ont des URL `https://` sans authentification (https://github.com/element84/earth-search). Exemple d'usage anonyme avec des scènes Sentinel-2 L2A en COG : https://serapeum-org.github.io/pyramids/main/examples/stac/stac-cloud-earth-search.
- **Planetary Computer** : STAC anonyme, téléchargements anonymes limités par throttling (https://planetarycomputer.microsoft.com/docs/overview/about/).
- **Landsat** : 30 m, trop grossier pour le Forum ; utile seulement pour la température de surface (thermique 100 m) ou l'historique (archive depuis 1982, https://eo-atlas.org/data_products/landsat-collection-2-l2-sr).

### Maxar / Vantor, OpenAerialMap, GIBS
- Maxar Open Data : imagerie avant/après événements (urgence), licence CC BY-NC 4.0 (https://registry.opendata.aws/maxar-open-data ; https://github.com/awslabs/open-data-registry/blob/main/datasets/maxar-open-data.yaml). Paris : probablement non couvert, à vérifier. La marque est désormais Vantor (https://docs.earthscale.ai/tutorials/access-vantor-maxar-open-data).
- OpenAerialMap : visualiseur à https://map.openaerialmap.org/ ; licence et API à vérifier.
- NASA GIBS : détails non confirmés (mon fetch a échoué), à vérifier.

### Esri et Mapbox
- Esri : accès tuiles avec token (https://esri.com/arcgis-blog/products/developers/developers/open-source-developers-time-to-upgrade-to-the-new-arcgis-basemap-layer-service). Certaines couches legacy sont en fin de vie (https://esri.com/arcgis-blog/products/arcgis-living-atlas/announcements/sunsetting-legacy-basemaps). Conditions générales : https://esri.com/en-us/legal/terms/web-site-service.
- Mapbox : tileset mondial z16, détails de licence à vérifier (https://docs.mapbox.com/data/tilesets/reference/mapbox-satellite).
- Recommandation : ne pas les utiliser si l'IGN suffit.

### Ville de Paris
Je n'ai pas trouvé de jeu d'orthophotographies sur le portail (https://opendata.paris.fr/explore). Les photos aériennes Paris passent probablement par l'IGN ou l'APUR (https://apur.org/en/geo-data/environmental-maps pour les cartes environnementales). Les 60 000 photos de musées sous CC0 (https://frameandfocal.com/photography-tips/paris-museums-put-60000-historic-photos-online-copyright-free) sont des images historiques, pas de l'imagerie géospatiale, et la source est secondaire (à vérifier).

## Recette 1 : ortho IGN en fond de carte MapLibre (≈ 5 min)

```html
<link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet">
<script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
<div id="map" style="height:100vh"></div>
<script>
const map = new maplibregl.Map({
  container: 'map',
  center: [2.3466, 48.8625],   // Forum des Halles (coordonnées approx., à vérifier)
  zoom: 17, pitch: 60, bearing: 20,
  style: { version: 8, sources: { ortho: {
      type: 'raster', tileSize: 256, maxzoom: 19,
      attribution: '© IGN',
      tiles: ['https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile'
        + '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg'
        + '&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}']
    } },
    layers: [{ id: 'ortho', type: 'raster', source: 'ortho' }] }
});
</script>
```
Le schéma d'URL suit le modèle WMTS standard et celui du viewer Panoramax (https://docs.panoramax.fr/web-viewer/tutorials/aerial_imagery) ; les paramètres exacts (STYLE, TILEMATRIXSET, maxzoom) sont à vérifier via le GetCapabilities (https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities). Pour la 3D, ajouter ensuite le MNH/MNT IGN en terrain, ou extruder les bâtiments OSM par-dessus. Avec deck.gl, utiliser `TileLayer` avec la même template d'URL (à vérifier).

## Recette 2 : image Sentinel-2 d'une zone via Earth Search (≈ 15 min)

```bash
curl -s -X POST https://earth-search.aws.element84.com/v1/search \
 -H 'Content-Type: application/json' \
 -d '{"collections":["sentinel-2-l2a"],
      "bbox":[2.335,48.855,2.360,48.870],
      "datetime":"2026-06-01T00:00:00Z/2026-10-15T23:59:59Z",
      "query":{"eo:cloud_cover":{"lt":10}},
      "sortby":[{"field":"properties.datetime","direction":"desc"}],
      "limit":1}'
```
Puis lire l'asset couleur vraie (nom `visual`, à vérifier) dans le JSON : c'est une URL `https://` vers un COG, lisible sans identifiants (https://github.com/element84/earth-search). Découper la bbox avec `rasterio`/GDAL (`/vsicurl/`) ou `geotiff.js` côté navigateur (à vérifier). Endpoint et collection cités dans https://serapeum-org.github.io/pyramids/main/examples/stac/stac-cloud-earth-search. À 10 m, le Forum ne couvre qu'environ 20 à 30 pixels de large : à utiliser pour NDVI ou contexte.

## Ce qu'un agent peut en tirer
- **Ortho IGN** : surfaces praticables vs obstacles (revêtement, végétation, emprises des toits), emplacement des accès visibles, calibration visuelle de la scène 3D. Pas de comptage de personnes (résolution et date d'acquisition fixes).
- **MNH LiDAR** : hauteurs de bâtiments pour la géométrie 3D.
- **Sentinel-2 / Landsat** : indice de végétation, chaleur de surface, contexte seulement. Résolution trop faible pour la simulation locale.
- **Vues historiques** : comparaison avant/après (le Forum a été reconstruit ; à vérifier si les clichés 1965-1980 couvrent Paris).

## Risques
- Les quotas IGN ne sont pas documentés dans mes sources. Pré-télécharger les tuiles de la zone.
- Le WMTS IGN affiche l'état de la dernière campagne, pas l'état en temps réel du Forum.
- Esri et Mapbox : jetons et conditions d'usage, à lire avant publication.

## Résumé en 5 lignes
1. Pour le fond 3D, utiliser l'ortho IGN (20 cm) via `data.geopf.fr` en WMTS, sans clé, avec une source raster MapLibre (~5 min).
2. Pour Sentinel-2, utiliser Earth Search (STAC + COG anonymes) plutôt que Copernicus, dont le palier gratuit est de 10 000 requêtes Sentinel Hub et 50 000 requêtes COG par mois.
3. Le LiDAR HD IGN (MNH/MNT, licence ouverte) est le meilleur complément pour la hauteur des bâtiments ; vérifier la couverture de Paris 1er.
4. Landsat (30 m), Maxar (événements, CC BY-NC), GIBS et OpenAerialMap ne servent pas pour le Forum ; Esri et Mapbox imposent jetons et conditions.
5. À vérifier : quotas IGN, date de l'ortho de Paris, paramètres WMTS exacts, couverture OAM et licence Ville de Paris (aucune ortho trouvée sur opendata.paris.fr).

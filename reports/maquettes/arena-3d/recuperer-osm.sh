#!/bin/sh
# Télécharge les extraits OpenStreetMap utilisés par la vue 3D (données générées : jamais commitées), puis construit scene.json.
# Copie de la vue Châtelet (branche maquette/chatelet-3d), recentrée sur l'Adidas Arena (Porte de la Chapelle, 56 bd Ney, 75018).
# Zone large (bâtiments, rues, abords) : environ 1,5 km × 1,5 km autour de l'Arena. Zone Arena : intérieur, escaliers, portes, tribunes.
set -e
cd "$(dirname "$0")" && mkdir -p data
BB="48.8930,2.3505,48.9065,2.3710"; FB="48.8980,2.3580,48.9015,2.3640"
q(){ curl -s -m 180 -A "hack-accel-maquette/1.0" --data-urlencode "data=$1" https://overpass-api.de/api/interpreter -o "data/$2"; echo "$2 : $(wc -c < data/$2) octets"; }
q "[out:json][timeout:170];(way[\"building\"]($BB);relation[\"building\"]($BB););out geom;" batiments.json
q "[out:json][timeout:170];(way[\"indoor\"]($FB);relation[\"indoor\"]($FB);way[\"conveying\"]($FB);way[\"highway\"=\"steps\"]($FB);node[\"highway\"=\"elevator\"]($FB);node[\"elevator\"=\"yes\"]($FB);way[\"highway\"=\"elevator\"]($FB);node[\"door\"]($FB);node[\"entrance\"]($FB);way[\"railway\"=\"platform\"]($FB);way[\"public_transport\"=\"platform\"]($FB);way[\"leisure\"~\"stadium|pitch|sports_centre\"]($FB);way[\"area:highway\"]($FB););out geom;" lieu.json
q "[out:json][timeout:170];(node[\"railway\"~\"subway_entrance|tram_stop\"]($BB);node[\"highway\"=\"bus_stop\"]($BB);node[\"emergency\"=\"fire_hydrant\"]($BB);node[\"natural\"=\"tree\"]($BB);node[\"amenity\"=\"bench\"]($BB);node[\"barrier\"=\"bollard\"]($BB);node[\"amenity\"=\"bicycle_rental\"]($BB);way[\"highway\"]($BB);way[\"leisure\"~\"park|garden\"]($BB);way[\"landuse\"=\"grass\"]($BB);way[\"water\"]($BB);way[\"natural\"=\"water\"]($BB););out geom;" abords.json
python3 -I build_scene.py

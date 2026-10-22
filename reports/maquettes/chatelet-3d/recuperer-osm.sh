#!/bin/sh
# Télécharge les extraits OpenStreetMap utilisés par la vue 3D (données générées : jamais commitées), puis construit scene.json.
# Zone large (bâtiments, rues, abords) : environ 1,5 km × 1,3 km autour du Forum. Zone Forum : intérieur, escalators, ascenseurs, portes.
set -e
cd "$(dirname "$0")" && mkdir -p data
BB="48.8545,2.3385,48.8680,2.3560"; FB="48.8590,2.3430,48.8640,2.3520"
q(){ curl -s -m 180 -A "hack-accel-maquette/1.0" --data-urlencode "data=$1" https://overpass-api.de/api/interpreter -o "data/$2"; echo "$2 : $(wc -c < data/$2) octets"; }
q "[out:json][timeout:170];(way[\"building\"]($BB);relation[\"building\"]($BB););out geom;" batiments.json
q "[out:json][timeout:170];(way[\"indoor\"]($FB);relation[\"indoor\"]($FB);way[\"conveying\"]($FB);way[\"highway\"=\"steps\"]($FB);node[\"highway\"=\"elevator\"]($FB);node[\"elevator\"=\"yes\"]($FB);way[\"highway\"=\"elevator\"]($FB);node[\"door\"]($FB);node[\"entrance\"]($FB);way[\"railway\"=\"platform\"]($FB);way[\"public_transport\"=\"platform\"]($FB););out geom;" forum.json
q "[out:json][timeout:170];(node[\"railway\"=\"subway_entrance\"]($BB);node[\"emergency\"=\"fire_hydrant\"]($BB);node[\"natural\"=\"tree\"]($BB);node[\"amenity\"=\"bench\"]($BB);node[\"barrier\"=\"bollard\"]($BB);node[\"amenity\"=\"bicycle_rental\"]($BB);way[\"highway\"]($BB);way[\"leisure\"~\"park|garden\"]($BB);way[\"landuse\"=\"grass\"]($BB);way[\"water\"]($BB);way[\"natural\"=\"water\"]($BB););out geom;" abords.json
python3 -I build_scene.py

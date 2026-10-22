#!/bin/sh
# Télécharge les textures CC0 de Poly Haven (1k, jpg, couleur seulement) utilisées par le style D Paris. Non commitées.
set -e
cd "$(dirname "$0")" && mkdir -p tex
for id in beige_wall_001 grey_roof_01 asphalt_02 granite_tile leafy_grass marble_tiles floor_tiles_06 large_floor_tiles_02 plastered_wall_02; do
  url=$(curl -s -m 30 -A "hack-accel-maquette/1.0" "https://api.polyhaven.com/files/$id" | python3 -I -c "import json,sys;d=json.load(sys.stdin);print(d['Diffuse']['1k']['jpg']['url'])")
  curl -s -m 60 -A "hack-accel-maquette/1.0" "$url" -o "tex/$id.jpg"
  echo "$id : $(wc -c < tex/$id.jpg) octets"
done

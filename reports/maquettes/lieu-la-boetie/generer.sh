#!/bin/sh
# Regénère scene.json depuis les données déjà téléchargées (aucun téléchargement).
# DATA_DIR doit contenir scene-metafore.json et osm_mobilier.json (dossier refuge-data/data/metafore).
set -e
cd "$(dirname "$0")"
python3 -I build_scene.py "${DATA_DIR:-data}"

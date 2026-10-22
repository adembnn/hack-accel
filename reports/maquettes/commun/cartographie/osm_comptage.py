#!/usr/bin/env python3
"""Extrait Overpass frais (indoor, level, steps, elevator, conveying, entrance) dans la bbox du Forum
et compte les objets par niveau. Ecrit data/osm-forum.json. Usage : python osm_comptage.py"""
import collections, json, os, sys
import requests

ICI = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(ICI, "data"); os.makedirs(DATA, exist_ok=True)
BB = "48.8600,2.3440,48.8640,2.3500"
Q = f"""[out:json][timeout:120];
(nwr["indoor"]({BB});nwr["level"]({BB});nwr["highway"="steps"]({BB});nwr["highway"="elevator"]({BB});nwr["conveying"]({BB});nwr["entrance"]({BB}););
out tags center;"""
SERVEURS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
j = None
for u in SERVEURS:
    try:
        r = requests.post(u, data={"data": Q}, headers={"User-Agent": "hack-accel-cartographie/1.0 (contact: equipe hackathon)", "Accept": "application/json"}, timeout=150)
        print(u, r.status_code, len(r.content))
        if r.status_code == 200:
            j = r.json(); break
    except Exception as e:
        print(u, "echec", type(e).__name__)
if not j:
    sys.exit("aucun serveur Overpass n'a repondu")
json.dump(j, open(os.path.join(DATA, "osm-forum.json"), "w", encoding="utf-8"), ensure_ascii=False)
el = j["elements"]; print(len(el), "elements")
cnt = collections.Counter()
for e in el:
    t = e.get("tags", {})
    lv = t.get("level", t.get("repeat_on", "?"))
    kind = ("escalator" if t.get("conveying") else "lift" if t.get("highway") == "elevator" else "steps" if t.get("highway") == "steps"
            else "door/entrance" if t.get("entrance") or t.get("door") else "indoor:" + t["indoor"] if t.get("indoor") else "autre-level")
    cnt[(kind, lv)] += 1
tot = collections.Counter()
for (k, lv), n in cnt.items():
    tot[k] += n
print(dict(tot))
for lv in ["0", "-1", "-2", "-3", "-4", "-5"]:
    print("niveau", lv, {k: n for (k, l), n in cnt.items() if l == lv})

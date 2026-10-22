#!/usr/bin/env python3
"""Telecharge les acces IDFM (open data, ODbL) autour de Chatelet - Les Halles,
leur associe les lignes via la zone d'arret, ecrit acces-idfm.json (repere de scene)
et compare aux bouches de metro de scene.json.
Usage : python acces_idfm.py [chemin/scene.json]
"""
import json, math, sys, os
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

B = "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets"
LAT0, LON0 = 48.8620, 2.3470
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110540
CENTRE, RAYON = (2.3466, 48.8602), 450  # lon, lat ; metres
# zone d'arret IDFM -> lignes (zones verifiees par leur nom, affiche a l'execution)
LIGNES_ZONE = {
    "42587": ["M1", "M4", "M7", "M11", "M14"],   # Chatelet (metro)
    "45102": ["RER A", "RER B", "RER D"],        # Chatelet - Les Halles (RER)
    "417675": ["M4"],                            # Les Halles (metro 4)
}
ICI = os.path.dirname(os.path.abspath(__file__))
SCENE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, "..", "..", "chatelet-3d", "scene.json")


def get(ds, **params):
    out, off = [], 0
    while True:
        p = dict(params, limit=100, offset=off)
        r = requests.get(f"{B}/{ds}/records", params=p, timeout=60)
        r.raise_for_status()
        j = r.json()
        out += j["results"]
        off += 100
        if off >= j["total_count"]:
            return out


def xz(lat, lon):
    return round((lon - LON0) * KX, 2), round(-(lat - LAT0) * KZ, 2)


def main():
    acces = get("acces", where=f"within_distance(accgeopoint,geom'POINT({CENTRE[0]} {CENTRE[1]})',{RAYON}m)")
    print(f"{len(acces)} acces IDFM dans {RAYON} m")
    zones = {}  # accid -> {zdaid}
    for a in acces:
        for r in get("relations-acces", where=f"accid='{a['accid']}'"):
            zones.setdefault(r["accid"], set()).add(r["zdaid"])
    noms = {}
    for z in sorted({z for s in zones.values() for z in s}):
        rr = get("zones-d-arrets", where=f"zdaid='{z}'")
        noms[z] = rr[0]["zdaname"] if rr else "?"
    print("zones reliees :", noms)
    res = []
    for a in sorted(acces, key=lambda a: (a["accshortname"] or 0)):
        g = a["accgeopoint"]
        x, z = xz(g["lat"], g["lon"])
        zs = sorted(zones.get(a["accid"], []))
        lignes = []
        for q in zs:
            for l in LIGNES_ZONE.get(q, []):
                if l not in lignes:
                    lignes.append(l)
        res.append({"id": a["accid"], "numero": a["accshortname"], "nom": a["accname"], "x": x, "z": z,
                    "lignes": lignes, "zone_arret": zs, "zones_noms": [noms[q] for q in zs]})
    if os.path.exists(SCENE):
        sc = json.load(open(SCENE, encoding="utf-8"))
        cands = [(m["x"], m["z"], m.get("n", "")) for m in sc["metro"]]
        print(f"{len(cands)} bouches dans la scene")
        for r in res:
            d, c = min((math.hypot(r["x"] - cx, r["z"] - cz), (cx, cz, n)) for cx, cz, n in cands)
            r["scene_proche"] = c[2]
            r["ecart_m"] = round(d, 1)
    with open(os.path.join(ICI, "acces-idfm.json"), "w", encoding="utf-8") as fh:
        json.dump(res, fh, ensure_ascii=False, indent=1)
    print("n | nom | lignes | zones | x z | bouche scene la plus proche | ecart m")
    for r in res:
        print(f"{r['numero']} | {r['nom']} | {','.join(r['lignes'])} | {'/'.join(r['zone_arret'])} | "
              f"{r['x']:.0f} {r['z']:.0f} | {r.get('scene_proche')} | {r.get('ecart_m')}")
    e = sorted(r["ecart_m"] for r in res if "ecart_m" in r)
    if e:
        print(f"ecart median {e[len(e)//2]:.1f} m, max {e[-1]:.1f} m, >10 m : {sum(v > 10 for v in e)}/{len(e)}")


if __name__ == "__main__":
    main()

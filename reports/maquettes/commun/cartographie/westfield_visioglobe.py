#!/usr/bin/env python3
"""Plan interactif Westfield Forum des Halles (Visioglobe) : telecharge le modele de carte
que la page https://www.westfield.com/fr/france/forumdeshalles/plan charge elle-meme,
le recale sur le repere de scene (origine 48.8620 N, 2.3470 E ; x est, z sud) par maximisation du
recouvrement avec les espaces interieurs OSM, exporte niveau par niveau (boutiques nommees,
liaisons verticales) et compare a scene.json.

DONNEE PRIVEE (Unibail-Rodamco-Westfield / Visioglobe) : usage de controle interne uniquement,
ne pas commiter ni republier (voir reports/cartographie-precise-chatelet.md).
Usage : python westfield_visioglobe.py [chemin/scene.json]     (numpy + matplotlib requis)
"""
import json, math, os, sys, collections
import numpy as np
import requests
from matplotlib.path import Path

ICI = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ICI, "data"); os.makedirs(DATA, exist_ok=True)
SCENE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, "..", "..", "chatelet-3d", "scene.json")
URL = "https://mapserver.visioglobe.com/k6bcee9ad2ce3f11fe01370ff0ac0913aa14e6b9f/map.json"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36", "Referer": "https://www.westfield.com/"}
LVL = {1: -4, 2: -3, 3: -2, 4: -1, 5: 0}          # index d'etage Visioglobe -> niveau OSM
FLOORNAME = {"B1-LL4": -4, "B1-LL3": -3, "B1-LL2": -2, "B1-LL1": -1, "B1-UL0": 0}
ANGLE = 20.22                                      # |rotation_angle_in_degrees| du jeu, signe trouve par ajustement
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def charger():
    f = os.path.join(DATA, "westfield-map.json")
    if not os.path.exists(f):
        r = requests.get(URL, headers=UA, timeout=120); r.raise_for_status()
        open(f, "wb").write(r.content)
    return json.load(open(f, encoding="utf-8"))


def pip_masks(sc, X0, Z0, W, H):
    gx, gz = np.meshgrid(np.arange(X0, X0 + W) + .5, np.arange(Z0, Z0 + H) + .5)
    P = np.c_[gx.ravel(), gz.ravel()]
    masks = {}
    for L in (-4, -3, -2, -1, 0):
        mk = np.zeros(W * H, bool)
        for i in sc["interieur"]:
            if float(L) in i["l"]:
                q = np.array(i["p"]).reshape(-1, 2)
                sel = np.where((P[:, 0] >= q[:, 0].min()) & (P[:, 0] <= q[:, 0].max()) & (P[:, 1] >= q[:, 1].min()) & (P[:, 1] <= q[:, 1].max()))[0]
                if len(sel):
                    mk[sel] |= Path(q).contains_points(P[sel])
        a = mk.reshape(H, W); o = a.copy()
        for dx in range(-3, 4):
            for dz in range(-3, 4):
                o |= np.roll(np.roll(a, dz, 0), dx, 1)
        masks[L] = o                                # tolerance 3 m
    return masks


def main():
    m = charger(); sc = json.load(open(SCENE, encoding="utf-8"))
    g = m["geoinformation"]; r = m["routing"]; s = g["meters_per_pixel"]
    X0, Z0, W, H = -450, -350, 1000, 1000
    masks = pip_masks(sc, X0, Z0, W, H)
    t = math.radians(ANGLE); c, sn = math.cos(t), math.sin(t)

    def rot(x, y):
        dx = (x - g["pixel_xref"]) * s; dy = (y - g["pixel_yref"]) * s
        return dx * c - dy * sn, dx * sn + dy * c

    nodes = [(n["x"], n["y"], LVL[n["f"]]) for n in r["nodes"] if n["f"] in LVL]
    ux = np.array([rot(a, b)[0] for a, b, _ in nodes]); uz = np.array([rot(a, b)[1] for a, b, _ in nodes])
    nl = np.array([L for *_, L in nodes])

    def score(tx, tz):
        h = 0
        for L in masks:
            i = np.where(nl == L)[0]
            xi = np.floor(ux[i] + tx - X0).astype(int); zi = np.floor(uz[i] + tz - Z0).astype(int)
            ok = (xi >= 0) & (xi < W) & (zi >= 0) & (zi < H)
            h += masks[L][zi[ok], xi[ok]].sum()
        return h / len(nodes)

    best = max((score(tx, tz), tx, tz) for tx in range(-330, -276) for tz in range(-80, -26))
    sc0, TX, TZ = best
    print(f"recalage : rotation {ANGLE} deg, translation ({TX}, {TZ}) m ; {sc0:.1%} des {len(nodes)} noeuds de cheminement "
          f"tombent a moins de 3 m d'un espace OSM du bon niveau")

    def to_scene(x, y):
        a, b = rot(x, y); return a + TX, b + TZ

    lev = {L: {"boutiques": [], "verticaux": []} for L in LVL.values()}
    # boutiques nommees
    names = {}
    for loc in m["extra_data"]["resources"]["default"]["localized"]["locale"].values():
        names.update({k: v.get("name", "") for k, v in loc["places"].items()})
        break
    floor = {p["poiID"]: p["floorName"] for p in m["pois"]["pois"]}
    pf = {p["poiID"]: p["floor"] for p in m["pois"]["places"]}
    for pg in m["pois"]["polygons"]:
        fl = pf.get(pg["poiID"]) or floor.get(pg["poiID"])
        if fl not in FLOORNAME:
            continue
        pts = [tuple(map(float, p.split())) for p in pg["points"].split(",")]
        poly = [round(v, 2) for xy in pts for v in to_scene(*xy)]
        lev[FLOORNAME[fl]]["boutiques"].append({"id": pg["poiID"], "nom": names.get(pg["poiID"]) or floor and next((p["name"] for p in m["pois"]["pois"] if p["poiID"] == pg["poiID"]), ""), "p": poly})
    # liaisons verticales : aretes dont l'attribut est escalator / lift / stair*
    attrs = r["attributes"]; ea = collections.defaultdict(set)
    for x in r["routingEdgeAttributes"]:
        ea[x["e"]].add(attrs[x["a"]])
    seen = set()
    for ei, e in enumerate(r["edges"]):
        k = ea.get(ei, set())
        typ = "escalator" if any(a.startswith("escalator") for a in k) else "lift" if any(a.startswith("lift") for a in k) else "stairs" if any(a.startswith("stair") for a in k) else None
        a, b = r["nodes"][e["s"]], r["nodes"][e["e"]]
        if not typ or a["f"] == b["f"] or a["f"] not in LVL or b["f"] not in LVL:
            continue
        key = (typ, min(e["s"], e["e"]), max(e["s"], e["e"]))
        if key in seen:
            continue
        seen.add(key)
        xa, za = to_scene(a["x"], a["y"]); xb, zb = to_scene(b["x"], b["y"])
        lo, hi = sorted((LVL[a["f"]], LVL[b["f"]]))
        lev[lo]["verticaux"].append({"type": typ, "niveaux": [lo, hi], "x": round((xa + xb) / 2, 2), "z": round((za + zb) / 2, 2)})
    json.dump({"recalage": {"rotation_deg": ANGLE, "tx": TX, "tz": TZ, "noeuds_dans_osm": round(sc0, 3)}, "niveaux": {str(k): v for k, v in lev.items()}},
              open(os.path.join(DATA, "westfield-niveaux.json"), "w", encoding="utf-8"), ensure_ascii=False)

    # ---- comparaison avec la scene
    print("\nniveau | boutiques Westfield (dont nommees) | espaces OSM (dont nommes) | boutiques dont le centre est dans un espace OSM du niveau")
    for L in sorted(lev):
        sh = lev[L]["boutiques"]
        osm = [i for i in sc["interieur"] if float(L) in i["l"]]
        inside = 0
        for b in sh:
            q = np.array(b["p"]).reshape(-1, 2); cx, cz = q.mean(0)
            if any(Path(np.array(i["p"]).reshape(-1, 2)).contains_point((cx, cz)) for i in osm):
                inside += 1
        print(f"{L:>3} | {len(sh)} ({sum(1 for b in sh if b['nom'])}) | {len(osm)} ({sum(1 for i in osm if i['n'])}) | {inside}/{len(sh)}")
    print("\nliaisons verticales Westfield vs OSM (meme type, memes niveaux) : n | apparies < 10 m | ecart median m")
    osm_v = {"escalator": [(i["l"], np.array(i["p"]).reshape(-1, 2).mean(0)) for i in sc["escalators"]],
             "lift": [(i["l"], np.array([i["x"], i["z"]])) for i in sc["ascenseurs"]],
             "stairs": [(i["l"], np.array(i["p"]).reshape(-1, 2).mean(0)) for i in sc["escaliers"]]}
    for typ in ("escalator", "lift", "stairs"):
        ws = [(v, L) for L in lev for v in lev[L]["verticaux"] if v["type"] == typ]
        d = []
        for v, _ in ws:
            c_ = [np.hypot(*(p - np.array([v["x"], v["z"]]))) for l, p in osm_v[typ] if all(float(n) in l for n in v["niveaux"])]
            d.append(min(c_) if c_ else float("nan"))
        dd = sorted(x for x in d if x == x)
        print(f"{typ:9} | Westfield {len(ws)} (OSM total {len(osm_v[typ])}) | {sum(x < 10 for x in dd)}/{len(ws)} | "
              f"{dd[len(dd)//2] if dd else float('nan'):.1f}")
    print("\nunique a Westfield (pas dans OSM) : boutiques nommees hors espace OSM nomme, ex. au niveau -1 et -2 :")
    for L in (-1, -2):
        print(L, [b["nom"] for b in lev[L]["boutiques"] if b["nom"]][:12])


if __name__ == "__main__":
    main()

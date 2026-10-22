"""Photo aérienne IGN (BD ORTHO, Géoplateforme, Licence Ouverte 2.0, sans clé) plaquée sous la maquette.
Télécharge les tuiles WMTS au niveau 18 (≈ 0,4 m par pixel à Paris) autour de l'Arena, les assemble et recadre
sur un carré centré sur l'origine de la scène. Sortie : data/ortho.jpg + data/ortho.json (bornes en mètres).
Données générées : jamais commitées. Attribution à afficher : « © IGN, BD ORTHO ».
"""
import io, json, math, os, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
LAT0, LON0 = 48.8997, 2.3607
HALF = 750            # demi-côté du carré couvert (m)
Z = 18
URL = ('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS'
       '&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg')
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110540


def lonlat_to_px(lon, lat, z):
    n = 256 * 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def main():
    lon0, lon1 = LON0 - HALF / KX, LON0 + HALF / KX
    lat0, lat1 = LAT0 + HALF / KZ, LAT0 - HALF / KZ           # nord, sud
    x0, y0 = lonlat_to_px(lon0, lat0, Z); x1, y1 = lonlat_to_px(lon1, lat1, Z)
    tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
    tiles = [(tx, ty) for ty in range(ty0, ty1 + 1) for tx in range(tx0, tx1 + 1)]

    def get(t):
        req = urllib.request.Request(URL.format(z=Z, x=t[0], y=t[1]), headers={'User-Agent': 'hack-accel-maquette/1.0'})
        for _ in range(3):
            try: return t, Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert('RGB')
            except Exception: pass
        return t, Image.new('RGB', (256, 256), (200, 200, 195))

    big = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    with ThreadPoolExecutor(8) as ex:
        for (tx, ty), im in ex.map(get, tiles):
            big.paste(im, ((tx - tx0) * 256, (ty - ty0) * 256))
    crop = big.crop((int(x0 - tx0 * 256), int(y0 - ty0 * 256), int(x1 - tx0 * 256), int(y1 - ty0 * 256)))
    crop = crop.resize((4096, 4096), Image.LANCZOS)
    os.makedirs(os.path.join(HERE, 'data'), exist_ok=True)
    crop.save(os.path.join(HERE, 'data', 'ortho.jpg'), quality=86)
    json.dump({'x0': -HALF, 'x1': HALF, 'z0': -HALF, 'z1': HALF, 'source': '© IGN, BD ORTHO (Licence Ouverte 2.0)', 'tuiles': len(tiles)},
              open(os.path.join(HERE, 'data', 'ortho.json'), 'w'))
    print('tuiles', len(tiles), 'image 4096 px pour', 2 * HALF, 'm')


if __name__ == '__main__':
    main()

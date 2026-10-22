# Plan du MP4 de 3 minutes

Source : captures de `node tools/capture.mjs --demo` (dossier `captures/`, une image par étape ; noms issus de `demo/parcours.json` : accueil, donnee-qui-arrive, agent-agit, le-jury-agit, resultat-source, route-utilisateurs). Lire les noms exacts de fichiers dans `captures/rapport.json` avant d'assembler.
Voix : lue par Titouan, ou ElevenLabs (crédits fournis ; appel payant, accord d'Adem requis).

| Plan | Durée | Image | Voix (demo/SCRIPT.md) |
|---|---|---|---|
| 1 | 20 s | capture accueil | texte 1 |
| 2 | 30 s | capture donnee-qui-arrive | texte 2 |
| 3 | 40 s | capture agent-agit (idéal : enregistrement d'écran de la simulation) | texte 3 |
| 4 | 30 s | capture le-jury-agit | texte 4 |
| 5 | 30 s | capture resultat-source | texte 5 |
| 6 | 20 s | `pitch/slide.html` en capture 1280x800 (`slide.png`) | texte 6 |

Total 170 s, 10 s de marge.

## Commande ffmpeg (images fixes + voix)
Prérequis : `ffmpeg`, `voix.mp3` (voix continue), noms réels dans `captures/` (adapter les six premiers `-i`).

```
ffmpeg -loop 1 -t 20 -i captures/1-accueil.png -loop 1 -t 30 -i captures/2-donnee-qui-arrive.png \
 -loop 1 -t 40 -i captures/3-agent-agit.png -loop 1 -t 30 -i captures/4-le-jury-agit.png \
 -loop 1 -t 30 -i captures/5-resultat-source.png -loop 1 -t 20 -i captures/slide.png -i voix.mp3 \
 -filter_complex "[0:v][1:v][2:v][3:v][4:v][5:v]concat=n=6:v=1:a=0,scale=1280:720,format=yuv420p[v]" \
 -map "[v]" -map 6:a -c:v libx264 -r 30 -c:a aac -shortest demo/demo.mp4
```

Secours : copier `demo/demo.mp4` vers `demo/secours.mp4`. Si un enregistrement d'écran `ecran.mp4` existe, le substituer aux plans 3 et 4 (`-i ecran.mp4 -ss .. -t ..`).
Livrable : le MP4 est téléversé par Alexandre (agenda de `plan-9h.md` : 14:15).

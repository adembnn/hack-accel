# Plan du MP4 de 3 minutes

Source : captures de `node tools/capture.mjs --demo` (dossier `captures/`, une image par étape ; noms issus de `demo/parcours.json` : accueil, donnee-qui-arrive, agent-agit, le-jury-agit, resultat-source, route-utilisateurs). Lire les noms exacts de fichiers dans `captures/rapport.json` avant d'assembler.
Voix : lue par Titouan, ou synthèse vocale du navigateur (aucun appel payant ; ElevenLabs non nécessaire, décision d'Adem du 22 oct.). Texte : `pitch/voix-off.md` (925 caractères, plus de A_REMPLIR). Option payante seulement avec l'accord d'Adem : `pitch/generer-voix.mjs --oui-payant`.

| Plan | Durée | Image | Voix (demo/SCRIPT.md) |
|---|---|---|---|
| 1 | 20 s | capture accueil | texte 1 |
| 2 | 30 s | capture donnee-qui-arrive | texte 2 |
| 3 | 40 s | capture agent-agit (idéal : enregistrement d'écran de la simulation) | texte 3 |
| 4 | 30 s | capture le-jury-agit | texte 4 |
| 5 | 30 s | capture resultat-source | texte 5 |
| 6 | 20 s | `pitch/slide.html` en capture 1280x800 (`slide.png`) | texte 6 |

Total 170 s, 10 s de marge.

## Commande ffmpeg (captures + une voix par plan)
Prérequis : `ffmpeg`, `pitch/audio/plan-1.mp3` à `plan-6.mp3` (produits par `generer-voix.mjs`), noms réels dans `captures/` (adapter les six premiers `-i` d'après `captures/rapport.json`). Chaque plan dure exactement sa durée : l'image est bouclée sur `-t`, la voix est complétée de silence (`apad`) puis coupée (`atrim`).

```
ffmpeg -loop 1 -t 20 -i captures/1-accueil.png -i pitch/audio/plan-1.mp3 \
 -loop 1 -t 30 -i captures/2-donnee-qui-arrive.png -i pitch/audio/plan-2.mp3 \
 -loop 1 -t 40 -i captures/3-agent-agit.png -i pitch/audio/plan-3.mp3 \
 -loop 1 -t 30 -i captures/4-le-jury-agit.png -i pitch/audio/plan-4.mp3 \
 -loop 1 -t 30 -i captures/5-resultat-source.png -i pitch/audio/plan-5.mp3 \
 -loop 1 -t 20 -i captures/slide.png -i pitch/audio/plan-6.mp3 \
 -filter_complex "[0:v]scale=1280:720,setsar=1,format=yuv420p[v0];[2:v]scale=1280:720,setsar=1,format=yuv420p[v1];[4:v]scale=1280:720,setsar=1,format=yuv420p[v2];[6:v]scale=1280:720,setsar=1,format=yuv420p[v3];[8:v]scale=1280:720,setsar=1,format=yuv420p[v4];[10:v]scale=1280:720,setsar=1,format=yuv420p[v5];[1:a]apad=whole_dur=20,atrim=0:20[a0];[3:a]apad=whole_dur=30,atrim=0:30[a1];[5:a]apad=whole_dur=40,atrim=0:40[a2];[7:a]apad=whole_dur=30,atrim=0:30[a3];[9:a]apad=whole_dur=30,atrim=0:30[a4];[11:a]apad=whole_dur=20,atrim=0:20[a5];[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4][v5][a5]concat=n=6:v=1:a=1[v][a]" \
 -map "[v]" -map "[a]" -c:v libx264 -r 30 -pix_fmt yuv420p -c:a aac demo/demo.mp4
```

Vérifier la durée finale (170 s) avec `ffprobe -show_entries format=duration demo/demo.mp4`. Si une voix dépasse son plan, `atrim` la coupe : relire le texte concerné avant de regénérer.

Secours : copier `demo/demo.mp4` vers `demo/secours.mp4`. Si un enregistrement d'écran `ecran.mp4` existe, le substituer aux plans 3 et 4 (`-i ecran.mp4 -ss .. -t ..`).
Livrable : le MP4 est téléversé par Alexandre (agenda de `plan-9h.md` : 14:15).

# Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Falken21/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Falken21/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a multi-panel Vice City poster — offline, in three clicks.

Vice Cover Studio is a static web app (vanilla JS + Canvas 2D, no build step,
no network at run time) that builds GTA-style cover art: pick a panel layout,
drop in your own photos, crop each panel with pan and zoom, write a big
poster caption, pick a Vice City colour grade, and export a PNG in
1080 × 1080, 1080 × 1350 or 1920 × 1080.

## How it works

1. **Panel layout** — three poster layouts (Vice Classic, Neon Grid,
   Sunset Strip) with 4–7 panels of varied sizes.
2. **Photos** — upload from your machine (file picker or drag-and-drop),
   click a panel then a photo to fill it, pan by dragging on the cover,
   zoom with the slider or mouse wheel; one photo can fill every panel.
3. **Caption** — big editable poster lettering in Anton (SIL Open Font
   License, vendored under `app/fonts/`) with a tagline underneath.
4. **Vice City grade** — sunset, neon, golden-hour and noir grades with
   saturation/contrast controls, a halftone print texture and white/black
   panel keylines.
5. **Export** — one click downloads the exact-size PNG.

Four AI-made sample photos ship under `app/samples/` so the cover is
complete the moment the app opens. No Rockstar logo, artwork or font is
used anywhere.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored `vendor/makefun-app.ts` library.

## License

MIT — see `LICENSE`. The Anton font is under the SIL Open Font License
(`app/fonts/OFL.txt`).

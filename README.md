# Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Falken21/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Falken21/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Vice Cover Studio** turns your photo into a neon-drenched, multi-panel poster cover in the style of a modern open-world game poster — built as a fully static, offline web app. No build step, no network at runtime, no uploads: your photos never leave your machine.

## What it does

1. **Bring a photo** — upload your own, or tap one of the four bundled AI-generated sample photos (neon street, beach sunset, neon portrait, coastal drive).
2. **Pick a layout** — Hero Split (one big panel + two small), Triptych (three columns), or Sunset Stack (wide top + two below).
3. **Crop each panel** — click a panel to select it, then drag it on the cover or use the zoom / nudge sliders. Every panel can hold a different photo.
4. **Write a caption** — big poster lettering with adjustable size and height, drawn with a dark band so it stays readable on any photo.
5. **Choose a colour grade** — Sunset Strip, Neon Nights, Golden Hour, or After Dark: a warm/neon wash plus a vignette over the panels.
6. **Export a PNG** — exact post sizes: **1080 × 1080**, **1080 × 1350**, and **1920 × 1080**, one click each.

## Run it locally

```sh
node serve.ts
# open http://localhost:8080
```

Everything under `app/` is plain static files — serve the folder with any static server and `app/index.html` just works.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the kit's `buildDossier`. Running it twice produces byte-identical output.

## Originality

All sample photos were generated with an image model for this entry. The app uses system fonts only and contains no game artwork, logos, wordmarks, or font files from any game.

## License

MIT — see [LICENSE](LICENSE).

# Neon Coast Cover Studio: GTA VI cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/vivid-raven-88/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/vivid-raven-88/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns your photos and a caption into multi-panel cover art in the style of GTA VI posters — built for the [make.fun GTA 6 cover art bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **6 multi-panel layouts** — Hero + Three, Four Grid, Full Bleed, Tilted Stack, Nine Panel and Split Duo, each with white poster gutters.
- **5 colour grades** — Vice Sunset, Neon Vice, Golden Hour, Dusk Purple and Noir Teal, painted as canvas washes over the cover.
- **Procedural scenes** — when a panel has no photo, the app draws its own deterministic scenes: Sunset Beach, Palm Boulevard, Neon Street, City Skyline, Wooden Pier and Marina Dusk. No downloaded art, no real people.
- **Any photo** — upload up to 8 photos from your machine (they never leave it) or use the 2 built-in sample photos. Click a panel to select it, drag on the canvas to pan, and use the zoom and pan sliders to crop each panel.
- **Caption** — an Anton title with a sunset gradient fill, a Pacifico script subtitle, a "Vice City" badge and a 0–5 star heat meter.
- **Polish** — film grain and vignette toggles, undo/redo, and a live preview that is exactly what the export will be.
- **Export PNG** — 1080 × 1080, 1080 × 1350, 1920 × 1080 and 1080 × 1920, straight from the canvas.

## Try it

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

No build step, no network requests at run time: every script, font and image the app loads is a file under `app/`.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/neon-out node main.ts
```

## Originality

Everything in this entry is original: the scenes are drawn by the app's own code, the lettering uses Anton and Pacifico under the SIL Open Font License (see `app/fonts/FONTS.md`), and it shows no Rockstar Games logo, wordmark, official artwork, character or font.

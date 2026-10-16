# bykreso

Portfolio for Krešo, who films and grades weddings, bands, bars and cities in Zagreb. Rebuilt from a screen recording of the original after it was lost.

```sh
npm install
npm run dev
```

## How it works

- **Hero** (`src/components/FilmStrip.tsx`): a looping strip of greyscale clips under four corner marks. The framed one plays in colour, and the lists on both sides turn with it. The wheel drives the strip near the centre column, and the page scrolls from the sides. Reworked from creative-kit's `viewfinder-strip`.
- **Page colour** (`src/lib/page-color.ts`): each film has a colour (`src/data/films.ts`). The whole page fades to it while that film is framed, ink flips on dark films, and the hex shows bottom right.
- **O meni / Kontakt** (`src/components/Spine.tsx`): text on a centre hairline, after creative-kit's `spine-text`.
- **Rad** (`src/components/Work.tsx`): every film as a barcode strip, one column per frame. Hovering floods a row with the film's colour.
- **Player** (`src/components/Player.tsx`): grows out of the clicked clip. Arrow keys switch films, Esc closes, and you can toggle sound.

## Media

Clips and covers are in `public/media/<id>.mp4|jpg` and come from [@bykreso](https://www.instagram.com/bykreso/). Barcodes are in `public/barcodes/<id>.png` and are made on macOS with:

```sh
swiftc -O -o /tmp/barcode scripts/barcode.swift
/tmp/barcode public/media/<id>.mp4 public/barcodes/<id>.png 240
```

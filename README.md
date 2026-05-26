<p align="center">
  <img src="./public/assets/rvps-logo.png" alt="VirtualPianoPedia logo" width="96" />
</p>

<h1 align="center">VirtualPianoPedia</h1>

<p align="center">Roblox virtual piano sheets with folders for each song, difficulty variants, local favorites, and MIDI conversion</p>

<p align="center">
  <a href="https://jasperdevs.github.io/VirtualPianoPedia/">Live site</a>
  ·
  <a href="https://github.com/jasperdevs/VirtualPianoPedia">GitHub</a>
</p>

<!-- SONG_INDEX_START -->

## Song Index

| Artist | Song | Target length | Tempo | Versions | Folder |
| --- | --- | --- | --- | --- | --- |
| Claude Debussy | Clair de Lune | 05:00 | 80 bpm | [Normal](./src/content/sheets/claude-debussy/clair-de-lune/normal.md) | [folder](./src/content/sheets/claude-debussy/clair-de-lune/) |
| Kavinsky | Nightcall | 04:19 | 91 bpm | [Hard](./src/content/sheets/kavinsky/nightcall/hard.md) | [folder](./src/content/sheets/kavinsky/nightcall/) |
| Max Richter | Written on the Sky | 01:51 | 95 bpm | [Normal](./src/content/sheets/max-richter/written-on-the-sky/normal.md), [Hard](./src/content/sheets/max-richter/written-on-the-sky/hard.md) | [folder](./src/content/sheets/max-richter/written-on-the-sky/) |
| Q Lazzarus | Goodbye Horses | 03:08 | 125 bpm | [Hard](./src/content/sheets/q-lazzarus/goodbye-horses/hard.md) | [folder](./src/content/sheets/q-lazzarus/goodbye-horses/) |
| Semisonic | Closing Time | 04:33 | 92 bpm | [Easy](./src/content/sheets/semisonic/closing-time/easy.md), [Hard](./src/content/sheets/semisonic/closing-time/hard.md) | [folder](./src/content/sheets/semisonic/closing-time/) |

<!-- SONG_INDEX_END -->

## Add A Sheet

Each song lives under the artist or composer:

```text
src/content/sheets/artist-or-composer/song-title/
  _meta.md
  easy.md
  normal.md
  hard.md
  expert.md
```

Only add the versions that exist

`_meta.md`

```md
---
title: Song Title
artist: Artist or Composer
game: Roblox Virtual Piano
category: Pop
tempo: 100
length: "01:30"
transpose: 0
source: Local sheet
tags:
  - pop
---
```

`normal.md`

```text
a s d f g
[asd] f g h
```

## Converter

The site converter accepts MIDI files and pasted notes, then exports `_meta.md` plus a sheet variant file

The CLI converter writes the repo folder format directly:

```bash
npm run convert:midi -- song.mid --title "Song Title" --artist "Artist" --category Classical --tier normal --source "Source URL"
```

Useful options:

```text
--transpose 0
--tempo 120
--length 01:30
--image-url /VirtualPianoPedia/assets/songs/song.jpg
--image-alt "Album cover for Song Title"
--image-source "https://example.com/source"
--image-credit "Artist name, license"
--tags classical,piano
--arrangement full
--grid 24
--max-chord 6 # optional cap for simplified sheets
--timing
--no-sustain
--no-chords
--dry-run
--force
```

Reference converter:

https://playpianosheets.com/roblox-piano-sheets-maker

## Development

```bash
npm install
npm run dev
npm run build
npm run library:audit
```

## License

MIT

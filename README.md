<p align="center">
  <img src="./public/assets/rvps-logo.png" alt="VirtualPianoPedia logo" width="96" />
</p>

<h1 align="center">VirtualPianoPedia</h1>

<p align="center">Roblox virtual piano sheets with folders for each song, difficulty variants, local favorites, MIDI conversion, and sampled piano preview</p>

<p align="center">
  <a href="https://jasperdevs.github.io/VirtualPianoPedia/">Live site</a>
  ·
  <a href="https://github.com/jasperdevs/VirtualPianoPedia">GitHub</a>
</p>

## Add A Sheet

Each song gets one folder:

```text
src/content/sheets/song-title/
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

Reference converter:

https://playpianosheets.com/roblox-piano-sheets-maker

## Development

```bash
npm install
npm run dev
npm run build
```

## Audio Credits

Playback uses Salamander Grand Piano V3 samples by Alexander Holm through `@audio-samples/piano-mp3-velocity16`

The samples are licensed under CC BY 3.0

## License

MIT

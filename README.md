# VirtualPianoPedia

Wiki-style Roblox virtual piano sheets with a MIDI converter, favorites, and playable sheet previews.

## Add A Sheet

Each song gets its own folder:

```text
src/content/sheets/song-title/
  _meta.md
  easy.md
  normal.md
  hard.md
  expert.md
```

Only add the version files that actually exist.

`_meta.md`:

```md
---
title: Song Title
artist: Artist or Composer
game: Roblox Virtual Piano
category: Pop
tempo: 100
length: "01:30"
transpose: 0
source: Community submission
tags:
  - pop
---
```

`normal.md`:

```text
a s d f g
[asd] f g h
```

## Converter

The `/converter` page accepts MIDI files or pasted note text. It maps notes to Roblox virtual piano keys, previews playback, and exports the `_meta.md` plus `normal.md` content.

External converter reference:

https://playpianosheets.com/roblox-piano-sheets-maker

## Development

```bash
npm install
npm run dev
npm run build
```

The UI uses shadcn-style local components, Tailwind CSS variables, and Fluid Functionalism-inspired motion for tabs, switches, copy feedback, and tactile buttons.

## License

MIT

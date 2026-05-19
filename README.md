# VirtualPianoPedia

Wiki-style Roblox virtual piano sheets with a MIDI converter and playable sheet previews.

## Add a sheet

Create a markdown file in `src/content/sheets`:

```md
---
title: Song Title
artist: Artist
game: Roblox Virtual Piano
difficulty: Standard
category: Pop
tempo: 100
length: "01:30"
transpose: 0
source: Community submission
tags:
  - pop
---

## Starter

a s d f g

## Standard

[asd] f g h
```

Use `Starter`, `Standard`, `Advanced`, and `Expert` headings when one song has multiple versions.

## Converter

The `/converter` page accepts MIDI files or pasted note text. It maps notes to Roblox virtual piano keys, previews playback, and exports markdown.

External converter reference:

https://playpianosheets.com/roblox-piano-sheets-maker

## Development

```bash
npm install
npm run dev
npm run build
```

The UI uses shadcn-style local components, Tailwind CSS variables, and a monochrome light/dark theme.

## License

MIT

# RVPS

Roblox Virtual Piano Sheets is a clean sheet library for Roblox virtual piano players. It has no player, comments, accounts, or extra social layer. Sheets live in GitHub as markdown and the site builds from those files.

## Add a sheet

Create a markdown file in `src/content/sheets`:

```md
---
title: Song Title
artist: Artist
game: Roblox Virtual Piano
difficulty: Beginner
category: Pop
tempo: 100
length: "01:30"
transpose: 0
source: Community submission
tags:
  - pop
---

a s d f g
[asd] f g h
```

Open a pull request and GitHub Pages will rebuild the site after merge.

## Converter

The `/converter` page accepts MIDI files or pasted note text. MIDI input is parsed in the browser, mapped to virtual piano keys, and exported as the same markdown format used by the library.

## Development

```bash
npm install
npm run dev
npm run build
```

The UI uses shadcn-style local components, Tailwind CSS variables, and a monochrome light/dark theme.

## License

MIT

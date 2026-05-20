import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sheetsDir = path.join(root, "src", "content", "sheets");
const readmePath = path.join(root, "README.md");
const variants = ["easy", "normal", "hard", "expert"];
const start = "<!-- SONG_INDEX_START -->";
const end = "<!-- SONG_INDEX_END -->";

function readMeta(artistSlug, songSlug) {
  const metaPath = path.join(sheetsDir, artistSlug, songSlug, "_meta.md");
  if (!fs.existsSync(metaPath)) return { title: songSlug, artist: artistSlug };

  const raw = fs.readFileSync(metaPath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { title: songSlug, artist: artistSlug };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*"?([^"]*)"?\s*$/);
    if (field) meta[field[1]] = field[2];
  }
  return {
    title: meta.title || songSlug,
    artist: meta.artist || "Unknown",
  };
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

const songs = fs
  .readdirSync(sheetsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((artistEntry) => {
    const artistSlug = artistEntry.name;
    const artistDir = path.join(sheetsDir, artistSlug);
    return fs
      .readdirSync(artistDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((songEntry) => {
        const songSlug = songEntry.name;
        const meta = readMeta(artistSlug, songSlug);
        const available = variants.filter((variant) => fs.existsSync(path.join(sheetsDir, artistSlug, songSlug, `${variant}.md`)));
        return { artistSlug, songSlug, ...meta, variants: available };
      });
  })
  .filter((song) => song.variants.length)
  .sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));

const rows = songs.map((song) => {
  const versionLinks = song.variants
    .map((variant) => `[${titleCase(variant)}](./src/content/sheets/${song.artistSlug}/${song.songSlug}/${variant}.md)`)
    .join(", ");
  return `| ${song.artist} | ${song.title} | ${versionLinks} | [folder](./src/content/sheets/${song.artistSlug}/${song.songSlug}/) |`;
});

const index = [
  start,
  "",
  "## Song Index",
  "",
  "| Artist | Song | Versions | Folder |",
  "| --- | --- | --- | --- |",
  ...rows,
  "",
  end,
].join("\n");

const readme = fs.readFileSync(readmePath, "utf8");
let nextReadme;

if (readme.includes(start) && readme.includes(end)) {
  nextReadme = readme.replace(new RegExp(`${start}[\\s\\S]*?${end}`), index);
} else {
  nextReadme = readme.replace(/\n## Add A Sheet/, `\n${index}\n\n## Add A Sheet`);
}

fs.writeFileSync(readmePath, `${nextReadme.trimEnd()}\n`);

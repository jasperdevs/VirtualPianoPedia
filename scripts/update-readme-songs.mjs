import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sheetsDir = path.join(root, "src", "content", "sheets");
const readmePath = path.join(root, "README.md");
const variants = ["easy", "normal", "hard", "expert"];
const start = "<!-- SONG_INDEX_START -->";
const end = "<!-- SONG_INDEX_END -->";

function readMeta(slug) {
  const metaPath = path.join(sheetsDir, slug, "_meta.md");
  if (!fs.existsSync(metaPath)) return { title: slug, artist: "Unknown" };

  const raw = fs.readFileSync(metaPath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { title: slug, artist: "Unknown" };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*"?([^"]*)"?\s*$/);
    if (field) meta[field[1]] = field[2];
  }
  return {
    title: meta.title || slug,
    artist: meta.artist || "Unknown",
  };
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

const songs = fs
  .readdirSync(sheetsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const slug = entry.name;
    const meta = readMeta(slug);
    const available = variants.filter((variant) => fs.existsSync(path.join(sheetsDir, slug, `${variant}.md`)));
    return { slug, ...meta, variants: available };
  })
  .filter((song) => song.variants.length)
  .sort((a, b) => a.title.localeCompare(b.title));

const rows = songs.map((song) => {
  const versionLinks = song.variants
    .map((variant) => `[${titleCase(variant)}](./src/content/sheets/${song.slug}/${variant}.md)`)
    .join(", ");
  return `| ${song.title} | ${song.artist} | ${versionLinks} | [folder](./src/content/sheets/${song.slug}/) |`;
});

const index = [
  start,
  "",
  "## Song Index",
  "",
  "| Song | Artist | Versions | Folder |",
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

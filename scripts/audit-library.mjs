import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sheetsDir = path.join(root, "src", "content", "sheets");
const variantNames = ["easy", "normal", "hard", "expert"];
const weakSourceValues = new Set(["local sheet", "user submission", "user supplied virtual piano sheet", "converter submission"]);
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const json = args.has("--json");

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const fields = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[index]);
    if (!pair) continue;

    const [, key, rawValue] = pair;
    if (rawValue === "") {
      const values = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        index += 1;
        values.push(lines[index].replace("  - ", "").trim());
      }
      fields[key] = values;
    } else {
      fields[key] = rawValue.replace(/^["']|["']$/g, "").trim();
    }
  }

  return fields;
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function isRepoAsset(value) {
  return String(value ?? "").startsWith("/VirtualPianoPedia/assets/");
}

function readSongs() {
  if (!fs.existsSync(sheetsDir)) return [];

  return fs
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
          const songDir = path.join(artistDir, songSlug);
          const metaPath = path.join(songDir, "_meta.md");
          const meta = fs.existsSync(metaPath) ? readFrontmatter(metaPath) : {};
          const variants = variantNames.filter((variant) => fs.existsSync(path.join(songDir, `${variant}.md`)));
          return {
            artistSlug,
            songSlug,
            path: path.relative(root, songDir).replaceAll("\\", "/"),
            title: meta.title ?? songSlug,
            artist: meta.artist ?? artistSlug,
            category: meta.category ?? "",
            source: meta.source ?? "",
            imageUrl: meta.imageUrl ?? "",
            imageAlt: meta.imageAlt ?? "",
            imageSource: meta.imageSource ?? "",
            imageCredit: meta.imageCredit ?? "",
            variants,
          };
        });
    });
}

const songs = readSongs();
const issues = [];
const categoryCounts = new Map();
const variantCounts = new Map(variantNames.map((variant) => [variant, 0]));

for (const song of songs) {
  categoryCounts.set(song.category || "Unsorted", (categoryCounts.get(song.category || "Unsorted") ?? 0) + 1);
  for (const variant of song.variants) variantCounts.set(variant, (variantCounts.get(variant) ?? 0) + 1);

  if (!song.source) {
    issues.push({ level: "error", path: song.path, message: "missing source" });
  } else if (weakSourceValues.has(song.source.toLowerCase()) || (!isUrl(song.source) && !song.source.includes("Converted from"))) {
    issues.push({ level: "warning", path: song.path, message: `weak source attribution: ${song.source}` });
  }

  if (!song.variants.length) {
    issues.push({ level: "error", path: song.path, message: "missing sheet variant" });
  }

  if (song.imageUrl) {
    if (!song.imageAlt) issues.push({ level: "error", path: song.path, message: "imageUrl missing imageAlt" });
    if (!song.imageSource) issues.push({ level: "error", path: song.path, message: "imageUrl missing imageSource" });
    if (!song.imageCredit) issues.push({ level: "error", path: song.path, message: "imageUrl missing imageCredit" });
    if (!isUrl(song.imageUrl) && !isRepoAsset(song.imageUrl)) issues.push({ level: "warning", path: song.path, message: `imageUrl is not a URL or repo asset: ${song.imageUrl}` });
    if (song.imageSource && !isUrl(song.imageSource)) issues.push({ level: "warning", path: song.path, message: `imageSource is not a URL: ${song.imageSource}` });
  }
}

const report = {
  songs: songs.length,
  variants: Object.fromEntries(variantCounts),
  categories: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  issues,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Songs: ${report.songs}`);
  console.log(`Variants: ${variantNames.map((variant) => `${variant} ${report.variants[variant]}`).join(", ")}`);
  console.log(`Categories: ${Object.entries(report.categories).map(([category, count]) => `${category} ${count}`).join(", ")}`);

  if (issues.length) {
    console.log("");
    console.log("Issues:");
    for (const issue of issues) console.log(`- ${issue.level}: ${issue.path} - ${issue.message}`);
  }
}

if (strict && issues.some((issue) => issue.level === "error" || issue.level === "warning")) {
  process.exit(1);
}

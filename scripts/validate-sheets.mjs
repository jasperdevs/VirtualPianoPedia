import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sheetsDir = path.join(root, "src", "content", "sheets");
const variants = ["easy.md", "normal.md", "hard.md", "expert.md"];
const requiredFields = ["title", "artist", "category", "tempo", "length"];
const errors = [];

function readFrontmatter(metaPath) {
  const raw = fs.readFileSync(metaPath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*"?([^"]*)"?\s*$/);
    if (field) fields[field[1]] = field[2].trim();
  }
  return fields;
}

for (const artistEntry of fs.readdirSync(sheetsDir, { withFileTypes: true })) {
  if (!artistEntry.isDirectory()) continue;
  const artistDir = path.join(sheetsDir, artistEntry.name);

  for (const songEntry of fs.readdirSync(artistDir, { withFileTypes: true })) {
    if (!songEntry.isDirectory()) continue;
    const songDir = path.join(artistDir, songEntry.name);
    const rel = path.relative(root, songDir).replaceAll("\\", "/");
    const metaPath = path.join(songDir, "_meta.md");

    if (!fs.existsSync(metaPath)) {
      errors.push(`${rel} is missing _meta.md`);
      continue;
    }

    const fields = readFrontmatter(metaPath);
    for (const field of requiredFields) {
      if (!fields[field]) errors.push(`${rel}/_meta.md is missing ${field}`);
    }

    if (fields.tempo && !/^\d+$/.test(fields.tempo)) errors.push(`${rel}/_meta.md tempo must be a number`);
    if (fields.length && !/^\d{2}:\d{2}$/.test(fields.length)) errors.push(`${rel}/_meta.md length must look like "01:51"`);
    if (fields.imageUrl) {
      for (const field of ["imageAlt", "imageSource", "imageCredit"]) {
        if (!fields[field]) errors.push(`${rel}/_meta.md imageUrl requires ${field}`);
      }
    }
    if (!variants.some((variant) => fs.existsSync(path.join(songDir, variant)))) errors.push(`${rel} needs at least one variant file`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

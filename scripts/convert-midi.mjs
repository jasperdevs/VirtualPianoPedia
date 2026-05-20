#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import midiPackage from "@tonejs/midi";

const { Midi } = midiPackage;

const virtualPianoKeys = [
  "1",
  "!",
  "2",
  "@",
  "3",
  "4",
  "$",
  "5",
  "%",
  "6",
  "^",
  "7",
  "8",
  "*",
  "9",
  "(",
  "0",
  "q",
  "Q",
  "w",
  "W",
  "e",
  "E",
  "r",
  "t",
  "T",
  "y",
  "Y",
  "u",
  "i",
  "I",
  "o",
  "O",
  "p",
  "P",
  "a",
  "s",
  "S",
  "d",
  "D",
  "f",
  "g",
  "G",
  "h",
  "H",
  "j",
  "J",
  "k",
  "l",
  "L",
  "z",
  "Z",
  "x",
  "c",
  "C",
  "v",
  "V",
  "b",
  "B",
  "n",
  "m",
  "M",
];

const firstVirtualPianoMidi = 36;
const lastVirtualPianoMidi = firstVirtualPianoMidi + virtualPianoKeys.length - 1;
const tiers = new Set(["easy", "normal", "hard", "expert"]);

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (!fs.existsSync(args.input)) {
    fail(`Input file not found: ${args.input}`);
  }

  const tier = String(args.tier ?? "normal").toLowerCase();
  if (!tiers.has(tier)) fail(`--tier must be one of: ${Array.from(tiers).join(", ")}`);

  const title = required(args.title, "--title");
  const artist = required(args.artist, "--artist");
  const category = required(args.category, "--category");
  const artistSlug = slugify(args.artistSlug ?? artist);
  const songSlug = slugify(args.songSlug ?? title);
  const outRoot = path.resolve(args.out ?? path.join("src", "content", "sheets"));
  const songDir = path.join(outRoot, artistSlug, songSlug);
  const inputBuffer = fs.readFileSync(args.input);
  const result = convertMidi(inputBuffer, {
    transpose: numberArg(args.transpose, 0),
    sustain: !args.noSustain,
    groupChords: !args.noChords,
    includeTiming: Boolean(args.timing),
  });

  const meta = {
    title,
    artist,
    game: args.game ?? "Roblox Virtual Piano",
    category,
    tempo: numberArg(args.tempo, result.tempo),
    length: args.length ?? result.duration,
    transpose: numberArg(args.transpose, 0),
    source: args.source ?? `Converted from ${path.basename(args.input)}`,
    tags: listArg(args.tags),
  };

  if (args.dryRun) {
    process.stdout.write(`${createMetaMarkdown(meta)}\n${result.sheet}\n`);
    printWarnings(result.warnings);
    return;
  }

  fs.mkdirSync(songDir, { recursive: true });
  const metaPath = path.join(songDir, "_meta.md");
  const variantPath = path.join(songDir, `${tier}.md`);

  if (!args.force) {
    for (const filePath of [metaPath, variantPath]) {
      if (fs.existsSync(filePath)) fail(`${path.relative(process.cwd(), filePath)} already exists. Pass --force to overwrite.`);
    }
  }

  fs.writeFileSync(metaPath, createMetaMarkdown(meta));
  fs.writeFileSync(variantPath, `${result.sheet.trim()}\n`);
  printWarnings(result.warnings);
  console.log(`Wrote ${path.relative(process.cwd(), metaPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), variantPath)}`);
}

function convertMidi(inputBuffer, options) {
  const midi = new Midi(inputBuffer);
  const notes = midi.tracks
    .flatMap((track) => track.notes)
    .map((note) => ({
      midi: note.midi,
      time: note.time,
      duration: note.duration,
    }))
    .sort((a, b) => a.time - b.time || a.midi - b.midi);
  const warnings = [];
  const endTime = notes.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
  const tempo = Math.round(midi.header.tempos[0]?.bpm ?? 100);

  if (!notes.length) warnings.push("No MIDI notes were found.");

  const octaveShift = chooseOctaveShift(notes, options.transpose);
  const shiftedNotes = notes.map((note) => ({ ...note, mappedMidi: note.midi + options.transpose + octaveShift }));
  const foldedCount = shiftedNotes.filter((note) => note.mappedMidi < firstVirtualPianoMidi || note.mappedMidi > lastVirtualPianoMidi).length;

  if (octaveShift !== 0) {
    warnings.push(`Auto-shifted MIDI by ${octaveShift / 12} octave${Math.abs(octaveShift) === 12 ? "" : "s"} to fit the Roblox virtual piano range.`);
  }

  if (foldedCount) {
    warnings.push(`${foldedCount} notes were outside the playable range and were folded by octave.`);
  }

  const groups = [];
  for (const note of shiftedNotes) {
    const previous = groups.at(-1);
    if (previous && Math.abs(note.time - previous.time) < 0.035) {
      previous.notes.push(note);
    } else {
      groups.push({ time: note.time, notes: [note] });
    }
  }

  const lines = [];
  let currentLine = [];
  let previousTime = 0;

  for (const group of groups) {
    const gap = group.time - previousTime;

    if (gap > 0.7 && currentLine.length) {
      lines.push(currentLine.join(" "));
      currentLine = [];
    }

    if (options.includeTiming && gap > 0.35) currentLine.push(`(${gap.toFixed(1)}s)`);

    const keys = group.notes
      .map((note) => {
        const key = midiToVirtualKey(fitMidiToVirtualRange(note.mappedMidi));
        return key ? (options.sustain && note.duration > 0.8 ? `${key}-` : key) : "";
      })
      .filter(Boolean);

    if (keys.length) currentLine.push(options.groupChords && keys.length > 1 ? `[${keys.join("")}]` : keys.join(" "));

    if (currentLine.length >= 16) {
      lines.push(currentLine.join(" "));
      currentLine = [];
    }

    previousTime = group.time;
  }

  if (currentLine.length) lines.push(currentLine.join(" "));

  return {
    sheet: lines.join("\n"),
    duration: formatDuration(endTime),
    noteCount: notes.length,
    tempo,
    warnings,
  };
}

function chooseOctaveShift(notes, transpose) {
  const shifts = [-36, -24, -12, 0, 12, 24, 36];

  return shifts
    .map((shift) => {
      const playable = notes.filter((note) => {
        const midi = note.midi + transpose + shift;
        return midi >= firstVirtualPianoMidi && midi <= lastVirtualPianoMidi;
      }).length;

      return { shift, playable };
    })
    .sort((a, b) => b.playable - a.playable || Math.abs(a.shift) - Math.abs(b.shift))[0].shift;
}

function midiToVirtualKey(midi) {
  return virtualPianoKeys[midi - firstVirtualPianoMidi];
}

function fitMidiToVirtualRange(midi) {
  let fitted = midi;
  while (fitted < firstVirtualPianoMidi) fitted += 12;
  while (fitted > lastVirtualPianoMidi) fitted -= 12;
  return fitted;
}

function createMetaMarkdown(meta) {
  const tags = meta.tags.map((tag) => tag.trim()).filter(Boolean);
  return `---\ntitle: ${meta.title}\nartist: ${meta.artist}\ngame: ${meta.game}\ncategory: ${meta.category}\ntempo: ${meta.tempo}\nlength: "${meta.length}"\ntranspose: ${meta.transpose}\nsource: ${meta.source}\ntags:\n${tags.length ? tags.map((tag) => `  - ${tag}`).join("\n") : "  - converted"}\n---\n`;
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (!arg.startsWith("--")) {
      parsed.input ??= arg;
      continue;
    }

    const key = arg.slice(2);
    if (["help", "dry-run", "force", "timing", "no-sustain", "no-chords"].includes(key)) {
      parsed[toCamel(key)] = true;
      continue;
    }

    const value = rawArgs[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for --${key}`);
    parsed[toCamel(key)] = value;
    index += 1;
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  node scripts/convert-midi.mjs song.mid --title "Song" --artist "Composer" --category Classical [options]

Options:
  --tier easy|normal|hard|expert
  --out src/content/sheets
  --artist-slug composer
  --song-slug song-title
  --tempo 120
  --length 01:30
  --transpose 0
  --source URL-or-note
  --tags classical,piano
  --timing
  --no-sustain
  --no-chords
  --dry-run
  --force`);
}

function listArg(value) {
  return String(value ?? "converted")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberArg(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function required(value, label) {
  if (!String(value ?? "").trim()) fail(`${label} is required`);
  return String(value).trim();
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function formatDuration(seconds) {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function printWarnings(warnings) {
  for (const warning of warnings) console.warn(`Warning: ${warning}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main();

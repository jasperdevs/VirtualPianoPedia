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
const defaultGridDivision = 24;
const tiers = new Set(["easy", "normal", "hard", "expert"]);
const arrangements = new Set(["balanced", "melody", "full"]);

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
    arrangement: choiceArg(args.arrangement, "full", arrangements, "--arrangement"),
    gridDivision: numberArg(args.grid, defaultGridDivision),
    maxChordKeys: args.maxChord === undefined ? undefined : numberArg(args.maxChord, virtualPianoKeys.length),
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
    imageUrl: optionalString(args.imageUrl),
    imageAlt: optionalString(args.imageAlt),
    imageSource: optionalString(args.imageSource),
    imageCredit: optionalString(args.imageCredit),
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
  const skippedTracks = midi.tracks.filter(isPercussionTrack).length;
  const rawNotes = midi.tracks
    .flatMap((track, trackIndex) => (isPercussionTrack(track) ? [] : track.notes.map((note) => ({ note, track, trackIndex }))))
    .map(({ note, track, trackIndex }) => ({
      midi: note.midi,
      time: note.time,
      ticks: note.ticks,
      duration: note.duration,
      velocity: note.velocity,
      trackIndex,
      trackName: track.name,
      instrumentFamily: track.instrument.family,
      instrumentName: track.instrument.name,
    }))
    .sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);
  const notes = selectArrangementNotes(rawNotes, options.arrangement).sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);
  const warnings = [];
  const endTime = notes.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
  const tempo = Math.round(midi.header.tempos[0]?.bpm ?? 100);

  if (!notes.length) warnings.push("No MIDI notes were found.");
  if (skippedTracks) warnings.push(`Skipped ${skippedTracks} drum/percussion MIDI track${skippedTracks === 1 ? "" : "s"}.`);
  if (rawNotes.length !== notes.length) warnings.push(`Kept ${notes.length} of ${rawNotes.length} non-drum MIDI notes using ${options.arrangement} arrangement mode.`);

  const octaveShift = chooseOctaveShift(notes, options.transpose);
  const shiftedNotes = notes.map((note) => ({ ...note, mappedMidi: fitMidiToVirtualRange(note.midi + options.transpose + octaveShift) }));

  const ppq = Math.max(1, midi.header.ppq || 480);
  const quantizeTicks = chooseQuantizeTicks(notes, ppq, options.gridDivision);
  const groups = [];
  for (const note of shiftedNotes) {
    const quantizedTicks = Math.round(note.ticks / quantizeTicks) * quantizeTicks;
    const previous = groups.at(-1);
    if (previous && previous.ticks === quantizedTicks) {
      previous.notes.push(note);
    } else {
      groups.push({ time: midi.header.ticksToSeconds(quantizedTicks), ticks: quantizedTicks, notes: [note] });
    }
  }

  const lines = [];
  let currentLine = [];
  let previousTime = 0;
  let trimmedChordCount = 0;

  for (const group of groups) {
    const gap = group.time - previousTime;

    if (gap > 0.7 && currentLine.length) {
      lines.push(currentLine.join(" "));
      currentLine = [];
    }

    if (options.includeTiming && gap > 0.35) currentLine.push(`(${gap.toFixed(1)}s)`);

    const rendered = renderMidiGroup(group.notes, options);

    if (rendered.text) {
      currentLine.push(rendered.text);
      if (rendered.trimmed) trimmedChordCount += 1;
    }

    if (currentLine.length >= 16) {
      lines.push(currentLine.join(" "));
      currentLine = [];
    }

    previousTime = group.time;
  }

  if (currentLine.length) lines.push(currentLine.join(" "));
  if (trimmedChordCount) warnings.push(`Trimmed ${trimmedChordCount} dense MIDI chord${trimmedChordCount === 1 ? "" : "s"} to keep the sheet readable.`);

  return {
    sheet: lines.join("\n"),
    duration: formatDuration(endTime),
    noteCount: notes.length,
    tempo,
    warnings,
  };
}

function renderMidiGroup(notes, options) {
  const maxChordKeys = options.maxChordKeys === undefined ? virtualPianoKeys.length : Math.max(1, Math.min(virtualPianoKeys.length, Math.round(options.maxChordKeys)));
  const byKey = new Map();

  for (const note of notes) {
    const fitted = fitMidiToVirtualRange(note.mappedMidi);
    const key = midiToVirtualKey(fitted);

    if (!key) continue;

    const current = byKey.get(key);
    if (!current || note.duration > current.duration) {
      byKey.set(key, {
        key,
        midi: fitted,
        duration: note.duration,
        velocity: note.velocity,
      });
    }
  }

  let playable = Array.from(byKey.values()).sort((a, b) => a.midi - b.midi);
  const trimmed = playable.length > maxChordKeys;

  if (trimmed) {
    const bass = playable.slice(0, 2);
    const melody = playable
      .slice(2)
      .sort((a, b) => b.velocity - a.velocity || b.midi - a.midi)
      .slice(0, maxChordKeys - bass.length)
      .sort((a, b) => a.midi - b.midi);
    playable = [...bass, ...melody];
  }

  const keys = playable.map((note) => note.key);
  const sustainLength = options.sustain ? Math.min(4, Math.max(0, Math.round(Math.max(...playable.map((note) => note.duration)) / 0.5) - 1)) : 0;
  const sustainSuffix = "-".repeat(sustainLength);
  return {
    text: options.groupChords && keys.length > 1 ? `[${keys.join("")}]${sustainSuffix}` : keys.map((key) => `${key}${sustainSuffix}`).join(" "),
    trimmed,
  };
}

function selectArrangementNotes(notes, arrangement) {
  if (arrangement === "full") return notes;

  const trackStats = Array.from(
    notes.reduce((tracks, note) => {
      const stats = tracks.get(note.trackIndex) ?? {
        trackIndex: note.trackIndex,
        name: note.trackName,
        family: note.instrumentFamily,
        instrument: note.instrumentName,
        count: 0,
        midiTotal: 0,
        velocityTotal: 0,
      };

      stats.count += 1;
      stats.midiTotal += note.midi;
      stats.velocityTotal += note.velocity;
      tracks.set(note.trackIndex, stats);
      return tracks;
    }, new Map()),
  ).map(([, stats]) => ({
    ...stats,
    averageMidi: stats.midiTotal / stats.count,
    averageVelocity: stats.velocityTotal / stats.count,
  }));

  if (trackStats.length <= 2) return notes;

  const bassTrack = trackStats
    .filter((track) => /bass/i.test(`${track.family} ${track.instrument} ${track.name}`) || track.averageMidi < 48)
    .sort((a, b) => a.averageMidi - b.averageMidi || b.count - a.count)[0];
  const melodicTracks = trackStats
    .filter((track) => track.trackIndex !== bassTrack?.trackIndex)
    .map((track) => ({
      ...track,
      score:
        track.averageMidi +
        track.averageVelocity * 18 +
        (/piano|guitar|synth|organ|lead|pad/i.test(`${track.family} ${track.instrument} ${track.name}`) ? 8 : 0) -
        Math.max(0, track.count / 900),
    }))
    .sort((a, b) => b.score - a.score);

  const keep = new Set();
  const melodicLimit = arrangement === "melody" ? 2 : 3;

  for (const track of melodicTracks.slice(0, melodicLimit)) keep.add(track.trackIndex);
  if (arrangement === "balanced" && bassTrack) keep.add(bassTrack.trackIndex);

  return notes.filter((note) => keep.has(note.trackIndex));
}

function chooseQuantizeTicks(notes, ppq, requestedDivision) {
  if (requestedDivision && Number.isFinite(requestedDivision) && requestedDivision > 0) return Math.max(1, Math.round(ppq / requestedDivision));

  const candidates = [12, 16, 24, 32].map((division) => Math.max(1, Math.round(ppq / division)));

  return candidates
    .map((ticks) => {
      const totalError = notes.reduce((sum, note) => sum + Math.abs(note.ticks - Math.round(note.ticks / ticks) * ticks), 0);
      const averageError = totalError / Math.max(1, notes.length);
      return { ticks, averageError };
    })
    .sort((a, b) => a.averageError - b.averageError || a.ticks - b.ticks)[0].ticks;
}

function isPercussionTrack(track) {
  return track.channel === 9 || track.instrument?.percussion === true || track.instrument?.family === "drums" || /drum|percussion/i.test(track.instrument?.name ?? "");
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
  const imageFields = [
    ["imageUrl", meta.imageUrl],
    ["imageAlt", meta.imageAlt],
    ["imageSource", meta.imageSource],
    ["imageCredit", meta.imageCredit],
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  const optionalImageBlock = imageFields ? `${imageFields}\n` : "";

  return `---\ntitle: ${meta.title}\nartist: ${meta.artist}\ngame: ${meta.game}\ncategory: ${meta.category}\ntempo: ${meta.tempo}\nlength: "${meta.length}"\ntranspose: ${meta.transpose}\nsource: ${meta.source}\n${optionalImageBlock}tags:\n${tags.length ? tags.map((tag) => `  - ${tag}`).join("\n") : "  - converted"}\n---\n`;
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
  --image-url URL-or-repo-path
  --image-alt "Cover art alt text"
  --image-source URL
  --image-credit "Artist or license"
  --tags classical,piano
  --arrangement balanced|melody|full
  --grid 24
  --max-chord 6 (optional cap for simplified sheets)
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

function optionalString(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed || undefined;
}

function numberArg(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function choiceArg(value, fallback, choices, label) {
  const choice = String(value ?? fallback).toLowerCase();
  if (!choices.has(choice)) fail(`${label} must be one of: ${Array.from(choices).join(", ")}`);
  return choice;
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

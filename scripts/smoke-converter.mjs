import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import midiPackage from "@tonejs/midi";

const { Midi } = midiPackage;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpp-converter-"));
const inputPath = path.join(tmpDir, "smoke.mid");

try {
  createFixtureMidi(inputPath);

  const full = runConverter("full", [
    "--arrangement",
    "full",
    "--image-url",
    "/VirtualPianoPedia/assets/songs/smoke-test.jpg",
    "--image-alt",
    "Smoke Test cover art",
    "--image-source",
    "https://example.com/smoke-test",
    "--image-credit",
    "Example Artist, CC0",
  ]);
  const balanced = runConverter("balanced", ["--arrangement", "balanced"]);
  const melody = runConverter("melody", ["--arrangement", "melody"]);
  const defaultConversion = runConverter("default", []);
  const capped = runConverter("capped", ["--arrangement", "full", "--max-chord", "3", "--grid", "12"]);

  assert(full.meta.includes("tempo: 120"), "tempo was not read from MIDI");
  assert(full.meta.includes('length: "00:05"'), "length was not calculated from MIDI");
  assert(full.meta.includes("imageUrl: /VirtualPianoPedia/assets/songs/smoke-test.jpg"), "imageUrl was not written");
  assert(full.meta.includes("imageAlt: Smoke Test cover art"), "imageAlt was not written");
  assert(full.meta.includes("imageSource: https://example.com/smoke-test"), "imageSource was not written");
  assert(full.meta.includes("imageCredit: Example Artist, CC0"), "imageCredit was not written");
  assert(full.sheet.includes("1"), "C2 did not map to 1");
  assert(full.sheet.includes("!"), "C#2 did not map to !");
  assert(full.sheet.includes("m"), "high out-of-range MIDI note did not map back into the virtual piano range");
  assert(full.sheet.includes("t"), "C4 did not map to t");
  assert(/\[[^\]]*(o|s)[^\]]*(s|o)[^\]]*\]/.test(full.sheet), "same-time notes were not grouped into a chord");
  assert(!/\[\[|\]\]/.test(full.sheet), "nested bracket output was generated");
  assert(/\][-\s]/.test(full.sheet), "long-note sustain was not rendered after the token");
  assert(!/\[[^\]]*-/.test(full.sheet), "sustain dashes were rendered inside a chord");
  assert(hasChordLongerThan(full.sheet, 6), "dense chords were trimmed even though no cap was requested");
  assert(allChordsAtMost(capped.sheet, 3), "custom max chord cap was not enforced");
  assert(defaultConversion.sheet === full.sheet, "default arrangement did not preserve the full MIDI");
  assert(full.stderr.includes("Skipped 1 drum/percussion MIDI track"), "percussion warning was not printed");
  assert(!full.stderr.includes("Trimmed"), "dense chord warning was printed even though no cap was requested");
  assert(!/folded|Auto-shifted/i.test(full.stderr), "normal range mapping was reported as a warning");

  assert(tokenCount(melody.sheet) < tokenCount(full.sheet), "melody mode did not reduce a multi-track MIDI");
  assert(tokenCount(balanced.sheet) < tokenCount(full.sheet), "balanced mode did not reduce a multi-track MIDI");
  assert(tokenCount(balanced.sheet) > tokenCount(melody.sheet), "balanced mode did not retain more context than melody mode");
  assert(balanced.stderr.includes("balanced arrangement mode"), "balanced arrangement warning was not printed");
  assert(melody.stderr.includes("melody arrangement mode"), "melody arrangement warning was not printed");

  const badArrangement = spawnSync(
    process.execPath,
    [
      "scripts/convert-midi.mjs",
      inputPath,
      "--title",
      "Bad Arrangement",
      "--artist",
      "Test Composer",
      "--category",
      "Classical",
      "--arrangement",
      "random",
    ],
    { encoding: "utf8" },
  );
  assert(badArrangement.status !== 0, "invalid arrangement mode did not fail");
  assert(badArrangement.stderr.includes("--arrangement must be one of"), "invalid arrangement error was not clear");

  console.log("converter smoke ok");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function createFixtureMidi(outputPath) {
  const midi = new Midi();
  midi.header.setTempo(120);

  const melodyTrack = midi.addTrack();
  melodyTrack.instrument.number = 0;
  melodyTrack.addNote({ midi: 36, time: 0, duration: 0.4, velocity: 0.7 });
  melodyTrack.addNote({ midi: 108, time: 0.25, duration: 0.2, velocity: 0.6 });
  melodyTrack.addNote({ midi: 37, time: 0.5, duration: 0.4, velocity: 0.7 });
  melodyTrack.addNote({ midi: 60, time: 1, duration: 0.4, velocity: 0.9 });
  melodyTrack.addNote({ midi: 64, time: 1.5, duration: 0.4, velocity: 0.9 });
  melodyTrack.addNote({ midi: 67, time: 2, duration: 1, velocity: 0.9 });
  melodyTrack.addNote({ midi: 72, time: 2, duration: 1, velocity: 1 });
  for (let midiNote = 48; midiNote <= 56; midiNote += 1) {
    melodyTrack.addNote({ midi: midiNote, time: 3, duration: 1.5, velocity: midiNote === 56 ? 1 : 0.4 });
  }

  const harmonyTrack = midi.addTrack();
  harmonyTrack.instrument.number = 48;
  harmonyTrack.addNote({ midi: 55, time: 0, duration: 0.75, velocity: 0.45 });
  harmonyTrack.addNote({ midi: 59, time: 0.75, duration: 0.75, velocity: 0.45 });
  harmonyTrack.addNote({ midi: 62, time: 1.5, duration: 0.75, velocity: 0.45 });
  harmonyTrack.addNote({ midi: 65, time: 2.25, duration: 0.75, velocity: 0.45 });

  const bassTrack = midi.addTrack();
  bassTrack.instrument.number = 33;
  bassTrack.addNote({ midi: 40, time: 0, duration: 1.25, velocity: 0.55 });
  bassTrack.addNote({ midi: 43, time: 1.25, duration: 1.25, velocity: 0.55 });
  bassTrack.addNote({ midi: 45, time: 2.5, duration: 1.25, velocity: 0.55 });

  const decorativeTrack = midi.addTrack();
  decorativeTrack.instrument.number = 89;
  decorativeTrack.addNote({ midi: 76, time: 0.25, duration: 0.2, velocity: 0.25 });
  decorativeTrack.addNote({ midi: 79, time: 1.25, duration: 0.2, velocity: 0.25 });
  decorativeTrack.addNote({ midi: 81, time: 2.25, duration: 0.2, velocity: 0.25 });

  const extraOrnamentTrack = midi.addTrack();
  extraOrnamentTrack.instrument.number = 90;
  extraOrnamentTrack.addNote({ midi: 83, time: 0.5, duration: 0.2, velocity: 0.2 });
  extraOrnamentTrack.addNote({ midi: 84, time: 1.75, duration: 0.2, velocity: 0.2 });

  const drumTrack = midi.addTrack();
  drumTrack.channel = 9;
  drumTrack.addNote({ midi: 71, time: 0.25, duration: 0.2 });

  fs.writeFileSync(outputPath, Buffer.from(midi.toArray()));
}

function runConverter(label, extraArgs) {
  const outDir = path.join(tmpDir, label);
  const run = spawnSync(
    process.execPath,
    [
      "scripts/convert-midi.mjs",
      inputPath,
      "--title",
      "Smoke Test",
      "--artist",
      "Test Composer",
      "--category",
      "Classical",
      "--tier",
      "normal",
      "--out",
      outDir,
      ...extraArgs,
    ],
    { encoding: "utf8" },
  );

  assert(run.status === 0, run.stderr || run.stdout || `converter failed for ${label}`);

  return {
    stderr: run.stderr,
    meta: fs.readFileSync(path.join(outDir, "test-composer", "smoke-test", "_meta.md"), "utf8"),
    sheet: fs.readFileSync(path.join(outDir, "test-composer", "smoke-test", "normal.md"), "utf8"),
  };
}

function allChordsAtMost(sheet, maxKeys) {
  return [...sheet.matchAll(/\[([^\]]+)\]/g)].every((match) => match[1].length <= maxKeys);
}

function hasChordLongerThan(sheet, maxKeys) {
  return [...sheet.matchAll(/\[([^\]]+)\]/g)].some((match) => match[1].length > maxKeys);
}

function tokenCount(sheet) {
  return sheet.match(/\[[^\]]+\]|[^\s]/g)?.length ?? 0;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import midiPackage from "@tonejs/midi";

const { Midi } = midiPackage;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpp-converter-"));
const inputPath = path.join(tmpDir, "smoke.mid");
const outDir = path.join(tmpDir, "sheets");
const midi = new Midi();

midi.header.setTempo(120);
const track = midi.addTrack();
track.addNote({ midi: 36, time: 0, duration: 0.4 });
track.addNote({ midi: 37, time: 0.5, duration: 0.4 });
track.addNote({ midi: 60, time: 1, duration: 0.4 });
track.addNote({ midi: 64, time: 1.5, duration: 0.4 });
track.addNote({ midi: 67, time: 2, duration: 1 });
track.addNote({ midi: 72, time: 2, duration: 1 });
for (let midiNote = 48; midiNote <= 56; midiNote += 1) {
  track.addNote({ midi: midiNote, time: 3, duration: 1.5, velocity: midiNote === 56 ? 1 : 0.4 });
}

const drumTrack = midi.addTrack();
drumTrack.channel = 9;
drumTrack.addNote({ midi: 71, time: 0.25, duration: 0.2 });

fs.writeFileSync(inputPath, Buffer.from(midi.toArray()));
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
    "--arrangement",
    "full",
  ],
  { encoding: "utf8" },
);

assert(run.status === 0, run.stderr || run.stdout || "converter failed");

const meta = fs.readFileSync(path.join(outDir, "test-composer", "smoke-test", "_meta.md"), "utf8");
const sheet = fs.readFileSync(path.join(outDir, "test-composer", "smoke-test", "normal.md"), "utf8");

assert(meta.includes("tempo: 120"), "tempo was not read from MIDI");
assert(meta.includes('length: "00:05"'), "length was not calculated from MIDI");
assert(sheet.includes("1"), "C2 did not map to 1");
assert(sheet.includes("!"), "C#2 did not map to !");
assert(sheet.includes("t"), "C4 did not map to t");
assert(/\[[^\]]*(o|s)[^\]]*(s|o)[^\]]*\]/.test(sheet), "same-time notes were not grouped into a chord");
assert(!/\[\[|\]\]/.test(sheet), "nested bracket output was generated");
assert(!sheet.includes("a"), "percussion track was not skipped");
assert(/\][-\s]/.test(sheet), "long-note sustain was not rendered after the token");
assert(!/\[[^\]]*-/.test(sheet), "sustain dashes were rendered inside a chord");
assert([...sheet.matchAll(/\[([^\]]+)\]/g)].every((match) => match[1].length <= 6), "dense chords were not trimmed");
assert(run.stderr.includes("Skipped 1 drum/percussion MIDI track"), "percussion warning was not printed");
assert(run.stderr.includes("Trimmed"), "dense chord warning was not printed");

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log("converter smoke ok");

function assert(condition, message) {
  if (!condition) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(message);
  }
}

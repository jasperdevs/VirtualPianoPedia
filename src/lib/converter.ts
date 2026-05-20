import { Midi } from "@tonejs/midi";

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
const defaultMaxChordKeys = 6;
const defaultGridDivision = 24;

const noteNameToSemitone = new Map<string, number>([
  ["C", 0],
  ["C#", 1],
  ["D", 2],
  ["D#", 3],
  ["E", 4],
  ["F", 5],
  ["F#", 6],
  ["G", 7],
  ["G#", 8],
  ["A", 9],
  ["A#", 10],
  ["B", 11],
]);

export type ArrangementMode = "balanced" | "melody" | "full";

export type ConvertOptions = {
  transpose: number;
  sustain: boolean;
  groupChords: boolean;
  includeTiming: boolean;
  arrangement?: ArrangementMode;
  gridDivision?: number;
  maxChordKeys?: number;
};

export type ConversionMeta = {
  title: string;
  artist: string;
  game: string;
  category: string;
  tempo: number;
  length: string;
  transpose: number;
  source: string;
  tags: string[];
};

export type ConversionResult = {
  title: string;
  sheet: string;
  markdown: string;
  metaMarkdown: string;
  variantMarkdown: string;
  meta: ConversionMeta;
  folderSlug: string;
  noteCount: number;
  duration: string;
  warnings: string[];
};

type MidiNoteLike = {
  midi: number;
  name: string;
  time: number;
  ticks: number;
  duration: number;
  velocity: number;
  trackIndex: number;
  trackName: string;
  instrumentFamily: string;
  instrumentName: string;
};

type ShiftedMidiNote = MidiNoteLike & {
  mappedMidi: number;
};

function noteNameToMidi(name: string) {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);
  if (!match) return undefined;

  const semitone = noteNameToSemitone.get(match[1]);
  if (semitone === undefined) return undefined;

  return (Number(match[2]) + 1) * 12 + semitone;
}

function midiToVirtualKey(midi: number) {
  const index = midi - firstVirtualPianoMidi;
  return virtualPianoKeys[index];
}

function fitMidiToVirtualRange(midi: number) {
  let fitted = midi;

  while (fitted < firstVirtualPianoMidi) fitted += 12;
  while (fitted > lastVirtualPianoMidi) fitted -= 12;

  return fitted;
}

function isPercussionTrack(track: { channel?: number; instrument?: { percussion?: boolean; family?: string; name?: string } }) {
  return track.channel === 9 || track.instrument?.percussion === true || track.instrument?.family === "drums" || /drum|percussion/i.test(track.instrument?.name ?? "");
}

function renderMidiGroup(notes: ShiftedMidiNote[], options: ConvertOptions) {
  const maxChordKeys = Math.max(1, Math.min(10, Math.round(options.maxChordKeys ?? defaultMaxChordKeys)));
  const byKey = new Map<string, { key: string; midi: number; duration: number; velocity: number }>();

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

function selectArrangementNotes(notes: MidiNoteLike[], arrangement: ArrangementMode) {
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
    }, new Map<number, { trackIndex: number; name: string; family: string; instrument: string; count: number; midiTotal: number; velocityTotal: number }>()),
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

  const keep = new Set<number>();
  const melodicLimit = arrangement === "melody" ? 2 : 3;

  for (const track of melodicTracks.slice(0, melodicLimit)) {
    keep.add(track.trackIndex);
  }

  if (arrangement === "balanced" && bassTrack) {
    keep.add(bassTrack.trackIndex);
  }

  return notes.filter((note) => keep.has(note.trackIndex));
}

function chooseQuantizeTicks(notes: MidiNoteLike[], ppq: number, requestedDivision?: number) {
  if (requestedDivision && Number.isFinite(requestedDivision) && requestedDivision > 0) {
    return Math.max(1, Math.round(ppq / requestedDivision));
  }

  const candidates = [12, 16, 24, 32].map((division) => Math.max(1, Math.round(ppq / division)));

  return candidates
    .map((ticks) => {
      const totalError = notes.reduce((sum, note) => sum + Math.abs(note.ticks - Math.round(note.ticks / ticks) * ticks), 0);
      const averageError = totalError / Math.max(1, notes.length);
      return { ticks, averageError };
    })
    .sort((a, b) => a.averageError - b.averageError || a.ticks - b.ticks)[0].ticks;
}

function chooseOctaveShift(notes: MidiNoteLike[], transpose: number) {
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

function noteNameToKey(name: string, transpose: number) {
  const midi = noteNameToMidi(name);
  if (midi === undefined) return name.toLowerCase().replace("#", "");

  const fitted = fitMidiToVirtualRange(midi + transpose);
  return midiToVirtualKey(fitted) ?? name.toLowerCase().replace("#", "");
}

function normalizePlainText(input: string, options: ConvertOptions) {
  const extracted = extractSheetBody(input).replace(/\[\s*\]/g, " ");
  const outputLines: string[] = [];

  for (const line of extracted.split(/\r?\n/)) {
    const tokens = line
      .replace(/[,;]/g, " ")
      .split(/\s+/)
      .flatMap((token) => normalizeNotationToken(token, options))
      .filter(Boolean);

    for (let index = 0; index < tokens.length; index += 16) {
      outputLines.push(tokens.slice(index, index + 16).join(" "));
    }

    if (!tokens.length && outputLines.length && outputLines.at(-1) !== "") {
      outputLines.push("");
    }
  }

  return outputLines.join("\n").trim();
}

export async function convertInput(input: string | ArrayBuffer, fileName: string, options: ConvertOptions): Promise<ConversionResult> {
  const isMidi = input instanceof ArrayBuffer || /\.midi?$/i.test(fileName);
  const warnings: string[] = [];
  let sheet = "";
  let noteCount = 0;
  let duration = "00:00";
  let tempo = 100;

  if (isMidi && input instanceof ArrayBuffer) {
    const midi = new Midi(input);
    const skippedTracks = midi.tracks.filter(isPercussionTrack).length;
    const rawNotes = midi.tracks
      .flatMap((track, trackIndex) => (isPercussionTrack(track) ? [] : track.notes.map((note) => ({ note, track, trackIndex }))))
      .map((note) => ({
        midi: note.note.midi,
        name: note.note.name,
        time: note.note.time,
        ticks: note.note.ticks,
        duration: note.note.duration,
        velocity: note.note.velocity,
        trackIndex: note.trackIndex,
        trackName: note.track.name,
        instrumentFamily: note.track.instrument.family,
        instrumentName: note.track.instrument.name,
      }))
      .sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);
    const notes = selectArrangementNotes(rawNotes, options.arrangement ?? "balanced").sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);

    noteCount = notes.length;
    const endTime = notes.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
    duration = formatDuration(endTime);
    tempo = Math.round(midi.header.tempos[0]?.bpm ?? 100);

    if (!notes.length) {
      warnings.push("No MIDI notes were found.");
    }

    if (skippedTracks) {
      warnings.push(`Skipped ${skippedTracks} drum/percussion MIDI track${skippedTracks === 1 ? "" : "s"}.`);
    }

    if (rawNotes.length !== notes.length) {
      warnings.push(`Kept ${notes.length} of ${rawNotes.length} non-drum MIDI notes using ${options.arrangement ?? "balanced"} arrangement mode.`);
    }

    const octaveShift = chooseOctaveShift(notes, options.transpose);
    const shiftedNotes = notes.map((note) => ({
      ...note,
      mappedMidi: note.midi + options.transpose + octaveShift,
    }));
    const foldedCount = shiftedNotes.filter((note) => note.mappedMidi < firstVirtualPianoMidi || note.mappedMidi > lastVirtualPianoMidi).length;

    if (octaveShift !== 0) {
      warnings.push(`Auto-shifted MIDI by ${octaveShift / 12} octave${Math.abs(octaveShift) === 12 ? "" : "s"} to fit the Roblox virtual piano range.`);
    }

    if (foldedCount) {
      warnings.push(`${foldedCount} notes were outside the playable range and were folded by octave.`);
    }

    const ppq = Math.max(1, midi.header.ppq || 480);
    const quantizeTicks = chooseQuantizeTicks(notes, ppq, options.gridDivision ?? defaultGridDivision);
    const groups: Array<{ time: number; ticks: number; notes: typeof shiftedNotes }> = [];

    for (const note of shiftedNotes) {
      const quantizedTicks = Math.round(note.ticks / quantizeTicks) * quantizeTicks;
      const previous = groups.at(-1);
      if (previous && previous.ticks === quantizedTicks) {
        previous.notes.push(note);
      } else {
        groups.push({ time: midi.header.ticksToSeconds(quantizedTicks), ticks: quantizedTicks, notes: [note] });
      }
    }

    const lines: string[] = [];
    let currentLine: string[] = [];
    let previousTime = 0;
    let trimmedChordCount = 0;

    for (const group of groups) {
      const gap = group.time - previousTime;

      if (gap > 0.7 && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }

      if (options.includeTiming && gap > 0.35) {
        currentLine.push(`(${gap.toFixed(1)}s)`);
      }

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
    sheet = lines.join("\n");
  } else {
    sheet = normalizePlainText(String(input), options);
    noteCount = sheet.split(/\s+/).filter(Boolean).length;
  }

  const title = titleFromFile(fileName);
  const folderSlug = slugify(title) || "converted-sheet";
  const meta: ConversionMeta = {
    title,
    artist: "Unknown",
    game: "Roblox Virtual Piano",
    category: "Pop",
    tempo,
    length: duration,
    transpose: options.transpose,
    source: "Converter submission",
    tags: ["submission"],
  };
  const metaMarkdown = createMetaMarkdown(meta);
  const variantMarkdown = `${sheet}\n`;
  const markdown = `# src/content/sheets/unknown/${folderSlug}/_meta.md\n\n${metaMarkdown}\n# src/content/sheets/unknown/${folderSlug}/normal.md\n\n${variantMarkdown}`;

  return { title, sheet, markdown, metaMarkdown, variantMarkdown, meta, folderSlug, noteCount, duration, warnings };
}

export function createMetaMarkdown(meta: ConversionMeta) {
  const tags = meta.tags.map((tag) => tag.trim()).filter(Boolean);

  return `---\ntitle: ${meta.title || "Untitled Sheet"}\nartist: ${meta.artist || "Unknown"}\ngame: ${meta.game || "Roblox Virtual Piano"}\ncategory: ${meta.category || "Pop"}\ntempo: ${Number(meta.tempo) || 100}\nlength: "${meta.length || "00:00"}"\ntranspose: ${Number(meta.transpose) || 0}\nsource: ${meta.source || "Converter submission"}\ntags:\n${tags.length ? tags.map((tag) => `  - ${tag}`).join("\n") : "  - submission"}\n---\n`;
}

function extractSheetBody(input: string) {
  const headers = Array.from(input.matchAll(/^#\s+(.+\.md)\s*$/gm));
  let sheetHeader: RegExpExecArray | undefined;

  for (const header of headers) {
    if (!header[1].endsWith("_meta.md")) sheetHeader = header;
  }

  if (sheetHeader) {
    const start = sheetHeader.index + sheetHeader[0].length;
    const nextHeader = headers.find((match) => match.index > start);
    return input.slice(start, nextHeader?.index).trim();
  }

  return input.replace(/^---[\s\S]*?---\s*/, "").trim();
}

function normalizeNotationToken(rawToken: string, options: ConvertOptions): string[] {
  const token = rawToken.replace(/\[\s*\]/g, "").trim();
  if (!token) return [];

  if (token.startsWith("[") && token.endsWith("]")) {
    return collapseBracketToken(token);
  }

  if (token.includes("[") || token.includes("]")) {
    const chunks = token.match(/\[[^\][]+\]|[^\][]+/g) ?? [token];
    return chunks.flatMap((chunk) => {
      if (chunk.includes("[") || chunk.includes("]")) return collapseBracketToken(chunk);
      return normalizePlainToken(chunk, options);
    });
  }

  return normalizePlainToken(token, options);
}

function collapseBracketToken(token: string) {
  const inner = token.replaceAll("[", "").replaceAll("]", "").replace(/\s/g, "");
  return inner ? [`[${inner}]`] : [];
}

function normalizePlainToken(token: string, options: ConvertOptions) {
  if (/^[A-G]#?-?\d+$/.test(token)) return [noteNameToKey(token, options.transpose)];
  return token ? [token] : [];
}

function titleFromFile(fileName: string) {
  const cleaned = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Untitled Sheet";
}

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

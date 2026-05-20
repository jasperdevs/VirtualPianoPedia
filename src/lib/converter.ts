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

export type ConvertOptions = {
  transpose: number;
  sustain: boolean;
  groupChords: boolean;
  includeTiming: boolean;
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
  duration: number;
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
    const notes = midi.tracks
      .flatMap((track) => track.notes)
      .map((note) => ({
        midi: note.midi,
        name: note.name,
        time: note.time,
        duration: note.duration,
      }))
      .sort((a, b) => a.time - b.time || a.midi - b.midi);

    noteCount = notes.length;
    const endTime = notes.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
    duration = formatDuration(endTime);
    tempo = Math.round(midi.header.tempos[0]?.bpm ?? 100);

    if (!notes.length) {
      warnings.push("No MIDI notes were found.");
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

    const groups: Array<{ time: number; notes: typeof shiftedNotes }> = [];

    for (const note of shiftedNotes) {
      const previous = groups.at(-1);
      if (previous && Math.abs(note.time - previous.time) < 0.035) {
        previous.notes.push(note);
      } else {
        groups.push({ time: note.time, notes: [note] });
      }
    }

    const lines: string[] = [];
    let currentLine: string[] = [];
    let previousTime = 0;

    for (const group of groups) {
      const gap = group.time - previousTime;

      if (gap > 0.7 && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }

      if (options.includeTiming && gap > 0.35) {
        currentLine.push(`(${gap.toFixed(1)}s)`);
      }

      const keys = group.notes
        .map((note) => {
          const fitted = fitMidiToVirtualRange(note.mappedMidi);
          const key = midiToVirtualKey(fitted);
          return key ? (options.sustain && note.duration > 0.8 ? `${key}-` : key) : "";
        })
        .filter(Boolean);

      if (keys.length) {
        currentLine.push(options.groupChords && keys.length > 1 ? `[${keys.join("")}]` : keys.join(" "));
      }

      if (currentLine.length >= 16) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }

      previousTime = group.time;
    }

    if (currentLine.length) lines.push(currentLine.join(" "));
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

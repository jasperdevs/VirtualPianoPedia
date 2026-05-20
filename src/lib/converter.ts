import { Midi } from "@tonejs/midi";

const noteToKey = new Map<string, string>([
  ["C", "a"],
  ["C#", "w"],
  ["D", "s"],
  ["D#", "e"],
  ["E", "d"],
  ["F", "f"],
  ["F#", "t"],
  ["G", "g"],
  ["G#", "y"],
  ["A", "h"],
  ["A#", "u"],
  ["B", "j"],
]);

export type ConvertOptions = {
  transpose: number;
  sustain: boolean;
  groupChords: boolean;
  includeTiming: boolean;
};

export type ConversionResult = {
  title: string;
  sheet: string;
  markdown: string;
  metaMarkdown: string;
  variantMarkdown: string;
  folderSlug: string;
  noteCount: number;
  duration: string;
};

function transposeName(name: string, steps: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);
  if (!match) return name;
  const index = names.indexOf(match[1]);
  if (index === -1) return name;
  const nextIndex = (index + steps + 120) % 12;
  return `${names[nextIndex]}${match[2]}`;
}

function noteNameToKey(name: string, transpose: number) {
  const transposed = transposeName(name, transpose);
  const pitch = transposed.replace(/-?\d+$/, "");
  const key = noteToKey.get(pitch);
  return key ?? pitch.toLowerCase().replace("#", "");
}

function normalizePlainText(input: string, options: ConvertOptions) {
  const notes = input
    .replace(/[,|]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const converted = notes.map((note) => {
    if (/^[A-G]#?-?\d+$/.test(note)) return noteNameToKey(note, options.transpose);
    return note;
  });

  return converted.join(" ");
}

export async function convertInput(input: string | ArrayBuffer, fileName: string, options: ConvertOptions): Promise<ConversionResult> {
  const isMidi = input instanceof ArrayBuffer || /\.midi?$/i.test(fileName);
  let sheet = "";
  let noteCount = 0;
  let duration = "00:00";

  if (isMidi && input instanceof ArrayBuffer) {
    const midi = new Midi(input);
    const notes = midi.tracks
      .flatMap((track) => track.notes)
      .sort((a, b) => a.time - b.time);
    noteCount = notes.length;
    const endTime = notes.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
    duration = formatDuration(endTime);

    const lines: string[] = [];
    let currentLine: string[] = [];
    let previousTime = 0;

    for (const note of notes) {
      const gap = note.time - previousTime;
      const key = noteNameToKey(note.name, options.transpose);
      const token = options.sustain && note.duration > 0.8 ? `${key}-` : key;
      const timing = options.includeTiming && gap > 0.25 ? `(${gap.toFixed(1)}s)` : "";

      if (gap > 0.55 && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }

      const previous = currentLine.at(-1);
      if (options.groupChords && previous && gap < 0.04) {
        currentLine[currentLine.length - 1] = `[${previous}${token}]`;
      } else {
        currentLine.push(`${timing}${token}`);
      }
      previousTime = note.time;
    }

    if (currentLine.length) lines.push(currentLine.join(" "));
    sheet = lines.join("\n");
  } else {
    sheet = normalizePlainText(String(input), options);
    noteCount = sheet.split(/\s+/).filter(Boolean).length;
  }

  const title = fileName.replace(/\.[^.]+$/, "") || "Untitled Sheet";
  const folderSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "converted-sheet";
  const metaMarkdown = `---\ntitle: ${title}\nartist: Unknown\ngame: Roblox Virtual Piano\ncategory: Pop\ntempo: 100\nlength: "${duration}"\ntranspose: ${options.transpose}\nsource: Converter submission\ntags:\n  - submission\n---\n`;
  const variantMarkdown = `${sheet}\n`;
  const markdown = `# src/content/sheets/unknown/${folderSlug}/_meta.md\n\n${metaMarkdown}\n# src/content/sheets/unknown/${folderSlug}/normal.md\n\n${variantMarkdown}`;

  return { title, sheet, markdown, metaMarkdown, variantMarkdown, folderSlug, noteCount, duration };
}

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

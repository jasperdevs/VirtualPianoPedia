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
};

export type ConversionResult = {
  title: string;
  sheet: string;
  markdown: string;
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

  if (isMidi && input instanceof ArrayBuffer) {
    const midi = new Midi(input);
    const notes = midi.tracks
      .flatMap((track) => track.notes)
      .sort((a, b) => a.time - b.time);

    const lines: string[] = [];
    let currentLine: string[] = [];
    let previousTime = 0;

    for (const note of notes) {
      const gap = note.time - previousTime;
      const key = noteNameToKey(note.name, options.transpose);
      const token = options.sustain && note.duration > 0.8 ? `${key}-` : key;

      if (gap > 0.55 && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }

      const previous = currentLine.at(-1);
      if (options.groupChords && previous && gap < 0.04) {
        currentLine[currentLine.length - 1] = `[${previous}${token}]`;
      } else {
        currentLine.push(token);
      }
      previousTime = note.time;
    }

    if (currentLine.length) lines.push(currentLine.join(" "));
    sheet = lines.join("\n");
  } else {
    sheet = normalizePlainText(String(input), options);
  }

  const title = fileName.replace(/\.[^.]+$/, "") || "Untitled Sheet";
  const markdown = `---\ntitle: ${title}\nartist: Unknown\ngame: Roblox Virtual Piano\ndifficulty: Beginner\ncategory: Pop\ntempo: 100\nlength: "00:00"\ntranspose: ${options.transpose}\nsource: Converter submission\ntags:\n  - submission\n---\n\n${sheet}\n`;

  return { title, sheet, markdown };
}

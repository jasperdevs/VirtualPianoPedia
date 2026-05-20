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

    const groups: Array<{ time: number; notes: typeof notes }> = [];

    for (const note of notes) {
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

      if (gap > 0.55 && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }

      if (options.includeTiming && gap > 0.25) {
        currentLine.push(`(${gap.toFixed(1)}s)`);
      }

      const keys = group.notes.map((note) => {
        const key = noteNameToKey(note.name, options.transpose);
        return options.sustain && note.duration > 0.8 ? `${key}-` : key;
      });

      if (options.groupChords && keys.length > 1) {
        currentLine.push(`[${keys.join("")}]`);
      } else {
        currentLine.push(...keys);
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
    tempo: 100,
    length: duration,
    transpose: options.transpose,
    source: "Converter submission",
    tags: ["submission"],
  };
  const metaMarkdown = createMetaMarkdown(meta);
  const variantMarkdown = `${sheet}\n`;
  const markdown = `# src/content/sheets/unknown/${folderSlug}/_meta.md\n\n${metaMarkdown}\n# src/content/sheets/unknown/${folderSlug}/normal.md\n\n${variantMarkdown}`;

  return { title, sheet, markdown, metaMarkdown, variantMarkdown, meta, folderSlug, noteCount, duration };
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

export type PlayableToken = {
  label: string;
  keys: string[];
  duration: number;
};

const keySemitone = new Map<string, number>([
  ["1", -12],
  ["2", -10],
  ["3", -8],
  ["4", -7],
  ["5", -5],
  ["6", -3],
  ["7", -1],
  ["8", 0],
  ["9", 2],
  ["0", 4],
  ["a", 0],
  ["w", 1],
  ["s", 2],
  ["e", 3],
  ["d", 4],
  ["f", 5],
  ["t", 6],
  ["g", 7],
  ["y", 8],
  ["h", 9],
  ["u", 10],
  ["j", 11],
  ["k", 12],
  ["o", 13],
  ["l", 14],
  ["p", 15],
]);

const pianoSampleBase = "https://cdn.jsdelivr.net/npm/@audio-samples/piano-mp3-velocity16@1.0.5/audio/";
const sampleNotes = [
  "A0",
  "C1",
  "D#1",
  "F#1",
  "A1",
  "C2",
  "D#2",
  "F#2",
  "A2",
  "C3",
  "D#3",
  "F#3",
  "A3",
  "C4",
  "D#4",
  "F#4",
  "A4",
  "C5",
  "D#5",
  "F#5",
  "A5",
  "C6",
  "D#6",
  "F#6",
  "A6",
  "C7",
  "D#7",
  "F#7",
  "A7",
  "C8",
].map((name) => ({ name, midi: noteNameToMidi(name) }));

const sampleCache = new Map<string, Promise<AudioBuffer>>();

export function parsePlayableTokens(sheet: string): PlayableToken[] {
  const tokens = sheet.match(/\([^)]+\)|\[[^\]]+\]|[A-Za-z0-9]-?|\|/g) ?? [];

  return tokens
    .filter((token) => token !== "|" && !token.startsWith("("))
    .map((token) => {
      const raw = token.replace(/^\[|\]$/g, "");
      const keys = raw
        .replace(/-/g, "")
        .split("")
        .filter((key) => keySemitone.has(key.toLowerCase()));

      return {
        label: token,
        keys,
        duration: token.includes("-") ? 0.42 : 0.24,
      };
    })
    .filter((token) => token.keys.length);
}

export async function preloadPianoSamples(audioContext: AudioContext) {
  await Promise.all(["C4", "D#4", "F#4", "A4", "C5"].map((note) => loadSample(audioContext, note).catch(() => null)));
}

export async function playToken(audioContext: AudioContext, token: PlayableToken, startTime = audioContext.currentTime) {
  const output = audioContext.createGain();
  output.gain.setValueAtTime(0.0001, startTime);
  output.gain.exponentialRampToValueAtTime(0.34, startTime + 0.014);
  output.gain.exponentialRampToValueAtTime(0.0001, startTime + token.duration + 0.22);
  output.connect(audioContext.destination);

  await Promise.all(
    token.keys.map(async (key) => {
      const semitone = keySemitone.get(key.toLowerCase()) ?? 0;
      const midi = 60 + semitone;
      await playSample(audioContext, output, midi, startTime, token.duration);
    }),
  );
}

async function playSample(audioContext: AudioContext, output: GainNode, midi: number, startTime: number, duration: number) {
  const nearest = nearestSample(midi);

  try {
    const buffer = await loadSample(audioContext, nearest.name);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(2 ** ((midi - nearest.midi) / 12), startTime);
    source.connect(output);
    source.start(startTime);
    source.stop(startTime + duration + 0.45);
  } catch {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(261.63 * 2 ** ((midi - 60) / 12), startTime);
    oscillator.connect(output);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }
}

function loadSample(audioContext: AudioContext, noteName: string) {
  const cacheKey = `${audioContext.sampleRate}:${noteName}`;
  const cached = sampleCache.get(cacheKey);
  if (cached) return cached;

  const promise = fetch(`${pianoSampleBase}${encodeURIComponent(`${noteName}v16.mp3`)}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load piano sample ${noteName}`);
      return response.arrayBuffer();
    })
    .then((buffer) => audioContext.decodeAudioData(buffer));

  sampleCache.set(cacheKey, promise);
  return promise;
}

function nearestSample(midi: number) {
  return sampleNotes.reduce((best, sample) => (Math.abs(sample.midi - midi) < Math.abs(best.midi - midi) ? sample : best), sampleNotes[0]);
}

function noteNameToMidi(name: string) {
  const match = /^([A-G])(#?)(\d)$/.exec(name);
  if (!match) return 60;

  const [, letter, sharp, octave] = match;
  const semitoneByLetter: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  return (Number(octave) + 1) * 12 + semitoneByLetter[letter] + (sharp ? 1 : 0);
}

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

export function playToken(audioContext: AudioContext, token: PlayableToken, startTime = audioContext.currentTime) {
  const output = audioContext.createGain();
  output.gain.setValueAtTime(0.0001, startTime);
  output.gain.exponentialRampToValueAtTime(0.13, startTime + 0.012);
  output.gain.exponentialRampToValueAtTime(0.0001, startTime + token.duration);
  output.connect(audioContext.destination);

  for (const key of token.keys) {
    const semitone = keySemitone.get(key.toLowerCase()) ?? 0;
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(261.63 * 2 ** (semitone / 12), startTime);
    oscillator.connect(output);
    oscillator.start(startTime);
    oscillator.stop(startTime + token.duration + 0.02);
  }
}

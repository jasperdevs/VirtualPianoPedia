import { useEffect, useMemo, useRef, useState } from "react";
import { PauseIcon, PlayIcon, SpeakerHighIcon, StopIcon } from "@phosphor-icons/react";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidPanel } from "@/components/fluid/FluidPanel";
import { parsePlayableTokens, playToken, preloadPianoSamples } from "@/lib/playback";
import { cn } from "@/lib/utils";

type SheetPlayerProps = {
  sheet: string;
  className?: string;
};

export function SheetPlayer({ sheet, className }: SheetPlayerProps) {
  const tokens = useMemo(() => parsePlayableTokens(sheet), [sheet]);
  const previewTokens = tokens.slice(0, 180);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    return () => {
      stopRef.current = true;
      void audioRef.current?.close();
    };
  }, []);

  async function play() {
    if (!tokens.length) return;
    try {
      setError("");
      stopRef.current = false;
      setPlaying(true);
      audioRef.current ??= new AudioContext();
      await audioRef.current.resume();
      setLoading(true);
      await preloadPianoSamples(audioRef.current, tokens);
      setLoading(false);

      for (let index = 0; index < tokens.length; index += 1) {
        if (stopRef.current) break;
        setActiveIndex(index);
        await playToken(audioRef.current, tokens[index]);
        await wait(tokens[index].duration * 1000 + 70);
      }
    } catch {
      setError("Playback failed. Try pressing Play again.");
    } finally {
      setPlaying(false);
      setLoading(false);
      setActiveIndex(null);
    }
  }

  function stop() {
    stopRef.current = true;
    setPlaying(false);
    setLoading(false);
    setActiveIndex(null);
  }

  return (
    <FluidPanel className={cn("overflow-hidden", className)}>
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <SpeakerHighIcon className="size-4" />
              Preview
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{loading ? "Loading piano samples" : `${tokens.length} playable notes detected`}</div>
          </div>
          <div className="flex gap-2">
            <FluidButton onClick={playing ? stop : play} size="sm" disabled={!tokens.length || loading}>
              {playing ? <PauseIcon /> : <PlayIcon />}
              {loading ? "Loading" : playing ? "Pause" : "Play"}
            </FluidButton>
            <FluidButton onClick={stop} variant="outline" size="sm" disabled={!playing && activeIndex === null && !loading}>
              <StopIcon />
              Stop
            </FluidButton>
          </div>
        </div>
        {error ? <div className="mt-3 text-xs text-destructive">{error}</div> : null}
        <div className="mt-4 flex max-h-32 flex-wrap gap-1.5 overflow-auto rounded-xl bg-background/45 p-3 font-mono text-xs ring-1 ring-border/50 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
          {previewTokens.map((token, index) => (
            <span
              key={`${token.label}-${index}`}
              className={cn(
                "rounded-md px-2 py-1 text-muted-foreground transition-colors",
                activeIndex === index ? "bg-foreground text-background" : "bg-background",
              )}
            >
              {token.label}
            </span>
          ))}
          {tokens.length > previewTokens.length ? (
            <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">+{tokens.length - previewTokens.length}</span>
          ) : null}
        </div>
      </div>
    </FluidPanel>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

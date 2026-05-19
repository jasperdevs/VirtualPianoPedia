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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
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
    stopRef.current = false;
    setPlaying(true);
    audioRef.current ??= new AudioContext();
    await audioRef.current.resume();
    setLoading(true);
    await preloadPianoSamples(audioRef.current);
    setLoading(false);

    for (let index = 0; index < tokens.length; index += 1) {
      if (stopRef.current) break;
      setActiveIndex(index);
      await playToken(audioRef.current, tokens[index]);
      await wait(tokens[index].duration * 1000 + 70);
    }

    setPlaying(false);
    setLoading(false);
    setActiveIndex(null);
  }

  function stop() {
    stopRef.current = true;
    setPlaying(false);
    setLoading(false);
    setActiveIndex(null);
  }

  return (
    <FluidPanel className={cn("p-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <SpeakerHighIcon className="size-4" />
            Preview
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{loading ? "Loading piano samples" : `${tokens.length} playable notes detected`}</div>
        </div>
        <div className="flex gap-2">
          <FluidButton onClick={playing ? stop : play} size="sm">
            {playing ? <PauseIcon /> : <PlayIcon />}
            {playing ? "Pause" : "Play"}
          </FluidButton>
          <FluidButton onClick={stop} variant="outline" size="sm" disabled={!playing && activeIndex === null}>
            <StopIcon />
            Stop
          </FluidButton>
        </div>
      </div>
      <div className="mt-4 flex max-h-32 flex-wrap gap-1.5 overflow-auto font-mono text-xs">
        {tokens.slice(0, 180).map((token, index) => (
          <span
            key={`${token.label}-${index}`}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground transition",
              activeIndex === index ? "bg-foreground text-background" : "bg-background",
            )}
          >
            {token.label}
          </span>
        ))}
      </div>
    </FluidPanel>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

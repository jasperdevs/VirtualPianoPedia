import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, GithubLogoIcon, GaugeIcon, MetronomeIcon, MusicNoteIcon, StarIcon } from "@phosphor-icons/react";
import { FluidBadge } from "@/components/fluid/FluidBadge";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidChoice } from "@/components/fluid/FluidChoice";
import { FluidCopy } from "@/components/fluid/FluidCopy";
import { FluidPanel } from "@/components/fluid/FluidPanel";
import { useFavorites } from "@/lib/favorites";
import { getSheet } from "@/lib/sheets";
import { cn } from "@/lib/utils";

export function SheetPage() {
  const params = useParams();
  const slug = params["*"];
  const sheet = slug ? getSheet(slug) : undefined;
  const [variantIndex, setVariantIndex] = useState(0);
  const [sheetPanelHeight, setSheetPanelHeight] = useState<number>();
  const sheetPanelRef = useRef<HTMLDivElement | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const panel = sheetPanelRef.current;
    if (!panel) {
      setSheetPanelHeight(undefined);
      return;
    }

    const updateHeight = () => setSheetPanelHeight(Math.round(panel.getBoundingClientRect().height));
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(panel);

    return () => observer.disconnect();
  }, [slug, variantIndex]);

  if (!sheet) return <Navigate to="/" replace />;

  const activeVariant = sheet.variants[variantIndex] ?? sheet.variants[0];
  const activeLength = activeVariant.length ?? sheet.length;
  const activeTempo = activeVariant.tempo ?? sheet.tempo;
  const activeTranspose = activeVariant.transpose ?? sheet.transpose;
  const rawUrl = `https://github.com/jasperdevs/VirtualPianoPedia/blob/main/src/content/sheets/${sheet.slug}/${activeVariant.fileName}`;

  return (
    <section className="h-full overflow-hidden bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1200px] min-h-0 flex-col">
        <FluidButton asChild variant="ghost" className="-ml-3 mb-3 shrink-0 self-start">
          <Link to="/">
            <ArrowLeftIcon />
            Browse
          </Link>
        </FluidButton>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid shrink-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                <TagLink to={`/?category=${encodeURIComponent(sheet.category)}`} label={sheet.category} primary />
                <TagLink to={`/?tag=${encodeURIComponent(sheet.game)}`} label={sheet.game} />
                {sheet.tags.map((tag) => (
                  <TagLink key={tag} to={`/?tag=${encodeURIComponent(tag)}`} label={tag} />
                ))}
              </div>

              <h1 className="max-w-4xl text-balance text-3xl font-semibold leading-[1.16] sm:text-4xl lg:text-5xl">{sheet.title}</h1>
              <Link to={`/artist/${sheet.artistSlug}`} className="mt-2 inline-flex text-base text-muted-foreground hover:text-foreground hover:underline sm:text-lg">
                {sheet.artist}
              </Link>
            </div>

            <div className="inline-flex w-fit flex-wrap rounded-full bg-muted/70 p-1 lg:ml-auto">
              {sheet.variants.map((variant, index) => (
                <FluidChoice key={variant.tier} onClick={() => setVariantIndex(index)} active={variantIndex === index}>
                  {variant.tier}
                </FluidChoice>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div ref={sheetPanelRef} className="min-w-0 self-start">
              <FluidPanel className="flex max-h-[calc(100dvh-20rem)] min-h-0 flex-col overflow-hidden bg-card/80 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ring-1 ring-border/50">
                <div className="flex shrink-0 items-center justify-between gap-3 bg-muted/20 px-5 py-3">
                  <FluidBadge className="bg-background text-foreground ring-1 ring-border/60">{activeVariant.tier}</FluidBadge>
                  <FluidCopy value={activeVariant.body} />
                </div>
                <div className="relative min-h-0 bg-background/35">
                  <SheetNotation body={activeVariant.body} />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>
              </FluidPanel>
            </div>

            <aside
              className="min-h-0 lg:h-[var(--song-panel-height)] lg:self-start"
              style={sheetPanelHeight ? ({ "--song-panel-height": `${sheetPanelHeight}px` } as React.CSSProperties) : undefined}
            >
              <FluidPanel className="flex h-full min-h-0 flex-col overflow-hidden border border-border/70 bg-card p-3">
                <div className="mb-2 flex shrink-0 items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">More info</h2>
                  <span className="text-xs font-medium text-muted-foreground">{activeVariant.tier}</span>
                </div>
                {sheet.imageUrl ? (
                  <div className="mb-2 h-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/45">
                    <img src={sheet.imageUrl} alt={sheet.imageAlt ?? ""} loading="lazy" className="h-full w-full object-cover outline outline-1 outline-black/10 dark:outline-white/10" />
                  </div>
                ) : null}
                <div className="mb-2 grid shrink-0 grid-cols-2 gap-2">
                  <FluidButton variant="outline" size="sm" onClick={() => toggleFavorite(sheet.slug)} className="w-full">
                    <StarIcon weight={isFavorite(sheet.slug) ? "fill" : "regular"} />
                    {isFavorite(sheet.slug) ? "Saved" : "Save"}
                  </FluidButton>
                  <FluidButton asChild size="sm" className="w-full">
                    <a href={rawUrl} target="_blank" rel="noreferrer">
                      <GithubLogoIcon />
                      Edit
                    </a>
                  </FluidButton>
                </div>
                <div className="my-2 space-y-0.5 rounded-xl bg-background/45 p-2 ring-1 ring-border/45">
                  <Info icon={<GaugeIcon />} label="Level" value={activeVariant.tier} />
                  {activeLength ? <Info icon={<MetronomeIcon />} label="Target length" value={activeLength} /> : null}
                  {activeTempo ? <Info icon={<MetronomeIcon />} label="Tempo" value={`${activeTempo} bpm`} /> : null}
                  {activeTranspose !== undefined ? <Info icon={<MusicNoteIcon />} label="Transpose" value={String(activeTranspose)} /> : null}
                </div>
                {sheet.imageSource ? (
                  <a href={sheet.imageSource} target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">
                    Image: {sheet.imageCredit ?? "source"}
                  </a>
                ) : null}
              </FluidPanel>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function TagLink({ to, label, primary = false }: { to: string; label: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex h-6 select-none items-center rounded-full px-2.5 text-xs font-medium transition-[background-color,color] hover:bg-foreground hover:text-background",
        primary ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function SheetNotation({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);

  return (
    <div className="max-h-[calc(100dvh-24rem)] overflow-y-auto px-5 pb-8 pt-5 font-mono text-[13px] leading-7 text-foreground/90 sm:px-6 sm:text-sm">
      {lines.map((line, lineIndex) => {
        const parts = line.split(/(\s+)/);

        if (!line.trim()) return <div key={lineIndex} className="h-4" />;

        return (
          <div key={lineIndex} className="whitespace-pre-wrap break-words py-[1px]">
            {parts.map((part, partIndex) =>
              /^\s+$/.test(part) ? (
                <span key={`${lineIndex}-${partIndex}`}>{part}</span>
              ) : (
                <span key={`${lineIndex}-${partIndex}-${part}`} className={notationTokenClass(part)}>
                  {part}
                </span>
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}

function notationTokenClass(token: string) {
  return cn(
    "inline rounded-[5px] font-mono tabular-nums",
    /^\[[^\]]+\]$/.test(token) && "bg-muted/55 px-1 py-0.5 text-foreground ring-1 ring-border/35",
    /^\([^)]+\)$/.test(token) && "bg-muted/25 px-1 py-0.5 text-muted-foreground",
    token === "|" && "px-0.5 text-muted-foreground/45",
    token.includes("-") && token !== "|" && "text-amber-200",
    !/^\[[^\]]+\]$/.test(token) && !/^\([^)]+\)$/.test(token) && token !== "|" && !token.includes("-") && "text-foreground/90",
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

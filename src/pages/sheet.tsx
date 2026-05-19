import { useState } from "react";
import type React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, GithubLogoIcon, GaugeIcon, MetronomeIcon, MusicNoteIcon, StarIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FluidCopy } from "@/components/fluid/FluidCopy";
import { useFavorites } from "@/lib/favorites";
import { SheetPlayer } from "@/components/SheetPlayer";
import { getSheet, tierClass } from "@/lib/sheets";
import { cn } from "@/lib/utils";

export function SheetPage() {
  const { slug } = useParams();
  const sheet = slug ? getSheet(slug) : undefined;
  const [variantIndex, setVariantIndex] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!sheet) return <Navigate to="/" replace />;

  const activeVariant = sheet.variants[variantIndex] ?? sheet.variants[0];
  const rawUrl = `https://github.com/jasperdevs/VirtualPianoPedia/blob/main/src/content/sheets/${sheet.slug}/${activeVariant.fileName}`;

  return (
    <section className="min-h-[100dvh] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1360px]">
        <Button asChild variant="ghost" className="-ml-3 mb-7 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeftIcon />
            Browse
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge>{sheet.category}</Badge>
              <Badge variant="secondary">{sheet.game}</Badge>
              {sheet.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-border/70 bg-muted/45 text-foreground">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{sheet.title}</h1>
                <p className="mt-4 text-xl text-muted-foreground">{sheet.artist}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {sheet.variants.map((variant, index) => (
                <button
                  key={variant.tier}
                  type="button"
                  onClick={() => setVariantIndex(index)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98]",
                    variantIndex === index ? tierClass(variant.tier) : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {variant.tier}
                </button>
              ))}
            </div>

            <SheetPlayer sheet={activeVariant.body} className="mt-6" />

            <div className="mt-6 overflow-hidden rounded-2xl bg-muted/50">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(activeVariant.tier))}>{activeVariant.tier}</span>
                <FluidCopy value={activeVariant.body} />
              </div>
              <pre className="max-h-[760px] overflow-auto px-5 pb-7 pt-3 font-mono text-sm leading-8 text-foreground sm:text-base">{activeVariant.body}</pre>
            </div>
          </div>

          <aside className="space-y-3 lg:pt-28">
            <Button variant="outline" onClick={() => toggleFavorite(sheet.slug)} className="w-full">
              <StarIcon weight={isFavorite(sheet.slug) ? "fill" : "regular"} />
              {isFavorite(sheet.slug) ? "Saved" : "Save"}
            </Button>
            <Info icon={<GaugeIcon />} label="Default level" value={sheet.difficulty} />
            <Info icon={<MetronomeIcon />} label="Tempo" value={`${sheet.tempo} bpm`} />
            <Info icon={<MusicNoteIcon />} label="Transpose" value={String(sheet.transpose)} />
            <div className="pt-3">
              <Button asChild className="w-full">
                <a href={rawUrl} target="_blank" rel="noreferrer">
                  <GithubLogoIcon />
                  Edit on GitHub
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/55 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

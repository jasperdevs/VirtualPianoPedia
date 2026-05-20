import { useState } from "react";
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

export function SheetPage() {
  const { slug } = useParams();
  const sheet = slug ? getSheet(slug) : undefined;
  const [variantIndex, setVariantIndex] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!sheet) return <Navigate to="/" replace />;

  const activeVariant = sheet.variants[variantIndex] ?? sheet.variants[0];
  const rawUrl = `https://github.com/jasperdevs/VirtualPianoPedia/blob/main/src/content/sheets/${sheet.slug}/${activeVariant.fileName}`;

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <FluidButton asChild variant="ghost" className="-ml-3 mb-7">
          <Link to="/">
            <ArrowLeftIcon />
            Browse
          </Link>
        </FluidButton>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <FluidBadge color="white">{sheet.category}</FluidBadge>
              <FluidBadge>{sheet.game}</FluidBadge>
              {sheet.tags.map((tag) => (
                <FluidBadge key={tag}>
                  {tag}
                </FluidBadge>
              ))}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <h1 className="max-w-4xl text-4xl font-semibold leading-[0.98] tracking-tight sm:text-5xl">{sheet.title}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{sheet.artist}</p>
              </div>
            </div>

            <div className="mt-6 inline-flex flex-wrap rounded-full bg-muted/70 p-1">
              {sheet.variants.map((variant, index) => (
                <FluidChoice
                  key={variant.tier}
                  onClick={() => setVariantIndex(index)}
                  active={variantIndex === index}
                >
                  {variant.tier}
                </FluidChoice>
              ))}
            </div>

            <FluidPanel className="mt-6 overflow-hidden bg-card/80 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ring-1 ring-border/50">
              <div className="flex items-center justify-between gap-3 bg-muted/20 px-5 py-4">
                <FluidBadge className="bg-background text-foreground ring-1 ring-border/60">{activeVariant.tier}</FluidBadge>
                <FluidCopy value={activeVariant.body} />
              </div>
              <div className="relative bg-background/35">
                <pre className="max-h-[min(66dvh,760px)] overflow-y-auto whitespace-pre-wrap break-words px-5 pb-20 pt-5 font-mono text-[13px] leading-7 text-foreground/90 [tab-size:2] sm:px-6 sm:text-sm">{activeVariant.body}</pre>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/85 to-transparent" />
              </div>
            </FluidPanel>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start lg:pt-24">
            <FluidPanel className="border border-border/70 bg-card p-3">
              <FluidButton variant="outline" onClick={() => toggleFavorite(sheet.slug)} className="w-full">
                <StarIcon weight={isFavorite(sheet.slug) ? "fill" : "regular"} />
                {isFavorite(sheet.slug) ? "Saved" : "Save"}
              </FluidButton>
              <div className="my-3 space-y-1 rounded-xl bg-background/45 p-2 ring-1 ring-border/45">
                <Info icon={<GaugeIcon />} label="Level" value={sheet.difficulty} />
                <Info icon={<MetronomeIcon />} label="Tempo" value={`${sheet.tempo} bpm`} />
                <Info icon={<MusicNoteIcon />} label="Transpose" value={String(sheet.transpose)} />
              </div>
              <FluidButton asChild className="w-full">
                <a href={rawUrl} target="_blank" rel="noreferrer">
                  <GithubLogoIcon />
                  Edit on GitHub
                </a>
              </FluidButton>
            </FluidPanel>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

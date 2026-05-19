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
import { SheetPlayer } from "@/components/SheetPlayer";
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
    <section className="relative min-h-[calc(100dvh-4rem)] overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <img
        src="/VirtualPianoPedia/assets/piano-macro-bg.png"
        alt=""
        className="absolute right-0 top-0 h-[560px] w-full object-cover object-right-top opacity-95 brightness-[2.05] contrast-125 dark:brightness-[1.65]"
      />
      <div className="absolute inset-x-0 top-0 h-[640px] bg-[linear-gradient(180deg,hsl(var(--background)/0.05)_0%,hsl(var(--background)/0.42)_54%,hsl(var(--background))_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.82)_42%,hsl(var(--background)/0.28)_75%,hsl(var(--background)/0.66)_100%)]" />
      <div className="relative mx-auto max-w-[1500px]">
        <FluidButton asChild variant="ghost" className="-ml-3 mb-7">
          <Link to="/">
            <ArrowLeftIcon />
            Browse
          </Link>
        </FluidButton>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap gap-2">
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
                <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{sheet.title}</h1>
                <p className="mt-4 text-xl text-muted-foreground">{sheet.artist}</p>
              </div>
            </div>

            <div className="mt-8 inline-flex flex-wrap rounded-full bg-muted/70 p-1">
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

            <SheetPlayer sheet={activeVariant.body} className="mt-6" />

            <FluidPanel className="mt-6 overflow-hidden bg-card/82 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <FluidBadge>{activeVariant.tier}</FluidBadge>
                <FluidCopy value={activeVariant.body} />
              </div>
              <pre className="max-h-[760px] overflow-auto px-5 pb-7 pt-3 font-mono text-sm leading-8 text-foreground sm:text-base">{activeVariant.body}</pre>
            </FluidPanel>
          </div>

          <aside className="space-y-3 lg:pt-28">
            <FluidButton variant="outline" onClick={() => toggleFavorite(sheet.slug)} className="w-full">
              <StarIcon weight={isFavorite(sheet.slug) ? "fill" : "regular"} />
              {isFavorite(sheet.slug) ? "Saved" : "Save"}
            </FluidButton>
            <Info icon={<GaugeIcon />} label="Default level" value={sheet.difficulty} />
            <Info icon={<MetronomeIcon />} label="Tempo" value={`${sheet.tempo} bpm`} />
            <Info icon={<MusicNoteIcon />} label="Transpose" value={String(sheet.transpose)} />
            <div className="pt-3">
              <FluidButton asChild className="w-full">
                <a href={rawUrl} target="_blank" rel="noreferrer">
                  <GithubLogoIcon />
                  Edit on GitHub
                </a>
              </FluidButton>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <FluidPanel className="flex items-center justify-between gap-4 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </FluidPanel>
  );
}

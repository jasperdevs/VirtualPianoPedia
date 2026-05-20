import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, ArrowUpRightIcon, ClockIcon, ImageIcon, MetronomeIcon } from "@phosphor-icons/react";
import { FluidBadge } from "@/components/fluid/FluidBadge";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidPanel } from "@/components/fluid/FluidPanel";
import { getArtistProfile } from "@/lib/artists";
import { getArtistSheets, tierClass } from "@/lib/sheets";
import { cn } from "@/lib/utils";

export function ArtistPage() {
  const { artistSlug } = useParams();
  const works = artistSlug ? getArtistSheets(artistSlug) : [];

  if (!artistSlug || !works.length) return <Navigate to="/" replace />;

  const profile = getArtistProfile(artistSlug, works[0]?.artist);

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <FluidButton asChild variant="ghost" className="-ml-3 mb-7">
          <Link to="/">
            <ArrowLeftIcon />
            Browse
          </Link>
        </FluidButton>

        <div className="grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <FluidPanel className="overflow-hidden bg-card p-4 ring-1 ring-border/60">
            {profile.imageUrl ? (
              <img src={profile.imageUrl} alt={profile.imageAlt} loading="lazy" className="aspect-[4/5] w-full rounded-xl object-cover ring-1 ring-white/10" />
            ) : (
              <div className="grid aspect-[4/5] w-full place-items-center rounded-xl bg-muted text-muted-foreground">
                <ImageIcon className="size-8" />
              </div>
            )}
            <div className="mt-4">
              <FluidBadge>{profile.role}</FluidBadge>
              <h1 className="mt-3 text-3xl font-semibold">{profile.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{works.length} {works.length === 1 ? "sheet" : "sheets"} in the library</p>
              {profile.sourceUrl ? (
                <a href={profile.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs text-muted-foreground hover:text-foreground">
                  Photo: {profile.credit}
                </a>
              ) : null}
            </div>
          </FluidPanel>

          <FluidPanel className="overflow-hidden bg-card ring-1 ring-border/60">
            <div className="border-b border-border/60 px-5 py-4">
              <h2 className="text-2xl font-semibold">Works</h2>
            </div>
            <div className="divide-y divide-border/45">
              {works.map((sheet) => (
                <Link key={sheet.slug} to={`/sheet/${sheet.slug}`} className="group grid gap-2 px-5 py-4 transition-colors hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{sheet.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>{sheet.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="size-3.5" />
                        {sheet.length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MetronomeIcon className="size-3.5" />
                        {sheet.tempo} bpm
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    {sheet.variants.map((variant) => (
                      <span key={variant.tier} className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(variant.tier))}>
                        {variant.tier}
                      </span>
                    ))}
                    <ArrowUpRightIcon className="ml-1 hidden size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          </FluidPanel>
        </div>
      </div>
    </section>
  );
}

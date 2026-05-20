import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowUpRightIcon,
  ClockIcon,
  GaugeIcon,
  MagnifyingGlassIcon,
  MetronomeIcon,
  MusicNotesIcon,
  PianoKeysIcon,
  SparkleIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { FluidBadge } from "@/components/fluid/FluidBadge";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidInput } from "@/components/fluid/FluidInput";
import { FluidTabs } from "@/components/fluid/FluidTabs";
import { useFavorites } from "@/lib/favorites";
import { categoryNav, filterByCategory, getCategoryCount, searchSheets, sheets, sortSheets, tierClass, type Sheet } from "@/lib/sheets";
import { cn } from "@/lib/utils";

type SortMode = "artist" | "song" | "length";

const quickSearches = ["max richter", "debussy", "classical", "hard"];

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("tag") ?? "";
  const category = searchParams.get("category") ?? "All Sheets";
  const [sort, setSort] = useState<SortMode>("artist");
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const filteredSheets = sortSheets(searchSheets(filterByCategory(sheets, category, favorites), query), sort);

  function setQuery(value: string) {
    updateFilters({ query: value, category });
  }

  function setCategory(value: string) {
    updateFilters({ query, category: value });
  }

  function updateFilters({ query: nextQuery, category: nextCategory }: { query: string; category: string }) {
    const next = new URLSearchParams();
    if (nextCategory !== "All Sheets") next.set("category", nextCategory);
    if (nextQuery) next.set("tag", nextQuery);
    setSearchParams(next, { replace: true });
  }

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-background">
      <div className="grid min-h-[calc(100dvh-4rem)] w-full min-w-0 md:grid-cols-[260px_1fr]">
        <aside className="min-w-0 border-b border-border/70 bg-muted/20 p-4 md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:border-b-0 md:border-r">
          <div className="flex gap-2 overflow-x-auto pb-2 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] md:block md:space-y-1 md:overflow-visible md:[mask-image:none]">
            {categoryNav.map((item) => {
              const CategoryIcon = categoryIcons[item] ?? MusicNotesIcon;

              return (
                <motion.button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-[background-color,color,font-weight] hover:bg-background hover:text-foreground md:w-full",
                    category === item && "bg-background text-foreground ring-1 ring-border/70",
                  )}
                >
                  <CategoryIcon className="size-4" />
                  {item}
                  <span className="ml-auto hidden text-xs tabular-nums text-muted-foreground md:inline">{getCategoryCount(item, favorites)}</span>
                </motion.button>
              );
            })}
          </div>
        </aside>

        <div className="min-h-[calc(100dvh-4rem)] min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1180px] min-w-0">
            <div className="flex flex-col gap-5 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h1 className="max-w-full break-words text-3xl font-semibold leading-tight sm:text-4xl">Sheets</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Find a song, pick a level, and open the sheet.</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[520px]">
                <FluidInput icon={<MagnifyingGlassIcon />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs or composers" />
                {(query || category !== "All Sheets") ? (
                  <FluidButton variant="outline" size="lg" onClick={() => {
                    setSearchParams({}, { replace: true });
                  }}>
                    Clear
                  </FluidButton>
                ) : null}
                <FluidButton asChild size="lg">
                  <Link to="/converter">
                    <SparkleIcon />
                    Convert MIDI
                  </Link>
                </FluidButton>
              </div>
            </div>

            <div className="mb-4 mt-5 flex flex-wrap gap-2">
              {quickSearches.map((tag) => (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(query === tag ? "" : tag)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-[background-color,color] hover:bg-foreground hover:text-background",
                    query === tag ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tag}
                </motion.button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              <div className="flex flex-col gap-4 border-b border-border/60 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">{category}</h2>
                    <FluidBadge color="white">{filteredSheets.length} songs</FluidBadge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">One folder per song, with only the versions that exist.</p>
                </div>
                <FluidTabs items={["artist", "song", "length"] as SortMode[]} value={sort} onChange={setSort} />
              </div>

              {filteredSheets.length ? (
                <div>
                  <div className="divide-y divide-border/45">
                    {filteredSheets.map((sheet) => (
                      <SheetRow key={sheet.slug} sheet={sheet} isFavorite={isFavorite(sheet.slug)} onFavorite={() => toggleFavorite(sheet.slug)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                  <SparkleIcon className="mb-4 size-8 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">No sheets here yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Convert one, copy the markdown, and open a GitHub pull request</p>
                  <FluidButton asChild className="mt-5">
                    <Link to="/converter">Open converter</Link>
                  </FluidButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const categoryIcons: Partial<Record<(typeof categoryNav)[number], Icon>> = {
  "All Sheets": MusicNotesIcon,
  Favorites: StarIcon,
  Normal: GaugeIcon,
  Hard: GaugeIcon,
  Classical: PianoKeysIcon,
};

function SheetRow({ sheet, isFavorite, onFavorite }: { sheet: Sheet; isFavorite: boolean; onFavorite: () => void }) {
  const navigate = useNavigate();
  const sheetHref = `/sheet/${sheet.slug}`;

  function openSheet() {
    navigate(sheetHref);
  }

  return (
    <motion.div
      role="link"
      tabIndex={0}
      onClick={openSheet}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSheet();
        }
      }}
      className="group grid cursor-pointer grid-cols-[32px_52px_minmax(0,1fr)] items-center gap-4 px-4 py-4 outline-none transition-colors hover:bg-muted/45 focus-visible:bg-muted/45 md:grid-cols-[32px_60px_minmax(0,1fr)_auto]"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
    >
      <motion.button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onFavorite();
        }}
        whileTap={{ scale: 0.9 }}
        className="grid size-8 place-items-center rounded-lg transition hover:bg-background"
        aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
      >
        <StarIcon className={cn("size-4", isFavorite ? "fill-foreground text-foreground" : "text-muted-foreground")} weight={isFavorite ? "fill" : "regular"} />
      </motion.button>
      <Link to={sheetHref} onClick={(event) => event.stopPropagation()} className="grid aspect-square place-items-center rounded-lg bg-muted text-sm font-semibold text-foreground ring-1 ring-border/70">
        {sheet.title
          .split(" ")
          .slice(0, 2)
          .map((word) => word[0])
          .join("")}
      </Link>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link to={sheetHref} onClick={(event) => event.stopPropagation()} className="truncate text-base font-semibold text-foreground hover:underline sm:text-lg">
            {sheet.title}
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Link to={`/artist/${sheet.artistSlug}`} onClick={(event) => event.stopPropagation()} className="hover:text-foreground hover:underline">
            {sheet.artist}
          </Link>
          <span className="hidden sm:inline">{sheet.category}</span>
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
      <Link to={sheetHref} onClick={(event) => event.stopPropagation()} className="col-span-3 flex flex-wrap gap-1.5 pl-12 text-foreground md:col-span-1 md:col-start-4 md:justify-end md:pl-0">
        {sheet.variants.map((variant) => (
          <span key={variant.tier} className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(variant.tier))}>
            {variant.tier}
          </span>
        ))}
        <ArrowUpRightIcon className="ml-1 hidden size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:block" />
      </Link>
    </motion.div>
  );
}

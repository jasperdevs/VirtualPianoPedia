import { useState } from "react";
import { Link } from "react-router-dom";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowUpRightIcon,
  ChartLineUpIcon,
  ClockIcon,
  FireIcon,
  FilmSlateIcon,
  GameControllerIcon,
  GaugeIcon,
  GiftIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MusicNoteIcon,
  MusicNotesIcon,
  PianoKeysIcon,
  PopcornIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
  TrendUpIcon,
  UserSoundIcon,
  VinylRecordIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FluidTabs } from "@/components/fluid/FluidTabs";
import { useFavorites } from "@/lib/favorites";
import { categoryNav, filterByCategory, getCategoryCount, searchSheets, sheets, sortSheets, tierClass, type Sheet } from "@/lib/sheets";
import { cn } from "@/lib/utils";

type SortMode = "hot" | "az" | "length";

const quickSearches = ["video game", "classical", "popular", "expert", "pop", "calm"];

export function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Sheets");
  const [sort, setSort] = useState<SortMode>("hot");
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const filteredSheets = sortSheets(searchSheets(filterByCategory(sheets, category, favorites), query), sort);

  return (
    <>
      <section className="mx-auto flex min-h-[46dvh] max-w-5xl flex-col items-center justify-center px-5 py-10 text-center">
        <img src="/VirtualPianoPedia/assets/rvps-logo.png" alt="" className="mb-7 size-16" />
        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">VirtualPianoPedia</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Roblox piano sheets you can browse, save, convert, and play back
        </p>
        <div className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs or composers" className="h-11 pl-9" />
          </div>
          <Button asChild size="lg">
            <Link to="/converter">
              <SparkleIcon />
              Convert
            </Link>
          </Button>
        </div>
      </section>

      <section className="min-h-[100dvh] bg-muted/40">
        <div className="grid min-h-[100dvh] w-full gap-0 md:grid-cols-[240px_1fr]">
          <aside className="border-b border-border/50 bg-background/45 p-4 md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:border-b-0 md:border-r">
            <div className="flex gap-2 overflow-x-auto pb-2 md:block md:space-y-1 md:overflow-visible">
              {categoryNav.map((item) => {
                const CategoryIcon = categoryIcons[item] ?? MusicNotesIcon;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-background hover:text-foreground active:scale-[0.98] md:w-full",
                      category === item && "bg-background text-foreground shadow-[0_18px_50px_-38px_rgba(0,0,0,0.65)]",
                    )}
                  >
                    <CategoryIcon className="size-4" />
                    {item}
                    <span className="ml-auto hidden text-xs tabular-nums text-muted-foreground md:inline">{getCategoryCount(item, favorites)}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-h-[100dvh] bg-background p-5 sm:p-8 lg:p-10">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-semibold tracking-tight">{category}</h2>
                  <Badge variant="secondary">{filteredSheets.length} songs</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Pick a song, then switch between Easy, Normal, Hard, and Expert</p>
              </div>
              <FluidTabs items={["hot", "az", "length"] as SortMode[]} value={sort} onChange={setSort} />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {quickSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:bg-foreground hover:text-background"
                >
                  {tag}
                </button>
              ))}
            </div>

            {filteredSheets.length ? (
              <div className="space-y-2">
                {filteredSheets.map((sheet) => (
                  <SheetRow key={sheet.slug} sheet={sheet} isFavorite={isFavorite(sheet.slug)} onFavorite={() => toggleFavorite(sheet.slug)} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[1.25rem] bg-muted/60 px-6 text-center">
                <SparkleIcon className="mb-4 size-8 text-muted-foreground" />
                <h3 className="text-xl font-semibold tracking-tight">No sheets here yet</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Convert one, copy the markdown, and open a GitHub pull request</p>
                <Button asChild className="mt-5">
                  <Link to="/converter">Open converter</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

const categoryIcons: Partial<Record<(typeof categoryNav)[number], Icon>> = {
  "All Sheets": MusicNotesIcon,
  Favorites: StarIcon,
  Trending: TrendUpIcon,
  Easy: HeartIcon,
  Normal: GaugeIcon,
  Hard: FireIcon,
  Expert: ChartLineUpIcon,
  "Video Game": GameControllerIcon,
  Anime: TelevisionIcon,
  Classical: PianoKeysIcon,
  Christmas: GiftIcon,
  Movie: FilmSlateIcon,
  Pop: PopcornIcon,
  Vocaloid: MusicNoteIcon,
  Phonk: VinylRecordIcon,
  "Player Requests": UserSoundIcon,
};

function SheetRow({ sheet, isFavorite, onFavorite }: { sheet: Sheet; isFavorite: boolean; onFavorite: () => void }) {
  return (
    <div className="group grid grid-cols-[32px_52px_1fr] items-center gap-4 rounded-xl p-2.5 transition hover:bg-muted/70 active:scale-[0.995] sm:grid-cols-[32px_64px_1fr_auto]">
      <button type="button" onClick={onFavorite} className="grid size-8 place-items-center rounded-md transition hover:bg-background active:scale-[0.92]" aria-label={isFavorite ? "Remove favorite" : "Add favorite"}>
        <StarIcon className={cn("size-4", isFavorite ? "fill-foreground text-foreground" : "text-muted-foreground")} weight={isFavorite ? "fill" : "regular"} />
      </button>
      <Link to={`/sheet/${sheet.slug}`} className="contents text-foreground">
        <div className="grid aspect-square place-items-center rounded-lg bg-foreground text-sm font-semibold text-background">
          {sheet.title
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">{sheet.title}</h3>
            {sheet.tags.includes("fast") || sheet.tags.includes("popular") ? <FireIcon className="size-4 text-muted-foreground" weight="fill" /> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{sheet.artist}</span>
            <span className="hidden sm:inline">{sheet.category}</span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {sheet.length}
            </span>
          </div>
        </div>
        <div className="col-span-3 flex flex-wrap gap-1.5 sm:col-span-1 sm:justify-end">
          {sheet.variants.map((variant) => (
            <span key={variant.tier} className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(variant.tier))}>
              {variant.tier}
            </span>
          ))}
          <ArrowUpRightIcon className="ml-1 hidden size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block" />
        </div>
      </Link>
    </div>
  );
}

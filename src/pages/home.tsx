import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
import { FluidBadge } from "@/components/fluid/FluidBadge";
import { FluidButton } from "@/components/fluid/FluidButton";
import { FluidInput } from "@/components/fluid/FluidInput";
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
    <section className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <img
        src="/VirtualPianoPedia/assets/piano-macro-bg.png"
        alt=""
        className="absolute right-0 top-0 h-[430px] w-full object-cover object-right-top opacity-95 brightness-[2.05] contrast-125 dark:brightness-[1.7]"
      />
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,hsl(var(--background)/0.08)_0%,hsl(var(--background)/0.42)_48%,hsl(var(--background))_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.84)_28%,hsl(var(--background)/0.36)_58%,hsl(var(--background)/0.72)_100%)]" />

      <div className="relative grid min-h-[calc(100dvh-4rem)] w-full min-w-0 md:grid-cols-[290px_1fr]">
        <aside className="min-w-0 border-b border-border/40 bg-background/45 p-4 backdrop-blur-sm md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:border-b-0 md:border-r md:bg-background/35">
          <div className="flex gap-2 overflow-x-auto pb-2 md:block md:space-y-1 md:overflow-visible">
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
                      "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-[background-color,color,font-weight] hover:bg-muted/70 hover:text-foreground md:w-full",
                      category === item && "bg-foreground text-background shadow-[0_18px_50px_-38px_rgba(0,0,0,0.65)]",
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

        <div className="min-h-[calc(100dvh-4rem)] min-w-0 p-5 sm:p-8 lg:p-12">
          <div className="mx-auto w-full max-w-[1500px] min-w-0">
            <div className="max-w-4xl pt-8 sm:pt-14">
              <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Roblox piano archive</div>
              <h1 className="max-w-full break-words text-4xl font-semibold leading-[0.94] tracking-tight sm:text-6xl lg:text-7xl">VirtualPianoPedia</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Roblox virtual piano sheets, organized like a wiki</p>
              <div className="mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
                <FluidInput icon={<MagnifyingGlassIcon />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs or composers" />
                <FluidButton asChild size="lg">
                  <Link to="/converter">
                    <SparkleIcon />
                    Convert MIDI
                  </Link>
                </FluidButton>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {quickSearches.map((tag) => (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-[background-color,color] hover:bg-foreground hover:text-background"
                >
                  {tag}
                </motion.button>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-[1.35rem] bg-card/78 shadow-[0_22px_90px_-70px_rgba(255,255,255,0.45)] ring-1 ring-border/55 backdrop-blur-md">
              <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{category}</h2>
                    <FluidBadge color="white">{filteredSheets.length} songs</FluidBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Choose Easy, Normal, Hard, or Expert</p>
                </div>
                <FluidTabs items={["hot", "az", "length"] as SortMode[]} value={sort} onChange={setSort} />
              </div>

              {filteredSheets.length ? (
                <div>
                  <div className="hidden grid-cols-[minmax(260px,1.6fr)_minmax(160px,0.8fr)_150px_230px_92px] px-5 pb-2 pt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground lg:grid">
                    <span>Song</span>
                    <span>Artist / composer</span>
                    <span>Category</span>
                    <span>Difficulty</span>
                    <span className="text-right">Length</span>
                  </div>
                  <div className="divide-y divide-border/45">
                    {filteredSheets.map((sheet) => (
                      <SheetRow key={sheet.slug} sheet={sheet} isFavorite={isFavorite(sheet.slug)} onFavorite={() => toggleFavorite(sheet.slug)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                  <SparkleIcon className="mb-4 size-8 text-muted-foreground" />
                  <h3 className="text-xl font-semibold tracking-tight">No sheets here yet</h3>
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
    <motion.div
      className="group grid grid-cols-[32px_52px_1fr] items-center gap-4 px-3 py-3 transition-colors hover:bg-muted/55 sm:grid-cols-[32px_64px_1fr_auto] lg:grid-cols-[32px_minmax(260px,1.6fr)_minmax(160px,0.8fr)_150px_230px_92px]"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
    >
      <motion.button type="button" onClick={onFavorite} whileTap={{ scale: 0.9 }} className="grid size-8 place-items-center rounded-lg transition hover:bg-background" aria-label={isFavorite ? "Remove favorite" : "Add favorite"}>
        <StarIcon className={cn("size-4", isFavorite ? "fill-foreground text-foreground" : "text-muted-foreground")} weight={isFavorite ? "fill" : "regular"} />
      </motion.button>
      <Link to={`/sheet/${sheet.slug}`} className="contents text-foreground">
        <div className="contents lg:hidden">
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
        </div>

        <div className="hidden min-w-0 items-center gap-4 lg:flex">
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-foreground text-sm font-semibold text-background">
            {sheet.title
              .split(" ")
              .slice(0, 2)
              .map((word) => word[0])
              .join("")}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold tracking-tight text-foreground">{sheet.title}</h3>
              {sheet.tags.includes("fast") || sheet.tags.includes("popular") ? <FireIcon className="size-4 text-muted-foreground" weight="fill" /> : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {sheet.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className="hidden text-sm text-muted-foreground lg:block">{sheet.artist}</span>
        <span className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
          <MusicNoteIcon className="size-4" />
          {sheet.category}
        </span>
        <div className="col-span-3 flex flex-wrap gap-1.5 sm:col-span-1 sm:justify-end lg:col-span-1 lg:justify-start">
          {sheet.variants.map((variant) => (
            <span key={variant.tier} className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(variant.tier))}>
              {variant.tier}
            </span>
          ))}
        </div>
        <span className="hidden items-center justify-end gap-3 text-sm text-muted-foreground lg:flex">
          {sheet.length}
          <ArrowUpRightIcon className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

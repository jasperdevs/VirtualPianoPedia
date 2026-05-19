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
    <section className="min-h-[calc(100dvh-4rem)] bg-background">
      <div className="grid min-h-[calc(100dvh-4rem)] w-full min-w-0 md:grid-cols-[280px_1fr]">
        <aside className="min-w-0 border-b border-border/70 bg-muted/20 p-4 md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:border-b-0 md:border-r">
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
          <div className="mx-auto w-full max-w-[1040px] min-w-0">
            <div className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Roblox piano archive</div>
                <h1 className="max-w-full break-words text-4xl font-semibold leading-[0.96] tracking-tight sm:text-5xl">VirtualPianoPedia</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">Browse sheets by category, save favorites, or convert a MIDI into a sheet.</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[520px]">
                <FluidInput icon={<MagnifyingGlassIcon />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs or composers" />
                <FluidButton asChild size="lg">
                  <Link to="/converter">
                    <SparkleIcon />
                    Convert MIDI
                  </Link>
                </FluidButton>
              </div>
            </div>

            <div className="mb-5 mt-6 flex flex-wrap gap-2">
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

            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
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
      className="group grid grid-cols-[32px_52px_minmax(0,1fr)] items-center gap-4 px-3 py-3 transition-colors hover:bg-muted/45 sm:grid-cols-[32px_64px_minmax(0,1fr)]"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
    >
      <motion.button type="button" onClick={onFavorite} whileTap={{ scale: 0.9 }} className="grid size-8 place-items-center rounded-lg transition hover:bg-background" aria-label={isFavorite ? "Remove favorite" : "Add favorite"}>
        <StarIcon className={cn("size-4", isFavorite ? "fill-foreground text-foreground" : "text-muted-foreground")} weight={isFavorite ? "fill" : "regular"} />
      </motion.button>
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
        <div className="col-span-3 flex flex-wrap gap-1.5 sm:col-span-1 sm:col-start-3 sm:justify-start">
          {sheet.variants.map((variant) => (
            <span key={variant.tier} className={cn("rounded-md px-2 py-1 text-xs font-medium", tierClass(variant.tier))}>
              {variant.tier}
            </span>
          ))}
          <ArrowUpRightIcon className="ml-1 hidden size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block" />
        </div>
      </Link>
    </motion.div>
  );
}

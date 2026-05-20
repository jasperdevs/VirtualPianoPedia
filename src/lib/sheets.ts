export const difficultyTiers = ["Easy", "Normal", "Hard", "Expert"] as const;
export type DifficultyTier = (typeof difficultyTiers)[number];

export type SheetVariant = {
  tier: DifficultyTier;
  fileName: string;
  body: string;
};

export type Sheet = {
  slug: string;
  artistSlug: string;
  songSlug: string;
  title: string;
  artist: string;
  game: string;
  difficulty: DifficultyTier;
  category: string;
  tempo: number;
  length: string;
  transpose: number;
  source: string;
  tags: string[];
  variants: SheetVariant[];
  body: string;
};

type MetaFrontmatter = Omit<Sheet, "slug" | "artistSlug" | "songSlug" | "body" | "variants" | "difficulty">;

type MarkdownModule = {
  frontmatter: Partial<MetaFrontmatter>;
  body: string;
};

const modules = import.meta.glob<MarkdownModule>("../content/sheets/**/*.md", {
  eager: true,
  query: "?sheet",
  import: "default",
});

const tierByFileName = new Map<string, DifficultyTier>([
  ["easy", "Easy"],
  ["normal", "Normal"],
  ["hard", "Hard"],
  ["expert", "Expert"],
]);

const grouped = new Map<string, { artistSlug: string; songSlug: string; meta?: MetaFrontmatter; variants: SheetVariant[] }>();

for (const [path, mod] of Object.entries(modules)) {
  const parts = path.split("/");
  const fileName = parts.pop()?.replace(".md", "") ?? "";
  const songSlug = parts.pop() ?? "sheet";
  const artistSlug = parts.pop() ?? slugify(String(mod.frontmatter.artist ?? "Unknown"));
  const slug = `${artistSlug}/${songSlug}`;
  const entry = grouped.get(slug) ?? { artistSlug, songSlug, variants: [] };

  if (fileName === "_meta") {
    entry.meta = mod.frontmatter as MetaFrontmatter;
  } else {
    const tier = tierByFileName.get(fileName.toLowerCase());
    if (tier) {
      entry.variants.push({
        tier,
        fileName: `${fileName}.md`,
        body: mod.body.trim(),
      });
    }
  }

  grouped.set(slug, entry);
}

export const sheets: Sheet[] = Array.from(grouped.entries())
  .map(([slug, entry]) => {
    const sortedVariants = entry.variants.sort((a, b) => difficultyTiers.indexOf(a.tier) - difficultyTiers.indexOf(b.tier));
    const meta = entry.meta ?? {
      title: slug,
      artist: "Unknown",
      game: "Roblox Virtual Piano",
      category: "Unsorted",
      tempo: 100,
      length: "00:00",
      transpose: 0,
      source: "Local sheet",
      tags: [],
    };

    return {
      slug,
      artistSlug: entry.artistSlug,
      songSlug: entry.songSlug,
      ...meta,
      difficulty: sortedVariants[0]?.tier ?? "Normal",
      tags: meta.tags ?? [],
      variants: sortedVariants,
      body: sortedVariants[0]?.body ?? "",
    };
  })
  .filter((sheet) => sheet.variants.length)
  .sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));

export const categoryNav = [
  "All Sheets",
  "Favorites",
  "Easy",
  "Normal",
  "Hard",
  "Expert",
  "Classical",
  "Baroque",
  "Romantic",
  "Ragtime",
  "Dance",
  "Folk",
  "Modern",
] as const;

export function getSheet(slug: string) {
  return sheets.find((sheet) => sheet.slug === slug);
}

export function getArtistSheets(artistSlug: string) {
  return sheets.filter((sheet) => sheet.artistSlug === artistSlug);
}

export function getCategoryCount(category: string, favorites: string[] = []) {
  return filterByCategory(sheets, category, favorites).length;
}

export function filterByCategory(items: Sheet[], category: string, favorites: string[] = []) {
  if (category === "All Sheets") return items;
  if (category === "Favorites") return items.filter((sheet) => favorites.includes(sheet.slug));
  if (difficultyTiers.includes(category as DifficultyTier)) return items.filter((sheet) => sheet.variants.some((variant) => variant.tier === category));
  return items.filter((sheet) => sheet.category === category);
}

export function searchSheets(items: Sheet[], query: string) {
  const needle = query.toLowerCase().trim();
  if (!needle) return items;

  return items.filter((sheet) =>
    [sheet.title, sheet.artist, sheet.game, sheet.category, sheet.difficulty, ...sheet.tags].join(" ").toLowerCase().includes(needle),
  );
}

export function sortSheets(items: Sheet[], mode: "artist" | "song" | "length") {
  return [...items].sort((a, b) => {
    if (mode === "song") return a.title.localeCompare(b.title) || a.artist.localeCompare(b.artist);
    if (mode === "length") return parseLength(a.length) - parseLength(b.length);
    return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
  });
}

export function tierClass(tier: string) {
  if (tier === "Easy") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (tier === "Normal") return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  if (tier === "Hard") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
}

function parseLength(length: string) {
  const [minutes = "0", seconds = "0"] = length.split(":");
  return Number(minutes) * 60 + Number(seconds);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

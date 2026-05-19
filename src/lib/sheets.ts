export const difficultyTiers = ["Starter", "Standard", "Advanced", "Expert"] as const;
export type DifficultyTier = (typeof difficultyTiers)[number];

export type SheetVariant = {
  tier: DifficultyTier;
  body: string;
};

export type Sheet = {
  slug: string;
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

type SheetModule = {
  frontmatter: Omit<Sheet, "slug" | "body" | "variants">;
  body: string;
};

const sheetModules = import.meta.glob<SheetModule>("../content/sheets/*.md", {
  eager: true,
  query: "?sheet",
  import: "default",
});

export const sheets = Object.entries(sheetModules)
  .map(([path, sheet]) => {
    const body = sheet.body.trim();
    const variants = parseVariants(body, sheet.frontmatter.difficulty);

    return {
      slug: path.split("/").pop()?.replace(".md", "") ?? "sheet",
      ...sheet.frontmatter,
      variants,
      body: variants[0]?.body ?? body,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const categoryNav = [
  "All Sheets",
  "Trending",
  "Starter",
  "Standard",
  "Advanced",
  "Expert",
  "Video Game",
  "Anime",
  "Classical",
  "Christmas",
  "Movie",
  "Pop",
  "Vocaloid",
  "Phonk",
  "Player Requests",
] as const;

export function getSheet(slug: string) {
  return sheets.find((sheet) => sheet.slug === slug);
}

export function getCategoryCount(category: string) {
  return filterByCategory(sheets, category).length;
}

export function filterByCategory(items: Sheet[], category: string) {
  if (category === "All Sheets") return items;
  if (category === "Trending") return items.filter((sheet) => sheet.tags.some((tag) => ["fast", "popular", "piano"].includes(tag)));
  if (difficultyTiers.includes(category as DifficultyTier)) return items.filter((sheet) => sheet.variants.some((variant) => variant.tier === category));
  if (category === "Player Requests") return items.filter((sheet) => sheet.tags.includes("request"));
  return items.filter((sheet) => sheet.category === category);
}

export function searchSheets(items: Sheet[], query: string) {
  const needle = query.toLowerCase().trim();
  if (!needle) return items;

  return items.filter((sheet) =>
    [sheet.title, sheet.artist, sheet.game, sheet.category, sheet.difficulty, ...sheet.tags].join(" ").toLowerCase().includes(needle),
  );
}

export function sortSheets(items: Sheet[], mode: "hot" | "az" | "length") {
  return [...items].sort((a, b) => {
    if (mode === "az") return a.title.localeCompare(b.title);
    if (mode === "length") return parseLength(a.length) - parseLength(b.length);
    return b.variants.length - a.variants.length || b.tempo - a.tempo || a.title.localeCompare(b.title);
  });
}

export function tierClass(tier: string) {
  if (tier === "Starter") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (tier === "Standard") return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  if (tier === "Advanced") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
}

function parseVariants(body: string, fallback: DifficultyTier): SheetVariant[] {
  const matches = Array.from(body.matchAll(/^##\s+(Starter|Standard|Advanced|Expert)\s*$/gim));
  if (!matches.length) return [{ tier: fallback, body }];

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    return {
      tier: match[1] as DifficultyTier,
      body: body.slice(start, end).trim(),
    };
  });
}

function parseLength(length: string) {
  const [minutes = "0", seconds = "0"] = length.split(":");
  return Number(minutes) * 60 + Number(seconds);
}

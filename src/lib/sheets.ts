export type Sheet = {
  slug: string;
  title: string;
  artist: string;
  game: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  tempo: number;
  length: string;
  transpose: number;
  source: string;
  tags: string[];
  body: string;
};

type SheetModule = {
  frontmatter: Omit<Sheet, "slug" | "body">;
  body: string;
};

const sheetModules = import.meta.glob<SheetModule>("../content/sheets/*.md", {
  eager: true,
  query: "?sheet",
  import: "default",
});

export const sheets = Object.entries(sheetModules)
  .map(([path, sheet]) => ({
    slug: path.split("/").pop()?.replace(".md", "") ?? "sheet",
    ...sheet.frontmatter,
    body: sheet.body.trim(),
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

export function getSheet(slug: string) {
  return sheets.find((sheet) => sheet.slug === slug);
}

export function getCategories() {
  return Array.from(new Set(sheets.map((sheet) => sheet.category))).sort();
}

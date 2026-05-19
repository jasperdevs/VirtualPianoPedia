import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function parseValue(value: string): string | number | string[] {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseSheetMarkdown(source: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) return { frontmatter: {}, body: source };

  const frontmatter: Record<string, string | number | string[]> = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;

    const [, key, rawValue] = pair;
    if (rawValue === "") {
      const values: string[] = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        index += 1;
        values.push(lines[index].replace("  - ", "").trim());
      }
      frontmatter[key] = values;
    } else {
      frontmatter[key] = parseValue(rawValue);
    }
  }

  return { frontmatter, body: match[2] };
}

function sheetMarkdownPlugin(): Plugin {
  return {
    name: "sheet-markdown",
    transform(code, id) {
      if (!id.includes(".md?sheet")) return null;
      const parsed = parseSheetMarkdown(code);
      return {
        code: `export default ${JSON.stringify(parsed)};`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), sheetMarkdownPlugin()],
  base: "/VirtualPianoPedia/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

/// <reference types="vite/client" />

declare module "*.md?sheet" {
  const sheet: {
    frontmatter: {
      title: string;
      artist: string;
      game: string;
      difficulty?: "Easy" | "Normal" | "Hard" | "Expert";
      category: string;
      tempo: number;
      length: string;
      transpose: number;
      source: string;
      tags: string[];
    };
    body: string;
  };
  export default sheet;
}

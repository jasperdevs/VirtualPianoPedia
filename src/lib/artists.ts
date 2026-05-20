export type ArtistProfile = {
  slug: string;
  name: string;
  role: string;
  imageUrl: string;
  imageAlt: string;
  sourceUrl: string;
  credit: string;
};

export const artistProfiles: Record<string, ArtistProfile> = {
  "claude-debussy": {
    slug: "claude-debussy",
    name: "Claude Debussy",
    role: "Composer",
    imageUrl: "/VirtualPianoPedia/assets/artists/claude-debussy.jpg",
    imageAlt: "Portrait of Claude Debussy",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Claude_Debussy_portrait.jpg",
    credit: "Otto Wegener, public domain",
  },
  "max-richter": {
    slug: "max-richter",
    name: "Max Richter",
    role: "Composer",
    imageUrl: "/VirtualPianoPedia/assets/artists/max-richter.jpg",
    imageAlt: "Portrait of Max Richter",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Max_Richter_at_Cadogan_Hall_(portrait).jpg",
    credit: "close to 94, CC BY-SA 2.0",
  },
};

export function getArtistProfile(slug: string, fallbackName?: string): ArtistProfile {
  return (
    artistProfiles[slug] ?? {
      slug,
      name: fallbackName ?? slug,
      role: "Artist",
      imageUrl: "",
      imageAlt: fallbackName ?? slug,
      sourceUrl: "",
      credit: "",
    }
  );
}

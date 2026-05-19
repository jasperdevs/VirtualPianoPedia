import { useEffect, useState } from "react";

const storageKey = "virtualpianopedia:favorites:v1";

function readFavorites() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(favorites));
  }, [favorites]);

  return {
    favorites,
    isFavorite: (slug: string) => favorites.includes(slug),
    toggleFavorite: (slug: string) =>
      setFavorites((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug])),
  };
}

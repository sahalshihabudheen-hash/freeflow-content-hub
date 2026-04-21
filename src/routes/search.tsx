import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { searchManga, type Manga } from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — JARVIS COMICS" },
      { name: "description", content: "Search thousands of manga titles." },
      { property: "og:title", content: "Search — JARVIS COMICS" },
      { property: "og:description", content: "Search thousands of manga titles." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [results, setResults] = useState<Manga[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setResults(null);
    setError(null);
    searchManga(q, 30)
      .then(setResults)
      .catch((e) => setError(e.message));
  }, [q]);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Browse"}
      </h1>
      <p className="text-muted-foreground mb-8">
        {q ? "Find your next read" : "Use the search bar above to find a series"}
      </p>

      {error && <div className="text-destructive">{error}</div>}

      {results === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center">
          {q ? "No results. Try different keywords." : ""}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {results.map((m) => <MangaCard key={m.id} manga={m} />)}
        </div>
      )}
    </div>
  );
}

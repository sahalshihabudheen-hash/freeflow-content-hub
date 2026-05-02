import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getMatureContent,
  LANGUAGES,
  type Manga,
} from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/adult")({
  head: () => ({
    meta: [
      { title: "Mature Hub — JARVIS COMICS" },
      { name: "description", content: "Explore mature and adult manga content. POWERED BY JARVIS." },
    ],
  }),
  component: AdultHub,
});

function AdultHub() {
  const [manga, setManga] = useState<Manga[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMatureContent(48)
      .then(setManga)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Mature Hub</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover adult-rated manga and erotica. Content here is filtered for mature audiences only.
        </p>
      </header>

      {error && (
        <div className="text-center text-destructive py-8">{error}</div>
      )}

      {manga === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : manga.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No mature content found at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {manga.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      )}
    </div>
  );
}

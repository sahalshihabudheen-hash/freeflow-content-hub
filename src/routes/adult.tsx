import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMatureContent, type Manga as MangaDexManga } from "@/lib/mangadex";
import { getComickAdult } from "@/lib/comick";
import { MangaCard } from "@/components/MangaCard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/adult")({
  component: AdultHub,
});

function AdultHub() {
  const [source, setSource] = useState<"mangadex" | "comick">("mangadex");
  const [manga, setManga] = useState<MangaDexManga[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setManga(null);
    setError(null);
    
    if (source === "mangadex") {
      getMatureContent(48)
        .then(setManga)
        .catch((e) => setError(e.message));
    } else {
      getComickAdult(48)
        .then(setManga)
        .catch((e) => setError("Comick.io access might be blocked by Cloudflare. " + e.message));
    }
  }, [source]);

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-destructive">Mature Hub</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover adult-rated manga, manhwa, and erotica in English. Content here is strictly for mature audiences.
        </p>
      </header>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setSource("mangadex")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            source === "mangadex" ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Manga (MangaDex)
        </button>
        <button
          onClick={() => setSource("comick")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            source === "comick" ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Manhwa (Comick.io)
        </button>
      </div>

      {error && (
        <div className="max-w-md mx-auto text-center p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <p className="font-semibold">Failed to load content</p>
          <p className="text-sm opacity-80 mt-1">{error}</p>
        </div>
      )}

      {manga === null && !error ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : manga?.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No mature content found for this source.</div>
      ) : manga ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 animate-fade-in">
          {manga.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

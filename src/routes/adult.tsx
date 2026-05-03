import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMatureContent, type Manga } from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { Loader2, Lock } from "lucide-react";
import { useAdultAccess } from "@/hooks/use-adult-access";

export const Route = createFileRoute("/adult")({
  component: AdultHub,
});

function AdultHub() {
  const [source, setSource] = useState<"manga" | "manhwa">("manga");
  const [mangaList, setMangaList] = useState<Manga[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMangaList(null);
    setError(null);
    
    // originalLanguage: ja = Japanese (Manga), ko = Korean (Manhwa)
    const origLang = source === "manga" ? "ja" : "ko";
    
    getMatureContent(48, undefined, undefined, origLang)
      .then(setMangaList)
      .catch((e) => setError("Failed to fetch content. " + e.message));
  }, [source]);

  const { hasAdultAccess, loading: accessLoading } = useAdultAccess();

  if (accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAdultAccess) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Access Restricted</h1>
        <p className="text-muted-foreground mb-8">
          This section contains adult content and requires explicit permission to view. 
          Please contact an administrator to verify your age and grant you access.
        </p>
      </div>
    );
  }

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
          onClick={() => setSource("manga")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            source === "manga" ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Adult Manga
        </button>
        <button
          onClick={() => setSource("manhwa")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            source === "manhwa" ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Adult Manhwa
        </button>
      </div>

      {error && (
        <div className="max-w-md mx-auto text-center p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <p className="font-semibold">Failed to load content</p>
          <p className="text-sm opacity-80 mt-1">{error}</p>
        </div>
      )}

      {mangaList === null && !error ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mangaList?.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No mature content found for this category.</div>
      ) : mangaList ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 animate-fade-in">
          {mangaList.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

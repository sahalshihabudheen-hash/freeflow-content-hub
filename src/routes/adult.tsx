import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMatureContent, getAnimatedComics, searchManga, type Manga } from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { Loader2, Lock, Search, PlayCircle, Sparkles } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMatureContent, getAnimatedComics, searchManga, type Manga } from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { Loader2, Lock, Search, PlayCircle, Sparkles } from "lucide-react";
import { useAdultAccess } from "@/hooks/use-adult-access";

export const Route = createFileRoute("/adult")({
  component: AdultHub,
});

function AdultHub() {
  const [source, setSource] = useState<"manga" | "manhwa">("manga");
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [animated, setAnimated] = useState<Manga[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const LIMIT = 30;
  const MATURE_GENRES = ["School Life", "Gore", "BDSM", "Incest", "Netorare", "Sexual Violence"];

  const fetchContent = async (newOffset = 0, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setMangaList([]);
      } else {
        setLoadingMore(true);
      }
      
      let results: Manga[] = [];
      if (query.trim()) {
        results = await searchManga(query.trim(), LIMIT, newOffset, true);
      } else {
        const origLang = source === "manga" ? "ja" : "ko";
        results = await getMatureContent(LIMIT, newOffset, selectedGenres, undefined, origLang);
      }

      setMangaList(prev => isInitial ? results : [...prev, ...results]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchContent(0, true);
    setOffset(0);
  }, [source, selectedGenres]);

  useEffect(() => {
    getAnimatedComics(12, true).then(setAnimated).catch(() => {});
  }, []);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setOffset(0);
    fetchContent(0, true);
  };

  const loadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchContent(nextOffset);
  };

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
    <div className="container mx-auto px-4 py-12 space-y-12">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-black uppercase tracking-widest border border-destructive/20">
          <Sparkles className="h-3 w-3" /> Restricted Content
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic">Mature <span className="text-destructive">Hub</span></h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Discover restricted manga and manhwa. This area is strictly for adults.
        </p>
      </header>

      {/* Animated Section */}
      {animated && animated.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Animated Mature Comics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {animated.map(m => <MangaCard key={m.id} manga={m} />)}
          </div>
        </section>
      )}

      <hr className="border-border/40" />

      {/* Search & Filters */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full mb-1">Filter by Taste</p>
          {MATURE_GENRES.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                selectedGenres.includes(g) 
                  ? "bg-destructive border-destructive text-white shadow-lg shadow-destructive/20" 
                  : "border-border hover:border-destructive/40 text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
          {selectedGenres.length > 0 && (
            <button 
              onClick={() => setSelectedGenres([])}
              className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-destructive hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex bg-secondary/50 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setSource("manga")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                source === "manga" ? "bg-background text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manga
            </button>
            <button
              onClick={() => setSource("manhwa")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                source === "manhwa" ? "bg-background text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manhwa
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search within Mature Hub..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </form>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto text-center p-6 rounded-2xl bg-destructive/5 text-destructive border border-destructive/10">
          <p className="font-bold uppercase tracking-widest text-xs mb-2">Sync Error</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-destructive" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Scanning encrypted vault...</p>
        </div>
      ) : mangaList.length === 0 ? (
        <div className="text-center text-muted-foreground py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">No restricted items found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 animate-fade-in">
            {mangaList.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>

          <div className="flex justify-center pb-12">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="h-14 px-10 rounded-2xl bg-secondary text-secondary-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary/80 disabled:opacity-50 transition-all shadow-xl shadow-black/5 flex items-center gap-3"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching More
                </>
              ) : (
                "Load More Results"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

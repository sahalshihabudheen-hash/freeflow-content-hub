import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMatureContent, getAnimatedComics, searchManga, type Manga } from "@/lib/mangadex";
import { getAnimeInfo, getEpisodeSources, fetchJikanAdultAnime, searchJikan, type Anime } from "@/lib/anime";
import { MangaCard } from "@/components/MangaCard";
import { AnimeCard } from "@/components/AnimeCard";
import { Loader2, Lock, Search, PlayCircle, Sparkles, Zap, Film } from "lucide-react";
import { useAdultAccess } from "@/hooks/use-adult-access";

export const Route = createFileRoute("/adult")({
  component: AdultHub,
});

function AdultHub() {
  const [source, setSource] = useState<"manga" | "manhwa" | "anime">("manga");
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [animated, setAnimated] = useState<Manga[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(1);
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
        setAnimeList([]);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      if (source === "anime") {
        let results: Anime[] = [];
        const currentPage = isInitial ? 1 : page;
        
        console.log(`[AdultHub] Fetching anime page ${currentPage}, query: ${query}`);
        
        if (query.trim()) {
          results = await searchJikan(query.trim(), currentPage);
        } else {
          results = await fetchJikanAdultAnime(currentPage);
        }
        
        setAnimeList(prev => isInitial ? results : [...prev, ...results]);
      } else {
        let results: Manga[] = [];
        if (query.trim()) {
          results = await searchManga(query.trim(), LIMIT, newOffset, true);
        } else {
          const origLang = source === "manga" ? "ja" : "ko";
          results = await getMatureContent(LIMIT, newOffset, selectedGenres, undefined, origLang);
        }
        setMangaList(prev => isInitial ? results : [...prev, ...results]);
      }
    } catch (e: any) {
      console.error("[AdultHub] Error:", e);
      setError(e.message || "An unexpected error occurred");
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
    if (source === "anime") {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContent((nextPage - 1) * 20);
    } else {
      const nextOffset = offset + LIMIT;
      setOffset(nextOffset);
      fetchContent(nextOffset);
    }
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
    <div className="container mx-auto px-4 py-24 space-y-20">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/20 animate-pulse">
          <Sparkles className="h-3 w-3" /> Restricted Access Only
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-none">
          Mature <span className="text-destructive drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">Hub</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm italic font-medium">
          The ultimate sanctuary for restricted content. Browse with caution.
        </p>
      </header>

      {/* Animated Section */}
      {animated && animated.length > 0 && source !== "anime" && (
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                 <PlayCircle className="h-6 w-6" />
               </div>
               <h2 className="text-2xl font-black uppercase tracking-tight italic">Animated <span className="text-destructive">Exclusive</span></h2>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
              {animated.length} Titles Found
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {animated.map(m => <MangaCard key={m.id} manga={m} />)}
          </div>
        </section>
      )}

      <div className="space-y-10">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
             <Search className="h-6 w-6" />
           </div>
           <h2 className="text-2xl font-black uppercase tracking-tight italic">Discover <span className="text-primary">Library</span></h2>
        </div>

        {/* Search & Filters */}
        <div className="space-y-8 bg-secondary/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
          {source !== "anime" && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full mb-2">Filter by Taste Profile</p>
              {MATURE_GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                    selectedGenres.includes(g) 
                      ? "bg-destructive border-destructive text-white shadow-xl shadow-destructive/30 scale-105" 
                      : "border-white/10 hover:border-destructive/40 text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  {g}
                </button>
              ))}
              {selectedGenres.length > 0 && (
                <button 
                  onClick={() => setSelectedGenres([])}
                  className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
                >
                  Purge Filters
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto">
              <button
                onClick={() => setSource("manga")}
                className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  source === "manga" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                Manga
              </button>
              <button
                onClick={() => setSource("manhwa")}
                className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  source === "manhwa" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                Manhwa
              </button>
              <button
                onClick={() => setSource("anime")}
                className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  source === "anime" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                Anime
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative w-full lg:max-w-md group">
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search the encrypted archives..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="relative w-full h-14 pl-12 pr-6 rounded-2xl border border-white/10 bg-black/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
              )}
            </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-destructive/5 text-destructive border border-destructive/10 animate-shake">
          <p className="font-black uppercase tracking-widest text-xs mb-3">System Override Error</p>
          <p className="text-sm font-medium opacity-80">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl animate-pulse rounded-full" />
            <Loader2 className="relative h-16 w-16 animate-spin text-destructive" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse tracking-[0.2em]">Scanning neural gateway...</p>
        </div>
      ) : (source === "anime" ? animeList.length === 0 : mangaList.length === 0) ? (
        <div className="text-center text-muted-foreground py-32 bg-secondary/10 rounded-[3rem] border border-dashed border-white/10">
          <Search className="h-16 w-16 mx-auto mb-6 opacity-10" />
          <p className="text-lg font-black uppercase tracking-tighter italic">Void Detected</p>
          <p className="text-xs font-medium opacity-50 mt-2 tracking-widest uppercase">No matches found in this sector.</p>
        </div>
      ) : (
        <div className="space-y-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 animate-fade-in">
            {source === "anime" 
              ? animeList.map((a) => (
                  <div key={a.id} className="hover:scale-105 transition-transform duration-500">
                    <AnimeCard anime={a} />
                  </div>
                ))
              : mangaList.map((m) => (
                  <div key={m.id} className="hover:scale-105 transition-transform duration-500">
                    <MangaCard manga={m} />
                  </div>
                ))
            }
          </div>

          <div className="flex justify-center pb-20">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group relative h-16 px-12 rounded-2xl bg-secondary text-foreground font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all shadow-2xl shadow-black/20 flex items-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              {loadingMore ? (
                <>
                  <Loader2 className="relative h-5 w-5 animate-spin" /> Fetching Archives
                </>
              ) : (
                <>
                  <Zap className="relative h-5 w-5" /> Expand Results
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

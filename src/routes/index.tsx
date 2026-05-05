import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  getPopular,
  getRecentlyUpdated,
  getTopRated,
  getNewReleases,
  getByGenre,
  getAnimatedComics,
  getMatureContent,
  getHentai,
  getDoujinshi,
  getManga,
  LANGUAGES,
  type Manga,
} from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { PreferencesModal, type Prefs } from "@/components/PreferencesModal";
import { Loader2, SlidersHorizontal, BookOpen, X, Play, Compass, Zap, History } from "lucide-react";
import { useReadingProgress, type ProgressItem } from "@/hooks/use-reading-progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARVIS COMICS — Discover & Read Manga" },
      { name: "description", content: "Browse trending and recently updated manga. Read chapters online for free." },
      { property: "og:title", content: "JARVIS COMICS — Discover & Read Manga" },
      { property: "og:description", content: "Browse trending and recently updated manga. Read chapters online for free." },
    ],
  }),
  component: Index,
});

const PREFS_KEY = "jarvis.prefs.v1";

function loadPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Prefs;
  } catch {
    return null;
  }
}

function Index() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [popular, setPopular] = useState<Manga[] | null>(null);
  const [recent, setRecent] = useState<Manga[] | null>(null);
  const [topRated, setTopRated] = useState<Manga[] | null>(null);
  const [newReleases, setNewReleases] = useState<Manga[] | null>(null);
  const [animated, setAnimated] = useState<Manga[] | null>(null);
  const [mature, setMature] = useState<Manga[] | null>(null);
  const [hentai, setHentai] = useState<Manga[] | null>(null);
  const [doujinshi, setDoujinshi] = useState<Manga[] | null>(null);
  const [recommended, setRecommended] = useState<Manga | null>(null);
  const [discovery, setDiscovery] = useState<Manga[]>([]);
  const [offset, setOffset] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);
  const [genreSections, setGenreSections] = useState<Record<string, Manga[]>>({});
  const [error, setError] = useState<string | null>(null);
  
  const { history: readingHistory, loading: historyLoading } = useReadingProgress();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Discovery logic
  const loadMore = async () => {
    if (!prefs || loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await getPopular(24, offset, prefs.genres, prefs.language);
      setDiscovery((prev) => [...prev, ...more]);
      setOffset((prev) => prev + 24);
    } catch (e) {
      console.error("Discovery error", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // On mount: load saved prefs or open modal
  useEffect(() => {
    const saved = loadPrefs();
    if (saved && saved.genres.length > 0) {
      setPrefs(saved);
    } else {
      setShowModal(true);
    }
  }, []);


  // Fetch when prefs change
  useEffect(() => {
    if (!prefs) return;
    setPopular(null);
    setRecent(null);
    setTopRated(null);
    setNewReleases(null);
    setAnimated(null);
    setMature(null);
    setHentai(null);
    setDoujinshi(null);
    setGenreSections({});
    setDiscovery([]);
    setOffset(24);
    setError(null);

    Promise.all([
      getPopular(24, 0, prefs.genres, prefs.language),
      getRecentlyUpdated(18, prefs.genres, prefs.language),
      getTopRated(18, prefs.genres, prefs.language),
      getNewReleases(18, prefs.genres, prefs.language),
      getAnimatedComics(12, false),
      getMatureContent(18, 0, prefs.genres, prefs.language, 'ko'),
      getHentai(18, 0, prefs.genres, prefs.language),
      getDoujinshi(18, 0, prefs.language),
      getManga("7533da40-085a-47c8-9960-5ed406491a34").catch(() => null),
    ])
      .then(([p, r, t, n, a, m, h, d, rec]) => {
        setPopular(p);
        setRecent(r);
        setTopRated(t);
        setNewReleases(n);
        setAnimated(a);
        setMature(m);
        setHentai(h);
        setDoujinshi(d);
        setRecommended(rec);
        setDiscovery(p);
      })
      .catch((e) => setError(e.message));

    // Load each selected genre as its own section
    if (prefs.genres.length > 0) {
      prefs.genres.forEach((g) => {
        getByGenre(g, 12, prefs.language)
          .then((items) => setGenreSections((prev) => ({ ...prev, [g]: items })))
          .catch(() => {});
      });
    }
  }, [prefs]);

  const handleSave = (p: Prefs) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    setPrefs(p);
    setShowModal(false);
  };

  return (
    <div>
      {showModal && (
        <PreferencesModal
          initial={prefs ?? { genres: [], language: "en" }}
          onSave={handleSave}
          onClose={prefs ? () => setShowModal(false) : undefined}
          canClose={!!prefs}
        />
      )}

      {/* Hero */}

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, transparent, var(--background) 70%)" }} />
        <div className="container relative mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-up">
            Endless stories,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              one page at a time
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2">
            Discover thousands of comic series and read them right in your browser. POWERED BY JARVIS.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {readingHistory.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shadow-primary/20">
                  <History className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter uppercase italic">Continue <span className="text-primary">Reading</span></h2>
              </div>
              <button 
                onClick={() => localStorage.removeItem("jarvis.readingHistory.v1")}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide snap-x">
              {readingHistory.map((item) => (
                <Link
                  key={item.mangaId}
                  to={item.isUserComic ? "/my-chapter/$id" : "/chapter/$id"}
                  params={{ id: item.chapterId }}
                  search={!item.isUserComic ? { manga: item.mangaId } : {}}
                  className="group relative flex-none w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden border border-border/50 shadow-xl snap-start"
                >
                  <img 
                    src={item.coverUrl} 
                    alt={item.mangaTitle} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-4 flex flex-col justify-end">
                    <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-primary transition-colors">{item.mangaTitle}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                        CH {item.chapterNumber}
                      </span>
                      {item.isUserComic && (
                        <span className="text-[8px] bg-white/10 text-white/60 px-1 py-0.5 rounded uppercase tracking-widest">
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4 fill-white text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {prefs && (
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Showing:</span>
              {prefs.genres.length > 0 ? (
                prefs.genres.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-full bg-muted text-foreground text-xs">{g}</span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-muted text-foreground text-xs">All genres</span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-muted text-foreground text-xs">
                {LANGUAGES[prefs.language] ?? prefs.language}
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border hover:bg-muted text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" /> Change preferences
            </button>
          </div>
        )}

        {error && (
          <div className="text-center text-destructive">{error}</div>
        )}

        <Section title="Recently Updated" items={recent} />
        <Section title="Mature Manhwa" items={mature} />
        <Section title="H-Manga & Doujinshi" items={doujinshi} />
        
        {recommended && (
          <section className="relative overflow-hidden rounded-3xl p-8 md:p-12 border border-primary/20 bg-black/40">
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
               <img src={recommended.coverUrl} className="w-full h-full object-cover blur-2xl" alt="" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-48 flex-none shadow-2xl rotate-3">
                 <MangaCard manga={recommended} />
              </div>
              <div className="flex-grow space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                  Featured Request
                </div>
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">
                  CHIZURU-CHAN <span className="text-primary">COLLECTION</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Dive into the development diary. This series also has a popular anime adaptation available in our library!
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    to="/manga/$id" 
                    params={{ id: recommended.id }}
                    className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    Read Manga
                  </Link>
                  <Link 
                    to="/anime/$id" 
                    params={{ id: "hanime-chizuru-chan-kaihatsu-nikki" }}
                    className="h-12 px-8 rounded-xl bg-secondary text-foreground font-bold flex items-center justify-center border border-border hover:bg-muted transition-all"
                  >
                    Watch Anime
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <Section title="New Releases" items={newReleases} />
        <Section title="Top Rated" items={topRated} />
        <Section title="Animated Comics" items={animated} />
        <Section title="Hardcore Collection" items={hentai} />
        {prefs?.genres.map((g) => (
          <Section key={g} title={g} items={genreSections[g] ?? null} />
        ))}

        {/* Discovery Feed with Load More */}
        <section className="pt-10 border-t border-border/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Discovery <span className="text-primary">Feed</span></h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {discovery.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>

          <div className="mt-12 pb-20 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group relative h-16 px-12 rounded-2xl bg-secondary text-foreground font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all shadow-2xl shadow-black/20 flex items-center gap-4 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              {loadingMore ? (
                <>
                  <Loader2 className="relative h-5 w-5 animate-spin" /> Fetching More
                </>
              ) : (
                <>
                  <Zap className="relative h-5 w-5" /> Load More Comics
                </>
              )}
            </button>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
              Hungry for more? Browse the full library in search.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: Manga[] | null }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {items === null ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No comics match your filters. Try changing preferences.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {items.map((m) => <MangaCard key={m.id} manga={m} />)}
        </div>
      )}
    </section>
  );
}

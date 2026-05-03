import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  getPopular,
  getRecentlyUpdated,
  getTopRated,
  getNewReleases,
  getByGenre,
  getAnimatedComics,
  LANGUAGES,
  type Manga,
} from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { PreferencesModal, type Prefs } from "@/components/PreferencesModal";
import { Loader2, SlidersHorizontal, BookOpen, X, Play, Compass, Zap } from "lucide-react";

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
  const [discovery, setDiscovery] = useState<Manga[]>([]);
  const [offset, setOffset] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);
  const [genreSections, setGenreSections] = useState<Record<string, Manga[]>>({});
  const [error, setError] = useState<string | null>(null);
  
  const [lastRead, setLastRead] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
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

    // Check for last read
    try {
      const last = localStorage.getItem("jarvis.lastRead");
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed && parsed.chapterId && parsed.mangaId) {
          setLastRead(parsed);
          
          // Only show if it's been less than 24h but more than 5 minutes
          const now = Date.now();
          const diff = now - (parsed.timestamp || 0);
          if (diff > 5 * 60 * 1000 && diff < 24 * 60 * 60 * 1000) {
            setTimeout(() => {
              setShowWelcome(true);
              const audio = new Audio("/notification.mp3");
              audio.volume = 0.5;
              audio.play().catch(() => {});
            }, 1500);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse reading history", e);
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
    ])
      .then(([p, r, t, n, a]) => {
        setPopular(p);
        setRecent(r);
        setTopRated(t);
        setNewReleases(n);
        setAnimated(a);
        setDiscovery(p); // Initialize discovery with popular
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

      {/* Welcome Back Notification */}
      {showWelcome && lastRead?.chapterId && lastRead?.mangaId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative flex items-center gap-4 bg-background/80 backdrop-blur-3xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[300px]">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Play className="h-6 w-6 fill-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Welcome Back</p>
                <p className="text-sm font-bold truncate pr-4">Continue {lastRead.mangaTitle}?</p>
              </div>
              <Link
                to="/chapter/$id"
                params={{ id: lastRead.chapterId }}
                search={{ manga: lastRead.mangaId }}
                onClick={() => setShowWelcome(false)}
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-primary/20"
              >
                Read
              </Link>
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
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

        <Section title="Popular Now" items={popular} />
        <Section title="New Releases" items={newReleases} />
        <Section title="Top Rated" items={topRated} />
        <Section title="Recently Updated" items={recent} />
        <Section title="Animated Comics" items={animated} />
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

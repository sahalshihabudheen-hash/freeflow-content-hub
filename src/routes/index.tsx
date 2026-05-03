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
import { Loader2, SlidersHorizontal, BookOpen, X, Play } from "lucide-react";

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
  const [genreSections, setGenreSections] = useState<Record<string, Manga[]>>({});
  const [error, setError] = useState<string | null>(null);
  
  const [lastRead, setLastRead] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // On mount: load saved prefs or open modal
  useEffect(() => {
    const saved = loadPrefs();
    if (saved && saved.genres.length > 0) {
      setPrefs(saved);
    } else {
      setShowModal(true);
    }

    // Check for last read
    const last = localStorage.getItem("jarvis.lastRead");
    if (last) {
      const parsed = JSON.parse(last);
      setLastRead(parsed);
      
      // Only show if it's been less than 24h but more than 5 minutes (to avoid annoying refreshes)
      const now = Date.now();
      const diff = now - parsed.timestamp;
      if (diff > 5 * 60 * 1000) {
        setTimeout(() => {
          setShowWelcome(true);
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        }, 1500);
      }
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
    setError(null);

    Promise.all([
      getPopular(24, prefs.genres, prefs.language),
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
      {showWelcome && lastRead && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] sm:w-96 animate-slide-in-right">
          <div className="relative group bg-card/80 backdrop-blur-2xl border border-primary/20 rounded-2xl p-4 shadow-2xl shadow-primary/10 flex items-center gap-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            <div className="h-14 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Welcome Back</p>
              <h4 className="text-sm font-bold truncate mb-2">Continue reading {lastRead.mangaTitle}?</h4>
              <div className="flex items-center gap-2">
                <Link 
                  to="/chapter/$id" 
                  params={{ id: lastRead.chapterId }} 
                  search={{ manga: lastRead.mangaId }}
                  onClick={() => setShowWelcome(false)}
                  className="inline-flex items-center gap-2 h-8 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  <Play className="h-3 w-3 fill-current" /> Resume
                </Link>
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="h-8 px-3 rounded-full border border-border text-xs font-bold hover:bg-secondary transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
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

        <div className="pt-10 pb-20 text-center border-t border-border/50">
          <h3 className="text-xl font-bold mb-4 text-muted-foreground">Hungry for more?</h3>
          <Link 
            to="/search" 
            className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            Browse All Series
          </Link>
        </div>
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

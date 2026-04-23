import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getPopular,
  getRecentlyUpdated,
  getTopRated,
  getNewReleases,
  getByGenre,
  LANGUAGES,
  type Manga,
} from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { PreferencesModal, type Prefs } from "@/components/PreferencesModal";
import { Loader2, SlidersHorizontal } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);

  // On mount: load saved prefs or open modal
  useEffect(() => {
    const saved = loadPrefs();
    if (saved) {
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
    setError(null);
    Promise.all([
      getPopular(24, prefs.genres, prefs.language),
      getRecentlyUpdated(18, prefs.genres, prefs.language),
    ])
      .then(([p, r]) => {
        setPopular(p);
        setRecent(r);
      })
      .catch((e) => setError(e.message));
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
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Endless stories,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              one page at a time
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
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
        <Section title="Recently Updated" items={recent} />
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

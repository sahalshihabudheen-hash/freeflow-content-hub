import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPopular, getRecentlyUpdated, type Manga } from "@/lib/mangadex";
import { MangaCard } from "@/components/MangaCard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inkwell — Discover & Read Manga" },
      { name: "description", content: "Browse trending and recently updated manga. Read chapters online for free." },
      { property: "og:title", content: "Inkwell — Discover & Read Manga" },
      { property: "og:description", content: "Browse trending and recently updated manga. Read chapters online for free." },
    ],
  }),
  component: Index,
});

function Index() {
  const [popular, setPopular] = useState<Manga[] | null>(null);
  const [recent, setRecent] = useState<Manga[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPopular(24), getRecentlyUpdated(18)])
      .then(([p, r]) => {
        setPopular(p);
        setRecent(r);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
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
            Discover thousands of manga series and read them right in your browser. Curated SFW catalog powered by MangaDex.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-16">
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {items.map((m) => <MangaCard key={m.id} manga={m} />)}
        </div>
      )}
    </section>
  );
}

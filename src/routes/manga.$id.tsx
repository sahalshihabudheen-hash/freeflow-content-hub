import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getManga, getChapters, getAvailableLanguages, LANGUAGES, type Manga, type Chapter } from "@/lib/mangadex";
import { Loader2, BookOpen, Calendar, Languages } from "lucide-react";

export const Route = createFileRoute("/manga/$id")({
  component: MangaDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-destructive mb-4">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  },
});

function MangaDetail() {
  const { id } = Route.useParams();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [langInitialized, setLangInitialized] = useState(false);

  useEffect(() => {
    getManga(id).then(setManga).catch(() => {});
    getAvailableLanguages(id).then((langs) => {
      setAvailableLangs(langs);
      // Pick English if available, otherwise first available language
      const initial = langs.includes("en") ? "en" : (langs[0] ?? "en");
      setSelectedLang(initial);
      setLangInitialized(true);
    }).catch(() => setLangInitialized(true));
  }, [id]);

  useEffect(() => {
    if (!langInitialized) return;
    setChapters(null);
    getChapters(id, 200, selectedLang).then(setChapters).catch(() => setChapters([]));
  }, [id, selectedLang, langInitialized]);

  const langLabel = useMemo(
    () => (code: string) => LANGUAGES[code] ?? code.toUpperCase(),
    []
  );

  if (!manga) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative">
        <div
          className="absolute inset-0 blur-3xl opacity-30"
          style={{ backgroundImage: `url(${manga.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="container relative mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col md:flex-row gap-8">
            <div
              className="w-48 md:w-64 shrink-0 mx-auto md:mx-0 aspect-[2/3] rounded-xl overflow-hidden border border-border"
              style={{ boxShadow: "var(--shadow-glow)" }}
            >
              {manga.coverUrl && (
                <img src={manga.coverUrl} alt={manga.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold">{manga.title}</h1>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary">
                  <Calendar className="h-3 w-3" /> {manga.year ?? "—"}
                </span>
                <span className="px-2 py-1 rounded-md bg-secondary capitalize">{manga.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {manga.tags.slice(0, 8).map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground">{t}</span>
                ))}
              </div>
              <p className="mt-6 text-foreground/90 leading-relaxed line-clamp-6 whitespace-pre-line">
                {manga.description || "No description available."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Chapters
          </h2>
          {availableLangs.length > 0 && (
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-primary"
              >
                {availableLangs.map((l) => (
                  <option key={l} value={l}>{langLabel(l)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {availableLangs.length === 0 && langInitialized ? (
          <p className="text-muted-foreground">No chapters available for this title.</p>
        ) : chapters === null ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : chapters.length === 0 ? (
          <p className="text-muted-foreground">
            No chapters available in {langLabel(selectedLang)}. Try another language above.
          </p>
        ) : (
          <div className="grid gap-2">
            {chapters.map((c: any) => {
              const content = (
                <>
                  <div className="min-w-0">
                    <div className="font-medium">
                      Chapter {c.chapter ?? "—"}{c.title ? ` · ${c.title}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      <span>{c.scanlator} · {langLabel(c.language)}</span>
                      {c.externalUrl && <span className="uppercase border border-border rounded px-1 text-[9px]">External</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {c.externalUrl ? "Link" : `${c.pages} pages`}
                  </div>
                </>
              );

              if (c.externalUrl) {
                return (
                  <a
                    key={c.id}
                    href={c.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/40 transition"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={c.id}
                  to="/chapter/$id"
                  params={{ id: c.id }}
                  search={{ manga: id }}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/40 transition"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

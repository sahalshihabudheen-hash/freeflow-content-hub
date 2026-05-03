import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getManga, getChapters, getAvailableLanguages, LANGUAGES, type Manga, type Chapter } from "@/lib/mangadex";
import { logViewManga } from "@/lib/search-analytics";
import { Loader2, BookOpen, Calendar, Languages, Share2, Check, Sparkles, Zap, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/manga/$id")({
  component: MangaDetail,
});

function MangaDetail() {
  const { id } = Route.useParams();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [langInitialized, setLangInitialized] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getManga(id).then((m) => {
      setManga(m);
      const isAdult = m.contentRating === "pornographic" || m.contentRating === "erotica";
      logViewManga(id, m.title, isAdult).catch(() => {});
      
      // Update document head for social sharing
      document.title = `${m.title} — JARVIS COMICS`;
      const meta = {
        "og:title": m.title,
        "og:description": m.description?.slice(0, 160),
        "og:image": m.coverUrl,
        "og:type": "website",
        "twitter:card": "summary_large_image"
      };
      Object.entries(meta).forEach(([key, val]) => {
        let el = document.querySelector(`meta[property="${key}"]`) || document.querySelector(`meta[name="${key}"]`);
        if (!el) {
          el = document.createElement("meta");
          if (key.startsWith("og:")) el.setAttribute("property", key);
          else el.setAttribute("name", key);
          document.head.appendChild(el);
        }
        el.setAttribute("content", val || "");
      });
    }).catch(() => {});
    
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

  const handleShare = async () => {
    const shareData = {
      title: manga?.title,
      text: `Read ${manga?.title} on JARVIS COMICS!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 blur-[100px] opacity-40 scale-150"
          style={{ backgroundImage: `url(${manga.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div
              className="w-56 md:w-72 shrink-0 mx-auto md:mx-0 group relative"
            >
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                {manga.coverUrl && (
                  <img src={manga.coverUrl} alt={manga.title} className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="h-3 w-3" /> JARVIS EXCLUSIVE
                   </div>
                   <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                     {manga.title}
                   </h1>
                </div>

                <button 
                  onClick={handleShare}
                  className={`group relative inline-flex items-center gap-3 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500 ${
                    copied 
                    ? "bg-green-500 text-white shadow-xl shadow-green-500/20" 
                    : "bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4 animate-bounce-subtle" />}
                  {copied ? "Copied!" : "Share Series"}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-white/5 text-xs font-bold">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> {manga.year ?? "—"}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-white/5 text-xs font-bold uppercase tracking-widest">
                  <Zap className="h-3.5 w-3.5 text-primary" /> {manga.status}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-white/5 text-xs font-bold uppercase tracking-widest">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" /> {manga.contentRating}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {manga.tags.map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default">
                    {t}
                  </span>
                ))}
              </div>

              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line pl-4 max-w-3xl italic">
                  {manga.description || "No description available."}
                </p>
              </div>
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
                  search={{ manga: id, lang: selectedLang }}
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

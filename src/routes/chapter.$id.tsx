import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getChapterPages, getChapters, getManga, type Chapter, type Manga } from "@/lib/mangadex";
import { Loader2, ArrowLeft, ArrowRight, ChevronLeft, LayoutGrid, Check, Share2 } from "lucide-react";
import { z } from "zod";

const chapterSearchSchema = z.object({
  manga: z.string().optional(),
  lang: z.string().optional(),
});

export const Route = createFileRoute("/chapter/$id")({
  validateSearch: chapterSearchSchema,
  component: ChapterReader,
});

import { useReadingProgress } from "@/hooks/use-reading-progress";
import { ComicReaderScrollbar } from "@/components/ComicReaderScrollbar";


function ChapterReader() {
  const { id } = Route.useParams();
  const { manga: mangaId, lang } = Route.useSearch();
  const navigate = useNavigate();
  const { updateProgress } = useReadingProgress();
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<Chapter[] | null>(null);
  const [manga, setManga] = useState<Manga | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: `${manga?.title} - Chapter ${currentChapter?.chapter}`,
      text: `Read ${manga?.title} - Chapter ${currentChapter?.chapter} on JARVIS COMICS!`,
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

  useEffect(() => {
    setPages(null);
    setError(null);
    getChapterPages(id)
      .then((r) => setPages(r.urls))
      .catch((e) => setError(e.message));
    window.scrollTo({ top: 0 });
    
    // Save reading progress
    if (mangaId && manga && currentChapter) {
      updateProgress({
        mangaId,
        mangaTitle: manga.title,
        coverUrl: manga.coverUrl,
        chapterId: id,
        chapterNumber: currentChapter.chapter || "Reading",
        chapterTitle: currentChapter.title || undefined,
        isUserComic: false
      });
    }
  }, [id, mangaId, manga, currentChapter]);


  useEffect(() => {
    if (!mangaId) return;
    getManga(mangaId).then(setManga).catch(() => {});
    // Fetch a large chunk of chapters in the same language to ensure next/prev work
    getChapters(mangaId, 500, lang).then((list) => {
      setSiblings(list);
      const current = list.find(c => c.id === id);
      if (current) setCurrentChapter(current);
    }).catch(() => {});
  }, [mangaId, id, lang]);

  const idx = siblings?.findIndex((c) => c.id === id) ?? -1;
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = idx >= 0 && siblings && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const goNext = () => next && navigate({ to: "/chapter/$id", params: { id: next.id }, search: { manga: mangaId, lang } });
  const goPrev = () => prev && navigate({ to: "/chapter/$id", params: { id: prev.id }, search: { manga: mangaId, lang } });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 py-2 sm:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {mangaId ? (
              <Link to="/manga/$id" params={{ id: mangaId }} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : (
              <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate leading-tight">
                {manga?.title || "Loading..."}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                {currentChapter ? `Chapter ${currentChapter.chapter}` : "Reading"}
                {currentChapter?.title && <span className="normal-case font-medium ml-2 opacity-60">· {currentChapter.title}</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={handleShare}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-all"
              title="Share"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button 
              onClick={goPrev} 
              disabled={!prev} 
              className="h-9 px-3 text-xs font-bold uppercase rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <button 
              onClick={goNext} 
              disabled={!next} 
              className="h-9 px-4 text-xs font-bold uppercase rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm"
          >
            Retry Loading
          </button>
        </div>
      )}

      {pages === null && !error && (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Initializing neural reading core...</p>
        </div>
      )}

      {pages && (
        <div className="max-w-4xl mx-auto py-2 px-1 sm:px-4 flex flex-col gap-1 sm:gap-2">
          {pages.map((url, i) => (
            <img 
              key={i} 
              src={url} 
              alt={`Page ${i + 1}`} 
              loading="lazy" 
              className="w-full h-auto rounded-sm sm:rounded shadow-2xl" 
            />
          ))}
          
          <div className="mt-12 text-center space-y-6">
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <div className="h-px w-12 bg-border" />
              <span className="text-xs font-black uppercase tracking-widest">End of Chapter</span>
              <div className="h-px w-12 bg-border" />
            </div>

            <div className="flex flex-col items-center gap-4">
              {next ? (
                <button 
                  onClick={goNext} 
                  className="w-full max-w-sm flex items-center justify-between px-6 py-4 rounded-2xl bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group"
                >
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Up Next</p>
                    <p className="text-lg font-bold">Chapter {next.chapter}</p>
                  </div>
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">You've reached the latest chapter available in this language.</p>
              )}

              <div className="flex gap-3 w-full max-w-sm">
                {prev && (
                  <button 
                    onClick={goPrev} 
                    className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border border-border bg-card hover:bg-secondary transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" /> <span className="font-bold text-sm">Previous</span>
                  </button>
                )}
                <Link 
                  to={mangaId ? "/manga/$id" : "/"} 
                  params={mangaId ? { id: mangaId } : {}}
                  className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border border-border bg-card hover:bg-secondary transition-all"
                >
                  <LayoutGrid className="h-4 w-4" /> <span className="font-bold text-sm">Chapters</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {pages && <ComicReaderScrollbar totalPages={pages.length} />}
    </div>
  );
}

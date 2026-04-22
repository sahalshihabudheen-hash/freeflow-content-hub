import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getChapterPages, getChapters, type Chapter } from "@/lib/mangadex";
import { Loader2, ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import { z } from "zod";

const chapterSearchSchema = z.object({
  manga: z.string().optional(),
});

export const Route = createFileRoute("/chapter/$id")({
  validateSearch: chapterSearchSchema,
  component: ChapterReader,
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

function ChapterReader() {
  const { id } = Route.useParams();
  const { manga: mangaId } = Route.useSearch();
  const navigate = useNavigate();
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<Chapter[] | null>(null);

  useEffect(() => {
    setPages(null);
    setError(null);
    getChapterPages(id)
      .then((r) => setPages(r.urls))
      .catch((e) => setError(e.message));
    window.scrollTo({ top: 0 });
  }, [id]);

  useEffect(() => {
    if (!mangaId) return;
    getChapters(mangaId, 300).then(setSiblings).catch(() => {});
  }, [mangaId]);

  const idx = siblings?.findIndex((c) => c.id === id) ?? -1;
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = idx >= 0 && siblings && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const goNext = () => next && navigate({ to: "/chapter/$id", params: { id: next.id }, search: { manga: mangaId } });
  const goPrev = () => prev && navigate({ to: "/chapter/$id", params: { id: prev.id }, search: { manga: mangaId } });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {mangaId ? (
            <Link to="/manga/$id" params={{ id: mangaId }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> All chapters
            </Link>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          )}
          <div className="flex items-center gap-2">
            <button onClick={goPrev} disabled={!prev} className="px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{pages ? `${pages.length} pages` : ""}</span>
            <button onClick={goNext} disabled={!next} className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 py-10 text-center text-destructive">{error}</div>
      )}

      {pages === null && !error && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {pages && (
        <div className="max-w-3xl mx-auto py-6 px-2 flex flex-col gap-2">
          {pages.map((url, i) => (
            <img key={i} src={url} alt={`Page ${i + 1}`} loading="lazy" className="w-full h-auto rounded" />
          ))}
          <div className="text-center text-sm text-muted-foreground py-6">— End of chapter —</div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pb-12">
            {prev && (
              <button onClick={goPrev} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-border bg-card hover:bg-secondary">
                <ArrowLeft className="h-4 w-4" /> Previous chapter
              </button>
            )}
            {next ? (
              <button onClick={goNext} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                Next chapter <ArrowRight className="h-4 w-4" />
              </button>
            ) : mangaId ? (
              <Link to="/manga/$id" params={{ id: mangaId }} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                Back to chapter list
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

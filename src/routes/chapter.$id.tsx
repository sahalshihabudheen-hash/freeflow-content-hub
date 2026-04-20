import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getChapterPages } from "@/lib/mangadex";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/chapter/$id")({
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
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPages(null);
    getChapterPages(id)
      .then((r) => setPages(r.urls))
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-sm text-muted-foreground">
            {pages ? `${pages.length} pages` : ""}
          </span>
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
            <img
              key={i}
              src={url}
              alt={`Page ${i + 1}`}
              loading="lazy"
              className="w-full h-auto rounded"
            />
          ))}
          <div className="text-center text-sm text-muted-foreground py-8">— End of chapter —</div>
        </div>
      )}
    </div>
  );
}

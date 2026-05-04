import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/my-chapter/$id")({
  component: MyChapterReader,
});

type Chap = { id: string; comic_id: string; number: string; title: string | null; page_paths: string[]; created_at: string };

function publicUrl(path: string): string {
  return supabase.storage.from("comics").getPublicUrl(path).data.publicUrl;
}

import { useReadingProgress } from "@/hooks/use-reading-progress";
import { ComicReaderScrollbar } from "@/components/ComicReaderScrollbar";


type Comic = { id: string; title: string; cover_path: string | null };

function MyChapterReader() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { updateProgress } = useReadingProgress();
  const [chap, setChap] = useState<Chap | null>(null);
  const [siblings, setSiblings] = useState<Chap[]>([]);

  useEffect(() => {
    setChap(null);
    window.scrollTo({ top: 0 });
    supabase.from("user_chapters").select("id,comic_id,number,title,page_paths,created_at").eq("id", id).maybeSingle()
      .then(async ({ data }) => {
        const c = data as Chap | null;
        setChap(c);
        if (c) {
          // Fetch comic details for progress tracking
          const { data: comic } = await supabase.from("user_comics").select("id,title,cover_path").eq("id", c.comic_id).maybeSingle();
          const comicData = comic as Comic | null;
          
          if (comicData) {
            updateProgress({
              mangaId: c.comic_id,
              mangaTitle: comicData.title,
              coverUrl: comicData.cover_path ? publicUrl(comicData.cover_path) : "",
              chapterId: id,
              chapterNumber: c.number,
              chapterTitle: c.title || undefined,
              isUserComic: true
            });
          }

          const { data: sibs } = await supabase.from("user_chapters")
            .select("id,comic_id,number,title,page_paths,created_at")
            .eq("comic_id", c.comic_id).order("created_at", { ascending: true });
          setSiblings((sibs as Chap[]) ?? []);
        }
      });
  }, [id]);


  if (!chap) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const idx = siblings.findIndex((s) => s.id === chap.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const goNext = () => next && navigate({ to: "/my-chapter/$id", params: { id: next.id } });
  const goPrev = () => prev && navigate({ to: "/my-chapter/$id", params: { id: prev.id } });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link to="/my-comic/$id" params={{ id: chap.comic_id }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> All chapters
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={goPrev} disabled={!prev} className="px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-40">Prev</button>
            <button onClick={goNext} disabled={!next} className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-6 px-2 flex flex-col gap-2">
        {chap.page_paths.map((p, i) => (
          <img key={i} src={publicUrl(p)} alt={`Page ${i + 1}`} loading="lazy" className="w-full h-auto rounded" />
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
          ) : (
            <Link to="/my-comic/$id" params={{ id: chap.comic_id }} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              Back to chapter list
            </Link>
          )}
        </div>
      </div>
      {chap?.page_paths && <ComicReaderScrollbar totalPages={chap.page_paths.length} />}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/my-comic/$id")({
  component: MyComicDetail,
});

type Comic = { id: string; title: string; description: string | null; cover_path: string | null };
type Chap = { id: string; number: string; title: string | null; page_paths: string[] };

function publicUrl(path: string | null): string {
  if (!path) return "";
  return supabase.storage.from("comics").getPublicUrl(path).data.publicUrl;
}

function MyComicDetail() {
  const { id } = Route.useParams();
  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chap[] | null>(null);

  useEffect(() => {
    supabase.from("user_comics").select("id,title,description,cover_path").eq("id", id).maybeSingle()
      .then(({ data }) => setComic(data as Comic | null));
    supabase.from("user_chapters").select("id,number,title,page_paths").eq("comic_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setChapters((data as Chap[]) ?? []));
  }, [id]);

  if (!comic) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-64 shrink-0 mx-auto md:mx-0 aspect-[2/3] rounded-xl overflow-hidden border border-border bg-secondary">
            {comic.cover_path && <img src={publicUrl(comic.cover_path)} alt={comic.title} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-bold">{comic.title}</h1>
            <p className="mt-6 text-foreground/90 whitespace-pre-line">{comic.description || "No description."}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Chapters</h2>
        {chapters === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        ) : chapters.length === 0 ? (
          <p className="text-muted-foreground">No chapters uploaded yet.</p>
        ) : (
          <div className="grid gap-2">
            {chapters.map((c) => (
              <Link key={c.id} to="/my-chapter/$id" params={{ id: c.id }}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary transition">
                <div className="font-medium">Chapter {c.number}{c.title ? ` · ${c.title}` : ""}</div>
                <div className="text-xs text-muted-foreground">{c.page_paths.length} pages</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

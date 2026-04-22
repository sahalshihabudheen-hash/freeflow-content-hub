import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, ImagePlus, Trash2, BookPlus, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload your comic — JARVIS COMICS" },
      { name: "description", content: "Publish your own comics on JARVIS COMICS. Upload covers and chapter pages." },
    ],
  }),
  component: UploadPage,
});

type MyComic = { id: string; title: string; description: string | null; cover_path: string | null };

function publicUrl(path: string | null): string {
  if (!path) return "";
  return supabase.storage.from("comics").getPublicUrl(path).data.publicUrl;
}

function UploadPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [comics, setComics] = useState<MyComic[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chapNumber, setChapNumber] = useState("");
  const [chapTitle, setChapTitle] = useState("");
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [uploadingChapter, setUploadingChapter] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoadingList(true);
    supabase.from("user_comics").select("id,title,description,cover_path").eq("user_id", userId).order("created_at", { ascending: false })
      .then(({ data }) => {
        setComics((data as MyComic[]) ?? []);
        setLoadingList(false);
      });
  }, [userId, creating]);

  if (authChecked && !userId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <BookPlus className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sign in to upload</h1>
        <p className="text-muted-foreground mb-6">Create a free account to publish your own comics on JARVIS COMICS.</p>
        <Link to="/auth" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium">Sign in / Sign up</Link>
      </div>
    );
  }

  const createComic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setCreating(true);
    setMsg(null);
    try {
      let cover_path: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg";
        const path = `${userId}/covers/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("comics").upload(path, coverFile);
        if (error) throw error;
        cover_path = path;
      }
      const { error: insErr } = await supabase.from("user_comics").insert({
        user_id: userId, title: title.trim(), description: description.trim() || null, cover_path,
      });
      if (insErr) throw insErr;
      setTitle(""); setDescription(""); setCoverFile(null);
      setMsg("Comic created!");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setCreating(false);
    }
  };

  const uploadChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedId || pageFiles.length === 0) return;
    setUploadingChapter(true);
    setMsg(null);
    try {
      const paths: string[] = [];
      for (let i = 0; i < pageFiles.length; i++) {
        const f = pageFiles[i];
        const ext = f.name.split(".").pop() || "jpg";
        const padded = String(i + 1).padStart(3, "0");
        const path = `${userId}/chapters/${selectedId}/${crypto.randomUUID()}-${padded}.${ext}`;
        const { error } = await supabase.storage.from("comics").upload(path, f);
        if (error) throw error;
        paths.push(path);
      }
      const { error: insErr } = await supabase.from("user_chapters").insert({
        user_id: userId, comic_id: selectedId, number: chapNumber.trim(), title: chapTitle.trim() || null, page_paths: paths,
      });
      if (insErr) throw insErr;
      setChapNumber(""); setChapTitle(""); setPageFiles([]);
      setMsg(`Chapter uploaded (${paths.length} pages)!`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setUploadingChapter(false);
    }
  };

  const deleteComic = async (id: string) => {
    if (!confirm("Delete this comic and all its chapters?")) return;
    await supabase.from("user_comics").delete().eq("id", id);
    setComics(comics.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Upload your comics</h1>
          <p className="text-muted-foreground mt-1">Publish your own series on JARVIS COMICS. Cover supports JPG, PNG, WEBP & GIF.</p>
        </div>
        <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
      </div>

      {msg && <div className="mb-6 p-3 rounded-lg border border-border bg-card text-sm">{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookPlus className="h-5 w-5 text-primary" /> New comic</h2>
          <form onSubmit={createComic} className="space-y-4">
            <input required maxLength={200} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 rounded-lg border border-border bg-input px-4" />
            <textarea maxLength={2000} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-input px-4 py-2" />
            <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:bg-secondary">
              <ImagePlus className="h-5 w-5 text-primary" />
              <span className="text-sm">{coverFile ? coverFile.name : "Choose cover image"}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
            <button type="submit" disabled={creating || !title.trim()} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create comic
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Add chapter</h2>
          {comics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a comic first to upload chapters.</p>
          ) : (
            <form onSubmit={uploadChapter} className="space-y-4">
              <select required value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value || null)} className="w-full h-11 rounded-lg border border-border bg-input px-3">
                <option value="">Select comic…</option>
                {comics.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Chapter # (e.g. 1)" value={chapNumber} onChange={(e) => setChapNumber(e.target.value)} className="h-11 rounded-lg border border-border bg-input px-4" />
                <input placeholder="Chapter title (optional)" value={chapTitle} onChange={(e) => setChapTitle(e.target.value)} className="h-11 rounded-lg border border-border bg-input px-4" />
              </div>
              <label className="block p-3 rounded-lg border border-dashed border-border cursor-pointer hover:bg-secondary">
                <div className="flex items-center gap-3">
                  <ImagePlus className="h-5 w-5 text-primary" />
                  <span className="text-sm">{pageFiles.length > 0 ? `${pageFiles.length} pages selected` : "Choose chapter pages (multiple)"}</span>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => setPageFiles(Array.from(e.target.files ?? []))} className="hidden" />
              </label>
              <button type="submit" disabled={uploadingChapter || !selectedId || pageFiles.length === 0 || !chapNumber.trim()} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {uploadingChapter && <Loader2 className="h-4 w-4 animate-spin" />} Upload chapter
              </button>
            </form>
          )}
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Your comics</h2>
        {loadingList ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : comics.length === 0 ? (
          <p className="text-muted-foreground">You haven't uploaded any comics yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {comics.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden group">
                <Link to="/my-comic/$id" params={{ id: c.id }} className="block aspect-[2/3] bg-secondary">
                  {c.cover_path ? (
                    <img src={publicUrl(c.cover_path)} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No cover</div>
                  )}
                </Link>
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="font-medium text-sm line-clamp-1">{c.title}</div>
                  <button onClick={() => deleteComic(c.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

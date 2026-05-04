
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAnimeInfo, type AnimeDetails } from "@/lib/anime";
import { useAdultAccess } from "@/hooks/use-adult-access";
import { Loader2, Play, Calendar, Tag, Info, ArrowLeft, Heart, Share2, Layers } from "lucide-react";

export const Route = createFileRoute("/anime/$id")({
  component: AnimeDetailsPage,
});

function AnimeDetailsPage() {
  const { id } = Route.useParams();
  const { hasAdultAccess, loading: accessLoading } = useAdultAccess();
  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessLoading && !hasAdultAccess) {
      navigate({ to: "/", replace: true });
    }
  }, [hasAdultAccess, accessLoading, navigate]);

  useEffect(() => {
    if (hasAdultAccess) {
      setLoading(true);
      getAnimeInfo(id)
        .then(setAnime)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, hasAdultAccess]);

  if (accessLoading || (loading && !anime)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAdultAccess || !anime) return null;

  return (
    <div className="pb-20">
      {/* Backdrop */}
      <div className="fixed inset-0 z-0 h-[60vh] opacity-30 pointer-events-none">
        <img src={anime.image} alt="" className="w-full h-full object-cover blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-12">
        <button 
          onClick={() => window.history.back()}
          className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Back to browsing
        </button>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src={anime.image} alt={anime.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                     <Play className="h-8 w-8 text-white fill-white ml-1" />
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                  <Heart size={14} /> Add Favorite
                </button>
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10">
                  <Share2 size={14} /> Share
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-secondary/30 border border-white/5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold uppercase tracking-widest text-xs">{anime.type || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold uppercase tracking-widest text-xs text-primary">{anime.status || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Released</span>
                  <span className="font-bold uppercase tracking-widest text-xs">{anime.releaseDate || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-12">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight uppercase italic">
                {anime.title}
              </h1>
              
              <div className="flex flex-wrap gap-2">
                {anime.genres?.map((g) => (
                  <span key={g} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/50 hover:text-primary transition-all cursor-default">
                    {g}
                  </span>
                ))}
              </div>

              <div className="p-8 rounded-3xl bg-secondary/20 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                  <Info size={14} /> Synopsis
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {anime.description || "No description available for this series."}
                </p>
              </div>
            </div>

            {/* Episode List */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">Episodes</h2>
                </div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {anime.episodes.length} Available
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {anime.episodes.map((ep) => (
                  <Link
                    key={ep.id}
                    to="/anime/watch/$id"
                    params={{ id: ep.id }}
                    search={{ anime: anime.id }}
                    className="group p-5 rounded-2xl bg-secondary/40 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-black/40 flex items-center justify-center text-white font-black group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      {ep.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Episode</div>
                      <div className="text-sm font-bold truncate">Episode {ep.number}</div>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} fill="currentColor" className="text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

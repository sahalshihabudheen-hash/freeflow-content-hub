
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAnimeInfo, getEpisodeSources, type AnimeDetails, type StreamingLink } from "@/lib/anime";
import { AnimePlayer } from "@/components/AnimePlayer";
import { useAdultAccess } from "@/hooks/use-adult-access";
import { Loader2, ArrowLeft, Layers, Play, AlertCircle, Maximize2 } from "lucide-react";

export const Route = createFileRoute("/anime/watch/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    anime: (search.anime as string) || "",
  }),
  component: WatchPage,
});

function WatchPage() {
  const { id: episodeId } = Route.useParams();
  const { anime: animeId } = Route.useSearch();
  const { hasAdultAccess, loading: accessLoading } = useAdultAccess();
  
  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [sources, setSources] = useState<StreamingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessLoading && !hasAdultAccess) {
      navigate({ to: "/", replace: true });
    }
  }, [hasAdultAccess, accessLoading, navigate]);

  useEffect(() => {
    if (hasAdultAccess && animeId && episodeId) {
      setLoading(true);
      setError(null);
      
      Promise.all([
        getAnimeInfo(animeId),
        getEpisodeSources(episodeId)
      ])
        .then(([info, src]) => {
          setAnime(info);
          setSources(src);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [animeId, episodeId, hasAdultAccess]);

  if (accessLoading || (loading && !anime)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAdultAccess || !anime) return null;

  const activeSource = sources.find(s => s.isM3U8) || sources[0];
  const currentEpisode = anime.episodes.find(e => e.id === episodeId);
  const nextEpisode = anime.episodes.find(e => e.number === (currentEpisode?.number || 0) + 1);

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 pt-8">
        <div className="flex flex-col gap-8">
          {/* Player Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link
                to="/anime/$id"
                params={{ id: anime.id }}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} /> Back to details
              </Link>
              <div className="flex items-center gap-4">
                 <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-red-600/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest">
                   Adult Content
                 </div>
              </div>
            </div>

            {error ? (
              <div className="aspect-video w-full rounded-3xl bg-secondary/20 flex flex-col items-center justify-center gap-4 border border-white/5 p-8 text-center">
                <AlertCircle size={48} className="text-destructive" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-tighter italic">Streaming Error</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">We couldn't load the video stream for this episode. This can happen if the provider is down or content is no longer available.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-8 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs"
                >
                  Retry Loading
                </button>
              </div>
            ) : activeSource ? (
              <AnimePlayer 
                url={activeSource.url} 
                title={`${anime.title} - Episode ${currentEpisode?.number || ""}`} 
                onEnded={() => {
                  if (nextEpisode) {
                    navigate({ to: "/anime/watch/$id", params: { id: nextEpisode.id }, search: { anime: anime.id } });
                  }
                }}
              />
            ) : (
              <div className="aspect-video w-full rounded-3xl bg-secondary/20 flex flex-col items-center justify-center gap-4 border border-white/5 animate-pulse">
                <Loader2 size={32} className="animate-spin text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Initializing Player...</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-secondary/20 border border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    EP {currentEpisode?.number}
                  </span>
                  <h1 className="text-2xl font-black tracking-tighter uppercase italic line-clamp-1">{anime.title}</h1>
                </div>
                <p className="text-sm text-muted-foreground">Now playing episode {currentEpisode?.number}. High quality streaming enabled.</p>
              </div>
              
              <div className="flex items-center gap-3">
                {nextEpisode && (
                  <Link
                    to="/anime/watch/$id"
                    params={{ id: nextEpisode.id }}
                    search={{ anime: anime.id }}
                    className="flex-1 md:flex-none h-12 px-8 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-xl"
                  >
                    Next Episode <Play size={12} fill="currentColor" />
                  </Link>
                )}
                <button className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Episode Selection Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Up <span className="text-primary">Next</span></h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
              {anime.episodes.map((ep) => (
                <Link
                  key={ep.id}
                  to="/anime/watch/$id"
                  params={{ id: ep.id }}
                  search={{ anime: anime.id }}
                  className={`group relative flex-none w-48 aspect-video rounded-2xl overflow-hidden border transition-all snap-start ${
                    ep.id === episodeId 
                      ? "border-primary shadow-lg shadow-primary/20 scale-105" 
                      : "border-white/5 opacity-60 hover:opacity-100 hover:border-white/20"
                  }`}
                >
                  <img src={anime.image} alt="" className="w-full h-full object-cover blur-[1px] brightness-[0.4]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ep.id === episodeId ? "bg-primary text-white" : "bg-white/10 text-white"}`}>
                      {ep.id === episodeId ? <Play size={16} fill="currentColor" /> : <span className="text-sm font-black">{ep.number}</span>}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white">Episode {ep.number}</div>
                  </div>
                  {ep.id === episodeId && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

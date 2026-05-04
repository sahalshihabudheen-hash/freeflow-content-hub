
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTrendingAnime, getRecentEpisodes, type Anime } from "@/lib/anime";
import { AnimeCard } from "@/components/AnimeCard";
import { useAdultAccess } from "@/hooks/use-adult-access";
import { Loader2, Flame, History, Play, ShieldAlert, Sparkles } from "lucide-react";

export const Route = createFileRoute("/anime")({
  component: AnimePage,
});

function AnimePage() {
  const { hasAdultAccess, loading: accessLoading } = useAdultAccess();
  const [trending, setTrending] = useState<Anime[] | null>(null);
  const [recent, setRecent] = useState<Anime[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessLoading && !hasAdultAccess) {
      navigate({ to: "/", replace: true });
    }
  }, [hasAdultAccess, accessLoading, navigate]);

  useEffect(() => {
    if (hasAdultAccess) {
      Promise.all([getTrendingAnime(), getRecentEpisodes()])
        .then(([t, r]) => {
          setTrending(t);
          setRecent(r);
        })
        .catch((e) => setError(e.message));
    }
  }, [hasAdultAccess]);

  if (accessLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAdultAccess) return null;

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden flex items-center">
        {trending?.[0] && (
          <>
            <div className="absolute inset-0 z-0">
              <img 
                src={trending[0].image} 
                alt="" 
                className="w-full h-full object-cover scale-105 blur-[2px] brightness-[0.3]" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent" />
            </div>
            
            <div className="container relative z-10 mx-auto px-4">
              <div className="max-w-3xl space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Flame className="h-3 w-3" /> Trending Now
                   </div>
                   <div className="px-3 py-1 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 text-xs font-black uppercase tracking-widest">
                     18+ Content
                   </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic uppercase">
                  {trending[0].title}
                </h1>
                
                <p className="text-lg text-muted-foreground line-clamp-3 max-w-xl">
                  Explore the most popular adult anime series. High quality streaming with zero interruptions.
                </p>

                <div className="flex items-center gap-4 pt-4">
                  <Link
                    to="/anime/$id"
                    params={{ id: trending[0].id }}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    <Play className="h-5 w-5 fill-white" /> Watch Now
                  </Link>
                  <button className="h-14 px-8 rounded-2xl bg-white/10 backdrop-blur-md text-white font-black uppercase tracking-widest text-sm flex items-center gap-3 border border-white/10 hover:bg-white/20 transition-all">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="container mx-auto px-4 -mt-16 relative z-20 space-y-20">
        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">Hot <span className="text-primary">Picks</span></h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
            {trending ? trending.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            )) : Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </section>

        {/* Recent Episodes */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
              <Play className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Recent <span className="text-primary">Updates</span></h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
            {recent ? recent.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            )) : Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </section>

        {/* Legal/Safety Disclaimer */}
        <section className="p-8 rounded-3xl bg-destructive/5 border border-destructive/10 flex flex-col md:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive uppercase tracking-widest mb-1">Content Advisory</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This section contains explicit adult content intended for viewers aged 18 and older. By continuing, you confirm that you are of legal age in your jurisdiction and consent to viewing such material. All content is for entertainment purposes only.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

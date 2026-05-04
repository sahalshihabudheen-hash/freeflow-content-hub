
import { Link } from "@tanstack/react-router";
import type { Anime } from "@/lib/anime";
import { Play, Calendar, Star } from "lucide-react";

export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <Link
      to="/anime/$id"
      params={{ id: anime.id }}
      className="group flex flex-col gap-2 animate-fade-in"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-muted transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-[0_20px_40px_-12px_oklch(0.7_0.22_250_/_0.5)] group-hover:-translate-y-1 active:scale-[0.98]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {anime.image ? (
          <img
            src={anime.image}
            alt={anime.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-6 w-6 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Info on hover */}
        <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-3 text-[10px] font-bold text-white/90 uppercase tracking-widest">
            {anime.releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {anime.releaseDate}
              </span>
            )}
            {anime.type && (
              <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-md">
                {anime.type}
              </span>
            )}
          </div>
        </div>

        {/* 18+ Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-600 text-white border border-red-500/50 shadow-lg">
          18+
        </div>

        {/* Episode count pill */}
        {anime.totalEpisodes && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white border border-white/10">
            {anime.totalEpisodes} EP
          </div>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
        {anime.title}
      </h3>
    </Link>
  );
}

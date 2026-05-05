import { Link } from "@tanstack/react-router";
import type { Manga } from "@/lib/mangadex";
import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function MangaCard({ manga }: { manga: Manga }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/manga/${manga.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: manga.title, url });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Link
      to="/manga/$id"
      params={{ id: manga.id }}
      className="group flex flex-col gap-2 animate-fade-in"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-muted transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-[0_20px_40px_-12px_oklch(0.7_0.22_250_/_0.5)] group-hover:-translate-y-1 active:scale-[0.98]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {manga.coverUrl ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No cover</div>
        )}
        
        {/* Share Button Overlay */}
        <button
          onClick={handleShare}
          className={`absolute top-2 left-2 z-10 h-8 w-8 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all duration-300 opacity-0 group-hover:opacity-100 ${
            copied 
              ? "bg-green-500 border-green-400 text-white" 
              : "bg-black/40 border-white/10 text-white hover:bg-primary hover:border-primary"
          }`}
          title="Share"
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </button>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Read badge on hover */}
        <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="text-xs font-medium text-white/90 line-clamp-1">
            {manga.tags.slice(0, 2).join(" · ")}
          </div>
        </div>
        {/* Status pill */}
        {manga.status && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white capitalize border border-white/10 flex items-center gap-1">
            {manga.status}
            {manga.lastChapter && <span className="opacity-60 text-[9px]">· {manga.lastChapter}</span>}
          </div>
        )}

        {/* Adult Badge */}
        {(manga.contentRating === 'pornographic' || manga.contentRating === 'erotica') && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white uppercase tracking-tighter border border-red-500 shadow-lg shadow-red-900/50">
            {manga.contentRating === 'pornographic' ? 'R-18' : 'M'}
          </div>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {manga.title}
      </h3>
    </Link>
  );
}

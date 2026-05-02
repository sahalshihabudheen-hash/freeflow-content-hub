import { Link } from "@tanstack/react-router";
import type { Manga } from "@/lib/mangadex";

export function MangaCard({ manga }: { manga: Manga }) {
  const isComick = manga.id.startsWith("comick-");
  const CardContent = (
    <>
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
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white capitalize border border-white/10">
            {manga.status}
          </div>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors mt-2">
        {manga.title}
        {isComick && <span className="ml-1 text-[10px] uppercase text-muted-foreground border border-border px-1 rounded">External</span>}
      </h3>
    </>
  );

  if (isComick) {
    return (
      <a
        href={`https://comick.io/comic/${manga.id.replace("comick-", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col animate-fade-in"
      >
        {CardContent}
      </a>
    );
  }

  return (
    <Link
      to="/manga/$id"
      params={{ id: manga.id }}
      className="group flex flex-col animate-fade-in"
    >
      {CardContent}
    </Link>
  );
}

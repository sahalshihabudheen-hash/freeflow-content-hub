import { Link } from "@tanstack/react-router";
import type { Manga } from "@/lib/mangadex";

export function MangaCard({ manga }: { manga: Manga }) {
  return (
    <Link
      to="/manga/$id"
      params={{ id: manga.id }}
      className="group flex flex-col gap-2 animate-fade-in hover-lift"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-muted"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {manga.coverUrl ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No cover</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition" />
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition">
        {manga.title}
      </h3>
    </Link>
  );
}

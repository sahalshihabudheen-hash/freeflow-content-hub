import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, BookOpen } from "lucide-react";

export function Header() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-hero)" }}
          >
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
            Inkwell
          </span>
        </Link>

        <form onSubmit={onSubmit} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search manga..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link to="/" className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition" activeProps={{ className: "px-3 py-2 rounded-md text-foreground bg-secondary" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/search" className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition" activeProps={{ className: "px-3 py-2 rounded-md text-foreground bg-secondary" }}>
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield } from "lucide-react";
import jarvisLogo from "@/assets/jarvis-comics-logo.png";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function Header() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-18 items-center gap-4 px-4 py-2">
        <Link to="/" className="shrink-0">
          <img
            src={jarvisLogo}
            alt="JARVIS COMICS"
            className="h-10 w-auto sm:h-12"
            loading="eager"
          />
        </Link>

        <form onSubmit={onSubmit} className="mx-auto flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search manga..."
              className="h-10 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link to="/" className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-2 text-foreground bg-secondary" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/search" className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-2 text-foreground bg-secondary" }}>
            Browse
          </Link>
          <Link to="/upload" className="rounded-md px-3 py-2 text-primary font-medium transition hover:bg-secondary" activeProps={{ className: "rounded-md px-3 py-2 text-primary bg-secondary font-medium" }}>
            Upload
          </Link>
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground font-medium transition hover:bg-secondary" activeProps={{ className: "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground bg-secondary font-medium" }}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

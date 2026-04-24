import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield, Menu, X, Home, Compass, Upload } from "lucide-react";
import jarvisLogo from "@/assets/jarvis-comics-logo.png";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function Header() {
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setMobileOpen(false);
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4 md:h-18 md:gap-4 md:py-2">
        <Link to="/" className="shrink-0 hover-scale" onClick={closeMenu}>
          <img
            src={jarvisLogo}
            alt="JARVIS COMICS"
            className="h-9 w-auto sm:h-12"
            loading="eager"
          />
        </Link>

        <form onSubmit={onSubmit} className="mx-auto flex-1 max-w-xl hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search manga..."
              className="h-10 w-full rounded-full border border-border bg-input/60 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link to="/" className="rounded-full px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-full px-3 py-2 text-foreground bg-secondary" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/search" className="rounded-full px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-full px-3 py-2 text-foreground bg-secondary" }}>
            Browse
          </Link>
          <Link to="/upload" className="rounded-full px-3 py-2 text-primary font-medium transition hover:bg-secondary" activeProps={{ className: "rounded-full px-3 py-2 text-primary bg-secondary font-medium" }}>
            Upload
          </Link>
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-foreground font-medium transition hover:bg-secondary" activeProps={{ className: "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-foreground bg-secondary font-medium" }}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-secondary transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <form onSubmit={onSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search manga..."
                  className="h-11 w-full rounded-full border border-border bg-input/60 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            </form>
            <nav className="grid gap-1 text-sm">
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary transition">
                <Home className="h-4 w-4 text-primary" /> Home
              </Link>
              <Link to="/search" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary transition">
                <Compass className="h-4 w-4 text-primary" /> Browse
              </Link>
              <Link to="/upload" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary transition">
                <Upload className="h-4 w-4 text-primary" /> Upload
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary transition">
                  <Shield className="h-4 w-4 text-primary" /> Admin
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

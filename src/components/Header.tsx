import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Shield, Menu, X, Home, Compass, Upload, Loader2 } from "lucide-react";
import jarvisLogo from "@/assets/jarvis-comics-logo.png";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ThemeToggle } from "@/components/ThemeToggle";
import { searchManga, type Manga } from "@/lib/mangadex";

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) && p.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function LiveSearch({
  value,
  onChange,
  onSubmit,
  onPick,
  placeholder = "Search manga...",
  inputClassName,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPick: () => void;
  placeholder?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const debounced = useDebounced(value, 250);
  const [results, setResults] = useState<Manga[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchManga(q, 6)
      .then((r) => { if (!cancelled) { setResults(r); setActiveIdx(r.length > 0 ? 0 : -1); } })
      .catch(() => { if (!cancelled) { setResults([]); setActiveIdx(-1); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelectorAll<HTMLElement>("[data-result-item]")[activeIdx];
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const m = results[activeIdx];
      setOpen(false);
      onPick();
      navigate({ to: "/manga/$id", params: { id: m.id } });
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const showDropdown = open && value.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={onSubmit}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIdx(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={
              inputClassName ??
              "h-10 w-full rounded-full border border-border bg-input/60 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            }
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border glass shadow-xl z-50 animate-fade-in">
          {loading && !results && (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {results && results.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No results</div>
          )}
          {results && results.length > 0 && (
            <ul ref={listRef} className="py-2">
              {results.map((m, idx) => {
                const active = idx === activeIdx;
                return (
                  <li key={m.id}>
                    <button
                      data-result-item
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        setOpen(false);
                        onPick();
                        navigate({ to: "/manga/$id", params: { id: m.id } });
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 transition text-left border-l-2 ${active ? "bg-primary/15 border-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)] ring-1 ring-primary/40" : "border-transparent hover:bg-secondary/70"}`}
                    >
                      {m.coverUrl ? (
                        <img src={m.coverUrl} alt="" className="h-12 w-9 rounded object-cover bg-muted" loading="lazy" />
                      ) : (
                        <div className="h-12 w-9 rounded bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          <Highlight text={m.title} query={value} />
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          <Highlight text={m.tags.slice(0, 3).join(" · ") || m.status} query={value} />
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={(e) => { setOpen(false); onSubmit(e as any); }}
                  className="w-full px-3 py-2 text-sm text-primary hover:bg-secondary/70 transition text-left font-medium"
                >
                  See all results for “{value.trim()}” →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

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

        <div className="mx-auto flex-1 max-w-xl hidden sm:block">
          <LiveSearch value={q} onChange={setQ} onSubmit={onSubmit} onPick={closeMenu} />
        </div>

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

        <ThemeToggle className="hidden sm:inline-flex" />

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-secondary transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sticky mobile search row — always visible on mobile */}
      <div className="sm:hidden border-t border-border/60 px-4 py-2">
        <LiveSearch value={q} onChange={setQ} onSubmit={onSubmit} onPick={closeMenu} autoFocus />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-3">
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
              <div className="flex items-center justify-between rounded-lg px-3 py-2 mt-2">
                <span className="text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

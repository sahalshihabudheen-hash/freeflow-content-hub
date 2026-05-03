import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Menu, X, Home, Compass, BookOpen, Loader2, AlertCircle, SlidersHorizontal, SearchX, LogOut, ShieldCheck } from "lucide-react";
import jarvisLogo from "@/assets/jarvis-comics-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { searchManga, type Manga } from "@/lib/mangadex";
import { logSearch, logClick } from "@/lib/search-analytics";
import { useSearchDebounce, DEBOUNCE_MIN, DEBOUNCE_MAX, DEBOUNCE_DEFAULT } from "@/hooks/use-search-debounce";
import { auth } from "@/lib/firebase";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useAdultAccess } from "@/hooks/use-adult-access";

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

function DebounceSettings({ ms, setMs }: { ms: number; setMs: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onOutside = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="Search settings"
        title="Search responsiveness"
        className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border glass shadow-xl z-[60] p-3 animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="debounce-range" className="text-xs font-medium">Typing delay</label>
            <span className="text-xs text-muted-foreground tabular-nums">{ms} ms</span>
          </div>
          <input
            id="debounce-range"
            type="range"
            min={DEBOUNCE_MIN}
            max={DEBOUNCE_MAX}
            step={50}
            value={ms}
            onChange={(e) => setMs(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Instant</span>
            <span>Relaxed</span>
          </div>
          <button
            type="button"
            onClick={() => setMs(DEBOUNCE_DEFAULT)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Reset to default ({DEBOUNCE_DEFAULT} ms)
          </button>
        </div>
      )}
    </div>
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
  const [debounceMs, setDebounceMs] = useSearchDebounce();
  const debounced = useDebounced(value, debounceMs);
  const [results, setResults] = useState<Manga[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [activeViaKeyboard, setActiveViaKeyboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const savedScrollRef = useRef(0);
  const savedActiveRef = useRef(-1);
  const restoreScrollRef = useRef<number | null>(null);
  const listboxId = "live-search-listbox";
  const itemId = (i: number) => `live-search-opt-${i}`;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const lastQueryRef = useRef<string>("");

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (q === lastQueryRef.current && results && results.length > 0 && retryTick === 0) {
      setLoading(false);
      if (savedActiveRef.current >= 0) setActiveIdx(savedActiveRef.current);
      restoreScrollRef.current = savedScrollRef.current;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchManga(q, 6)
      .then((r) => {
        if (cancelled) return;
        lastQueryRef.current = q;
        setResults(r);
        setActiveIdx(r.length > 0 ? 0 : -1);
        setActiveViaKeyboard(false);
        setLiveMessage(r.length === 0 ? `No results for ${q}` : `${r.length} results. Use up and down arrows to navigate.`);
        logSearch(q, r.length);
      })
      .catch(() => {
        if (cancelled) return;
        setResults(null);
        setActiveIdx(-1);
        setError("Search failed. Please check your connection.");
        setLiveMessage("Search failed. Press retry to try again.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, retryTick]);

  // Announce active result to screen readers
  useEffect(() => {
    if (activeIdx < 0 || !results || !results[activeIdx]) return;
    const m = results[activeIdx];
    setLiveMessage(`${m.title}, result ${activeIdx + 1} of ${results.length}`);
  }, [activeIdx, results]);

  useEffect(() => {
    const onOutside = (e: Event) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        if (listRef.current) savedScrollRef.current = listRef.current.scrollTop;
        savedActiveRef.current = -1;
        setOpen(false);
        setActiveIdx(-1);
        setActiveViaKeyboard(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, []);

  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelectorAll<HTMLElement>("[data-result-item]")[activeIdx];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  useEffect(() => {
    if (restoreScrollRef.current !== null && listRef.current) {
      listRef.current.scrollTop = restoreScrollRef.current;
      restoreScrollRef.current = null;
    }
  });

  const closeAndOpen = (m: Manga, idx: number) => {
    if (listRef.current) savedScrollRef.current = listRef.current.scrollTop;
    savedActiveRef.current = activeIdx;
    setOpen(false);
    setActiveIdx(-1);
    setActiveViaKeyboard(false);
    logClick(value.trim(), m.id, m.title, idx);
    onPick();
    navigate({ to: "/manga/$id", params: { id: m.id } });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length === 0) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveViaKeyboard(true);
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveViaKeyboard(true);
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      const idx = activeIdx >= 0 ? activeIdx : 0;
      const m = results[idx];
      if (m) {
        e.preventDefault();
        closeAndOpen(m, idx);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIdx(-1);
      setActiveViaKeyboard(false);
    }
  };

  const showDropdown = open && value.trim().length >= 2;
  const activeDescendant = showDropdown && activeIdx >= 0 ? itemId(activeIdx) : undefined;

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* SR-only live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      <form onSubmit={onSubmit}>
        <div
          className="relative group"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-owns={showDropdown ? listboxId : undefined}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
              setActiveIdx(-1);
              setError(null);
              if (e.target.value.trim().length >= 2) setLoading(true);
            }}
            onFocus={() => { setOpen(true); inputRef.current?.focus(); }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="searchbox"
            aria-label="Search manga"
            aria-autocomplete="list"
            aria-controls={showDropdown ? listboxId : undefined}
            aria-activedescendant={activeDescendant}
            className={
              inputClassName ??
              "h-10 w-full rounded-full border border-border bg-input/60 pl-10 pr-20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            }
          />
          <DebounceSettings ms={debounceMs} setMs={setDebounceMs} />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto scroll-smooth rounded-2xl border border-border glass shadow-xl z-50 animate-fade-in">
          {loading && (
            <ul className="py-2" aria-label="Loading search results">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                  <div className="h-12 w-9 rounded bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-2.5 w-1/2 rounded bg-muted/70" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && error && (
            <div className="p-6 text-center space-y-3" role="alert">
              <div className="mx-auto h-10 w-10 rounded-full bg-destructive/15 text-destructive inline-flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium text-foreground">Couldn't load results</div>
              <div className="text-xs text-muted-foreground">{error}</div>
              <button
                type="button"
                onClick={() => { setError(null); setRetryTick((n) => n + 1); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
              >
                Retry search
              </button>
            </div>
          )}
          {!loading && !error && results && results.length === 0 && (
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto h-10 w-10 rounded-full bg-muted text-muted-foreground inline-flex items-center justify-center">
                <SearchX className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium text-foreground">No matches for “{value.trim()}”</div>
              <div className="text-xs text-muted-foreground">
                Try a shorter title, different spelling, or browse popular manga instead.
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => { onChange(""); setActiveIdx(-1); inputRef.current?.focus(); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  Clear & search again
                </button>
                <button
                  type="button"
                  onClick={(e) => { setOpen(false); onSubmit(e as any); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-secondary/70 transition"
                >
                  Browse all
                </button>
              </div>
            </div>
          )}
          {!loading && !error && results && results.length > 0 && (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="py-2"
            >
              {results.map((m, idx) => {
                const active = idx === activeIdx;
                return (
                  <li key={m.id} role="presentation">
                    <button
                      data-result-item
                      id={itemId(idx)}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => { setActiveIdx(idx); setActiveViaKeyboard(false); }}
                      onClick={() => closeAndOpen(m, idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 transition text-left border-l-2 ${active ? "bg-primary/15 border-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)] ring-1 ring-primary/40" : "border-transparent hover:bg-secondary/70"}`}
                    >
                      {m.coverUrl ? (
                        <img src={m.coverUrl} alt="" className="h-12 w-9 rounded object-cover bg-muted" loading="lazy" />
                      ) : (
                        <div className="h-12 w-9 rounded bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {active && activeViaKeyboard
                            ? <Highlight text={m.title} query={value} />
                            : m.title}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {active && activeViaKeyboard
                            ? <Highlight text={m.tags.slice(0, 3).join(" · ") || m.status} query={value} />
                            : (m.tags.slice(0, 3).join(" · ") || m.status)}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
              <li role="presentation">
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
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { hasAdultAccess } = useAdultAccess();

  // Hide header on chapter reader for zen mode
  if (location.pathname.startsWith("/chapter/")) {
    return null;
  }

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
          {hasAdultAccess && (
            <Link to="/adult" className="rounded-full px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-full px-3 py-2 text-foreground bg-secondary" }}>
              Mature
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="rounded-full px-3 py-2 text-primary transition hover:bg-primary/10 font-medium" activeProps={{ className: "bg-primary/15" }}>
              Admin
            </Link>
          )}
          <button 
            onClick={() => auth.signOut()}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </nav>

        <ThemeToggle className="hidden sm:inline-flex" />

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-secondary transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="sm:hidden border-t border-border/60 px-4 py-2">
        <LiveSearch value={q} onChange={setQ} onSubmit={onSubmit} onPick={closeMenu} autoFocus />
      </div>

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
              {hasAdultAccess && (
                <Link to="/adult" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary transition">
                  <BookOpen className="h-4 w-4 text-destructive" /> Mature Hub
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-primary/10 transition text-primary font-medium">
                  <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                </Link>
              )}
              <div className="flex items-center justify-between rounded-lg px-3 py-2 mt-2">
                <span className="text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <button 
                onClick={() => { auth.signOut(); closeMenu(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 mt-2 text-destructive hover:bg-destructive/10 transition text-left font-medium"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

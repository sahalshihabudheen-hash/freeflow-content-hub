import { Outlet, Link, createRootRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Loader2, Settings, LogOut } from "lucide-react";
import { trackSession } from "@/lib/track-session";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function MaintenanceScreen({ onSignOut }: { onSignOut: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const timer = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.4));
    }, 80);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Play audio
    const audio = new Audio("/maintenance.wav");
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    audio.play().catch(() => {
      // Auto-play blocked; play on first user interaction
      const unlock = () => { audio.play().catch(() => {}); document.removeEventListener("click", unlock); };
      document.addEventListener("click", unlock);
    });
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #040810 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Outfit', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Animated grid background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        animation: "gridScroll 20s linear infinite",
        pointerEvents: "none",
      }} />
      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(20px)",
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Outfit:wght@400;700;900&display=swap');
        @keyframes gridScroll { from { transform: translateY(0); } to { transform: translateY(60px); } }
        @keyframes gearSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:0.8; transform:scale(1.05); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .maint-fade-1 { animation: fadeUp 0.6s ease forwards; }
        .maint-fade-2 { animation: fadeUp 0.6s ease 0.15s both; }
        .maint-fade-3 { animation: fadeUp 0.6s ease 0.3s both; }
        .maint-fade-4 { animation: fadeUp 0.6s ease 0.45s both; }
        .maint-fade-5 { animation: fadeUp 0.6s ease 0.6s both; }
        .maint-signout:hover { background: rgba(255,255,255,0.08) !important; transform: translateY(-1px); }
      `}</style>

      <div style={{ textAlign: "center", maxWidth: 520, padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Icon */}
        <div className="maint-fade-1" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            background: "rgba(59,130,246,0.12)",
            border: "1.5px solid rgba(59,130,246,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(59,130,246,0.15), inset 0 0 20px rgba(59,130,246,0.05)",
            animation: "pulseRing 3s ease-in-out infinite",
          }}>
            <Settings size={40} color="#3b82f6" style={{ animation: "gearSpin 8s linear infinite" }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="maint-fade-2" style={{
          fontSize: 52, fontWeight: 900, letterSpacing: "0.08em",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, #ffffff 30%, #93c5fd 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: "0 0 8px", lineHeight: 1.1,
        }}>Under<br />Maintenance</h1>

        {/* Subtitle */}
        <p className="maint-fade-3" style={{
          fontSize: 17, fontStyle: "italic", color: "rgba(147,197,253,0.85)",
          margin: "0 0 20px", fontWeight: 400,
          letterSpacing: "0.02em",
        }}>JARVIS is working faster than you think</p>

        {/* Description */}
        <p className="maint-fade-3" style={{
          fontSize: 14, color: "rgba(255,255,255,0.45)",
          margin: "0 0 28px", lineHeight: 1.6,
        }}>We're upgrading our systems to serve you<br />better. Please check back soon.</p>

        {/* Progress bar */}
        <div className="maint-fade-4" style={{ margin: "0 0 32px" }}>
          <div style={{
            height: 3, borderRadius: 2,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 2,
              background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s linear infinite",
              transition: "width 0.08s linear",
              boxShadow: "0 0 10px rgba(96,165,250,0.6)",
            }} />
          </div>
        </div>

        {/* Contact hint */}
        <p className="maint-fade-4" style={{
          fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)", margin: "0 0 20px",
        }}>If you believe you should have access, contact the administrator</p>

        {/* Sign out */}
        <div className="maint-fade-5">
          <button
            onClick={onSignOut}
            className="maint-signout"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", letterSpacing: "0.04em",
              transition: "all 0.2s ease",
              backdropFilter: "blur(8px)",
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isBanned, setIsBanned] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to maintenance mode doc
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_settings", "maintenance"), (snap) => {
      setMaintenanceMode(snap.exists() ? !!snap.data()?.enabled : false);
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    let unsubBan: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        trackSession(currentUser.uid).catch(() => {});

        // Check admin status for maintenance bypass
        const isRootOwner = currentUser.email === "admin@gmail.com";
        if (isRootOwner) {
          setIsAdmin(true);
        } else {
          try {
            const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
            setIsAdmin(adminSnap.exists());
          } catch {
            setIsAdmin(false);
          }
        }
        
        unsubBan = onSnapshot(doc(db, "banned_users", currentUser.uid), (snap) => {
          if (snap.exists()) {
            setIsBanned(true);
            auth.signOut();
          } else {
            setIsBanned(false);
          }
        }, () => {
          // Ignore permission errors if they don't have access to banned list
        });
      } else {
        setIsAdmin(false);
        setIsBanned(false);
        if (unsubBan) unsubBan();
      }
    });
    
    return () => {
      unsubscribe();
      if (unsubBan) unsubBan();
    };
  }, []);

  useEffect(() => {
    if (user === null && location.pathname !== "/auth") {
      navigate({ to: "/auth", replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Account Suspended</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your access to JARVIS COMICS has been permanently revoked by an administrator.
        </p>
        <button onClick={() => navigate({ to: "/auth" })} className="text-sm font-medium text-primary hover:underline">
          Return to login
        </button>
      </div>
    );
  }

  // Show maintenance screen to non-admins
  if (maintenanceMode && !isAdmin && user !== undefined && user !== null) {
    return <MaintenanceScreen onSignOut={() => auth.signOut()} />;
  }

  // If user is null and not on /auth, we are redirecting, render nothing to avoid flicker
  if (user === null && location.pathname !== "/auth") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {location.pathname !== "/auth" && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {location.pathname !== "/auth" && (
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          POWERED BY JARVIS
        </footer>
      )}
    </div>
  );
}

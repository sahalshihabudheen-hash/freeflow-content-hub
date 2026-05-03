import { Outlet, Link, createRootRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Loader2 } from "lucide-react";
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

function RootComponent() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isBanned, setIsBanned] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubBan: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        trackSession(currentUser.uid).catch(() => {});
        
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

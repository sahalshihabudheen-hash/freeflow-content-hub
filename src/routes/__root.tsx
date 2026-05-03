import { Outlet, Link, createRootRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        trackSession(currentUser.uid).catch(() => {});
      }
    });
    return () => unsubscribe();
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

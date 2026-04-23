import { Link } from "@tanstack/react-router";
import { X, Sparkles } from "lucide-react";

export function SignupPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl animate-scale-in overflow-hidden"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted text-muted-foreground transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary animate-float mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold">Join JARVIS COMICS</h2>
          <p className="text-muted-foreground mt-2">
            Create a free account to upload your own comics, save your reading progress, and unlock the full experience.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/auth"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 inline-flex items-center justify-center transition hover-scale"
            >
              Sign up free
            </Link>
            <button
              onClick={onClose}
              className="h-11 px-5 rounded-lg border border-border hover:bg-muted transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { GENRE_TAGS, LANGUAGES } from "@/lib/mangadex";
import { X, Check } from "lucide-react";

export type Prefs = { genres: string[]; language: string };

export function PreferencesModal({
  initial,
  onSave,
  onClose,
  canClose = true,
}: {
  initial: Prefs;
  onSave: (p: Prefs) => void;
  onClose?: () => void;
  canClose?: boolean;
}) {
  const [genres, setGenres] = useState<string[]>(initial.genres);
  const [language, setLanguage] = useState<string>(initial.language || "en");

  const toggle = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold">Welcome to JARVIS COMICS</h2>
          <p className="text-muted-foreground mt-1">Pick your favorite genres and reading language so we can show you the best comics.</p>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Genres <span className="text-muted-foreground font-normal">(pick one or more)</span></h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(GENRE_TAGS).map((g) => {
                const active = genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggle(g)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {active && <Check className="inline h-3 w-3 mr-1" />}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Reading language</h3>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-input px-3"
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            {canClose && onClose && (
              <button onClick={onClose} className="h-11 px-5 rounded-lg border border-border hover:bg-muted">
                Cancel
              </button>
            )}
            <button
              onClick={() => onSave({ genres, language })}
              className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              Save & continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

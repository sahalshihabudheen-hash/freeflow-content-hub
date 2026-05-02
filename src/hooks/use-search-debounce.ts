import { useEffect, useState } from "react";

const KEY = "jc_search_debounce_ms";
export const DEBOUNCE_MIN = 0;
export const DEBOUNCE_MAX = 800;
export const DEBOUNCE_DEFAULT = 250;

export function useSearchDebounce() {
  const [ms, setMs] = useState<number>(() => {
    if (typeof window === "undefined") return DEBOUNCE_DEFAULT;
    const v = Number(localStorage.getItem(KEY));
    return Number.isFinite(v) && v >= DEBOUNCE_MIN && v <= DEBOUNCE_MAX ? v : DEBOUNCE_DEFAULT;
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(ms));
    } catch {
      /* ignore */
    }
  }, [ms]);
  return [ms, setMs] as const;
}

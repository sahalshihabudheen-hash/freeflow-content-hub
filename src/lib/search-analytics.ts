import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "jc_search_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function logSearch(query: string, resultsCount: number) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("search_events").insert({
      event_type: "search",
      query,
      results_count: resultsCount,
      session_id: getSessionId(),
      user_id: userData?.user?.id ?? null,
    });
  } catch {
    // swallow — analytics must never break UX
  }
}

export async function logClick(
  query: string,
  mangaId: string,
  mangaTitle: string,
  position: number,
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("search_events").insert({
      event_type: "click",
      query,
      manga_id: mangaId,
      manga_title: mangaTitle,
      position,
      session_id: getSessionId(),
      user_id: userData?.user?.id ?? null,
    });
  } catch {
    // swallow
  }
}

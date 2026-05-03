import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function logSearch(query: string, resultsCount: number) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "user_activity"), {
      uid: user.uid,
      email: user.email || "Unknown",
      action: "SEARCH",
      details: query,
      results_count: resultsCount,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    // ignore
  }
}

export async function logClick(query: string, mangaId: string, mangaTitle: string, position: number) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "user_activity"), {
      uid: user.uid,
      email: user.email || "Unknown",
      action: "CLICK_SEARCH_RESULT",
      manga_id: mangaId,
      details: mangaTitle,
      search_query: query,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    // ignore
  }
}

export async function logViewManga(mangaId: string, mangaTitle: string, isAdult: boolean) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "user_activity"), {
      uid: user.uid,
      email: user.email || "Unknown",
      action: isAdult ? "VIEW_ADULT_MANGA" : "VIEW_MANGA",
      manga_id: mangaId,
      details: mangaTitle,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    // ignore
  }
}

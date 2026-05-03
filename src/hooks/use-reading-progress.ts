import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

export type ProgressItem = {
  mangaId: string;
  mangaTitle: string;
  coverUrl: string;
  chapterId: string;
  chapterNumber: string;
  chapterTitle?: string;
  lastReadAt: number;
  isUserComic: boolean;
};

const LOCAL_STORAGE_KEY = "jarvis.readingHistory.v1";

export function useReadingProgress() {
  const [history, setHistory] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local storage first for immediate UI
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localHistory: ProgressItem[] = [];
    if (localData) {
      try {
        localHistory = JSON.parse(localData);
        setHistory(localHistory);
      } catch (e) {
        console.error("Failed to parse local history");
      }
    }

    // Subscribe to Auth changes for cloud sync
    return auth.onAuthStateChanged((user) => {
      if (user) {
        setLoading(true);
        // Subscribe to Firestore changes
        const q = query(
          collection(db, "reading_progress", user.uid, "history"),
          orderBy("lastReadAt", "desc"),
          limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const cloudHistory = snapshot.docs.map(doc => doc.data() as ProgressItem);
          
          // Merge logic: For now, cloud takes precedence but we can merge with local if cloud is empty
          if (cloudHistory.length > 0) {
            setHistory(cloudHistory);
            // Save to local storage as well for offline use
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudHistory));
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore history error", err);
          setLoading(false);
        });

        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    });
  }, []);

  const updateProgress = async (item: Omit<ProgressItem, "lastReadAt">) => {
    const newItem: ProgressItem = {
      ...item,
      lastReadAt: Date.now(),
    };

    // Update Local State & Storage
    setHistory(prev => {
      const filtered = prev.filter(p => p.mangaId !== item.mangaId);
      const updated = [newItem, ...filtered].slice(0, 20);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Update Firestore if logged in
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "reading_progress", user.uid, "history", item.mangaId);
        await setDoc(docRef, newItem);
      } catch (e) {
        console.warn("Failed to sync progress to cloud", e);
      }
    }
  };

  const deleteProgress = async (mangaId: string) => {
    setHistory(prev => {
      const updated = prev.filter(p => p.mangaId !== mangaId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "reading_progress", user.uid, "history", mangaId);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn("Failed to delete cloud progress", e);
      }
    }
  };

  return { history, loading, updateProgress, deleteProgress };
}

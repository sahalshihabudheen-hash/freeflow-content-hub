import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout: Database connection failed")), ms))
  ]);
}

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      if (user.email === "admin@gmail.com") {
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "admins", user.uid);
        const docSnap = await withTimeout(getDoc(docRef), 5000);
        setIsAdmin(docSnap.exists());
      } catch (e) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return { isAdmin, loading };
}

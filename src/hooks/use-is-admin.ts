import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
        const docSnap = await getDoc(docRef);
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

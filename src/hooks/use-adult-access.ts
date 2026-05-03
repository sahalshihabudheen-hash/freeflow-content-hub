import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useAdultAccess() {
  const [hasAdultAccess, setHasAdultAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      if (!user) {
        setHasAdultAccess(false);
        setLoading(false);
        return;
      }

      const unsub = onSnapshot(
        doc(db, "adult_access", user.uid),
        (snap) => {
          setHasAdultAccess(snap.exists());
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching adult access:", error);
          setHasAdultAccess(false);
          setLoading(false);
        }
      );

      return () => unsub();
    });
  }, []);

  return { hasAdultAccess, loading };
}

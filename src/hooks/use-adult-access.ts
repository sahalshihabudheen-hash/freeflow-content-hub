import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useAdultAccess() {
  const [hasAdultAccess, setHasAdultAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Cancel any existing Firestore listener before setting up a new one
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (!user) {
        setHasAdultAccess(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubFirestore = onSnapshot(
        doc(db, "adult_access", user.uid),
        (snap) => {
          setHasAdultAccess(snap.exists());
          setLoading(false);
        },
        () => {
          setHasAdultAccess(false);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  return { hasAdultAccess, loading };
}

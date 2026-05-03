import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

const ROOT_OWNER = "admin@gmail.com";

export function useAdultAccess() {
  const [hasAdultAccess, setHasAdultAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (!user) {
        setHasAdultAccess(false);
        setLoading(false);
        return;
      }

      // Root owner always has access
      if (user.email === ROOT_OWNER) {
        setHasAdultAccess(true);
        setLoading(false);
        return;
      }

      // Admins always have access
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          setHasAdultAccess(true);
          setLoading(false);
          return;
        }
      } catch (_) {
        // Not an admin, fall through to adult_access check
      }

      // Regular users: check adult_access collection with real-time updates
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


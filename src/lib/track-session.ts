import { db, auth } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  return "Monitor";
}


export async function trackSession(uid?: string) {
  try {
    const user = auth.currentUser;
    const targetUid = uid || user?.uid;
    if (!targetUid) return;

    const device = getDeviceType();

    // 1. Save immediately with Unknown IP to prevent data loss if user logs out fast
    try {
      await setDoc(doc(db, "user_sessions", targetUid), {
        email: user?.email || "Unknown",
        ip: "Unknown",
        country: "Unknown",
        countryCode: "",
        city: "",
        region: "",
        last_device: device,
        last_seen_at: serverTimestamp(),
        created_at: user?.metadata?.creationTime || new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Initial session tracking failed", e);
    }

    // 2. Fetch IP location and update
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        await setDoc(doc(db, "user_sessions", targetUid), {
          ip: data.ip || "Unknown",
          country: data.country_name || "Unknown",
          countryCode: data.country_code || "",
          city: data.city || "",
          region: data.region || ""
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Failed to update location info");
    }

  } catch (error) {
    console.error("Failed to track session", error);
  }
}

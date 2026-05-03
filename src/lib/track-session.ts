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

    // Fetch IP location first, then save everything at once
    let ipData = { ip: "Unknown", country: "Unknown", countryCode: "", city: "", region: "" };
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        ipData = {
          ip: data.ip || "Unknown",
          country: data.country_name || "Unknown",
          countryCode: data.country_code || "",
          city: data.city || "",
          region: data.region || ""
        };
      }
    } catch (e) {
      console.warn("Failed to update location info");
    }

    try {
      await setDoc(doc(db, "user_sessions", targetUid), {
        email: user?.email || "Unknown",
        photo_url: user?.photoURL || null,
        last_device: device,
        last_seen_at: serverTimestamp(),
        created_at: user?.metadata?.creationTime || new Date().toISOString(),
        ...ipData
      }, { merge: true });
    } catch (e) {
      console.warn("Session tracking failed", e);
    }

  } catch (error) {
    console.error("Failed to track session", error);
  }
}

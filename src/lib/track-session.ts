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

    let ip = "Unknown";
    let country = "Unknown";
    let countryCode = "";
    let city = "";
    let region = "";

    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        ip = data.ip || "Unknown";
        country = data.country_name || "Unknown";
        countryCode = data.country_code || "";
        city = data.city || "";
        region = data.region || "";
      }
    } catch (e) {
      console.warn("Failed to get location info");
    }

    const device = getDeviceType();

    await setDoc(doc(db, "user_sessions", targetUid), {
      email: user?.email || "Unknown",
      ip,
      country,
      countryCode,
      city,
      region,
      last_device: device,
      last_seen_at: serverTimestamp(),
      created_at: user?.metadata?.creationTime || new Date().toISOString()
    }, { merge: true });

  } catch (error) {
    console.error("Failed to track session", error);
  }
}

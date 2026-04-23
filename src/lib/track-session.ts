import { supabase } from "@/integrations/supabase/client";

function detectDevice(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "Tablet";
  if (/Mobile|iPhone|Android.+Mobile|Opera Mini|IEMobile/i.test(ua)) return "Mobile";
  return "Desktop";
}

async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    return j.country_name || j.country || null;
  } catch {
    return null;
  }
}

/**
 * Records a session row + updates profile last_seen / device / country.
 * Call after a successful sign-in or sign-up.
 */
export async function trackSession(userId: string) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const device = detectDevice(ua);
  const country = await detectCountry();

  await supabase.from("user_sessions").insert({
    user_id: userId,
    device_type: device,
    user_agent: ua,
    country,
  });

  await supabase
    .from("profiles")
    .update({ last_device: device, country, last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

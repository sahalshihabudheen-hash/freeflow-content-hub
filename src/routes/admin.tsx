import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Loader2, Shield, ShieldCheck, Smartphone, Tablet, Monitor, ArrowLeft, Wrench, Power, Users, Activity as ActivityIcon, Settings, Search, ShieldAlert, Clock } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — JARVIS COMICS" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  email: string | null;
  photo_url: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  ip: string | null;
  last_device: string | null;
  last_seen_at: string | null;
  created_at: string | null;
  is_admin: boolean;
  is_root_owner: boolean;
  is_online: boolean;
  has_adult_access: boolean;
  is_banned: boolean;
};

function getFlagEmoji(countryCode: string | null) {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function DeviceIcon({ d }: { d: string | null }) {
  if (d === "Mobile") return <Smartphone className="h-4 w-4" />;
  if (d === "Tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noAdminsExist, setNoAdminsExist] = useState(false);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "activity" | "maint" | "app">("users");
  const [globalActivities, setGlobalActivities] = useState<any[] | null>(null);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setSignedIn(!!user);
      setAuthChecked(true);
      if (user) {
        checkIfAnyAdminsExist();
      } else {
        setCheckingAdmins(false);
      }
    });
  }, []);

  const checkIfAnyAdminsExist = async () => {
    try {
      const snap = await getDocs(collection(db, "admins"));
      setNoAdminsExist(snap.empty);
    } catch (e) {
      setNoAdminsExist(false);
    } finally {
      setCheckingAdmins(false);
    }
  };

  const claimAdmin = async () => {
    if (!auth.currentUser) return;
    setBusyId("claim");
    try {
      await setDoc(doc(db, "admins", auth.currentUser.uid), {
        email: auth.currentUser.email,
        created_at: new Date().toISOString()
      });
      window.location.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  // Listen to maintenance mode
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, "app_settings", "maintenance"), (snap) => {
      setMaintenanceMode(snap.exists() ? !!snap.data()?.enabled : false);
    }, (e) => {
      console.error("Maintenance listener error:", e);
      setErr(`Maintenance settings access: ${e.message}`);
    });
    return unsub;
  }, [isAdmin]);

  const toggleMaintenance = async () => {
    setMaintenanceBusy(true);
    try {
      const next = !maintenanceMode;
      await setDoc(doc(db, "app_settings", "maintenance"), {
        enabled: next,
        updated_at: new Date().toISOString(),
        updated_by: auth.currentUser?.email || "unknown",
        // We can keep history here if needed
      }, { merge: true });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setMaintenanceBusy(false);
    }
  };

  // Global Activity Listener
  useEffect(() => {
    if (!isAdmin || activeTab !== "activity") return;
    
    const q = query(
      collection(db, "user_activity"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGlobalActivities(data);
    }, (e) => {
      console.error("Activity listener error:", e);
      setErr(`Global activity access: ${e.message}`);
    });

    return unsub;
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!isAdmin) return;
    
    setErr(null);
    let sessionsDocs: any[] = [];
    let adminsDocs: any[] = [];
    let adultAccessDocs: any[] = [];
    let bannedUsersDocs: any[] = [];

    const updateRows = () => {
      const adminSet = new Set(adminsDocs.map(d => d.id));
      const adultAccessSet = new Set(adultAccessDocs.map(d => d.id));
      const bannedSet = new Set(bannedUsersDocs.map(d => d.id));
      const data: Row[] = sessionsDocs.map(d => {
        const val = d.data();
        let lastSeen = null;
        if (val.last_seen_at?.toDate) {
          lastSeen = val.last_seen_at.toDate().toISOString();
        } else if (val.last_seen_at) {
          lastSeen = new Date(val.last_seen_at).toISOString();
        }
        
        const is_root_owner = val.email === "admin@gmail.com";
        const is_online = lastSeen ? (new Date().getTime() - new Date(lastSeen).getTime()) < 5 * 60 * 1000 : false;
        
        return {
          id: d.id,
          email: val.email || null,
          photo_url: val.photo_url || null,
          country: val.country || null,
          countryCode: val.countryCode || null,
          city: val.city || null,
          region: val.region || null,
          ip: val.ip || null,
          last_device: val.last_device || null,
          last_seen_at: lastSeen,
          created_at: val.created_at || null,
          is_admin: adminSet.has(d.id) || is_root_owner,
          is_root_owner,
          is_online,
          has_adult_access: adultAccessSet.has(d.id),
          is_banned: bannedSet.has(d.id)
        };
      });
      
      data.sort((a, b) => {
        if (!a.last_seen_at) return 1;
        if (!b.last_seen_at) return -1;
        return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
      });

      setRows(data);
    };

    const unsubSessions = onSnapshot(collection(db, "user_sessions"), (snap) => {
      sessionsDocs = snap.docs;
      updateRows();
    }, (e) => setErr(`Sessions access: ${e.message}`));

    const unsubAdmins = onSnapshot(collection(db, "admins"), (snap) => {
      adminsDocs = snap.docs;
      updateRows();
    }, (e) => setErr(`Admins access: ${e.message}`));

    const unsubAdultAccess = onSnapshot(collection(db, "adult_access"), (snap) => {
      adultAccessDocs = snap.docs;
      updateRows();
    }, (e) => setErr(`Adult access list: ${e.message}`));

    const unsubBanned = onSnapshot(collection(db, "banned_users"), (snap) => {
      bannedUsersDocs = snap.docs;
      updateRows();
    }, (e) => setErr(`Banned list access: ${e.message}`));

    return () => {
      unsubSessions();
      unsubAdmins();
      unsubAdultAccess();
      unsubBanned();
    };
  }, [isAdmin]);

  const toggleBan = async (row: Row) => {
    if (row.is_root_owner || row.email === auth.currentUser?.email) return;
    setBusyId(`ban_${row.id}`);
    try {
      if (row.is_banned) {
        await deleteDoc(doc(db, "banned_users", row.id));
      } else {
        await setDoc(doc(db, "banned_users", row.id), {
          email: row.email,
          banned_at: new Date().toISOString()
        });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleAdultAccess = async (row: Row) => {
    setBusyId(`adult_${row.id}`);
    try {
      if (row.has_adult_access) {
        await deleteDoc(doc(db, "adult_access", row.id));
      } else {
        await setDoc(doc(db, "adult_access", row.id), {
          email: row.email,
          granted_at: new Date().toISOString()
        });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleAdmin = async (row: Row) => {
    setBusyId(row.id);
    try {
      if (row.is_admin) {
        await deleteDoc(doc(db, "admins", row.id));
      } else {
        await setDoc(doc(db, "admins", row.id), {
          email: row.email,
          created_at: new Date().toISOString()
        });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!authChecked || roleLoading) {
    return <div className="container mx-auto py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!signedIn) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
        <p className="text-muted-foreground mb-6">You need to sign in to access the admin area.</p>
        <button onClick={() => navigate({ to: "/auth" })} className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium">Sign in</button>
      </div>
    );
  }

  if (!isAdmin) {
    if (checkingAdmins) {
      return <div className="container mx-auto py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }
    if (noAdminsExist) {
      return (
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Claim Admin Rights</h1>
          <p className="text-muted-foreground mb-6">No administrators exist yet. Click below to become the first admin.</p>
          <button 
            disabled={busyId === "claim"}
            onClick={claimAdmin} 
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium inline-flex items-center gap-2"
          >
            {busyId === "claim" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Make me Admin
          </button>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-muted-foreground mb-6">Only JARVIS administrators can view this page.</p>
        <Link to="/" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-border hover:bg-muted"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
        activeTab === id 
          ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105" 
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className={`h-4 w-4 ${activeTab === id ? "text-primary" : ""}`} />
      <span className="text-sm font-semibold tracking-wide">{label}</span>
      {activeTab === id && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_#3b82f6]" />
      )}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Admin <span className="text-primary">Dashboard</span></h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.2em]">Jarvis Neural Control</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl">
          <TabButton id="users" icon={Users} label="Users" />
          <TabButton id="activity" icon={ActivityIcon} label="Activity" />
          <TabButton id="maint" icon={Wrench} label="Maint." />
          <TabButton id="app" icon={Settings} label="App" />
        </div>
      </div>

      {err && (
        <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          {err}
        </div>
      )}

      <div className="animate-in fade-in duration-500">
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </h2>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                {rows?.length ?? 0} Connected Nodes
              </div>
            </div>

            {rows === null ? (
              <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-muted-foreground uppercase text-[10px] tracking-[0.15em] font-bold">
                      <tr>
                        <th className="p-4 border-b border-white/5">Identity</th>
                        <th className="p-4 border-b border-white/5">Geo Location</th>
                        <th className="p-4 border-b border-white/5">Access</th>
                        <th className="p-4 border-b border-white/5">Network Data</th>
                        <th className="p-4 border-b border-white/5 text-right">Directives</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((r) => (
                        <tr key={r.id} className={`group transition-colors hover:bg-white/[0.02] ${r.is_banned ? "opacity-40 grayscale" : ""}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                                  {r.photo_url ? (
                                    <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center text-xs text-primary font-bold">
                                      {r.email ? r.email[0].toUpperCase() : "?"}
                                    </div>
                                  )}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-4 border-black ${r.is_online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-white/20'}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-white group-hover:text-primary transition-colors">{r.email ?? "ANONYMOUS"}</span>
                                <span className="text-[10px] text-muted-foreground font-mono uppercase">ID: {r.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              {r.countryCode ? (
                                <span className="inline-flex items-center gap-2 text-white">
                                  <span className="text-xl leading-none">{getFlagEmoji(r.countryCode)}</span>
                                  <span className="font-medium text-xs">{[r.city, r.country].filter(Boolean).join(", ")}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">Unknown Region</span>
                              )}
                              <span className="text-[10px] font-mono text-muted-foreground/60">{r.ip ?? "0.0.0.0"}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {r.is_banned ? (
                                <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-wider border border-destructive/20">Terminated</span>
                              ) : r.is_root_owner ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                  <ShieldCheck className="h-3 w-3" /> Core Admin
                                </span>
                              ) : r.is_admin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">Authorized</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground text-[10px] font-bold uppercase border border-white/10">Guest</span>
                              )}
                              {r.has_adult_access && !r.is_banned && (
                                <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 text-[10px] font-black uppercase border border-pink-500/20">18+ Hub</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-white/80">
                                <DeviceIcon d={r.last_device} />
                                <span className="text-xs font-medium">{r.last_device ?? "Neural Link"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {r.last_seen_at ? new Date(r.last_seen_at).toLocaleTimeString() : "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                to="/admin-activity/$id"
                                params={{ id: r.id }}
                                className="h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center transition-all"
                              >
                                Log
                              </Link>
                              
                              {!r.is_root_owner && (
                                <button
                                  disabled={busyId === `adult_${r.id}`}
                                  onClick={() => toggleAdultAccess(r)}
                                  className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-50 ${
                                    r.has_adult_access
                                      ? "border-green-500/30 text-green-500 bg-green-500/5 hover:bg-green-500/10"
                                      : "border-pink-500/30 text-pink-500 bg-pink-500/5 hover:bg-pink-500/10"
                                  }`}
                                >
                                  {busyId === `adult_${r.id}` ? "…" : r.has_adult_access ? "Lock 18+" : "Unlock 18+"}
                                </button>
                              )}

                              {!r.is_root_owner && r.email !== auth.currentUser?.email && (
                                <button
                                  disabled={busyId === `ban_${r.id}`}
                                  onClick={() => toggleBan(r)}
                                  className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-50 ${
                                    r.is_banned
                                      ? "border-white/20 text-white bg-white/5 hover:bg-white/10"
                                      : "border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10"
                                  }`}
                                >
                                  {busyId === `ban_${r.id}` ? "…" : r.is_banned ? "Restore" : "Purge"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-6 max-w-4xl mx-auto">
             <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-primary" />
                Global Activity Hub
              </h2>
            </div>
            
            {globalActivities === null ? (
              <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : globalActivities.length === 0 ? (
              <div className="text-center py-24 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-xl">
                <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">No active signals detected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {globalActivities.map(a => (
                  <div key={a.id} className="group flex items-start gap-5 p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all hover:bg-white/[0.05] hover:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary/30 transition-colors">
                      {a.action === "SEARCH" && <Search className="h-4 w-4 text-blue-400" />}
                      {a.action === "VIEW_MANGA" && <Monitor className="h-4 w-4 text-primary" />}
                      {a.action === "VIEW_ADULT_MANGA" && <ShieldAlert className="h-4 w-4 text-destructive" />}
                      {!["SEARCH", "VIEW_MANGA", "VIEW_ADULT_MANGA"].includes(a.action) && <ActivityIcon className="h-4 w-4 text-white/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-white/90">
                          {a.email?.split('@')[0] || "Unknown User"} 
                          <span className="ml-2 font-mono text-muted-foreground font-normal lowercase tracking-normal">({a.action})</span>
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                          {a.timestamp?.toDate ? a.timestamp.toDate().toLocaleTimeString() : "Live"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {a.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "maint" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-12">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/30 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-pulse">
                <Wrench className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Maintenance <span className="text-primary">Protocols</span></h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                Execute system-wide access lock. Administrators bypass this state via localized authentication tokens.
              </p>
            </div>

            <div className={`relative overflow-hidden rounded-[2.5rem] border transition-all duration-700 ${
              maintenanceMode 
                ? "bg-gradient-to-br from-red-600/10 to-black border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)]" 
                : "bg-gradient-to-br from-primary/10 to-black border-white/5 shadow-2xl"
            }`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-8">
                <div className={`w-3 h-3 rounded-full ${maintenanceMode ? "bg-red-500 animate-ping" : "bg-primary/20"}`} />
              </div>
              
              <div className="p-10 md:p-14 relative z-10 flex flex-col items-center text-center">
                <div className={`mb-8 p-6 rounded-3xl bg-black/40 border backdrop-blur-2xl transition-all duration-500 ${
                   maintenanceMode ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-white/5"
                }`}>
                  <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${maintenanceMode ? "text-red-500" : "text-white"}`}>
                    System Lockdown
                  </h3>
                  <p className="text-muted-foreground text-xs font-mono uppercase tracking-[0.2em]">Priority Alpha One</p>
                </div>

                <p className="text-white/60 mb-12 max-w-sm font-medium leading-relaxed">
                  {maintenanceMode 
                    ? "SITE IS CURRENTLY UNDER LOCKDOWN. Non-admin users are being redirected to the maintenance terminal with audio feedback." 
                    : "Toggle to initiate global maintenance mode. All active user sessions will be interrupted instantly."}
                </p>

                <button
                  onClick={toggleMaintenance}
                  disabled={maintenanceBusy}
                  className={`group relative h-24 w-64 rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-wait ${
                    maintenanceMode 
                      ? "bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)]" 
                      : "bg-primary shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                  }`}
                >
                  <div className="absolute inset-1 rounded-xl border border-white/20 pointer-events-none" />
                  <div className="flex items-center justify-center gap-4">
                    {maintenanceBusy ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    ) : (
                      <>
                        <Power className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-black text-white uppercase tracking-tighter">
                          {maintenanceMode ? "Disable Lock" : "Enable Lock"}
                        </span>
                      </>
                    )}
                  </div>
                </button>

                <div className="mt-12 flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                   <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/10 flex items-center justify-center">
                          <Users className="h-3 w-3 text-white/40" />
                        </div>
                      ))}
                   </div>
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">
                      Maintenance mode is synced in real-time<br/>via JARVIS Neural Core.
                   </p>
                </div>
              </div>

              {/* Grid Background Effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(${maintenanceMode ? '#ef4444' : '#3b82f6'} 1px, transparent 1px), linear-gradient(90deg, ${maintenanceMode ? '#ef4444' : '#3b82f6'} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "app" && (
           <div className="max-w-4xl mx-auto py-24 text-center">
              <Settings className="h-20 w-20 mx-auto text-muted-foreground/10 mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-white/20">Core Configuration</h2>
              <p className="text-muted-foreground/40 font-mono text-xs uppercase mt-4">Module Pending Deployment</p>
           </div>
        )}
      </div>
    </div>
  );
}

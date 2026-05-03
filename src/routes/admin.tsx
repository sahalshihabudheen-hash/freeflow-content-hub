import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { Loader2, Shield, ShieldCheck, Smartphone, Tablet, Monitor, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — JARVIS COMICS" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  email: string | null;
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

  useEffect(() => {
    if (!isAdmin) return;
    
    setErr(null);
    let sessionsDocs: any[] = [];
    let adminsDocs: any[] = [];
    let initialized = 0;

    const updateRows = () => {
      const adminSet = new Set(adminsDocs.map(d => d.id));
      const data: Row[] = sessionsDocs.map(d => {
        const val = d.data();
        let lastSeen = null;
        if (val.last_seen_at?.toDate) {
          lastSeen = val.last_seen_at.toDate().toISOString();
        } else if (val.last_seen_at) {
          lastSeen = new Date(val.last_seen_at).toISOString();
        }
        
        const is_root_owner = val.email === "admin@gmail.com";
        return {
          id: d.id,
          email: val.email || null,
          country: val.country || null,
          countryCode: val.countryCode || null,
          city: val.city || null,
          region: val.region || null,
          ip: val.ip || null,
          last_device: val.last_device || null,
          last_seen_at: lastSeen,
          created_at: val.created_at || null,
          is_admin: adminSet.has(d.id) || is_root_owner,
          is_root_owner
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
      initialized |= 1;
      if (initialized === 3) updateRows();
    }, (e) => setErr(e.message));

    const unsubAdmins = onSnapshot(collection(db, "admins"), (snap) => {
      adminsDocs = snap.docs;
      initialized |= 2;
      if (initialized === 3) updateRows();
    }, (e) => setErr(e.message));

    return () => {
      unsubSessions();
      unsubAdmins();
    };
  }, [isAdmin]);

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

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      <p className="text-muted-foreground mb-6">{rows?.length ?? 0} active sessions</p>

      {err && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{err}</div>}

      {rows === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">IP Address</th>
                <th className="p-3 font-semibold">Country</th>
                <th className="p-3 font-semibold">Device</th>
                <th className="p-3 font-semibold">Joined</th>
                <th className="p-3 font-semibold">Last seen</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                        {r.email ? r.email[0].toUpperCase() : "?"}
                      </div>
                      {r.email ?? "—"}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{r.ip ?? "—"}</td>
                  <td className="p-3">
                    {r.countryCode ? (
                      <span className="inline-flex items-center gap-1.5" title={r.country ?? "Unknown"}>
                        <span className="text-lg leading-none">{getFlagEmoji(r.countryCode)}</span>
                        <span>{[r.city, r.country].filter(Boolean).join(", ") || "—"}</span>
                      </span>
                    ) : (
                      r.country ?? "—"
                    )}
                  </td>
                  <td className="p-3"><span className="inline-flex items-center gap-1.5"><DeviceIcon d={r.last_device} /> {r.last_device ?? "—"}</span></td>
                  <td className="p-3 text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : "—"}</td>
                  <td className="p-3">
                    {r.is_root_owner ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <ShieldCheck className="h-3 w-3" /> Root Owner
                      </span>
                    ) : r.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium"><ShieldCheck className="h-3 w-3" /> Admin</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">User</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!r.is_root_owner && (
                      <button
                        disabled={busyId === r.id}
                        onClick={() => toggleAdmin(r)}
                        className={`h-8 px-3 rounded-md text-xs font-medium border transition disabled:opacity-50 ${
                          r.is_admin
                            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                            : "border-primary/40 text-primary hover:bg-primary/10"
                        }`}
                      >
                        {busyId === r.id ? "…" : r.is_admin ? "Revoke admin" : "Grant admin"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

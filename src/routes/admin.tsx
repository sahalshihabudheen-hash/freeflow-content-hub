import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Loader2, Shield, ShieldCheck, Smartphone, Tablet, Monitor, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — JARVIS COMICS" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  email: string | null;
  country: string | null;
  last_device: string | null;
  last_seen_at: string | null;
  created_at: string;
  is_admin: boolean;
};

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setAuthChecked(true);
    });
  }, []);

  const load = async () => {
    setErr(null);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, email, country, last_device, last_seen_at, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr || rErr) { setErr((pErr || rErr)?.message ?? "Failed to load"); return; }
    const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    setRows((profiles ?? []).map((p) => ({ ...p, is_admin: adminSet.has(p.id) })));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const toggleAdmin = async (row: Row) => {
    setBusyId(row.id);
    try {
      if (row.is_admin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", row.id).eq("role", "admin");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role: "admin" });
        if (error) throw error;
      }
      await load();
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
      <p className="text-muted-foreground mb-6">{rows?.length ?? 0} registered users</p>

      {err && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{err}</div>}

      {rows === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Country</th>
                <th className="p-3 font-semibold">Device</th>
                <th className="p-3 font-semibold">Last seen</th>
                <th className="p-3 font-semibold">Joined</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3">{r.email ?? "—"}</td>
                  <td className="p-3">{r.country ?? "—"}</td>
                  <td className="p-3"><span className="inline-flex items-center gap-1.5"><DeviceIcon d={r.last_device} /> {r.last_device ?? "—"}</span></td>
                  <td className="p-3 text-muted-foreground">{r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    {r.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium"><ShieldCheck className="h-3 w-3" /> Admin</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">User</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
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

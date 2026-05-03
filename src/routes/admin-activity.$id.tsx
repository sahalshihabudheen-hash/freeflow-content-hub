import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { Loader2, ArrowLeft, Search, Eye, ShieldAlert, Clock } from "lucide-react";

export const Route = createFileRoute("/admin-activity/$id")({
  head: () => ({ meta: [{ title: "User Activity — Admin" }] }),
  component: UserActivityPage,
});

type Activity = {
  id: string;
  action: string;
  details: string;
  manga_id?: string;
  search_query?: string;
  results_count?: number;
  timestamp: string | null;
  email: string;
};

function UserActivityPage() {
  const { id } = Route.useParams();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, "user_activity"),
      where("uid", "==", id),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const val = d.data();
        let ts = null;
        if (val.timestamp?.toDate) {
          ts = val.timestamp.toDate().toLocaleString();
        } else if (val.timestamp) {
          ts = new Date(val.timestamp).toLocaleString();
        }
        return {
          id: d.id,
          action: val.action,
          details: val.details,
          manga_id: val.manga_id,
          search_query: val.search_query,
          results_count: val.results_count,
          email: val.email,
          timestamp: ts,
        };
      });
      setActivities(data);
    }, (e) => setErr(e.message));

    return () => unsub();
  }, [isAdmin, id]);

  if (roleLoading) {
    return <div className="container mx-auto py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Activity Log</h1>
        <p className="text-muted-foreground font-mono text-sm">User ID: {id}</p>
        {activities?.[0]?.email && (
          <p className="text-primary font-medium mt-1">{activities[0].email}</p>
        )}
      </div>

      {err && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{err}</div>}

      {activities === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-xl bg-card">
          <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">No activity recorded for this user.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="shrink-0 mt-1">
                {a.action === "SEARCH" && <Search className="h-5 w-5 text-blue-500" />}
                {a.action === "CLICK_SEARCH_RESULT" && <Eye className="h-5 w-5 text-green-500" />}
                {a.action === "VIEW_MANGA" && <BookOpen className="h-5 w-5 text-primary" />}
                {a.action === "VIEW_ADULT_MANGA" && <ShieldAlert className="h-5 w-5 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {a.action === "SEARCH" && "Searched"}
                    {a.action === "CLICK_SEARCH_RESULT" && "Clicked Search Result"}
                    {a.action === "VIEW_MANGA" && "Viewed Manga"}
                    {a.action === "VIEW_ADULT_MANGA" && "Viewed Adult Manga"}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.timestamp ?? "Unknown time"}</span>
                </div>
                
                <div className="text-sm text-foreground/90">
                  {a.action === "SEARCH" && (
                    <p>Query: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary">"{a.details}"</span> ({a.results_count} results)</p>
                  )}
                  {a.action === "CLICK_SEARCH_RESULT" && (
                    <p>Opened <span className="font-medium text-primary">{a.details}</span> from search <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-muted-foreground">"{a.search_query}"</span></p>
                  )}
                  {(a.action === "VIEW_MANGA" || a.action === "VIEW_ADULT_MANGA") && (
                    <p>Opened <span className="font-medium text-primary">{a.details}</span></p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

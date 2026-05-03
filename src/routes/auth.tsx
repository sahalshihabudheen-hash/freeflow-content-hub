import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPopup 
} from "firebase/auth";
import { trackSession } from "@/lib/track-session";
import { Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/jarvis-comics-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — JARVIS COMICS" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }
        trackSession(userCredential.user.uid).catch(() => {});
        navigate({ to: "/" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setMsg("Account created! Please check your email to verify your account before signing in.");
        setMode("signin");
        setPassword("");
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      trackSession(userCredential.user.uid).catch(() => {});
      navigate({ to: "/" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 mb-4 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 p-[2px] shadow-lg">
              <div className="h-full w-full bg-card rounded-[14px] flex items-center justify-center overflow-hidden">
                <img src={logo} alt="JARVIS COMICS" className="h-10 w-10 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signin" 
                ? "Enter your details to access your comics." 
                : "Join JARVIS COMICS — read & upload your own comics."}
            </p>
          </div>
          
          <div className="space-y-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground px-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full h-12 rounded-xl border border-border bg-background/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground px-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full h-12 rounded-xl border border-border bg-background/50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                  />
                </div>
              </div>

              {msg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500 font-medium animate-in fade-in">{msg}</div>}
              {err && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium animate-in fade-in">{err}</div>}
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {mode === "signin" ? "Sign in with Email" : "Sign up with Email"}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-medium tracking-wider">
                <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 rounded-xl border border-border bg-background/50 text-foreground font-medium hover:bg-accent disabled:opacity-60 inline-flex items-center justify-center gap-3 transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Google
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <button onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setErr(null);
              setMsg(null);
            }} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

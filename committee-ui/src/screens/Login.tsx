import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { user, loading, login } = useAuth();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(120%_80%_at_50%_-10%,#d1e7dd_0%,#f7faf8_48%,#eef5f1_100%)] p-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await login(usr.trim(), pwd);
          } catch {
            setError("Could not sign in. Check email and password.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="text-center">
          <img
            src="/assets/digital_jamath/images/logo-lockup.png"
            alt="digitaljamath"
            className="mx-auto h-10 object-contain"
          />
          <h1 className="mt-4 text-lg font-semibold text-brand-700">Committee sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">Same login as Desk</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="usr">
            Email
          </label>
          <Input
            id="usr"
            type="email"
            autoComplete="username"
            value={usr}
            onChange={(e) => setUsr(e.target.value)}
            placeholder="trustee@masjid.org"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="pwd">
            Password
          </label>
          <Input
            id="pwd"
            type="password"
            autoComplete="current-password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-xs text-zinc-400">
          Demo: demo@digitaljamath.com · Experience@DJ1
        </p>
      </form>
    </div>
  );
}

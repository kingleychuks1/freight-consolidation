// apps/web/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not sign in");
        return;
      }
      router.push(data.user.role === "CUSTOMER" ? "/dashboard" : "/clients");
      router.refresh();
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <header className="bg-brand-navy text-white px-6 py-4">
        <Link href="/" className="text-xs text-blue-300 font-mono tracking-widest uppercase">
          FreightCo
        </Link>
        <h1 className="text-lg font-bold">Consolidation Platform</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card">
            <h2 className="text-xl font-bold text-brand-navy">Welcome back</h2>
            <p className="text-sm text-brand-muted mt-1 mb-6">
              Sign in to track your packages and shipments.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">⚠️ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-brand-muted mt-4">
            New here?{" "}
            <Link href="/register" className="text-brand-blue font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

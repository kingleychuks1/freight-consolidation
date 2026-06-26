// apps/web/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [phone,    setPhone]    = useState("");
  const [country,  setCountry]  = useState("");
  const [address,  setAddress]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mailbox,  setMailbox]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     name.trim(),
          email:    email.trim(),
          password,
          phone:    phone.trim() || undefined,
          country:  country.trim() || undefined,
          address:  address.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account");
        return;
      }
      // Show the assigned mailbox code briefly before sending them in.
      setMailbox(data.user.mailboxCode ?? null);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1800);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (mailbox) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <p className="text-4xl mb-2">🎉</p>
          <h2 className="text-xl font-bold text-brand-navy">You&apos;re all set!</h2>
          <p className="text-sm text-brand-muted mt-1">Your personal mailbox code is</p>
          <p className="font-mono font-bold text-3xl tracking-widest text-brand-blue my-3">{mailbox}</p>
          <p className="text-sm text-brand-muted">
            Use it when ordering online so we can match arrivals to you. Taking you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <header className="bg-brand-navy text-white px-6 py-4">
        <Link href="/" aria-label="XPRESS CARGO home">
          <Logo markClassName="h-8 w-auto" className="text-lg" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card">
            <h2 className="text-xl font-bold text-brand-navy">Create your account</h2>
            <p className="text-sm text-brand-muted mt-1 mb-6">
              Get a free mailbox to consolidate and ship your packages.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">⚠️ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="input"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>

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
                  autoComplete="new-password"
                  className="input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="label" htmlFor="phone">
                  Phone <span className="text-brand-muted font-normal">(for WhatsApp alerts)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className="input"
                  placeholder="+44 7700 900000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="country">Country</label>
                  <input
                    id="country"
                    type="text"
                    autoComplete="country-name"
                    className="input"
                    placeholder="Nigeria"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="address">Delivery address</label>
                  <input
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    className="input"
                    placeholder="Street, city"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-brand-muted mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-blue font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

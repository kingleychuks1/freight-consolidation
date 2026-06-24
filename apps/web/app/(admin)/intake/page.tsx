// apps/web/app/(admin)/intake/page.tsx
"use client";

import { useState, useRef } from "react";

interface IntakeResult {
  shortId:     string;
  clientName:  string;
  mailboxCode: string;
  retailer:    string;
  waitingCount: number;
}

export default function IntakePage() {
  const [mailboxCode,     setMailboxCode]     = useState("");
  const [trackingNumber,  setTrackingNumber]  = useState("");
  const [retailer,        setRetailer]        = useState("");
  const [origin,          setOrigin]          = useState("");
  const [weight,          setWeight]          = useState("");
  const [photoUrl,        setPhotoUrl]        = useState("");
  const [clientPreview,   setClientPreview]   = useState<{ name: string; waitingCount: number } | null>(null);
  const [result,          setResult]          = useState<IntakeResult | null>(null);
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [lookingUp,       setLookingUp]       = useState(false);

  const RETAILERS = [
    "Amazon", "ASOS", "DPD", "Royal Mail", "Evri", "DHL",
    "FedEx", "UPS", "SHEIN", "Zara", "eBay", "AliExpress",
    "Temu", "Boohoo", "PLT", "Other",
  ];

  async function lookupMailbox(code: string) {
    if (code.length < 4) { setClientPreview(null); return; }
    setLookingUp(true);
    try {
      const res = await fetch(`/api/clients/mailbox?code=${code.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setClientPreview({ name: data.name, waitingCount: data.waitingCount });
        setError("");
      } else {
        setClientPreview(null);
      }
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/packages/intake", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          mailboxCode:   mailboxCode.toUpperCase(),
          trackingNumber: trackingNumber || undefined,
          retailer:      retailer || undefined,
          origin:        origin || undefined,
          weight:        weight ? parseFloat(weight) : undefined,
          photoUrl:      photoUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data.package);

      // Reset form for next package
      setTrackingNumber("");
      setRetailer("");
      setOrigin("");
      setWeight("");
      setPhotoUrl("");

    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMailboxCode("");
    setClientPreview(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4">
        <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">FreightCo Admin</p>
        <h1 className="text-lg font-bold">Package Intake</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Success banner */}
        {result && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4">
            <p className="font-semibold text-green-800">✅ Package logged successfully</p>
            <p className="text-sm text-green-700 mt-1">
              <strong>#{result.shortId}</strong> · {result.clientName} ({result.mailboxCode}) ·{" "}
              {result.retailer} · {result.waitingCount} packages now waiting
            </p>
            <p className="text-xs text-green-600 mt-1">Client has been notified by email & WhatsApp.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setResult(null)} className="btn-primary text-sm py-1.5">
                Log another package for {result.mailboxCode}
              </button>
              <button onClick={handleReset} className="btn-secondary text-sm py-1.5">
                New mailbox
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-700">⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Step 1: Mailbox code */}
          <div className="card">
            <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide mb-3">
              Step 1 — Identify the Client
            </h2>
            <label className="label">Mailbox Code *</label>
            <input
              type="text"
              className="input font-mono text-lg font-bold tracking-widest uppercase"
              placeholder="KLD-007"
              value={mailboxCode}
              onChange={(e) => {
                setMailboxCode(e.target.value.toUpperCase());
                lookupMailbox(e.target.value);
              }}
              required
              maxLength={10}
            />
            {lookingUp && <p className="text-xs text-brand-muted mt-1">Looking up…</p>}
            {clientPreview && (
              <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-green-600">✓</span>
                <div>
                  <p className="text-sm font-semibold text-green-900">{clientPreview.name}</p>
                  <p className="text-xs text-green-700">{clientPreview.waitingCount} packages currently waiting</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Package details */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide">
              Step 2 — Package Details
            </h2>

            <div>
              <label className="label">Tracking Number</label>
              <input
                type="text"
                className="input font-mono"
                placeholder="e.g. JD000XXXXXXXXX"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Retailer / Sender</label>
              <select
                className="input"
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
              >
                <option value="">— Auto-detect or select —</option>
                {RETAILERS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Origin Country</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. UK, US, CN"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Photo URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://... (upload photo first)"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <p className="text-xs text-brand-muted mt-1">
                Upload the package photo to storage first, then paste the URL here.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !mailboxCode}
            className="btn-primary w-full text-base py-3"
          >
            {loading ? "Logging package…" : "✅ Log Package & Notify Client"}
          </button>
        </form>

        {/* Quick reference */}
        <div className="card mt-6 bg-brand-navy text-white">
          <p className="text-xs font-mono text-blue-300 uppercase tracking-widest mb-2">Intake SOP</p>
          <ol className="text-sm text-blue-100 space-y-1 list-decimal list-inside">
            <li>Find the mailbox code on the package label (e.g. KLD-007)</li>
            <li>Scan or type it in above — client name will confirm</li>
            <li>Scan the carrier tracking barcode</li>
            <li>Take a photo and upload it to storage</li>
            <li>Select the retailer or let the system auto-detect</li>
            <li>Log it — client gets notified instantly</li>
            <li>Place the package in the physical bay labelled {"{mailboxCode}"}</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

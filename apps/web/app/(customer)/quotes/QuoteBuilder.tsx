"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Pkg {
  id: string;
  shortId: string;
  retailer: string | null;
  origin: string | null;
  weight: number | null;
  photoUrl: string | null;
}

interface QuoteResult {
  total: number;
  billableWeight: number;
  method: string;
  zone: number;
  weightCharge: number;
  handlingFee: number;
  estimatedTransitDays: number;
  currency: string;
}

const METHODS = [
  { value: "SEA",         label: "Sea Freight", hint: "Cheapest · slowest" },
  { value: "AIR",         label: "Air Freight", hint: "Balanced" },
  { value: "EXPRESS_AIR", label: "Express Air", hint: "Fastest" },
] as const;

export function QuoteBuilder({
  packages,
  defaultCountry,
  defaultAddress,
}: {
  packages: Pkg[];
  defaultCountry: string;
  defaultAddress: string;
}) {
  const [selected, setSelected]   = useState<Set<string>>(new Set(packages.map((p) => p.id)));
  const [method, setMethod]       = useState<string>("AIR");
  const [country, setCountry]     = useState(defaultCountry);
  const [address, setAddress]     = useState(defaultAddress);
  const [quote, setQuote]         = useState<QuoteResult | null>(null);
  const [error, setError]         = useState("");
  const [quoting, setQuoting]     = useState(false);
  const [booking, setBooking]     = useState(false);

  const selectedPackages = packages.filter((p) => selected.has(p.id));
  const totalWeight = useMemo(
    () => selectedPackages.reduce((s, p) => s + (p.weight ?? 0), 0),
    [selectedPackages]
  );
  const hasUnweighed = selectedPackages.some((p) => !p.weight);

  function toggle(id: string) {
    setQuote(null);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function getQuote() {
    setError("");
    setQuote(null);
    if (selected.size === 0) { setError("Select at least one package."); return; }
    if (!country)            { setError("Enter your destination country."); return; }
    setQuoting(true);
    try {
      const res = await fetch("/api/shipments/quote", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ method, packageIds: Array.from(selected), destinationCountry: country }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not calculate a quote"); return; }
      setQuote(data.quote);
    } catch {
      setError("Could not calculate a quote — please try again.");
    } finally {
      setQuoting(false);
    }
  }

  async function bookAndPay() {
    setError("");
    if (!address) { setError("Enter your delivery address."); return; }
    setBooking(true);
    try {
      const res = await fetch("/api/shipments/book", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          method,
          packageIds:         Array.from(selected),
          destination:        address,
          destinationCountry: country,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not book this shipment"); return; }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Booked but payment couldn't start — send them to the quote page.
        window.location.href = `/quotes/${data.shipmentId}`;
      }
    } catch {
      setError("Could not book this shipment — please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (packages.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-4xl mb-2">📦</p>
        <p className="text-brand-muted">You have no packages waiting to ship.</p>
        <Link href="/dashboard" className="btn-secondary inline-block mt-4 text-sm">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Step 1 — choose packages */}
      <div className="card">
        <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide mb-3">
          Step 1 — Choose Packages
        </h2>
        <div className="space-y-2">
          {packages.map((p) => {
            const on = selected.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`w-full text-left flex items-center gap-3 rounded-lg border p-3 transition-colors
                  ${on ? "border-brand-blue bg-blue-50" : "border-brand-border hover:border-brand-blue"}`}
              >
                <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                  ${on ? "bg-brand-blue border-brand-blue text-white" : "border-gray-300"}`}>
                  {on && "✓"}
                </span>
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">📦</span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">{p.retailer ?? "Unknown"}</span>
                  <span className="block text-xs font-mono text-brand-muted">#{p.shortId}</span>
                </span>
                <span className="text-sm font-semibold text-brand-muted">
                  {p.weight ? `${p.weight}kg` : "— kg"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-brand-muted">{selected.size} selected</span>
          <span className="font-semibold">Total: {totalWeight.toFixed(1)} kg</span>
        </div>
        {hasUnweighed && (
          <p className="text-xs text-amber-700 mt-2">
            ⚠️ Some selected packages aren&apos;t weighed yet — we&apos;ll confirm the final price once weighed.
          </p>
        )}
      </div>

      {/* Step 2 — method + destination */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide">
          Step 2 — Shipping Method & Destination
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMethod(m.value); setQuote(null); }}
              className={`rounded-lg border p-3 text-center transition-colors
                ${method === m.value ? "border-brand-blue bg-blue-50" : "border-brand-border hover:border-brand-blue"}`}
            >
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="block text-[11px] text-brand-muted mt-0.5">{m.hint}</span>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Destination country</label>
            <input className="input" value={country} onChange={(e) => { setCountry(e.target.value); setQuote(null); }} placeholder="Nigeria" />
          </div>
          <div>
            <label className="label">Delivery address</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
          </div>
        </div>
      </div>

      {/* Quote result */}
      {quote && (
        <div className="card bg-brand-navy text-white">
          <p className="text-xs font-mono text-blue-300 uppercase tracking-widest">Your quote</p>
          <p className="text-4xl font-bold text-brand-amber mt-1">£{quote.total.toFixed(2)}</p>
          <div className="text-sm text-blue-100 mt-3 space-y-1">
            <div className="flex justify-between"><span>Billable weight</span><span>{quote.billableWeight} kg</span></div>
            <div className="flex justify-between"><span>Freight ({quote.method.replace("_", " ")})</span><span>£{quote.weightCharge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Handling</span><span>£{quote.handlingFee.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-white/15 pt-1 mt-1"><span>Est. transit</span><span>~{quote.estimatedTransitDays} days</span></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button onClick={getQuote} disabled={quoting} className="btn-secondary w-full">
          {quoting ? "Calculating…" : quote ? "Recalculate quote" : "Calculate quote"}
        </button>
        {quote && (
          <button onClick={bookAndPay} disabled={booking} className="btn-primary w-full text-base py-3">
            {booking ? "Starting checkout…" : `Book & Pay £${quote.total.toFixed(2)} →`}
          </button>
        )}
      </div>

      <p className="text-xs text-brand-muted text-center">
        You&apos;ll be taken to secure Stripe checkout. Your packages are only reserved once you book.
      </p>
    </div>
  );
}

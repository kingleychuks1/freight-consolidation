"use client";

import { useState } from "react";

/**
 * Starts (or restarts) Stripe Checkout for an unpaid shipment and redirects
 * the browser to the hosted payment page.
 */
export function PayButton({
  shipmentId,
  amount,
  className = "btn-primary w-full text-base py-3",
  label,
}: {
  shipmentId: string;
  amount: number;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Could not start payment");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Could not start payment — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={pay} disabled={loading} className={className}>
        {loading ? "Starting payment…" : label ?? `Pay £${amount.toFixed(2)} now`}
      </button>
      {error && <p className="text-sm text-red-700 mt-2">⚠️ {error}</p>}
    </div>
  );
}

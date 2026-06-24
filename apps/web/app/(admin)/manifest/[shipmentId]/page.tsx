// apps/web/app/(admin)/manifest/[shipmentId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";

interface PackageItem {
  id:            string;
  shortId:       string;
  retailer:      string | null;
  origin:        string | null;
  weight:        number | null;
  photoUrl:      string | null;
}

interface ChecklistData {
  shipmentId:      string;
  clientName:      string;
  mailboxCode:     string;
  method:          string;
  totalPackages:   number;
  packages:        PackageItem[];
  allChecked:      boolean;
  missingPackages: PackageItem[];
  session: {
    id:                string;
    checkedPackageIds: string[];
    completed:         boolean;
  } | null;
}

export default function ManifestPage({ params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = use(params);

  const [data,          setData]          = useState<ChecklistData | null>(null);
  const [checked,       setChecked]       = useState<Set<string>>(new Set());
  const [saving,        setSaving]        = useState(false);
  const [completing,    setCompleting]    = useState(false);
  const [error,         setError]         = useState("");
  const [done,          setDone]          = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/shipments/${shipmentId}/checklist`);
    if (res.ok) {
      const d: ChecklistData = await res.json();
      setData(d);
      setChecked(new Set(d.session?.checkedPackageIds ?? []));
      setDone(d.session?.completed ?? false);
    }
  }, [shipmentId]);

  useEffect(() => { load(); }, [load]);

  async function saveProgress(complete = false) {
    setError("");
    complete ? setCompleting(true) : setSaving(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/checklist`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          checkedPackageIds: Array.from(checked),
          complete,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error + (d.missingCount ? ` (${d.missingCount} missing)` : ""));
        return;
      }
      if (complete) setDone(true);
      await load();
    } finally {
      setSaving(false);
      setCompleting(false);
    }
  }

  function toggle(id: string) {
    if (done) return;
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <p className="text-brand-muted">Loading checklist…</p>
      </div>
    );
  }

  const checkedCount  = checked.size;
  const totalCount    = data.packages.length;
  const allChecked    = checkedCount === totalCount;
  const progressPct   = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4">
        <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">Packing Checklist</p>
        <h1 className="text-lg font-bold">{data.clientName} · {data.mailboxCode}</h1>
        <p className="text-sm text-blue-200">{data.method} shipment · {totalCount} packages</p>
      </header>

      {done && (
        <div className="bg-green-600 text-white px-6 py-3 text-center font-semibold">
          ✅ Packing complete — shipment marked READY for dispatch
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Progress bar */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">{checkedCount} / {totalCount} packed</p>
            <p className="text-sm font-bold text-brand-blue">{progressPct}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${allChecked ? "bg-green-500" : "bg-brand-blue"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700">⚠️ {error}</p>
          </div>
        )}

        {/* Package list */}
        <div className="space-y-3 mb-6">
          {data.packages.map((pkg) => {
            const isChecked = checked.has(pkg.id);
            return (
              <button
                key={pkg.id}
                onClick={() => toggle(pkg.id)}
                disabled={done}
                className={`w-full text-left card flex items-center gap-4 transition-all
                  ${isChecked ? "border-green-400 bg-green-50" : "hover:border-brand-blue"}`}
              >
                {/* Checkbox */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${isChecked ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                >
                  {isChecked && "✓"}
                </div>

                {/* Photo */}
                {pkg.photoUrl ? (
                  <img src={pkg.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    📦
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{pkg.retailer ?? "Unknown"}</p>
                  <p className="text-xs font-mono text-brand-muted">#{pkg.shortId ?? pkg.id.slice(-6).toUpperCase()}</p>
                  {pkg.origin && <p className="text-xs text-brand-muted">From: {pkg.origin}</p>}
                </div>

                {pkg.weight && (
                  <p className="text-sm font-semibold text-brand-muted flex-shrink-0">{pkg.weight}kg</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        {!done && (
          <div className="space-y-3">
            <button
              onClick={() => saveProgress(false)}
              disabled={saving}
              className="btn-secondary w-full"
            >
              {saving ? "Saving…" : "Save Progress"}
            </button>
            <button
              onClick={() => saveProgress(true)}
              disabled={completing || !allChecked}
              className={`w-full py-3 rounded-xl font-semibold text-base transition-colors
                ${allChecked
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              {completing
                ? "Completing…"
                : allChecked
                ? "✅ All Packed — Mark as Ready"
                : `⚠️ ${totalCount - checkedCount} packages still missing`}
            </button>
          </div>
        )}

        {/* Missing packages highlight */}
        {!allChecked && !done && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              ⚠️ Not yet checked off ({totalCount - checkedCount}):
            </p>
            {data.packages
              .filter((p) => !checked.has(p.id))
              .map((p) => (
                <p key={p.id} className="text-sm text-amber-800 font-mono">
                  • #{(p.shortId ?? p.id.slice(-6)).toUpperCase()} — {p.retailer ?? "Unknown"}
                </p>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

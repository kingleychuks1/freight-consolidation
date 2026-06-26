// apps/web/app/(customer)/shipments/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { LogoMark } from "@/components/Logo";
import { PayButton } from "@/components/PayButton";

export const dynamic = "force-dynamic";

// Ordered milestones for the tracking timeline.
const MILESTONES = [
  { key: "QUOTED",     label: "Quote created",  statuses: ["QUOTE_PENDING", "QUOTE_SENT"] },
  { key: "CONFIRMED",  label: "Payment confirmed", statuses: ["CONFIRMED"] },
  { key: "PACKED",     label: "Packed & ready", statuses: ["PACKING", "READY"] },
  { key: "DISPATCHED", label: "Dispatched",     statuses: ["DISPATCHED", "IN_TRANSIT"] },
  { key: "DELIVERED",  label: "Delivered",      statuses: ["DELIVERED"] },
];

const RANK: Record<string, number> = {
  QUOTE_PENDING: 0, QUOTE_SENT: 0,
  CONFIRMED: 1, PACKING: 2, READY: 2,
  DISPATCHED: 3, IN_TRANSIT: 3, DELIVERED: 4, CANCELLED: -1,
};

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const { paid } = await searchParams;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { packages: { select: { id: true, retailer: true, weight: true, photoUrl: true } } },
  });

  if (!shipment) notFound();
  if (session.role === "CUSTOMER" && shipment.clientId !== session.sub) redirect("/dashboard");

  const rank      = RANK[shipment.status] ?? 0;
  const cancelled = shipment.status === "CANCELLED";
  const isPaid    = shipment.status === "CONFIRMED" || !!shipment.paidAt || rank >= 1;
  const unpaid    = !isPaid && !cancelled;
  const price     = shipment.quotedPrice ?? 0;

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center gap-3">
        <Link href="/shipments" aria-label="All shipments"><LogoMark className="h-9 w-auto" /></Link>
        <div>
          <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO</p>
          <h1 className="text-lg font-bold">Shipment #{shipment.id.slice(-6).toUpperCase()}</h1>
        </div>
      </header>

      {(paid || isPaid) && !cancelled && rank >= 1 && (
        <div className="bg-green-600 text-white px-6 py-3 text-center font-semibold">
          ✅ Payment confirmed — your shipment is being processed
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Summary */}
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{shipment.method.replace(/_/g, " ")} shipment</p>
            <span className={`badge ${cancelled ? "badge-warning" : rank >= 3 ? "badge-dispatched" : "badge-packed"}`}>
              {shipment.status.replace(/_/g, " ")}
            </span>
          </div>
          <div className="text-sm text-brand-muted mt-3 space-y-1">
            <div className="flex justify-between"><span>Destination</span><span className="font-semibold text-brand-navy text-right">{shipment.destination}</span></div>
            <div className="flex justify-between"><span>Packages</span><span className="font-semibold text-brand-navy">{shipment.packages.length}</span></div>
            <div className="flex justify-between"><span>Total weight</span><span className="font-semibold text-brand-navy">{shipment.totalWeight?.toFixed(1) ?? "—"} kg</span></div>
            <div className="flex justify-between"><span>Price</span><span className="font-semibold text-brand-navy">£{price.toFixed(2)}</span></div>
            {shipment.carrier && <div className="flex justify-between"><span>Carrier</span><span className="font-semibold text-brand-navy">{shipment.carrier}</span></div>}
            {shipment.trackingNumber && <div className="flex justify-between"><span>Tracking</span><span className="font-mono text-brand-navy">{shipment.trackingNumber}</span></div>}
          </div>
        </div>

        {/* Pay CTA */}
        {unpaid && (
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">This shipment is awaiting payment.</p>
            <PayButton shipmentId={shipment.id} amount={price} />
          </div>
        )}

        {/* Timeline */}
        {!cancelled && (
          <div className="card">
            <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide mb-4">Tracking</h2>
            <ol className="space-y-4">
              {MILESTONES.map((m, i) => {
                const done    = rank >= i;
                const current = rank === i;
                return (
                  <li key={m.key} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0
                      ${done ? "bg-brand-green text-white" : "bg-gray-200 text-gray-400"}`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm ${current ? "font-bold text-brand-navy" : done ? "text-brand-navy" : "text-brand-muted"}`}>
                      {m.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Packages */}
        <div className="card">
          <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide mb-2">Packages</h2>
          <ul className="divide-y divide-brand-border">
            {shipment.packages.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">📦</span>
                )}
                <span className="flex-1 text-sm font-semibold">{p.retailer ?? "Unknown"}</span>
                <span className="text-xs font-mono text-brand-muted">#{p.id.slice(-6).toUpperCase()} · {p.weight ? `${p.weight}kg` : "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

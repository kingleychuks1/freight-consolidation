// apps/web/app/(customer)/quotes/[shipmentId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { LogoMark } from "@/components/Logo";
import { PayButton } from "@/components/PayButton";

export const dynamic = "force-dynamic";

export default async function QuoteReviewPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { shipmentId } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { packages: { select: { id: true, retailer: true, weight: true } } },
  });

  if (!shipment) notFound();
  if (session.role === "CUSTOMER" && shipment.clientId !== session.sub) redirect("/dashboard");

  const isPaid    = shipment.status === "CONFIRMED" || !!shipment.paidAt;
  const cancelled = shipment.status === "CANCELLED";
  const price     = shipment.quotedPrice ?? 0;

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" aria-label="XPRESS CARGO home"><LogoMark className="h-9 w-auto" /></Link>
        <div>
          <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO</p>
          <h1 className="text-lg font-bold">Your Quote</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-brand-muted">#{shipment.id.slice(-6).toUpperCase()}</p>
            <span className={`badge ${isPaid ? "badge-dispatched" : cancelled ? "badge-warning" : "badge-packed"}`}>
              {shipment.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-5xl font-bold text-brand-navy mt-3">£{price.toFixed(2)}</p>
          <div className="text-sm text-brand-muted mt-3 space-y-1">
            <div className="flex justify-between"><span>Method</span><span className="font-semibold text-brand-navy">{shipment.method.replace(/_/g, " ")}</span></div>
            <div className="flex justify-between"><span>Packages</span><span className="font-semibold text-brand-navy">{shipment.packages.length}</span></div>
            <div className="flex justify-between"><span>Total weight</span><span className="font-semibold text-brand-navy">{shipment.totalWeight?.toFixed(1) ?? "—"} kg</span></div>
            <div className="flex justify-between"><span>Destination</span><span className="font-semibold text-brand-navy text-right">{shipment.destination}</span></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-sm text-brand-muted uppercase tracking-wide mb-2">Packages in this shipment</h2>
          <ul className="divide-y divide-brand-border">
            {shipment.packages.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold">{p.retailer ?? "Unknown"}</span>
                <span className="font-mono text-brand-muted">#{p.id.slice(-6).toUpperCase()} · {p.weight ? `${p.weight}kg` : "—"}</span>
              </li>
            ))}
          </ul>
        </div>

        {isPaid ? (
          <div className="card bg-green-50 border-green-200 text-center">
            <p className="font-semibold text-green-800">✅ This shipment is paid and confirmed.</p>
            <Link href={`/shipments/${shipment.id}`} className="btn-primary inline-block mt-3 text-sm">Track shipment →</Link>
          </div>
        ) : cancelled ? (
          <div className="card text-center">
            <p className="text-brand-muted">This quote was cancelled.</p>
            <Link href="/quotes" className="btn-primary inline-block mt-3 text-sm">Start a new quote</Link>
          </div>
        ) : (
          <PayButton shipmentId={shipment.id} amount={price} label={`Approve & Pay £${price.toFixed(2)}`} />
        )}
      </main>
    </div>
  );
}

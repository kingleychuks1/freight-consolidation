// apps/web/app/(customer)/shipments/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  QUOTE_PENDING: "badge-received",
  QUOTE_SENT:    "badge-packed",
  CONFIRMED:     "badge-dispatched",
  PACKING:       "badge-packed",
  READY:         "badge-packed",
  DISPATCHED:    "badge-dispatched",
  IN_TRANSIT:    "badge-dispatched",
  DELIVERED:     "badge-delivered",
  CANCELLED:     "badge-warning",
};

export default async function ShipmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect("/clients");

  const shipments = await prisma.shipment.findMany({
    where:   { clientId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { packages: { select: { id: true } } },
  });

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" aria-label="XPRESS CARGO home"><LogoMark className="h-9 w-auto" /></Link>
        <div>
          <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO</p>
          <h1 className="text-lg font-bold">My Shipments</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {shipments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-2">🚢</p>
            <p className="text-brand-muted">No shipments yet.</p>
            <Link href="/quotes" className="btn-primary inline-block mt-4 text-sm">Get a shipping quote →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((s) => {
              const unpaid = !["CONFIRMED", "PACKING", "READY", "DISPATCHED", "IN_TRANSIT", "DELIVERED"].includes(s.status) && s.status !== "CANCELLED";
              return (
                <Link key={s.id} href={`/shipments/${s.id}`}>
                  <div className="card flex items-center justify-between hover:border-brand-blue transition-colors cursor-pointer">
                    <div>
                      <p className="font-mono text-xs text-brand-muted">#{s.id.slice(-6).toUpperCase()}</p>
                      <p className="font-semibold text-sm mt-0.5">{s.method.replace(/_/g, " ")} · {s.packages.length} packages</p>
                      <p className="text-xs text-brand-muted">{s.destination}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${STATUS_BADGE[s.status] ?? "badge-received"}`}>{s.status.replace(/_/g, " ")}</span>
                      {s.quotedPrice != null && <p className="text-sm font-semibold mt-1">£{s.quotedPrice.toFixed(2)}</p>}
                      {unpaid && <p className="text-xs text-brand-blue mt-0.5">Pay now →</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

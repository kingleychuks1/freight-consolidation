// apps/web/app/(customer)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect("/admin");

  const [packages, shipments] = await Promise.all([
    prisma.package.findMany({
      where: {
        clientId: session.sub,
        status:   { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] },
      },
      orderBy: { receivedAt: "desc" },
      take:    10,
    }),
    prisma.shipment.findMany({
      where:   { clientId: session.sub },
      orderBy: { createdAt: "desc" },
      take:    3,
    }),
  ]);

  const totalWeight = packages.reduce((s, p) => s + (p.weight ?? 0), 0);

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Header */}
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="XPRESS CARGO home"><LogoMark className="h-9 w-auto" /></Link>
          <div>
            <span className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO</span>
            <h1 className="text-lg font-bold">My Dashboard</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200">Your mailbox</p>
          <p className="font-mono font-bold text-brand-amber text-lg">{session.mailboxCode}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-blue">{packages.length}</p>
            <p className="text-xs text-brand-muted mt-1">Waiting</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-navy">
              {totalWeight > 0 ? `${totalWeight.toFixed(1)}` : "—"}
            </p>
            <p className="text-xs text-brand-muted mt-1">Total kg</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-green">{shipments.length}</p>
            <p className="text-xs text-brand-muted mt-1">Shipments</p>
          </div>
        </div>

        {/* Mailbox info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900">📮 Your Mailbox Address</p>
          <p className="text-sm text-blue-700 mt-1">
            When ordering online, use <strong>{session.mailboxCode}</strong> as part of your delivery address.
            Add it to the name field or as a reference, e.g. <em>&ldquo;John Smith [{session.mailboxCode}]&rdquo;</em>
          </p>
        </div>

        {/* Waiting packages */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-brand-navy">Waiting Packages</h2>
            <Link href="/packages" className="text-sm text-brand-blue hover:underline">See all</Link>
          </div>

          {packages.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-brand-muted">No packages waiting. We&apos;ll notify you when something arrives.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="card flex items-start gap-4">
                  {pkg.photoUrl ? (
                    <img
                      src={pkg.photoUrl}
                      alt="Package"
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-brand-navy truncate">
                        {pkg.retailer ?? "Unknown sender"}
                      </span>
                      <span className="badge-received">Received</span>
                    </div>
                    <p className="text-xs text-brand-muted font-mono">#{pkg.id.slice(-6).toUpperCase()}</p>
                    {pkg.origin && (
                      <p className="text-xs text-brand-muted">From: {pkg.origin}</p>
                    )}
                    <p className="text-xs text-brand-muted mt-0.5">
                      {formatDistanceToNow(new Date(pkg.receivedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {pkg.weight && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-brand-navy">{pkg.weight}kg</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Request consolidation CTA */}
        {packages.length >= 2 && (
          <div className="card bg-brand-navy text-white">
            <p className="font-semibold mb-1">Ready to ship?</p>
            <p className="text-sm text-blue-200 mb-3">
              You have {packages.length} packages waiting. Request a consolidation and we&apos;ll pack
              them as one shipment to save on shipping costs.
            </p>
            <Link href="/quotes" className="btn-primary inline-block text-sm">
              Get a Shipping Quote →
            </Link>
          </div>
        )}

        {/* Recent shipments */}
        {shipments.length > 0 && (
          <section>
            <h2 className="font-semibold text-brand-navy mb-3">Recent Shipments</h2>
            <div className="space-y-3">
              {shipments.map((s) => (
                <Link key={s.id} href={`/shipments/${s.id}`}>
                  <div className="card flex items-center justify-between hover:border-brand-blue transition-colors cursor-pointer">
                    <div>
                      <p className="font-mono text-xs text-brand-muted">#{s.id.slice(-6).toUpperCase()}</p>
                      <p className="font-semibold text-sm mt-0.5">{s.method} Shipment</p>
                      <p className="text-xs text-brand-muted">{s.destination}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        s.status === "DELIVERED"   ? "badge-delivered"  :
                        s.status === "DISPATCHED"  ? "badge-dispatched" :
                        s.status === "READY"       ? "badge-packed"     :
                        "badge-received"
                      }`}>
                        {s.status.replace(/_/g, " ")}
                      </span>
                      {s.quotedPrice && (
                        <p className="text-sm font-semibold mt-1">£{s.quotedPrice.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

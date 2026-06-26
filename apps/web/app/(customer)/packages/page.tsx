// apps/web/app/(customer)/packages/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  RECEIVED:               "badge-received",
  AWAITING_CONSOLIDATION: "badge-packed",
  PACKED:                 "badge-packed",
  DISPATCHED:             "badge-dispatched",
  DELIVERED:              "badge-delivered",
};

export default async function PackagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect("/clients");

  const packages = await prisma.package.findMany({
    where:   { clientId: session.sub },
    orderBy: { receivedAt: "desc" },
  });

  const waiting = packages.filter((p) => ["RECEIVED", "AWAITING_CONSOLIDATION"].includes(p.status));

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" aria-label="XPRESS CARGO home"><LogoMark className="h-9 w-auto" /></Link>
          <div>
            <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO</p>
            <h1 className="text-lg font-bold">My Packages</h1>
          </div>
        </div>
        {waiting.length >= 2 && (
          <Link href="/quotes" className="btn-primary text-sm">Get a Quote →</Link>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {packages.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-brand-muted">No packages yet. We&apos;ll notify you the moment one arrives.</p>
            <Link href="/dashboard" className="btn-secondary inline-block mt-4 text-sm">Back to dashboard</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card flex items-start gap-4">
                {pkg.photoUrl ? (
                  <img src={pkg.photoUrl} alt="Package" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-brand-navy truncate">{pkg.retailer ?? "Unknown sender"}</span>
                    <span className={`badge ${STATUS_BADGE[pkg.status] ?? "badge-received"}`}>
                      {pkg.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted font-mono">#{pkg.id.slice(-6).toUpperCase()}</p>
                  {pkg.trackingNumber && <p className="text-xs text-brand-muted font-mono">{pkg.trackingNumber}</p>}
                  {pkg.origin && <p className="text-xs text-brand-muted">From: {pkg.origin}</p>}
                  <p className="text-xs text-brand-muted mt-0.5">
                    {formatDistanceToNow(new Date(pkg.receivedAt), { addSuffix: true })}
                  </p>
                </div>
                {pkg.weight && <p className="text-sm font-semibold text-brand-navy flex-shrink-0">{pkg.weight}kg</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// apps/web/app/(admin)/clients/[id]/manifest/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ClientManifestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CUSTOMER") redirect("/dashboard");

  const { id } = await params;

  const client = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, mailboxCode: true, country: true, address: true,
      packages: {
        where:   { status: { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] } },
        orderBy: { receivedAt: "desc" },
      },
      shipments: {
        where:   { status: { in: ["QUOTE_PENDING", "QUOTE_SENT", "CONFIRMED", "PACKING", "READY"] } },
        orderBy: { createdAt: "desc" },
        include: { packages: { select: { id: true } } },
      },
    },
  });

  if (!client) notFound();

  const totalWeight = client.packages.reduce((s, p) => s + (p.weight ?? 0), 0);

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/clients" className="text-xs text-blue-300 hover:underline">← All clients</Link>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-lg font-bold">{client.name}</h1>
              <p className="text-sm text-blue-200">{client.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200">Mailbox</p>
              <p className="font-mono font-bold text-brand-amber text-lg">{client.mailboxCode ?? "—"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-blue">{client.packages.length}</p>
            <p className="text-xs text-brand-muted mt-1">Waiting</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-navy">{totalWeight > 0 ? totalWeight.toFixed(1) : "—"}</p>
            <p className="text-xs text-brand-muted mt-1">Total kg</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-green">{client.shipments.length}</p>
            <p className="text-xs text-brand-muted mt-1">Open shipments</p>
          </div>
        </div>

        {client.address && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900">📍 Delivery address</p>
            <p className="text-sm text-blue-700 mt-1">{client.address}{client.country ? `, ${client.country}` : ""}</p>
          </div>
        )}

        {/* Open shipments */}
        {client.shipments.length > 0 && (
          <section>
            <h2 className="font-semibold text-brand-navy mb-3">Open Shipments</h2>
            <div className="space-y-3">
              {client.shipments.map((s) => (
                <Link key={s.id} href={`/manifest/${s.id}`}>
                  <div className="card flex items-center justify-between hover:border-brand-blue transition-colors cursor-pointer">
                    <div>
                      <p className="font-mono text-xs text-brand-muted">#{s.id.slice(-6).toUpperCase()}</p>
                      <p className="font-semibold text-sm mt-0.5">{s.method} · {s.packages.length} packages</p>
                      <p className="text-xs text-brand-muted">{s.destination}</p>
                    </div>
                    <div className="text-right">
                      <span className="badge-packed">{s.status.replace(/_/g, " ")}</span>
                      {s.quotedPrice && <p className="text-sm font-semibold mt-1">£{s.quotedPrice.toFixed(2)}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Waiting packages */}
        <section>
          <h2 className="font-semibold text-brand-navy mb-3">Waiting Packages</h2>
          {client.packages.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-brand-muted">No packages currently waiting for this client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.packages.map((pkg) => (
                <div key={pkg.id} className="card flex items-start gap-4">
                  {pkg.photoUrl ? (
                    <img src={pkg.photoUrl} alt="Package" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-brand-navy truncate">{pkg.retailer ?? "Unknown sender"}</span>
                      <span className="badge-received">{pkg.status.replace(/_/g, " ")}</span>
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
        </section>
      </main>
    </div>
  );
}

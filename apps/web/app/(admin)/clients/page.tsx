// apps/web/app/(admin)/clients/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CUSTOMER") redirect("/dashboard");

  const clients = await prisma.user.findMany({
    where:   { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      name:        true,
      email:       true,
      mailboxCode: true,
      country:     true,
      _count: {
        select: {
          // Only packages still waiting to be consolidated.
          packages: { where: { status: { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] } } },
        },
      },
    },
  });

  const totalWaiting = clients.reduce((sum, c) => sum + c._count.packages, 0);
  const withPackages = clients.filter((c) => c._count.packages > 0).length;

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="XPRESS CARGO home"><LogoMark className="h-9 w-auto" /></Link>
          <div>
            <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO Admin</p>
            <h1 className="text-lg font-bold">Clients</h1>
          </div>
        </div>
        <Link href="/intake" className="btn-primary text-sm">+ Log Intake</Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-blue">{clients.length}</p>
            <p className="text-xs text-brand-muted mt-1">Total clients</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-navy">{withPackages}</p>
            <p className="text-xs text-brand-muted mt-1">With waiting packages</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-brand-amber">{totalWaiting}</p>
            <p className="text-xs text-brand-muted mt-1">Packages waiting</p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-2">👥</p>
            <p className="text-brand-muted">No clients registered yet.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 bg-brand-surface border-b border-brand-border text-xs font-semibold text-brand-muted uppercase tracking-wide">
              <div className="col-span-4">Client</div>
              <div className="col-span-3">Mailbox</div>
              <div className="col-span-2 text-center">Waiting</div>
              <div className="col-span-3 text-right">Manifest</div>
            </div>

            <ul className="divide-y divide-brand-border">
              {clients.map((c) => (
                <li
                  key={c.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-5 py-4 items-center hover:bg-brand-surface transition-colors"
                >
                  <div className="sm:col-span-4 min-w-0">
                    <p className="font-semibold text-sm text-brand-navy truncate">{c.name}</p>
                    <p className="text-xs text-brand-muted truncate">{c.email}</p>
                  </div>

                  <div className="sm:col-span-3">
                    <span className="font-mono font-bold text-sm tracking-wide text-brand-blue">
                      {c.mailboxCode ?? "—"}
                    </span>
                    {c.country && <p className="text-xs text-brand-muted">{c.country}</p>}
                  </div>

                  <div className="sm:col-span-2 sm:text-center">
                    {c._count.packages > 0 ? (
                      <span className="badge-received">{c._count.packages} waiting</span>
                    ) : (
                      <span className="text-xs text-brand-muted">None</span>
                    )}
                  </div>

                  <div className="sm:col-span-3 sm:text-right">
                    <Link
                      href={`/clients/${c.id}/manifest`}
                      className="text-sm text-brand-blue font-medium hover:underline"
                    >
                      View manifest →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

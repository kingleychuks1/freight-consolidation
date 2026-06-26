// apps/web/app/(customer)/quotes/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { LogoMark } from "@/components/Logo";
import { QuoteBuilder } from "./QuoteBuilder";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect("/clients");

  const [user, packages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { country: true, address: true },
    }),
    prisma.package.findMany({
      where:   { clientId: session.sub, status: { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] }, shipmentId: null },
      orderBy: { receivedAt: "desc" },
      select:  { id: true, retailer: true, origin: true, weight: true, photoUrl: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" aria-label="XPRESS CARGO home"><LogoMark className="h-9 w-auto" /></Link>
        <div>
          <p className="text-xs text-blue-300 font-mono tracking-widest uppercase">XPRESS CARGO</p>
          <h1 className="text-lg font-bold">Get a Shipping Quote</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <QuoteBuilder
          packages={packages.map((p) => ({
            id:       p.id,
            shortId:  p.id.slice(-6).toUpperCase(),
            retailer: p.retailer,
            origin:   p.origin,
            weight:   p.weight,
            photoUrl: p.photoUrl,
          }))}
          defaultCountry={user?.country ?? ""}
          defaultAddress={user?.address ?? ""}
        />
      </main>
    </div>
  );
}

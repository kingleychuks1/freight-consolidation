// apps/web/app/api/clients/[id]/manifest/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Customers can only see their own manifest
  const clientId = session.role === "CUSTOMER" ? session.sub : id;
  if (session.role === "CUSTOMER" && session.sub !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [client, packages, activeShipment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, mailboxCode: true, country: true },
    }),
    prisma.package.findMany({
      where: { clientId, status: { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] } },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.shipment.findFirst({
      where: { clientId, status: { in: ["QUOTE_PENDING", "QUOTE_SENT", "CONFIRMED", "PACKING"] } },
      include: { packages: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  return NextResponse.json({
    client,
    summary: {
      totalWaiting:      packages.length,
      totalWeight:       packages.reduce((sum, p) => sum + (p.weight ?? 0), 0),
      receivedThisWeek:  packages.filter(
        (p) => p.receivedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    },
    packages: packages.map((p) => ({
      id:            p.id,
      shortId:       p.id.slice(-6).toUpperCase(),
      trackingNumber: p.trackingNumber,
      retailer:      p.retailer,
      origin:        p.origin,
      weight:        p.weight,
      dimensions:    p.dimensions,
      photoUrl:      p.photoUrl,
      status:        p.status,
      receivedAt:    p.receivedAt,
      description:   p.description,
    })),
    activeShipment: activeShipment
      ? {
          id:           activeShipment.id,
          status:       activeShipment.status,
          method:       activeShipment.method,
          packageCount: activeShipment.packages.length,
          quotedPrice:  activeShipment.quotedPrice,
        }
      : null,
  });
}

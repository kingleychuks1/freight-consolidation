// apps/web/app/api/shipments/[id]/checklist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/jwt";

const ChecklistUpdateSchema = z.object({
  checkedPackageIds: z.array(z.string()),
  complete: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * GET  — retrieve current packing session state
 * POST — update checked packages; optionally mark complete
 *
 * The key safety rule: a shipment CANNOT be marked READY unless
 * ALL packages assigned to it are checked off.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      packages:       { select: { id: true, retailer: true, origin: true, weight: true, photoUrl: true, shortId: true } },
      packingSessions: { orderBy: { createdAt: "desc" }, take: 1 },
      client:         { select: { name: true, mailboxCode: true } },
    },
  });

  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const session = shipment.packingSessions[0] ?? null;

  return NextResponse.json({
    shipmentId:        id,
    clientName:        shipment.client.name,
    mailboxCode:       shipment.client.mailboxCode,
    method:            shipment.method,
    totalPackages:     shipment.packages.length,
    packages:          shipment.packages,
    session:           session
      ? {
          id:                session.id,
          checkedPackageIds: session.checkedPackageIds,
          completed:         session.completed,
          completedAt:       session.completedAt,
        }
      : null,
    allChecked:
      session
        ? shipment.packages.every((p) => session.checkedPackageIds.includes(p.id))
        : false,
    missingPackages:
      session
        ? shipment.packages.filter((p) => !session.checkedPackageIds.includes(p.id))
        : shipment.packages,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workerSession = await requireSession();
    if (workerSession.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { checkedPackageIds, complete, notes } = ChecklistUpdateSchema.parse(body);

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { packages: true },
    });

    if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

    // Find or create packing session
    let packingSession = await prisma.packingSession.findFirst({
      where: { shipmentId: id, completed: false },
    });

    if (!packingSession) {
      packingSession = await prisma.packingSession.create({
        data: {
          shipmentId:        id,
          workerId:          workerSession.sub,
          checkedPackageIds: [],
        },
      });
    }

    const allPackageIds = shipment.packages.map((p) => p.id);
    const allChecked    = allPackageIds.every((pid) => checkedPackageIds.includes(pid));

    // Safety guard: cannot mark complete if packages are missing
    if (complete && !allChecked) {
      const missing = allPackageIds.filter((pid) => !checkedPackageIds.includes(pid));
      return NextResponse.json(
        {
          error:          "Cannot complete packing — packages are missing",
          missingPackageIds: missing,
          missingCount:   missing.length,
        },
        { status: 422 }
      );
    }

    // Update the session
    const updated = await prisma.packingSession.update({
      where: { id: packingSession.id },
      data: {
        checkedPackageIds,
        completed:   complete ?? false,
        completedAt: complete ? new Date() : null,
        notes,
      },
    });

    // If completing, update shipment + all packages to PACKED
    if (complete && allChecked) {
      await prisma.$transaction([
        prisma.shipment.update({
          where: { id },
          data:  { status: "READY" },
        }),
        prisma.package.updateMany({
          where: { id: { in: allPackageIds } },
          data:  { status: "PACKED", packedAt: new Date() },
        }),
      ]);
    }

    return NextResponse.json({
      success:      true,
      sessionId:    updated.id,
      checkedCount: checkedPackageIds.length,
      totalCount:   allPackageIds.length,
      allChecked,
      completed:    updated.completed,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    console.error("[checklist] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper type (Prisma doesn't auto-generate this)
declare module "@prisma/client" {
  interface Package {
    shortId?: string;
  }
}

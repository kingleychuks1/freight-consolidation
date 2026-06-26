// apps/web/app/api/shipments/[id]/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/jwt";
import { createShipmentCheckout } from "@/lib/payments/stripe";

/**
 * POST /api/shipments/[id]/checkout
 * Opens a fresh Stripe Checkout session for an unpaid shipment, so the
 * customer can pay from the quote-review or tracking page (and email links).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        client:   { select: { id: true, email: true } },
        packages: { select: { id: true } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Customers may only pay for their own shipments; staff may act on any.
    if (session.role === "CUSTOMER" && shipment.clientId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (shipment.status === "CONFIRMED" || shipment.paidAt) {
      return NextResponse.json({ error: "Shipment is already paid" }, { status: 409 });
    }
    if (shipment.status === "CANCELLED") {
      return NextResponse.json({ error: "Shipment was cancelled" }, { status: 409 });
    }

    const amount = shipment.quotedPrice ?? 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "Shipment has no quoted price" }, { status: 422 });
    }

    const checkout = await createShipmentCheckout({
      shipmentId:   shipment.id,
      clientId:     shipment.clientId,
      clientEmail:  shipment.client.email,
      amount,
      method:       shipment.method,
      packageCount: shipment.packages.length,
      destination:  shipment.destination,
    });

    await prisma.shipment.update({
      where: { id: shipment.id },
      data:  { stripePaymentId: checkout.id },
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[checkout] error:", err);
    return NextResponse.json({ error: "Could not start payment — please try again" }, { status: 502 });
  }
}

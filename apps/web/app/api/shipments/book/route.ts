// apps/web/app/api/shipments/book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/jwt";
import { calculateQuote } from "@/lib/shipping/pricing";
import { createShipmentCheckout } from "@/lib/payments/stripe";

const BookSchema = z.object({
  method:             z.enum(["AIR", "SEA", "EXPRESS_AIR"]),
  packageIds:         z.array(z.string()).min(1),
  destination:        z.string().min(4).optional(),       // delivery address
  destinationCountry: z.string().min(2).optional(),
});

/**
 * POST /api/shipments/book
 * Creates a shipment, links the selected packages, prices it server-side,
 * and opens a Stripe Checkout session. Shipment stays QUOTE_SENT until the
 * Stripe webhook confirms payment → CONFIRMED.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const data = BookSchema.parse(body);

    const client = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, address: true, country: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const destination = data.destination ?? client.address;
    const destinationCountry = data.destinationCountry ?? client.country;
    if (!destination || !destinationCountry) {
      return NextResponse.json(
        { error: "Delivery address and country are required" },
        { status: 400 }
      );
    }

    // Load and validate the packages: must belong to this client, be waiting,
    // and not already attached to another shipment.
    const packages = await prisma.package.findMany({
      where: { id: { in: data.packageIds }, clientId: client.id },
      select: { id: true, weight: true, status: true, shipmentId: true },
    });

    if (packages.length !== data.packageIds.length) {
      return NextResponse.json(
        { error: "One or more packages were not found for this account" },
        { status: 404 }
      );
    }

    const ineligible = packages.filter(
      (p) => p.shipmentId || !["RECEIVED", "AWAITING_CONSOLIDATION"].includes(p.status)
    );
    if (ineligible.length > 0) {
      return NextResponse.json(
        {
          error: "Some packages are already booked into a shipment",
          packageIds: ineligible.map((p) => p.id),
        },
        { status: 409 }
      );
    }

    const totalWeight = packages.reduce((sum, p) => sum + (p.weight ?? 0), 0);
    if (totalWeight <= 0) {
      return NextResponse.json(
        { error: "Packages must be weighed before booking" },
        { status: 422 }
      );
    }

    // Authoritative server-side price — never trust a client-sent amount.
    const quote = calculateQuote({
      weight: totalWeight,
      method: data.method,
      destinationCountry,
    });

    // Create the shipment and attach the packages atomically.
    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          clientId:           client.id,
          method:             data.method,
          destination,
          destinationCountry,
          totalWeight,
          quotedPrice:        quote.total,
          status:             "QUOTE_SENT",
        },
      });

      await tx.package.updateMany({
        where: { id: { in: data.packageIds } },
        data:  { shipmentId: created.id, status: "AWAITING_CONSOLIDATION" },
      });

      return created;
    });

    // Open Stripe Checkout. On failure, roll the booking back so packages free up.
    let checkout;
    try {
      checkout = await createShipmentCheckout({
        shipmentId:   shipment.id,
        clientId:     client.id,
        clientEmail:  client.email,
        amount:       quote.total,
        method:       data.method,
        packageCount: packages.length,
        destination,
      });
    } catch (stripeErr) {
      console.error("[book] stripe error:", stripeErr);
      await prisma.$transaction([
        prisma.package.updateMany({
          where: { shipmentId: shipment.id },
          data:  { shipmentId: null, status: "RECEIVED" },
        }),
        prisma.shipment.update({
          where: { id: shipment.id },
          data:  { status: "CANCELLED" },
        }),
      ]);
      return NextResponse.json(
        { error: "Could not start payment — please try again" },
        { status: 502 }
      );
    }

    await prisma.shipment.update({
      where: { id: shipment.id },
      data:  { stripePaymentId: checkout.id },
    });

    return NextResponse.json(
      {
        success:     true,
        shipmentId:  shipment.id,
        quote,
        checkoutUrl: checkout.url,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[book] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

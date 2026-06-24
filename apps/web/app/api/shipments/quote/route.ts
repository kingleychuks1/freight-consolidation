// apps/web/app/api/shipments/quote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/jwt";
import { calculateQuote } from "@/lib/shipping/pricing";

const QuoteSchema = z.object({
  method:             z.enum(["AIR", "SEA", "EXPRESS_AIR"]),
  packageIds:         z.array(z.string()).min(1).optional(),
  // Fallback when no concrete packages are selected (e.g. instant estimate).
  weight:             z.number().positive().optional(),
  destinationCountry: z.string().min(2).optional(),
}).refine((d) => d.packageIds || d.weight, {
  message: "Provide either packageIds or weight",
});

/**
 * POST /api/shipments/quote
 * Stateless price preview — calculates cost by weight × method × destination
 * zone. Does NOT create a shipment (that happens at /book).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const data = QuoteSchema.parse(body);

    // Resolve the client (customers quote for themselves; staff may pass none).
    const client = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, country: true },
    });

    const destinationCountry =
      data.destinationCountry ?? client?.country;
    if (!destinationCountry) {
      return NextResponse.json(
        { error: "Destination country is required" },
        { status: 400 }
      );
    }

    // Determine chargeable weight.
    let weight = data.weight ?? 0;
    let packageCount = 0;

    if (data.packageIds?.length) {
      const packages = await prisma.package.findMany({
        where: {
          id:       { in: data.packageIds },
          clientId: session.sub, // a client may only quote their own packages
        },
        select: { id: true, weight: true },
      });

      if (packages.length !== data.packageIds.length) {
        return NextResponse.json(
          { error: "One or more packages were not found for this account" },
          { status: 404 }
        );
      }

      packageCount = packages.length;
      weight = packages.reduce((sum, p) => sum + (p.weight ?? 0), 0);
    }

    if (weight <= 0) {
      return NextResponse.json(
        { error: "Total package weight is unknown — weigh packages before quoting" },
        { status: 422 }
      );
    }

    const quote = calculateQuote({
      weight,
      method: data.method,
      destinationCountry,
    });

    return NextResponse.json({ quote, packageCount });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[quote] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

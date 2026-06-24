// apps/web/app/api/packages/intake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/jwt";
import { detectRetailer } from "@/lib/shipping/retailerDetect";
import { sendPackageReceived } from "@/lib/notifications/email";
import { whatsappPackageReceived } from "@/lib/notifications/whatsapp";

const IntakeSchema = z.object({
  mailboxCode:    z.string().min(3),           // e.g. "KLD-007"
  trackingNumber: z.string().optional(),
  retailer:       z.string().optional(),       // override auto-detect
  senderHint:     z.string().optional(),       // label sender name
  origin:         z.string().optional(),       // country
  weight:         z.number().positive().optional(),
  dimensions:     z.string().optional(),       // "30x20x15"
  description:    z.string().optional(),
  photoUrl:       z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Only workers and admins can log intake
    const session = await requireSession();
    if (session.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = IntakeSchema.parse(body);

    // 1. Resolve client by mailbox code
    const client = await prisma.user.findUnique({
      where: { mailboxCode: data.mailboxCode.toUpperCase() },
    });

    if (!client) {
      return NextResponse.json(
        { error: `No client found for mailbox code ${data.mailboxCode}` },
        { status: 404 }
      );
    }

    // 2. Auto-detect retailer if not provided
    const detectedRetailer = data.retailer
      ?? detectRetailer(data.trackingNumber ?? "", data.senderHint)?.name
      ?? "Unknown";

    // 3. Create package record
    const pkg = await prisma.package.create({
      data: {
        clientId:      client.id,
        trackingNumber: data.trackingNumber,
        retailer:      detectedRetailer,
        origin:        data.origin,
        weight:        data.weight,
        dimensions:    data.dimensions,
        description:   data.description,
        photoUrl:      data.photoUrl,
        status:        "RECEIVED",
      },
    });

    // 4. Count all waiting packages for this client
    const waitingCount = await prisma.package.count({
      where: {
        clientId: client.id,
        status:   { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] },
      },
    });

    // 5. Log notification record
    await prisma.notification.create({
      data: {
        clientId:  client.id,
        packageId: pkg.id,
        type:      "PACKAGE_RECEIVED",
        channel:   "EMAIL",
        subject:   `Package received from ${detectedRetailer}`,
        message:   `Package #${pkg.id.slice(-6).toUpperCase()} from ${detectedRetailer} received at warehouse.`,
      },
    });

    // 6. Send notifications (fire-and-forget — don't block response)
    const notifyOpts = {
      clientName:   client.name,
      retailer:     detectedRetailer,
      mailboxCode:  client.mailboxCode!,
      totalWaiting: waitingCount,
    };

    Promise.allSettled([
      // Email
      sendPackageReceived({
        to:        client.email,
        packageId: pkg.id,
        photoUrl:  data.photoUrl,
        ...notifyOpts,
      }),
      // WhatsApp (if phone on file)
      client.phone
        ? whatsappPackageReceived({ phone: client.phone, ...notifyOpts })
        : Promise.resolve(),
    ]).catch(console.error);

    return NextResponse.json({
      success: true,
      package: {
        id:            pkg.id,
        shortId:       pkg.id.slice(-6).toUpperCase(),
        clientName:    client.name,
        mailboxCode:   client.mailboxCode,
        retailer:      detectedRetailer,
        status:        pkg.status,
        receivedAt:    pkg.receivedAt,
        waitingCount,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[intake] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

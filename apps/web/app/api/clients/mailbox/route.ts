// apps/web/app/api/clients/mailbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/jwt";

/**
 * GET /api/clients/mailbox?code=KLD-007
 * Workers scan the mailbox code on a package to identify the client.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSession(); // any authenticated user

    const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Missing mailbox code" }, { status: 400 });
    }

    const client = await prisma.user.findUnique({
      where: { mailboxCode: code },
      select: {
        id:          true,
        name:        true,
        email:       true,
        mailboxCode: true,
        country:     true,
        _count: {
          select: {
            packages: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: `No client found for mailbox code "${code}"` },
        { status: 404 }
      );
    }

    // Count packages currently waiting
    const waitingCount = await prisma.package.count({
      where: {
        clientId: client.id,
        status:   { in: ["RECEIVED", "AWAITING_CONSOLIDATION"] },
      },
    });

    return NextResponse.json({
      id:          client.id,
      name:        client.name,
      email:       client.email,
      mailboxCode: client.mailboxCode,
      country:     client.country,
      waitingCount,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[mailbox lookup] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

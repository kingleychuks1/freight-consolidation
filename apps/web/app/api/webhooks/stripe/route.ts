// apps/web/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import prisma from "@/lib/db/prisma";
import { stripe } from "@/lib/payments/stripe";
import { sendPaymentConfirmed } from "@/lib/notifications/email";
import { whatsappPaymentConfirmed } from "@/lib/notifications/whatsapp";

// Stripe needs the raw, unparsed request body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
    // Other event types are acknowledged without action.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    // 500 → Stripe will retry delivery.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
  const shipmentId = checkoutSession.metadata?.shipmentId;
  if (!shipmentId) {
    console.warn("[stripe webhook] checkout.session.completed without shipmentId metadata");
    return;
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      client:   { select: { name: true, email: true, phone: true } },
      packages: { select: { id: true } },
    },
  });

  if (!shipment) {
    console.warn(`[stripe webhook] shipment ${shipmentId} not found`);
    return;
  }

  // Idempotency — Stripe may deliver the same event more than once.
  if (shipment.status === "CONFIRMED" || shipment.paidAt) {
    return;
  }

  const amountPaid =
    typeof checkoutSession.amount_total === "number"
      ? checkoutSession.amount_total / 100
      : shipment.quotedPrice ?? 0;

  await prisma.$transaction([
    prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status:          "CONFIRMED",
        paidAt:          new Date(),
        finalPrice:      amountPaid,
        stripePaymentId: checkoutSession.payment_intent?.toString() ?? checkoutSession.id,
      },
    }),
    prisma.notification.create({
      data: {
        clientId:   shipment.clientId,
        shipmentId: shipment.id,
        type:       "PAYMENT_CONFIRMED",
        channel:    "EMAIL",
        subject:    "Payment received — shipment confirmed",
        message:    `Payment of £${amountPaid.toFixed(2)} received. Your ${shipment.method} shipment is confirmed.`,
      },
    }),
  ]);

  // Fire-and-forget notifications — don't block the webhook ack.
  Promise.allSettled([
    sendPaymentConfirmed({
      to:           shipment.client.email,
      clientName:   shipment.client.name,
      shipmentId:   shipment.id,
      amountPaid,
      method:       shipment.method,
      packageCount: shipment.packages.length,
      destination:  shipment.destination,
    }),
    shipment.client.phone
      ? whatsappPaymentConfirmed({
          phone:        shipment.client.phone,
          clientName:   shipment.client.name,
          shipmentId:   shipment.id,
          amountPaid,
          packageCount: shipment.packages.length,
        })
      : Promise.resolve(),
  ]).catch(console.error);
}

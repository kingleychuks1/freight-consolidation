// apps/web/lib/payments/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

/**
 * Create a Stripe Checkout session for a freight shipment.
 * The shipmentId is stamped into metadata so the webhook can resolve it.
 */
export async function createShipmentCheckout(opts: {
  shipmentId: string;
  clientId: string;
  clientEmail: string;
  amount: number;        // GBP, e.g. 42.50
  method: string;
  packageCount: number;
  destination: string;
}): Promise<Stripe.Checkout.Session> {
  const { shipmentId, clientId, clientEmail, amount, method, packageCount, destination } = opts;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: clientEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(amount * 100), // pence
          product_data: {
            name: `${method} consolidated shipment to ${destination}`,
            description: `${packageCount} package${packageCount === 1 ? "" : "s"} · FreightCo Consolidation`,
          },
        },
      },
    ],
    metadata: { shipmentId, clientId },
    success_url: `${siteUrl}/shipments/${shipmentId}?paid=1`,
    cancel_url: `${siteUrl}/quotes/${shipmentId}?cancelled=1`,
  });
}

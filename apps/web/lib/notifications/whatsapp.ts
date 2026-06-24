// apps/web/lib/notifications/whatsapp.ts

/**
 * WhatsApp notifications via Twilio WhatsApp Business API.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *
 * The Twilio sandbox number is whatsapp:+14155238886 for testing.
 * For production, request a dedicated WhatsApp Business number from Twilio.
 */

function twilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken  = process.env.TWILIO_AUTH_TOKEN!;
  const base64     = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const from       = process.env.TWILIO_WHATSAPP_FROM!;

  async function sendMessage(to: string, body: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formData = new URLSearchParams({
      From: from,
      To: `whatsapp:${to}`,
      Body: body,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Twilio error: ${JSON.stringify(err)}`);
    }
  }

  return { sendMessage };
}

export async function whatsappPackageReceived(opts: {
  phone: string;
  clientName: string;
  retailer: string;
  mailboxCode: string;
  totalWaiting: number;
}) {
  const { phone, clientName, retailer, mailboxCode, totalWaiting } = opts;
  const client = twilioClient();

  const message = [
    `📦 *FreightCo — Package Received*`,
    ``,
    `Hi ${clientName}! A package from *${retailer}* has just arrived for mailbox *${mailboxCode}*.`,
    ``,
    `You now have *${totalWaiting}* package${totalWaiting > 1 ? "s" : ""} waiting.`,
    ``,
    `View your manifest: ${process.env.NEXT_PUBLIC_SITE_URL}/packages`,
    ``,
    `_No need to call us — we'll keep you posted here._`,
  ].join("\n");

  await client.sendMessage(phone, message);
}

export async function whatsappPaymentConfirmed(opts: {
  phone: string;
  clientName: string;
  shipmentId: string;
  amountPaid: number;
  packageCount: number;
}) {
  const { phone, clientName, shipmentId, amountPaid, packageCount } = opts;
  const client = twilioClient();

  const message = [
    `✅ *FreightCo — Payment Confirmed*`,
    ``,
    `Hi ${clientName}! We've received your payment of *£${amountPaid.toFixed(2)}*.`,
    ``,
    `Your shipment of *${packageCount}* package${packageCount === 1 ? "" : "s"} is confirmed and heading to packing.`,
    ``,
    `Track it: ${process.env.NEXT_PUBLIC_SITE_URL}/shipments/${shipmentId}`,
  ].join("\n");

  await client.sendMessage(phone, message);
}

export async function whatsappShipmentDispatched(opts: {
  phone: string;
  clientName: string;
  trackingNumber: string;
  carrier: string;
  packageCount: number;
}) {
  const { phone, clientName, trackingNumber, carrier, packageCount } = opts;
  const client = twilioClient();

  const message = [
    `🚀 *FreightCo — Shipment Dispatched*`,
    ``,
    `Hi ${clientName}! Your ${packageCount} package${packageCount > 1 ? "s" : ""} ${packageCount > 1 ? "have" : "has"} been dispatched via *${carrier}*.`,
    ``,
    `Tracking: *${trackingNumber}*`,
    ``,
    `Track: ${process.env.NEXT_PUBLIC_SITE_URL}/shipments`,
  ].join("\n");

  await client.sendMessage(phone, message);
}

export async function whatsappQuoteReady(opts: {
  phone: string;
  clientName: string;
  shipmentId: string;
  quotedPrice: number;
  packageCount: number;
}) {
  const { phone, clientName, shipmentId, quotedPrice, packageCount } = opts;
  const client = twilioClient();

  const message = [
    `💰 *FreightCo — Quote Ready*`,
    ``,
    `Hi ${clientName}! Your shipping quote for *${packageCount}* package${packageCount > 1 ? "s" : ""} is ready.`,
    ``,
    `Total: *£${quotedPrice.toFixed(2)}*`,
    ``,
    `Approve here: ${process.env.NEXT_PUBLIC_SITE_URL}/quotes/${shipmentId}`,
  ].join("\n");

  await client.sendMessage(phone, message);
}

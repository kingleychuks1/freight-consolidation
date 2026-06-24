// apps/web/lib/notifications/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? "notifications@freightco.com";

// ── Package Received ──────────────────────────────────────────────────────────

export async function sendPackageReceived(opts: {
  to: string;
  clientName: string;
  retailer: string;
  packageId: string;
  photoUrl?: string;
  totalWaiting: number;
  mailboxCode: string;
}) {
  const { to, clientName, retailer, packageId, photoUrl, totalWaiting, mailboxCode } = opts;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `📦 Package received from ${retailer}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0B1F3A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">FreightCo Consolidation</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none;">
          <p style="color: #374151; font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
          <p style="color: #374151;">A new package has arrived at our warehouse for your mailbox <strong>${mailboxCode}</strong>.</p>
          
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; color: #64748B; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Package Details</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>From:</strong> ${retailer}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Package ID:</strong> #${packageId.slice(-6).toUpperCase()}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Waiting for you:</strong> ${totalWaiting} package${totalWaiting > 1 ? "s" : ""}</p>
          </div>

          ${photoUrl ? `<img src="${photoUrl}" alt="Package photo" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ""}

          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/packages" 
             style="display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            View My Packages
          </a>
          
          <p style="color: #64748B; font-size: 13px; margin-top: 24px;">
            You're receiving this because you have a mailbox with us. No need to call — we'll notify you of every arrival.
          </p>
        </div>
      </div>
    `,
  });
}

// ── Shipment Dispatched ───────────────────────────────────────────────────────

export async function sendShipmentDispatched(opts: {
  to: string;
  clientName: string;
  shipmentId: string;
  trackingNumber: string;
  carrier: string;
  packageCount: number;
  destination: string;
  estimatedArrival?: Date;
}) {
  const { to, clientName, shipmentId, trackingNumber, carrier, packageCount, destination, estimatedArrival } = opts;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `🚀 Your shipment is on its way — ${trackingNumber}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0B1F3A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">FreightCo Consolidation</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none;">
          <p style="color: #374151; font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
          <p style="color: #374151;">Your consolidated shipment has been dispatched! 🎉</p>
          
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Carrier:</strong> ${carrier}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Tracking:</strong> ${trackingNumber}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Packages:</strong> ${packageCount}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Destination:</strong> ${destination}</p>
            ${estimatedArrival ? `<p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Est. Arrival:</strong> ${estimatedArrival.toDateString()}</p>` : ""}
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/shipments/${shipmentId}" 
             style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Track Shipment
          </a>
        </div>
      </div>
    `,
  });
}

// ── Quote Ready ───────────────────────────────────────────────────────────────

export async function sendQuoteReady(opts: {
  to: string;
  clientName: string;
  shipmentId: string;
  packageCount: number;
  method: string;
  quotedPrice: number;
}) {
  const { to, clientName, shipmentId, packageCount, method, quotedPrice } = opts;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `💰 Your shipping quote is ready — £${quotedPrice.toFixed(2)}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0B1F3A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">FreightCo Consolidation</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none;">
          <p style="color: #374151; font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
          <p style="color: #374151;">Your shipping quote is ready. Review and approve it to get your packages moving.</p>
          
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #0B1F3A;"><strong>Packages:</strong> ${packageCount}</p>
            <p style="margin: 4px 0; color: #0B1F3A;"><strong>Method:</strong> ${method}</p>
            <p style="margin: 8px 0 4px; color: #1A56DB; font-size: 24px; font-weight: 700;">£${quotedPrice.toFixed(2)}</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/quotes/${shipmentId}" 
             style="display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Review & Approve Quote
          </a>
        </div>
      </div>
    `,
  });
}

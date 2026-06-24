# FreightCo — Package Consolidation Platform

Air & sea freight consolidation system. Solves:
1. **Mixing/missing packages** — mailbox codes + packing checklists with hard guards
2. **Client calls asking "did you get my package?"** — instant email + WhatsApp notifications on intake
3. **Manual quote & booking** — automated quote, Stripe payment, dispatch workflow

---

## Quick Start

```bash
# 1. Install dependencies
cd apps/web && npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in: DATABASE_URL, JWT_SECRET, RESEND_API_KEY, STRIPE_*, TWILIO_*, NEXT_PUBLIC_SITE_URL

# 3. Push schema to Neon
npm run db:push

# 4. Seed test data
npm run db:seed

# 5. Run locally
npm run dev
```

---

## Architecture

```
freight-consolidation/
├── apps/
│   ├── web/                    Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/        Login, Register
│   │   │   ├── (customer)/    Client dashboard, packages, shipments, quotes
│   │   │   ├── (admin)/       Worker intake, manifest/checklist, dispatch
│   │   │   └── api/           All REST endpoints
│   │   ├── components/        Reusable UI components
│   │   └── lib/               DB, auth, notifications, shipping utils
│   └── worker-pwa/            Lightweight HTML PWA for warehouse workers
│       └── pages/
│           └── scan.html      Camera scan + intake form
├── prisma/
│   └── schema.prisma          Full data model
└── scripts/
    └── seed.ts                Dev seed data
```

---

## Key User Flows

### 1. Client Onboarding
```
Register → auto-assigned mailbox code (e.g. KLD-007)
→ Uses KLD-007 as part of delivery address when ordering online
→ e.g. "Jane Adeyemi [KLD-007]" in name field
```

### 2. Package Intake (Worker)
```
Package arrives at warehouse
→ Worker opens /admin/intake or scan.html (PWA)
→ Types/scans KLD-007
→ System confirms: "Jane Adeyemi — 2 packages waiting"
→ Worker scans tracking barcode, selects retailer, enters weight
→ Logs package → client notified instantly via email + WhatsApp
→ Worker places package in physical bay labelled "KLD-007"
```

### 3. Consolidation & Dispatch (Worker)
```
Client requests consolidation via /quotes
→ System generates quote (weight × method × destination)
→ Client approves + pays via Stripe
→ Worker opens /admin/manifest/[shipmentId]
→ Checklist shows all packages for that client
→ Worker physically checks off each package from the KLD-007 bay
→ System BLOCKS completion if any package not checked
→ All checked → shipment marked READY
→ Client notified of dispatch with tracking number
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register + auto-assign mailbox code |
| POST | `/api/auth/login` | Public | Login, set HTTP-only cookie |
| POST | `/api/packages/intake` | Worker/Admin | Log incoming package, trigger notifications |
| GET | `/api/packages/scan?tracking=` | Worker/Admin | Lookup package by tracking number |
| GET | `/api/clients/mailbox?code=KLD-007` | Any auth | Resolve mailbox code to client |
| GET | `/api/clients/[id]/manifest` | Customer (own) / Admin | Full waiting manifest |
| GET | `/api/shipments/[id]/checklist` | Worker/Admin | Packing session state |
| POST | `/api/shipments/[id]/checklist` | Worker/Admin | Update checked packages, complete packing |
| POST | `/api/shipments/quote` | Customer | Request consolidation quote |
| POST | `/api/shipments/book` | Customer | Confirm + pay for shipment |
| POST | `/api/webhooks/stripe` | Stripe | Payment confirmation |

---

## Database Models

```
User           — id, email, passwordHash, name, phone, role, mailboxCode
Package        — id, clientId, trackingNumber, retailer, origin, photoUrl, status, receivedAt
Shipment       — id, clientId, method (AIR|SEA), status, trackingNumber, quotedPrice
PackingSession — id, shipmentId, workerId, checkedPackageIds[], completed
Notification   — id, clientId, type, channel, message, packageId?
```

---

## Physical Operations SOP

### Intake
1. Package arrives at warehouse
2. Find mailbox code on the label (client adds it when ordering)
3. Open Worker PWA on tablet/phone → `/worker-pwa/pages/scan.html`
4. Scan QR or type the code — client name confirmed on screen
5. Scan carrier tracking barcode
6. Take a photo → upload to Supabase Storage → paste URL
7. Select retailer or let system auto-detect from tracking prefix
8. Log → client notified automatically
9. Place package in physical shelving bay labelled **KLD-007**

### Packing & Dispatch
1. Client requests consolidation and pays
2. Open admin checklist: `/admin/manifest/[shipmentId]`
3. Go to KLD-007 physical bay
4. Check off each package on screen as you physically handle it
5. System shows missing packages in amber — do NOT seal box until all green
6. All checked → tap "Mark as Ready" → system prevents bypassing
7. Pack, photograph sealed box, update tracking number
8. Client receives dispatch notification automatically

---

## Environment Variables

See `.env.example` for the full list. Minimum required to run:
- `DATABASE_URL` — Neon Postgres connection string
- `JWT_SECRET` — random 32+ char string
- `NEXT_PUBLIC_SITE_URL` — your domain
- `RESEND_API_KEY` — for email notifications
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — for payments

Optional but recommended:
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_WHATSAPP_FROM` — WhatsApp
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — photo storage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Database | Neon Postgres + Prisma v5 |
| Auth | Custom JWT (jose) + HTTP-only cookies |
| Email | Resend |
| WhatsApp | Twilio WhatsApp Business API |
| Payments | Stripe |
| Storage | Supabase Storage (or Cloudflare R2) |
| Worker PWA | Plain HTML/JS with html5-qrcode |
| Barcode scanning | html5-qrcode (camera), ZXing |
| Shipping rates | Easyship API or Shippo |

---

## Deployment (Vercel + Neon)

```bash
# Build command (Vercel)
prisma generate && next build

# Environment variables to set manually in Vercel:
# RESEND_API_KEY, JWT_SECRET, NEXT_PUBLIC_SITE_URL, STRIPE_*, TWILIO_*
# DATABASE_URL is auto-set by the Neon Vercel integration
```

---

## Test Accounts (after seeding)

| Role | Email | Password | Mailbox |
|------|-------|----------|---------|
| Admin | admin@freightco.com | admin1234 | — |
| Worker | worker@freightco.com | worker1234 | — |
| Customer | jane@example.com | customer1234 | KLD-001 |
| Customer | kwame@example.com | customer1234 | KLD-002 |

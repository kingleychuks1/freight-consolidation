// apps/web/lib/shipping/pricing.ts
//
// Freight pricing engine. Price = billable weight × zone rate × method
// multiplier + a flat consolidation/handling fee. All amounts in GBP.
//
// This is deliberately a pure function with no I/O so the same calculation
// can be used by both the quote endpoint (preview) and the book endpoint
// (authoritative, server-side recompute — never trust a client-sent price).

import type { ShipmentMethod } from "@prisma/client";

// ── Destination zones ─────────────────────────────────────────────────────────
// Countries are matched case-insensitively by ISO-2 code or common name.

export type Zone = 1 | 2 | 3 | 4 | 5;

const ZONE_BY_COUNTRY: Record<string, Zone> = {
  // Zone 1 — UK domestic
  uk: 1, gb: 1, "united kingdom": 1, england: 1, scotland: 1, wales: 1,
  // Zone 2 — Europe
  ie: 2, ireland: 2, fr: 2, france: 2, de: 2, germany: 2, es: 2, spain: 2,
  it: 2, italy: 2, nl: 2, netherlands: 2, be: 2, belgium: 2, pt: 2, portugal: 2,
  // Zone 3 — North America
  us: 3, usa: 3, "united states": 3, ca: 3, canada: 3,
  // Zone 4 — Africa (core consolidation market)
  ng: 4, nigeria: 4, gh: 4, ghana: 4, ke: 4, kenya: 4, za: 4, "south africa": 4,
  cm: 4, cameroon: 4, ci: 4, "ivory coast": 4, sn: 4, senegal: 4,
  // Zone 5 — Asia / Middle East / rest of world (default)
  cn: 5, china: 5, ae: 5, uae: 5, in: 5, india: 5, au: 5, australia: 5,
};

export function zoneForCountry(country: string): Zone {
  return ZONE_BY_COUNTRY[country.trim().toLowerCase()] ?? 5;
}

// ── Rate tables ───────────────────────────────────────────────────────────────
// Base GBP/kg per zone — this is the SEA rate; air methods scale up from it.

const ZONE_RATE_PER_KG: Record<Zone, number> = {
  1: 2.5,
  2: 4.0,
  3: 6.5,
  4: 5.5,
  5: 7.0,
};

const METHOD_MULTIPLIER: Record<ShipmentMethod, number> = {
  SEA:         1.0,
  AIR:         2.4,
  EXPRESS_AIR: 3.6,
};

// Indicative door-to-door transit time per zone+method, in days.
const TRANSIT_DAYS: Record<ShipmentMethod, Record<Zone, number>> = {
  SEA:         { 1: 3, 2: 10, 3: 21, 4: 35, 5: 40 },
  AIR:         { 1: 1, 2: 3, 3: 6, 4: 7, 5: 9 },
  EXPRESS_AIR: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
};

// Flat per-shipment consolidation + handling fee (packing, label, admin).
const HANDLING_FEE_GBP = 8;

// We never bill below this weight — covers handling of very light parcels.
const MIN_BILLABLE_KG = 0.5;

export interface QuoteBreakdown {
  currency: "GBP";
  destinationCountry: string;
  zone: Zone;
  method: ShipmentMethod;
  actualWeight: number;     // kg, raw input
  billableWeight: number;   // kg, after MIN_BILLABLE_KG floor
  ratePerKg: number;        // zone base rate (SEA)
  methodMultiplier: number;
  effectiveRatePerKg: number; // ratePerKg × methodMultiplier
  weightCharge: number;     // billableWeight × effectiveRatePerKg
  handlingFee: number;
  total: number;
  estimatedTransitDays: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate a freight quote. `weight` is total chargeable weight in kg.
 */
export function calculateQuote(opts: {
  weight: number;
  method: ShipmentMethod;
  destinationCountry: string;
}): QuoteBreakdown {
  const { weight, method, destinationCountry } = opts;

  const zone = zoneForCountry(destinationCountry);
  const ratePerKg = ZONE_RATE_PER_KG[zone];
  const methodMultiplier = METHOD_MULTIPLIER[method];
  const effectiveRatePerKg = round2(ratePerKg * methodMultiplier);

  const billableWeight = Math.max(weight, MIN_BILLABLE_KG);
  const weightCharge = round2(billableWeight * effectiveRatePerKg);
  const total = round2(weightCharge + HANDLING_FEE_GBP);

  return {
    currency: "GBP",
    destinationCountry,
    zone,
    method,
    actualWeight: round2(weight),
    billableWeight: round2(billableWeight),
    ratePerKg,
    methodMultiplier,
    effectiveRatePerKg,
    weightCharge,
    handlingFee: HANDLING_FEE_GBP,
    total,
    estimatedTransitDays: TRANSIT_DAYS[method][zone],
  };
}

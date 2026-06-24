// apps/web/lib/shipping/retailerDetect.ts

interface RetailerMatch {
  name: string;
  logo: string; // emoji fallback, replace with actual logo URLs
  color: string;
}

const TRACKING_PATTERNS: Array<{ pattern: RegExp; retailer: RetailerMatch }> = [
  // Amazon
  {
    pattern: /^(TBA|AMZN|1Z[0-9A-Z]{16}|[0-9]{12,14})/i,
    retailer: { name: "Amazon", logo: "📦", color: "#FF9900" },
  },
  // Royal Mail
  {
    pattern: /^[A-Z]{2}[0-9]{9}GB$/i,
    retailer: { name: "Royal Mail", logo: "✉️", color: "#E11B22" },
  },
  // DPD
  {
    pattern: /^(15|16|05|%5B)[0-9]{14,16}$/,
    retailer: { name: "DPD", logo: "🚐", color: "#DC0032" },
  },
  // Hermes / Evri
  {
    pattern: /^[A-Z0-9]{16}$/,
    retailer: { name: "Evri", logo: "📬", color: "#8B2BE2" },
  },
  // DHL
  {
    pattern: /^(JD|1Z|GM|LX)[0-9A-Z]{14,}/i,
    retailer: { name: "DHL", logo: "🟡", color: "#FFCC00" },
  },
  // FedEx
  {
    pattern: /^[0-9]{12,22}$/,
    retailer: { name: "FedEx", logo: "🟣", color: "#4D148C" },
  },
  // UPS
  {
    pattern: /^1Z[A-Z0-9]{16}$/i,
    retailer: { name: "UPS", logo: "🟤", color: "#351C15" },
  },
  // ASOS
  {
    pattern: /^(AS|ASOS)[0-9A-Z]{8,}/i,
    retailer: { name: "ASOS", logo: "👗", color: "#2D2D2D" },
  },
];

const RETAILER_KEYWORDS: Record<string, RetailerMatch> = {
  amazon:   { name: "Amazon",     logo: "📦", color: "#FF9900" },
  asos:     { name: "ASOS",       logo: "👗", color: "#2D2D2D" },
  dpd:      { name: "DPD",        logo: "🚐", color: "#DC0032" },
  evri:     { name: "Evri",       logo: "📬", color: "#8B2BE2" },
  hermes:   { name: "Evri",       logo: "📬", color: "#8B2BE2" },
  dhl:      { name: "DHL",        logo: "🟡", color: "#FFCC00" },
  fedex:    { name: "FedEx",      logo: "🟣", color: "#4D148C" },
  ups:      { name: "UPS",        logo: "🟤", color: "#351C15" },
  "royal mail": { name: "Royal Mail", logo: "✉️", color: "#E11B22" },
  shein:    { name: "SHEIN",      logo: "👚", color: "#000000" },
  zara:     { name: "Zara",       logo: "🛍️", color: "#1A1A1A" },
  ebay:     { name: "eBay",       logo: "🔵", color: "#E53238" },
  aliexpress: { name: "AliExpress", logo: "🟠", color: "#FF6A00" },
  temu:     { name: "Temu",       logo: "🛒", color: "#FF6600" },
  boohoo:   { name: "Boohoo",     logo: "💜", color: "#6B21A8" },
  prettylittlething: { name: "PLT", logo: "💗", color: "#E91E8C" },
};

export function detectRetailer(
  trackingNumber: string,
  senderHint?: string
): RetailerMatch | null {
  // 1. Try keyword match on sender name
  if (senderHint) {
    const lower = senderHint.toLowerCase();
    for (const [key, retailer] of Object.entries(RETAILER_KEYWORDS)) {
      if (lower.includes(key)) return retailer;
    }
  }

  // 2. Try tracking number pattern
  const tracking = trackingNumber.trim().toUpperCase();
  for (const { pattern, retailer } of TRACKING_PATTERNS) {
    if (pattern.test(tracking)) return retailer;
  }

  return null;
}

export function getKnownRetailers(): string[] {
  return Object.values(RETAILER_KEYWORDS).map((r) => r.name);
}

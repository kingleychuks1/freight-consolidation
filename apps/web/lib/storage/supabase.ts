// apps/web/lib/storage/supabase.ts
//
// Thin wrapper over the Supabase Storage REST API — no SDK dependency,
// consistent with how Twilio is called via fetch. The service-role key is
// used server-side only; it must never reach the browser.
//
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "packages";

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

/**
 * Upload a package photo to Supabase Storage and return its public URL.
 * `path` is the object key within the bucket (e.g. "intake/abc123.jpg").
 */
export async function uploadPackagePhoto(opts: {
  path: string;
  body: ArrayBuffer | Buffer;
  contentType: string;
}): Promise<string> {
  if (!storageConfigured()) {
    throw new Error("Supabase Storage is not configured");
  }
  const { path, body, contentType } = opts;
  const objectUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

  const res = await fetch(objectUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType,
      // Public, cacheable package photos; fail if the key already exists.
      "cache-control": "public, max-age=31536000",
      "x-upsert": "false",
    },
    body: body as BodyInit,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase upload failed (${res.status}): ${detail}`);
  }

  // For a public bucket this URL resolves directly.
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

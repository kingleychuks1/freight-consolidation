// apps/web/app/api/uploads/package-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireSession } from "@/lib/auth/jwt";
import { uploadPackagePhoto, storageConfigured } from "@/lib/storage/supabase";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/**
 * POST /api/uploads/package-photo
 * Workers/admins upload an intake photo (multipart, field "file").
 * Returns { url } to drop straight into the intake API's photoUrl.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!storageConfigured()) {
      return NextResponse.json(
        { error: "Photo storage is not configured on the server" },
        { status: 503 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}` },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 8 MB)" },
        { status: 413 }
      );
    }

    const ext = EXT[file.type] ?? "jpg";
    const path = `intake/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const url = await uploadPackagePhoto({
      path,
      body: buffer,
      contentType: file.type,
    });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

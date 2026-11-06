import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES: Record<string, "image" | "video"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/heic": "image",
  "image/heif": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
};

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`records-presign:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) },
    });
  }

  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try {
    userId = verifyToken(bearer).sub;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let mimeType: string;
  try {
    const body = await req.json();
    mimeType = (body.mimeType ?? "").toLowerCase().split(";")[0].trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mediaType = ALLOWED_TYPES[mimeType];
  if (!mediaType) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const ext = EXT_MAP[mimeType] ?? "bin";
  const path = `records/${userId}/${Date.now()}-${randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("pr-media")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("pr-media").getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl,
    mediaType,
  });
}

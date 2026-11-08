import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifyToken } from "@/lib/jwt";
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

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: path,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  let signedUrl: string;
  try {
    signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  } catch {
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${path}`;

  return NextResponse.json({ signedUrl, path, publicUrl, mediaType });
}

import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** Extract the R2 object key from a public URL. Returns null if not an R2 URL. */
export function r2KeyFromUrl(url: string | null | undefined): string | null {
  if (!url || !process.env.R2_PUBLIC_URL) return null;
  const base = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
  if (!url.startsWith(base + "/")) return null;
  return url.slice(base.length + 1);
}

export async function deleteR2Object(url: string | null | undefined): Promise<void> {
  const key = r2KeyFromUrl(url);
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }));
  } catch (err) {
    console.error("[r2] deleteObject failed:", key, err);
  }
}

export async function deleteR2Objects(urls: (string | null | undefined)[]): Promise<void> {
  const keys = urls.map(r2KeyFromUrl).filter(Boolean) as string[];
  if (keys.length === 0) return;
  try {
    await r2.send(new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }));
  } catch (err) {
    console.error("[r2] deleteObjects failed:", keys, err);
  }
}

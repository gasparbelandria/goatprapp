import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";
import { deleteR2Objects } from "@/lib/r2";

async function resolveUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ar_token")?.value;
  if (!token) return null;
  try { return verifyToken(token).sub; } catch { return null; }
}

// POST /api/account/delete — verify email only, no deletion
export async function POST(req: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { data: user } = await supabase
    .from("pr_users")
    .select("email")
    .eq("id", userId)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (email !== user.email.trim().toLowerCase()) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}

// DELETE /api/account/delete — full account deletion
// Accepts both cookie (web) and Bearer token (mobile)
export async function DELETE(req: NextRequest) {
  const bearerToken = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  const cookieStore = await cookies();
  const token = bearerToken ?? cookieStore.get("ar_token")?.value ?? null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try { userId = verifyToken(token).sub; } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Collect all R2 URLs before any DB deletions — rows may cascade away mid-sequence.
  const [{ data: mediaRecords }, { data: unRow }] = await Promise.all([
    supabase.from("pr_records").select("media_url").eq("user_id", userId).not("media_url", "is", null),
    supabase.from("pr_usernames").select("avatar_url, banner_url").eq("user_id", userId).maybeSingle(),
  ]);
  const r2Urls = [
    ...(mediaRecords ?? []).map((r) => r.media_url),
    unRow?.avatar_url,
    unRow?.banner_url,
  ];

  // 1. Delete R2 media (before DB rows — idempotent if it fails)
  await deleteR2Objects(r2Urls);

  // 2. Delete all follow relationships
  await supabase
    .from("pr_follows")
    .delete()
    .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

  // 3. Delete user's notifications
  await supabase.from("pr_notifications").delete().eq("user_id", userId);

  // 4. Delete profile and username
  await Promise.all([
    supabase.from("pr_profiles").delete().eq("user_id", userId),
    supabase.from("pr_usernames").delete().eq("user_id", userId),
  ]);

  // 5. Delete user record (must be last — cascades pr_records, pr_challenges, etc.)
  await supabase.from("pr_users").delete().eq("id", userId);

  // 7. Invalidate session cookie (web sessions — mobile handles logout client-side)
  cookieStore.set("ar_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

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
export async function DELETE(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ar_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try { userId = verifyToken(token).sub; } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Most child records cascade automatically via ON DELETE CASCADE in the schema.
  // We handle explicit deletions here for storage cleanup and tables without CASCADE.

  // 1. Delete all follow relationships
  await supabase
    .from("pr_follows")
    .delete()
    .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

  // 2. Delete user's notifications
  await supabase.from("pr_notifications").delete().eq("user_id", userId);

  // 3. Delete profile and username (in parallel)
  await Promise.all([
    supabase.from("pr_profiles").delete().eq("user_id", userId),
    supabase.from("pr_usernames").delete().eq("user_id", userId),
  ]);

  // 4. Delete user record (must be last — cascades pr_records, pr_challenges, etc.)
  await supabase.from("pr_users").delete().eq("id", userId);

  // 5. Delete avatar from storage (all possible extensions)
  await supabase.storage
    .from("avatars")
    .remove(["jpg", "png", "webp"].map((ext) => `${userId}.${ext}`));

  // 6. Invalidate session cookie
  cookieStore.set("ar_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}

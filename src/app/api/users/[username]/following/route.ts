import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const clean = username.replace(/^@/, "").toLowerCase();

  const cookieStore = await cookies();
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  const rawToken = cookieStore.get("ar_token")?.value ?? bearer ?? null;
  let viewerId: string | null = null;
  if (rawToken) {
    try { viewerId = verifyToken(rawToken).sub; } catch { /* anon */ }
  }

  const { data: usernameRow } = await supabase
    .from("pr_usernames")
    .select("user_id")
    .eq("username", clean)
    .maybeSingle();

  if (!usernameRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get people this user follows
  const { data: follows } = await supabase
    .from("pr_follows")
    .select("following_id")
    .eq("follower_id", usernameRow.user_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!follows || follows.length === 0) return NextResponse.json({ items: [] });

  const followingIds = follows.map((f) => f.following_id);

  const [{ data: usernames }, { data: users }] = await Promise.all([
    supabase
      .from("pr_usernames")
      .select("user_id, username, display_name")
      .in("user_id", followingIds),
    supabase
      .from("pr_users")
      .select("id, avatar_url")
      .in("id", followingIds),
  ]);

  const unMap = new Map((usernames ?? []).map((u) => [u.user_id, u]));
  const uuMap = new Map((users ?? []).map((u) => [u.id, u]));

  // Check which of these users the viewer follows
  let viewerFollowSet = new Set<string>();
  if (viewerId) {
    const { data: viewerFollows } = await supabase
      .from("pr_follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .in("following_id", followingIds);
    viewerFollowSet = new Set((viewerFollows ?? []).map((f) => f.following_id));
  }

  const items = followingIds.map((id) => {
    const un = unMap.get(id);
    const uu = uuMap.get(id);
    return {
      userId: id,
      username: un?.username ?? "unknown",
      displayName: un?.display_name ?? null,
      avatarUrl: uu?.avatar_url ?? null,
      isFollowing: viewerId ? viewerFollowSet.has(id) : null,
    };
  }).filter((item) => item.username !== "unknown");

  return NextResponse.json({ items });
}

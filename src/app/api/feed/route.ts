import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type FeedRow = {
  id: string;
  value: number;
  unit: string;
  notes: string | null;
  media_url: string | null;
  media_type: string | null;
  verification_status: string;
  recorded_at: string;
  visibility: string;
  created_at: string;
  user_id: string;
  exercise_id: string;
};

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const bearerToken = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  const token = cookieStore.get("ar_token")?.value ?? bearerToken;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try { userId = verifyToken(token).sub; } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");

  // Build feed user set: self + followed users
  const { data: following } = await supabase
    .from("pr_follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = new Set((following ?? []).map((f) => f.following_id));

  // "friends" visibility requires mutual follow — find which followed users also follow back
  let mutualFollowIds: Set<string> = new Set();
  if (followingIds.size > 0) {
    const { data: mutualFollows } = await supabase
      .from("pr_follows")
      .select("follower_id")
      .eq("following_id", userId)
      .in("follower_id", [...followingIds]);
    mutualFollowIds = new Set((mutualFollows ?? []).map((f) => f.follower_id));
  }

  // Self + mutual follows can see each other's 'friends' posts
  const friendFeedIds = [userId, ...mutualFollowIds];

  // Call the get_feed SQL function which uses DISTINCT ON to return only the
  // personal record (best value) per user+exercise, paginated by created_at.
  const { data: records, error } = await supabase.rpc("get_feed", {
    p_friend_ids: friendFeedIds,
    p_cursor: cursor ?? null,
    p_limit: PAGE_SIZE,
  }) as { data: FeedRow[] | null; error: unknown };

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const rows = records ?? [];
  if (rows.length === 0) return NextResponse.json({ items: [], nextCursor: null });

  // Batch-fetch user info and exercise info
  const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))];
  const uniqueExIds = [...new Set(rows.map((r) => r.exercise_id))];

  const [{ data: usernames }, { data: users }, { data: exercises }, { data: schools }] = await Promise.all([
    supabase.from("pr_usernames").select("user_id, username, display_name, avatar_url").in("user_id", uniqueUserIds),
    supabase.from("pr_users").select("id, avatar_url").in("id", uniqueUserIds),
    supabase.from("pr_exercises").select("id, name, category, default_unit, direction").in("id", uniqueExIds),
    supabase.from("pr_user_schools").select("user_id, pr_schools(id, name)").in("user_id", uniqueUserIds),
  ]);

  const unMap = new Map((usernames ?? []).map((u) => [u.user_id, u]));
  const uuMap = new Map((users ?? []).map((u) => [u.id, u]));
  const exMap = new Map((exercises ?? []).map((e) => [e.id, e]));

  type SchRow = { user_id: string; pr_schools: { id: string; name: string } | { id: string; name: string }[] | null };
  const scMap = new Map<string, string | null>();
  for (const s of (schools ?? []) as SchRow[]) {
    const sch = Array.isArray(s.pr_schools) ? s.pr_schools[0] : s.pr_schools;
    scMap.set(s.user_id, sch?.name ?? null);
  }

  const items = rows.map((r) => {
    const un = unMap.get(r.user_id);
    const uu = uuMap.get(r.user_id);
    const ex = exMap.get(r.exercise_id);
    if (!ex) return null;
    return {
      id: r.id,
      value: Number(r.value),
      unit: r.unit,
      notes: r.notes,
      mediaUrl: r.media_url ?? null,
      mediaType: r.media_type ?? null,
      verificationStatus: r.verification_status ?? "unverified",
      recordedAt: r.recorded_at,
      createdAt: r.created_at,
      isOwn: r.user_id === userId,
      isFollowing: followingIds.has(r.user_id),
      user: {
        username: un?.username ?? null,
        displayName: un?.display_name ?? null,
        avatarUrl: un?.avatar_url ?? uu?.avatar_url ?? null,
        schoolName: scMap.get(r.user_id) ?? null,
      },
      exercise: {
        id: ex.id,
        name: ex.name,
        category: ex.category,
        defaultUnit: ex.default_unit,
        direction: ex.direction,
      },
    };
  }).filter(Boolean);

  const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null;
  return NextResponse.json({ items, nextCursor });
}

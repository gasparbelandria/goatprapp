import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const exerciseId = req.nextUrl.searchParams.get("exerciseId");
  const scope = req.nextUrl.searchParams.get("scope") ?? "school";
  const schoolId = req.nextUrl.searchParams.get("schoolId");

  if (!exerciseId) return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  if (scope === "school" && !schoolId) {
    return NextResponse.json({ error: "schoolId required for school scope" }, { status: 400 });
  }

  const { data: exercise } = await supabase
    .from("pr_exercises")
    .select("id, name, default_unit, direction")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  let targetUserIds: string[] | null = null;

  if (scope === "school" && schoolId) {
    const { data: members } = await supabase
      .from("pr_user_schools")
      .select("user_id")
      .eq("school_id", schoolId);
    targetUserIds = (members ?? []).map((m) => m.user_id);
    if (targetUserIds.length === 0) return NextResponse.json({ exercise, rankings: [] });
  }

  if (scope === "friends") {
    const cookieStore = await cookies();
    const token = cookieStore.get("ar_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let userId: string;
    try { userId = verifyToken(token).sub; } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: following } = await supabase
      .from("pr_follows")
      .select("following_id")
      .eq("follower_id", userId);
    targetUserIds = [userId, ...(following ?? []).map((f) => f.following_id)];
  }

  let recQuery = supabase
    .from("pr_records")
    .select("user_id, value, unit, recorded_at")
    .eq("exercise_id", exerciseId)
    .eq("visibility", "public");

  if (targetUserIds) recQuery = recQuery.in("user_id", targetUserIds);

  const { data: records, error } = await recQuery;
  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Best per user
  const bestMap = new Map<string, { value: number; unit: string; recordedAt: string }>();
  for (const r of records ?? []) {
    const val = Number(r.value);
    const current = bestMap.get(r.user_id);
    if (!current) {
      bestMap.set(r.user_id, { value: val, unit: r.unit, recordedAt: r.recorded_at });
    } else if (exercise.direction === "higher" && val > current.value) {
      bestMap.set(r.user_id, { value: val, unit: r.unit, recordedAt: r.recorded_at });
    } else if (exercise.direction === "lower" && val < current.value) {
      bestMap.set(r.user_id, { value: val, unit: r.unit, recordedAt: r.recorded_at });
    }
  }

  if (bestMap.size === 0) return NextResponse.json({ exercise, rankings: [] });

  const userIds = [...bestMap.keys()];

  // Fetch user info in one query
  const [{ data: usernames }, { data: users }] = await Promise.all([
    supabase.from("pr_usernames").select("user_id, username, display_name").in("user_id", userIds),
    supabase.from("pr_users").select("id, avatar_url").in("id", userIds),
  ]);

  const usernameMap = new Map((usernames ?? []).map((u) => [u.user_id, u]));
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  // Optionally fetch school info
  const { data: schoolRows } = await supabase
    .from("pr_user_schools")
    .select("user_id, pr_schools(id, name, city, state)")
    .in("user_id", userIds);

  type SchRow = { user_id: string; pr_schools: { id: string; name: string; city: string | null; state: string } | { id: string; name: string; city: string | null; state: string }[] | null };
  const schoolMap = new Map<string, { id: string; name: string; city: string | null; state: string } | null>();
  for (const s of (schoolRows ?? []) as SchRow[]) {
    const sch = Array.isArray(s.pr_schools) ? s.pr_schools[0] : s.pr_schools;
    schoolMap.set(s.user_id, sch ?? null);
  }

  // Sort
  const sorted = [...bestMap.entries()].sort(([, a], [, b]) =>
    exercise.direction === "higher" ? b.value - a.value : a.value - b.value
  );

  const rankings = sorted.map(([userId, best], i) => {
    const un = usernameMap.get(userId);
    const uu = userMap.get(userId);
    const sch = schoolMap.get(userId) ?? null;
    return {
      rank: i + 1,
      username: un?.username ?? "",
      displayName: un?.display_name ?? "Unknown",
      avatarUrl: uu?.avatar_url ?? null,
      school: sch,
      bestValue: best.value,
      unit: best.unit,
      recordedAt: best.recordedAt,
    };
  }).filter((r) => r.username);

  return NextResponse.json({
    exercise: { id: exercise.id, name: exercise.name, defaultUnit: exercise.default_unit, direction: exercise.direction },
    rankings,
  });
}

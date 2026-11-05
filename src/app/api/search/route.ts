import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });

  const like = `%${q}%`;

  // Fan out searches in parallel across all searchable dimensions
  const [
    { data: matchedUsernames },
    { data: matchedProfiles },
    { data: matchedSchools },
    { data: matchedExercises },
  ] = await Promise.all([
    supabase
      .from("pr_usernames")
      .select("user_id")
      .or(`username.ilike.${like},display_name.ilike.${like}`)
      .limit(50),
    supabase
      .from("pr_profiles")
      .select("user_id")
      .or(`city.ilike.${like},state.ilike.${like}`)
      .limit(50),
    supabase
      .from("pr_schools")
      .select("id")
      .ilike("name", like)
      .limit(20),
    supabase
      .from("pr_exercises")
      .select("id")
      .ilike("name", like)
      .limit(20),
  ]);

  // Resolve school → user_ids
  const schoolIds = (matchedSchools ?? []).map((s) => s.id);
  const { data: schoolUsers } = schoolIds.length > 0
    ? await supabase.from("pr_user_schools").select("user_id").in("school_id", schoolIds).limit(100)
    : { data: [] };

  // Build deduped user_id and exercise_id sets
  const userIdSet = new Set<string>([
    ...(matchedUsernames ?? []).map((u) => u.user_id),
    ...(matchedProfiles ?? []).map((p) => p.user_id),
    ...(schoolUsers ?? []).map((u) => u.user_id),
  ]);
  const exerciseIdSet = new Set<string>((matchedExercises ?? []).map((e) => e.id));

  if (userIdSet.size === 0 && exerciseIdSet.size === 0) {
    return NextResponse.json({ items: [] });
  }

  // Build OR filter for records
  const orParts: string[] = [];
  if (userIdSet.size > 0) orParts.push(`user_id.in.(${[...userIdSet].join(",")})`);
  if (exerciseIdSet.size > 0) orParts.push(`exercise_id.in.(${[...exerciseIdSet].join(",")})`);

  const { data: records } = await supabase
    .from("pr_records")
    .select("id, value, unit, media_url, media_type, recorded_at, user_id, exercise_id")
    .eq("visibility", "public")
    .or(orParts.join(","))
    .order("recorded_at", { ascending: false })
    .limit(60);

  if (!records || records.length === 0) return NextResponse.json({ items: [] });

  // Batch-fetch user and exercise details
  const uniqueUserIds = [...new Set(records.map((r) => r.user_id))];
  const uniqueExIds = [...new Set(records.map((r) => r.exercise_id))];

  const [{ data: usernames }, { data: users }, { data: exercises }] = await Promise.all([
    supabase.from("pr_usernames").select("user_id, username, display_name").in("user_id", uniqueUserIds),
    supabase.from("pr_users").select("id, avatar_url").in("id", uniqueUserIds),
    supabase.from("pr_exercises").select("id, name, category").in("id", uniqueExIds),
  ]);

  const unMap = new Map((usernames ?? []).map((u) => [u.user_id, u]));
  const uuMap = new Map((users ?? []).map((u) => [u.id, u]));
  const exMap = new Map((exercises ?? []).map((e) => [e.id, e]));

  const items = records.map((r) => {
    const un = unMap.get(r.user_id);
    const uu = uuMap.get(r.user_id);
    const ex = exMap.get(r.exercise_id);
    return {
      id: r.id,
      value: r.value,
      unit: r.unit,
      mediaUrl: r.media_url ?? null,
      mediaType: r.media_type ?? null,
      recordedAt: r.recorded_at,
      user: {
        username: un?.username ?? "unknown",
        displayName: un?.display_name ?? null,
        avatarUrl: uu?.avatar_url ?? null,
      },
      exercise: {
        name: ex?.name ?? "Unknown",
        category: ex?.category ?? "other",
      },
    };
  });

  return NextResponse.json({ items });
}

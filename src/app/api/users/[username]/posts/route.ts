import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const clean = username.replace(/^@/, "").toLowerCase();
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10));
  const exerciseId = req.nextUrl.searchParams.get("exerciseId");

  const { data: usernameRow } = await supabase
    .from("pr_usernames")
    .select("user_id")
    .eq("username", clean)
    .maybeSingle();

  if (!usernameRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Determine visibility
  const cookieStore = await cookies();
  const token = cookieStore.get("ar_token")?.value;
  let viewerId: string | null = null;
  if (token) {
    try { viewerId = verifyToken(token).sub; } catch { /* anon */ }
  }

  let visFilter: string[];
  if (viewerId === usernameRow.user_id) {
    visFilter = ["public", "friends", "private"];
  } else if (viewerId) {
    const { data: follow } = await supabase
      .from("pr_follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", usernameRow.user_id)
      .maybeSingle();
    visFilter = follow ? ["public", "friends"] : ["public"];
  } else {
    visFilter = ["public"];
  }

  let query = supabase
    .from("pr_records")
    .select(`id, value, unit, notes, recorded_at, visibility, created_at, pr_exercises(id, name, normalized_name, category, default_unit, direction)`)
    .eq("user_id", usernameRow.user_id)
    .in("visibility", visFilter)
    .order("recorded_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (exerciseId) {
    query = query.eq("exercise_id", exerciseId);
  }

  const { data: records, error } = await query;
  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  type ExRow = { id: string; name: string; normalized_name: string; category: string; default_unit: string; direction: string };
  type RecRow = { id: string; value: unknown; unit: string; notes: string | null; recorded_at: string; visibility: string; created_at: string; pr_exercises: ExRow | null };

  const rows = (records ?? []) as unknown as RecRow[];

  const result = rows.map((r) => {
    const ex = r.pr_exercises;
    return {
      id: r.id,
      value: Number(r.value),
      unit: r.unit,
      notes: r.notes,
      recordedAt: r.recorded_at,
      visibility: r.visibility,
      createdAt: r.created_at,
      exercise: ex
        ? { id: ex.id, name: ex.name, normalizedName: ex.normalized_name, category: ex.category, defaultUnit: ex.default_unit, direction: ex.direction }
        : null,
    };
  });

  return NextResponse.json({ records: result, hasMore: rows.length === PAGE_SIZE });
}

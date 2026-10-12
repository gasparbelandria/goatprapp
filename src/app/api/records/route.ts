import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ar_token")?.value;
  if (!token) return null;
  try { return verifyToken(token).sub; } catch { return null; }
}

const postSchema = z.object({
  exerciseId: z.string().uuid(),
  value: z.number().positive().finite(),
  unit: z.string().min(1).max(20),
  notes: z.string().max(500).optional(),
  mediaUrl: z.string().url().max(2048).optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  visibility: z.enum(["public", "friends", "private"]).default("friends"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`records:${ip}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) },
    });
  }

  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { exerciseId, value, unit, notes, mediaUrl, mediaType, recordedAt, visibility } = parsed.data;

  const { data: exercise } = await supabase
    .from("pr_exercises")
    .select("id, name, default_unit, direction")
    .eq("id", exerciseId)
    .eq("status", "active")
    .maybeSingle();

  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const { data: record, error } = await supabase
    .from("pr_records")
    .insert({
      user_id: userId,
      exercise_id: exerciseId,
      value,
      unit,
      notes: notes ?? null,
      media_url: mediaUrl ?? null,
      media_type: mediaType ?? null,
      recorded_at: recordedAt ?? new Date().toISOString().slice(0, 10),
      visibility,
    })
    .select("id, value, unit, notes, media_url, media_type, verification_status, recorded_at, visibility, created_at")
    .single();

  if (error || !record) {
    void logServerError("pr_records insert error", { message: error?.message, section: "records" });
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }

  return NextResponse.json({
    id: record.id,
    exerciseId,
    exerciseName: exercise.name,
    value: Number(record.value),
    unit: record.unit,
    notes: record.notes,
    mediaUrl: record.media_url ?? null,
    mediaType: record.media_type ?? null,
    verificationStatus: record.verification_status ?? "unverified",
    recordedAt: record.recorded_at,
    visibility: record.visibility,
    createdAt: record.created_at,
  }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const { data: usernameRow } = await supabase
    .from("pr_usernames")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (!usernameRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Determine visibility based on viewer
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

  const { data: records, error } = await supabase
    .from("pr_records")
    .select(`id, value, unit, notes, media_url, media_type, verification_status, recorded_at, visibility, created_at, pr_exercises(id, name, normalized_name, category, default_unit, direction)`)
    .eq("user_id", usernameRow.user_id)
    .in("visibility", visFilter)
    .order("recorded_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  type ExRow = { id: string; name: string; normalized_name: string; category: string; default_unit: string; direction: string };
  type RecRow = { id: string; value: unknown; unit: string; notes: string | null; media_url: string | null; media_type: string | null; verification_status: string | null; recorded_at: string; visibility: string; created_at: string; pr_exercises: ExRow | null };
  const rows = (records ?? []) as unknown as RecRow[];

  const all = rows
    .filter((r) => r.pr_exercises != null)
    .map((r) => {
      const ex = r.pr_exercises!;
      return {
        id: r.id,
        value: Number(r.value),
        unit: r.unit,
        notes: r.notes,
        mediaUrl: r.media_url ?? null,
        mediaType: r.media_type ?? null,
        verificationStatus: r.verification_status ?? "unverified",
        recordedAt: r.recorded_at,
        visibility: r.visibility,
        createdAt: r.created_at,
        exercise: {
          id: ex.id,
          name: ex.name,
          normalizedName: ex.normalized_name,
          category: ex.category,
          defaultUnit: ex.default_unit,
          direction: ex.direction,
        },
      };
    });

  return NextResponse.json({ records: all });
}

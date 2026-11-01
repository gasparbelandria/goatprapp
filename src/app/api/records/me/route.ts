import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const bearerToken = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  const cookieStore = await cookies();
  const token = bearerToken ?? cookieStore.get("ar_token")?.value ?? null;
  if (!token) return null;
  try { return verifyToken(token).sub; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: records, error } = await supabase
    .from("pr_records")
    .select(`id, value, unit, notes, verification_status, recorded_at, visibility, created_at, pr_exercises(id, name, category, default_unit, direction)`)
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  type ExRow = { id: string; name: string; category: string; default_unit: string; direction: string };
  type RecRow = { id: string; value: unknown; unit: string; notes: string | null; verification_status: string | null; recorded_at: string; visibility: string; created_at: string; pr_exercises: ExRow | null };
  const rows = (records ?? []) as unknown as RecRow[];

  const result = rows
    .filter((r) => r.pr_exercises != null)
    .map((r) => {
      const ex = r.pr_exercises!;
      return {
        id: r.id,
        value: Number(r.value),
        unit: r.unit,
        notes: r.notes,
        verificationStatus: r.verification_status ?? "unverified",
        recordedAt: r.recorded_at,
        visibility: r.visibility,
        createdAt: r.created_at,
        exercise: {
          id: ex.id,
          name: ex.name,
          category: ex.category,
          defaultUnit: ex.default_unit,
          direction: ex.direction,
        },
      };
    });

  return NextResponse.json(result);
}

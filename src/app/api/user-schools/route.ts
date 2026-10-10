import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";
import { logServerError } from "@/lib/logger";

const schema = z.object({
  schoolId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ar_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { schoolId } = parsed.data;

  // Verify school exists
  const { data: school } = await supabase
    .from("pr_schools")
    .select("id, name")
    .eq("id", schoolId)
    .eq("status", "active")
    .maybeSingle();

  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  // Upsert membership (idempotent — if already a member, do nothing)
  const { error } = await supabase
    .from("pr_user_schools")
    .upsert({ user_id: userId, school_id: schoolId, role: "member" }, { onConflict: "user_id,school_id" });

  if (error) {
    void logServerError("pr_user_schools upsert error", { message: error.message, section: "setup" });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ schoolId, schoolName: school.name });
}

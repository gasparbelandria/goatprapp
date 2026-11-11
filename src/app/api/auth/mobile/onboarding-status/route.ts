import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { sub: string };
  try { payload = verifyToken(bearer); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: usernameRow }, { data: schoolRow }] = await Promise.all([
    supabase.from("pr_usernames").select("username").eq("user_id", payload.sub).maybeSingle(),
    supabase.from("pr_user_schools").select("school_id").eq("user_id", payload.sub).maybeSingle(),
  ]);

  const needsOnboarding = !usernameRow?.username || !schoolRow;

  return NextResponse.json({ needsOnboarding });
}

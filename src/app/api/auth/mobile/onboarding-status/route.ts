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

  const [{ data: usernameRow }, { data: schoolRow }, { data: userData }] = await Promise.all([
    supabase.from("pr_usernames").select("username").eq("user_id", payload.sub).maybeSingle(),
    supabase.from("pr_user_schools").select("school_id").eq("user_id", payload.sub).maybeSingle(),
    supabase.from("pr_users").select("birth_date").eq("id", payload.sub).maybeSingle(),
  ]);

  const needsOnboarding = !usernameRow?.username || !schoolRow || !(userData as any)?.birth_date;

  return NextResponse.json({ needsOnboarding });
}

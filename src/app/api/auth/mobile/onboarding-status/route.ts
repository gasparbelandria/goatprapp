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

  const [{ data: userRow }, { data: usernameRow }, { data: schoolRow }] = await Promise.all([
    supabase.from("pr_users").select("id").eq("id", payload.sub).maybeSingle(),
    supabase.from("pr_usernames").select("username, display_name").eq("user_id", payload.sub).maybeSingle(),
    supabase.from("pr_user_schools").select("school_id").eq("user_id", payload.sub).maybeSingle(),
  ]);

  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const needsOnboarding = !usernameRow?.username || !schoolRow;

  return NextResponse.json({
    needsOnboarding,
    username: usernameRow?.username ?? null,
    displayName: usernameRow?.display_name ?? null,
  });
}

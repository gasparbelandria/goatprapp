import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifyToken, signToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";

const RESERVED = new Set([
  "admin", "api", "feed", "rankings", "create", "setup", "login", "signup",
  "logout", "me", "about", "support", "help", "terms", "privacy", "goatpr",
  "goat", "null", "undefined", "root", "system", "mod", "moderator",
  "profile", "settings", "geo",
]);

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const schema = z.object({
  username: z
    .string()
    .min(3).max(20)
    .regex(USERNAME_RE, "Only lowercase letters, numbers and underscores")
    .refine((v) => !/^\d+$/.test(v), "Username cannot be entirely numeric")
    .refine((v) => !/^_/.test(v), "Username cannot start with an underscore"),
  displayName: z.string().min(1).max(50).trim(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  schoolId: z.string().uuid("Invalid school"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`onboarding:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { sub: string; role: 'user' | 'admin' };
  try { payload = verifyToken(bearer); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { username, displayName, birthDate, schoolId } = parsed.data;
  const handle = username.toLowerCase();

  // Validate age >= 13
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 13) {
    return NextResponse.json({ error: "You must be at least 13 years old to use GoatPR." }, { status: 400 });
  }
  if (age > 100) {
    return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
  }

  // Check username not reserved
  if (RESERVED.has(handle)) {
    return NextResponse.json({ error: "Username not available." }, { status: 409 });
  }

  // Check username not taken (allow re-use of own username)
  const { data: taken } = await supabase
    .from("pr_usernames")
    .select("username, user_id")
    .eq("username", handle)
    .maybeSingle();
  if (taken && taken.user_id !== payload.sub) {
    return NextResponse.json({ error: "Username taken." }, { status: 409 });
  }

  // Check school exists
  const { data: school } = await supabase
    .from("pr_schools")
    .select("id, city, state")
    .eq("id", schoolId)
    .eq("status", "active")
    .maybeSingle();
  if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 });

  // 1. Username — skip insert if user already owns one (idempotent)
  const { data: existing } = await supabase
    .from("pr_usernames")
    .select("username")
    .eq("user_id", payload.sub)
    .maybeSingle();

  const finalUsername = existing?.username ?? handle;

  if (!existing) {
    const { error: unErr } = await supabase
      .from("pr_usernames")
      .insert({ user_id: payload.sub, username: handle, display_name: displayName });
    if (unErr) {
      if (unErr.code === "23505") return NextResponse.json({ error: "Username taken." }, { status: 409 });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  } else {
    await supabase
      .from("pr_usernames")
      .update({ display_name: displayName })
      .eq("user_id", payload.sub);
  }

  // 2. Update pr_users: birth_date + display_name (always)
  await supabase
    .from("pr_users")
    .update({ birth_date: birthDate, display_name: displayName })
    .eq("id", payload.sub);

  // 3. Save school — delete existing then insert (avoids upsert constraint issues)
  await supabase.from("pr_user_schools").delete().eq("user_id", payload.sub);
  const { error: schoolErr } = await supabase
    .from("pr_user_schools")
    .insert({ user_id: payload.sub, school_id: schoolId });
  if (schoolErr) {
    return NextResponse.json({ error: "Failed to save school. Please try again." }, { status: 500 });
  }

  // 4. Upsert pr_profiles with school's city/state (creates entry for edit-profile pre-population)
  await supabase
    .from("pr_profiles")
    .upsert(
      { user_id: payload.sub, city: school.city ?? null, state: school.state ?? null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  // 4. Issue new JWT
  const newToken = signToken({ sub: payload.sub, username: finalUsername, role: payload.role ?? "user" });

  return NextResponse.json({ token: newToken, username: finalUsername, displayName });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifyToken, signToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";
import { logServerError } from "@/lib/logger";

const RESERVED = new Set([
  "admin", "api", "feed", "rankings", "create", "setup", "login", "signup",
  "logout", "me", "about", "support", "help", "terms", "privacy", "goatpr",
  "goat", "null", "undefined", "root", "system", "mod", "moderator",
  "profile", "settings", "geo",
]);

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const DANGEROUS_RE = /[<>"'`;(){}[\]\\\/\x00-\x1f\x7f]/;

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Maximum 20 characters")
    .regex(USERNAME_RE, "Only lowercase letters, numbers and underscores")
    .refine((v) => !DANGEROUS_RE.test(v), "Invalid characters")
    .refine((v) => !/^\d+$/.test(v), "Username cannot be entirely numeric")
    .refine((v) => !/^_/.test(v), "Username cannot start with an underscore")
    .refine((v) => /^[\x20-\x7e]+$/.test(v), "Non-ASCII characters not allowed"),
  displayName: z.string().min(1, "Display name required").max(50).trim(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`username_change:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) },
    });
  }

  const token = req.cookies.get("ar_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors;
    const msg = Object.values(firstError).flat()[0] ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { username, displayName } = parsed.data;
  const handle = username.toLowerCase();

  // Fetch current username for this user
  const { data: current } = await supabase
    .from("pr_usernames")
    .select("username")
    .eq("user_id", payload.sub)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const usernameChanged = current.username !== handle;

  if (usernameChanged) {
    if (RESERVED.has(handle)) {
      return NextResponse.json({ error: "Username not available" }, { status: 409 });
    }

    // Check availability before attempting update
    const { data: taken } = await supabase
      .from("pr_usernames")
      .select("username")
      .eq("username", handle)
      .maybeSingle();

    if (taken) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
  }

  // Update username and display_name (UNIQUE constraint on username catches races)
  const { error } = await supabase
    .from("pr_usernames")
    .update({ username: handle, display_name: displayName })
    .eq("user_id", payload.sub);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    void logServerError("pr_usernames update error", { message: error.message, section: "username-change" });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Reissue JWT with updated username so middleware stays in sync
  if (usernameChanged) {
    const newToken = signToken({
      sub: payload.sub,
      username: handle,
      role: payload.role,
    });
    const cookieStore = await cookies();
    cookieStore.set("ar_token", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return NextResponse.json({ username: handle, displayName });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { signToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID ?? "",          // AuraRank web client
  process.env.GOOGLE_CLIENT_ID_MOBILE ?? "",   // Firebase web client (fallback)
  process.env.GOOGLE_CLIENT_ID_ANDROID ?? "",  // AuraRank Android client
  process.env.GOOGLE_CLIENT_ID_SIGNIN ?? "",   // AuraRank native sign-in client
].filter(Boolean);

const schema = z.object({
  accessToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`auth-mobile:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) },
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { accessToken } = parsed.data;

  const [tokenInfo, userInfo] = await Promise.all([
    fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`).then((r) => r.json()),
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json()),
  ]);

  if (tokenInfo.error) {
    console.log("[auth/mobile] tokeninfo error:", tokenInfo.error, tokenInfo.error_description);
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Accept tokens from any of our registered Google OAuth clients
  console.log("[auth/mobile] token aud:", tokenInfo.aud, "| allowed:", ALLOWED_CLIENT_IDS);
  if (ALLOWED_CLIENT_IDS.length > 0 && !ALLOWED_CLIENT_IDS.includes(tokenInfo.aud)) {
    console.log("[auth/mobile] audience rejected");
    return NextResponse.json({ error: "Invalid token audience" }, { status: 400 });
  }

  const providerUserId = userInfo.sub;
  const email = userInfo.email;
  const displayName = userInfo.name ?? null;
  const avatarUrl = userInfo.picture ?? null;

  if (!providerUserId || !email) {
    return NextResponse.json({ error: "Could not retrieve user info" }, { status: 400 });
  }

  const { data: existingUser } = await supabase
    .from("pr_users")
    .select("id, role")
    .eq("provider", "google")
    .eq("provider_user_id", providerUserId)
    .maybeSingle();

  let user: { id: string; role: string } | null = null;

  if (existingUser) {
    const { data, error } = await supabase
      .from("pr_users")
      .update({ email, display_name: displayName, active: true, last_seen_at: new Date().toISOString() })
      .eq("id", existingUser.id)
      .select("id, role")
      .single();
    if (error || !data) return NextResponse.json({ error: "Server error" }, { status: 500 });
    user = data;
  } else {
    const { data, error } = await supabase
      .from("pr_users")
      .insert({ provider: "google", provider_user_id: providerUserId, email, display_name: displayName, avatar_url: avatarUrl, active: true })
      .select("id, role")
      .single();
    if (error || !data) return NextResponse.json({ error: "Server error" }, { status: 500 });
    user = data;
  }

  const { data: usernameRow } = await supabase
    .from("pr_usernames")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  const username = usernameRow?.username ?? null;

  const token = signToken({
    sub: user.id,
    username,
    role: (user.role as "user" | "admin") ?? "user",
  });

  // Return JWT in body — mobile clients can't use HTTP-only cookies
  return NextResponse.json({
    token,
    userId: user.id,
    username,
    role: user.role,
    isNewUser: !username,
  });
}

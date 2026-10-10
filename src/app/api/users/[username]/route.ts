import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const clean = username.replace(/^@/, "").toLowerCase();

  const { data: usernameRow } = await supabase
    .from("pr_usernames")
    .select("username, display_name, user_id, claimed_at")
    .eq("username", clean)
    .maybeSingle();

  if (!usernameRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [
    { data: user },
    { data: profile },
    { data: userSchool },
    { count: followersCount },
    { count: followingCount },
    { count: recordCount },
  ] = await Promise.all([
    supabase
      .from("pr_users")
      .select("avatar_url")
      .eq("id", usernameRow.user_id)
      .single(),
    supabase
      .from("pr_profiles")
      .select("bio, city, state")
      .eq("user_id", usernameRow.user_id)
      .maybeSingle(),
    supabase
      .from("pr_user_schools")
      .select("pr_schools(id, name, city, state, postal_code, school_type, verified_status)")
      .eq("user_id", usernameRow.user_id)
      .maybeSingle(),
    supabase
      .from("pr_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", usernameRow.user_id),
    supabase
      .from("pr_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", usernameRow.user_id),
    supabase
      .from("pr_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", usernameRow.user_id),
  ]);

  type SchoolRow = {
    id: string; name: string; city: string | null; state: string;
    postal_code: string | null; school_type: string | null; verified_status: string;
  };
  const rawSchool = userSchool?.pr_schools;
  const school = (Array.isArray(rawSchool) ? rawSchool[0] : rawSchool) as SchoolRow | null ?? null;

  return NextResponse.json({
    id: usernameRow.user_id,
    username: usernameRow.username,
    displayName: usernameRow.display_name,
    avatarUrl: user?.avatar_url ?? null,
    bio: profile?.bio ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    school: school
      ? {
          id: school.id,
          name: school.name,
          city: school.city,
          state: school.state,
          postalCode: school.postal_code,
          schoolType: school.school_type,
          verifiedStatus: school.verified_status,
        }
      : null,
    recordCount: recordCount ?? 0,
    followersCount: followersCount ?? 0,
    followingCount: followingCount ?? 0,
    joinedAt: usernameRow.claimed_at,
  });
}

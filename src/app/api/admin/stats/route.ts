import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

function groupByDay(rows: { created_at: string }[], days: number) {
  const map: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (key in map) map[key]++;
  }
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const days = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30")));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000);

  const [
    { count: totalUsers },
    { count: totalRecords },
    { count: totalFollows },
    { data: recentUsers },
    { data: recentRecords },
    { count: unresolvedErrors },
  ] = await Promise.all([
    supabase.from("pr_users").select("*", { count: "exact", head: true }),
    supabase.from("pr_records").select("*", { count: "exact", head: true }),
    supabase.from("pr_follows").select("*", { count: "exact", head: true }),
    supabase.from("pr_users").select("id, created_at").gte("created_at", since).order("created_at", { ascending: true }),
    supabase.from("pr_records").select("id, user_id, created_at").gte("created_at", since).order("created_at", { ascending: true }),
    supabase.from("pr_error_logs").select("*", { count: "exact", head: true }).eq("resolved", false),
  ]);

  const usersByDay = groupByDay(recentUsers ?? [], days);
  const postsByDay = groupByDay(recentRecords ?? [], days);

  const usersToday = (recentUsers ?? []).filter((u) => new Date(u.created_at) >= todayStart).length;
  const usersThisWeek = (recentUsers ?? []).filter((u) => new Date(u.created_at) >= weekStart).length;
  const postsToday = (recentRecords ?? []).filter((p) => new Date(p.created_at) >= todayStart).length;
  const postsThisWeek = (recentRecords ?? []).filter((p) => new Date(p.created_at) >= weekStart).length;
  const activeUsers = new Set((recentRecords ?? []).filter((p) => new Date(p.created_at) >= weekStart).map((p) => p.user_id)).size;

  return NextResponse.json({
    stats: {
      totalUsers: totalUsers ?? 0,
      totalPosts: totalRecords ?? 0,
      totalRatings: 0,
      totalFollows: totalFollows ?? 0,
      avgAura: 0,
      avgRatingsPerPost: 0,
      usersToday,
      usersThisWeek,
      postsToday,
      postsThisWeek,
      activeUsers,
      unresolvedErrors: unresolvedErrors ?? 0,
    },
    charts: { usersByDay, postsByDay },
    categories: {},
    mediaTypes: {},
  });
}

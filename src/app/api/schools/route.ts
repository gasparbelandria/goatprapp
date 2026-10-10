import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";

  let query = supabase
    .from("pr_schools")
    .select("id, name, city, state, postal_code, school_type, verified_status")
    .eq("status", "active")
    .order("name")
    .limit(50);

  if (q.length >= 2) {
    query = query.ilike("normalized_name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const schools = (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city ?? null,
    state: s.state,
    postalCode: s.postal_code ?? null,
    schoolType: s.school_type ?? null,
    verifiedStatus: s.verified_status,
  }));

  return NextResponse.json({ schools });
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const q = raw.toLowerCase();

  let query = supabase
    .from("pr_schools")
    .select("id, name, city, state, postal_code, school_type, verified_status")
    .eq("status", "active")
    .order("name")
    .limit(20);

  if (q.length >= 2) {
    const isZip   = /^\d{3,5}$/.test(q);
    const isState = /^[a-z]{2}$/.test(q);

    if (isZip) {
      // ZIP or partial ZIP → match postal_code prefix
      query = query.ilike("postal_code", `${q}%`);
    } else if (isState) {
      // Two-letter state abbreviation → exact state filter
      query = query.eq("state", q.toUpperCase());
    } else {
      // General: search name OR city simultaneously
      query = query.or(
        `normalized_name.ilike.%${q}%,city.ilike.%${q}%`
      );
    }
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

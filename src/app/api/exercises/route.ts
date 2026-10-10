import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("pr_exercises")
    .select("id, name, normalized_name, category, default_unit, direction, description, is_custom, status")
    .eq("status", "active")
    .order("category")
    .order("name");

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const exercises = (data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    normalizedName: e.normalized_name,
    category: e.category,
    defaultUnit: e.default_unit,
    direction: e.direction,
    description: e.description ?? null,
    isCustom: e.is_custom,
    status: e.status,
  }));

  return NextResponse.json({ exercises });
}

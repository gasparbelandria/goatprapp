import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";
import { logServerError } from "@/lib/logger";

async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ar_token")?.value;
  if (!token) return null;
  try { return verifyToken(token).sub; } catch { return null; }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership before deleting
  const { data: record } = await supabase
    .from("pr_records")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (record.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("pr_records").delete().eq("id", id);
  if (error) {
    void logServerError("pr_records delete error", { message: error.message, section: "records" });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

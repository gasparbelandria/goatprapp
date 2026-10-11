import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Vercel injects x-vercel-ip-country-region with the ISO 3166-2 subdivision code (e.g. "MA", "CA")
export async function GET(req: NextRequest) {
  const region = req.headers.get("x-vercel-ip-country-region");
  const country = req.headers.get("x-vercel-ip-country");

  // Only return a state for US IPs
  if (!region || country !== "US") {
    return NextResponse.json({ state: null });
  }

  return NextResponse.json({ state: region });
}

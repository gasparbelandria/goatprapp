import { NextResponse } from "next/server";

export const GET = () => NextResponse.json({ error: "Gone" }, { status: 410 });

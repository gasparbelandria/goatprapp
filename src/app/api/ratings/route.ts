import { NextResponse } from "next/server";

export const POST = () => NextResponse.json({ error: "Gone" }, { status: 410 });

import { NextResponse } from "next/server";

export const PATCH = () => NextResponse.json({ error: "Gone" }, { status: 410 });

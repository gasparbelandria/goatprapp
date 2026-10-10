import { NextResponse } from "next/server";

const gone = () => NextResponse.json({ error: "Gone" }, { status: 410 });
export const GET = gone;
export const DELETE = gone;

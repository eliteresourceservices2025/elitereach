import { NextRequest, NextResponse } from "next/server";
import { generateSubjects, SequenzyError } from "@/lib/sequenzy";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  try {
    const subjects = await generateSubjects(body.topic, body.count);
    return NextResponse.json({ subjects });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to generate subject lines" }, { status: 500 });
  }
}

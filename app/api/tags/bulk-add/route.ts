import { NextRequest, NextResponse } from "next/server";
import { bulkAddTag, SequenzyError } from "@/lib/sequenzy";

export async function POST(request: NextRequest) {
  const { emails, tag } = await request.json().catch(() => ({}));
  if (!Array.isArray(emails) || emails.length === 0 || !tag) {
    return NextResponse.json({ error: "emails[] and tag are required" }, { status: 400 });
  }
  try {
    await bulkAddTag(emails, tag);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to bulk add tag" }, { status: 500 });
  }
}

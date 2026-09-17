import { NextRequest, NextResponse } from "next/server";
import { enrollInSequence, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { emails } = await request.json().catch(() => ({ emails: [] }));
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails[] is required" }, { status: 400 });
  }
  try {
    const result = await enrollInSequence(id, emails);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to enroll contacts" }, { status: 500 });
  }
}

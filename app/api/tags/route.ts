import { NextRequest, NextResponse } from "next/server";
import { createTag, listTags, SequenzyError } from "@/lib/sequenzy";

export async function GET() {
  try {
    const result = await listTags();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  try {
    const tag = await createTag({ name: body.name, color: body.color });
    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

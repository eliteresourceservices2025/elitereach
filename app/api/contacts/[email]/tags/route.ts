import { NextRequest, NextResponse } from "next/server";
import { addTagToSubscriber, removeTagFromSubscriber, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ email: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { email } = await params;
  const { tag } = await request.json().catch(() => ({ tag: null }));
  if (!tag) return NextResponse.json({ error: "Tag is required" }, { status: 400 });
  try {
    await addTagToSubscriber(decodeURIComponent(email), tag);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to add tag" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { email } = await params;
  const { tag } = await request.json().catch(() => ({ tag: null }));
  if (!tag) return NextResponse.json({ error: "Tag is required" }, { status: 400 });
  try {
    await removeTagFromSubscriber(decodeURIComponent(email), tag);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 });
  }
}

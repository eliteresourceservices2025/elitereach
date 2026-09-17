import { NextRequest, NextResponse } from "next/server";
import { deleteTag, SequenzyError, TAG_COLORS, updateTag, type TagColor } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!TAG_COLORS.includes(body.color)) {
    return NextResponse.json({ error: `color must be one of: ${TAG_COLORS.join(", ")}` }, { status: 400 });
  }
  try {
    const tag = await updateTag(id, { color: body.color as TagColor });
    return NextResponse.json(tag);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteTag(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}

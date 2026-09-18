import { NextRequest, NextResponse } from "next/server";
import { deleteSequence, getSequence, updateSequenceLabels, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const sequence = await getSequence(id);
    return NextResponse.json(sequence);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load sequence" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { labels?: string[] } | null;
  if (!Array.isArray(body?.labels)) return NextResponse.json({ error: "labels[] is required" }, { status: 400 });
  try {
    const sequence = await updateSequenceLabels(id, body.labels);
    return NextResponse.json(sequence);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update labels" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteSequence(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to delete sequence" }, { status: 500 });
  }
}

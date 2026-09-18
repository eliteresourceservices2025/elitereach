import { NextRequest, NextResponse } from "next/server";
import { deleteSequenceGoal, updateSequenceGoal, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string; goalId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, goalId } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const goal = await updateSequenceGoal(id, goalId, body);
    return NextResponse.json(goal);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, goalId } = await params;
  try {
    await deleteSequenceGoal(id, goalId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}

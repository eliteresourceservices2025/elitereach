import { NextRequest, NextResponse } from "next/server";
import { createSequenceGoal, listSequenceGoals, SequenzyError, type CreateGoalInput } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const goals = await listSequenceGoals(id);
    return NextResponse.json({ goals });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<CreateGoalInput> | null;
  if (!body?.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (body.triggerType === "event" && !body.triggerEventName?.trim()) {
    return NextResponse.json({ error: "triggerEventName is required for event goals" }, { status: 400 });
  }
  if (body.triggerType === "tag_added" && !body.triggerTagName?.trim()) {
    return NextResponse.json({ error: "triggerTagName is required for tag goals" }, { status: 400 });
  }
  try {
    const goal = await createSequenceGoal(id, body as CreateGoalInput);
    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

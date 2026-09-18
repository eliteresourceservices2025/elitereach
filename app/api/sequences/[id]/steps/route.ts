import { NextRequest, NextResponse } from "next/server";
import { insertSequenceSteps, SequenzyError, type InsertableStep } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    afterNodeId?: string;
    step?: InsertableStep;
    confirmStructuralChange?: boolean;
  } | null;
  if (!body?.step) return NextResponse.json({ error: "step is required" }, { status: 400 });

  try {
    const sequence = await insertSequenceSteps(id, {
      afterNodeId: body.afterNodeId,
      steps: [body.step],
      confirmStructuralChange: body.confirmStructuralChange,
    });
    return NextResponse.json(sequence, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to insert step" }, { status: 500 });
  }
}

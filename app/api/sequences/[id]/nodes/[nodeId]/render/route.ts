import { NextRequest, NextResponse } from "next/server";
import { renderSequenceStep, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string; nodeId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id, nodeId } = await params;
  try {
    const result = await renderSequenceStep(id, nodeId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to render step" }, { status: 500 });
  }
}

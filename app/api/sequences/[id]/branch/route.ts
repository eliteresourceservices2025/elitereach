import { NextRequest, NextResponse } from "next/server";
import { getSequence, insertSequenceBranch, SequenzyError, type BranchCondition, type InsertableStep } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    afterNodeId?: string;
    label?: string;
    condition?: BranchCondition;
    ifSteps?: InsertableStep[];
    elseSteps?: InsertableStep[];
    confirmStructuralChange?: boolean;
  } | null;
  if (!body?.afterNodeId || !body?.condition) {
    return NextResponse.json({ error: "afterNodeId and condition are required" }, { status: 400 });
  }

  try {
    // The branch always needs a merge target so both paths reconnect to the
    // rest of the sequence — compute it from the current graph rather than
    // trusting the client, since it must match the node that follows
    // afterNodeId right now.
    const current = await getSequence(id);
    const mergeEdge = current.edges.find((e) => e.sourceNodeId === body.afterNodeId);
    if (!mergeEdge) {
      return NextResponse.json({ error: "Could not find where to reconnect this branch" }, { status: 400 });
    }

    const sequence = await insertSequenceBranch(id, {
      afterNodeId: body.afterNodeId,
      mergeTargetNodeId: mergeEdge.targetNodeId,
      label: body.label,
      condition: body.condition,
      ifSteps: body.ifSteps,
      elseSteps: body.elseSteps,
      confirmStructuralChange: body.confirmStructuralChange,
    });
    return NextResponse.json(sequence, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to insert branch" }, { status: 500 });
  }
}

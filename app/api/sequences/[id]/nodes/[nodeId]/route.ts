import { NextRequest, NextResponse } from "next/server";
import { updateSequenceNode, deleteSequenceNode, SequenzyError, type SequenceEdge } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string; nodeId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, nodeId } = await params;
  const body = (await request.json().catch(() => null)) as {
    expectedUpdatedAt?: string;
    changes?: Record<string, unknown>;
    confirmLiveChange?: boolean;
  } | null;
  if (!body?.changes) return NextResponse.json({ error: "changes is required" }, { status: 400 });

  try {
    const sequence = await updateSequenceNode(id, {
      nodeId,
      expectedUpdatedAt: body.expectedUpdatedAt,
      changes: body.changes,
      confirmLiveChange: body.confirmLiveChange,
    });
    return NextResponse.json(sequence);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, nodeId } = await params;
  const body = (await request.json().catch(() => null)) as {
    graphRevision?: string;
    edges?: SequenceEdge[];
    confirmStructuralChange?: boolean;
  } | null;
  if (!body?.graphRevision) return NextResponse.json({ error: "graphRevision is required" }, { status: 400 });

  try {
    const sequence = await deleteSequenceNode(id, {
      nodeId,
      graphRevision: body.graphRevision,
      edges: body.edges,
      confirmStructuralChange: body.confirmStructuralChange,
    });
    return NextResponse.json(sequence);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
  }
}

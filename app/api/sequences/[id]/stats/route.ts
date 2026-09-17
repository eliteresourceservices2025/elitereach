import { NextRequest, NextResponse } from "next/server";
import { getSequenceStats, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const stats = await getSequenceStats(id);
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load sequence stats" }, { status: 500 });
  }
}

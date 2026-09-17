import { NextRequest, NextResponse } from "next/server";
import { getFormEmbed, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await getFormEmbed(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load embed code" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cancelCampaign, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await cancelCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to cancel campaign" }, { status: 500 });
  }
}

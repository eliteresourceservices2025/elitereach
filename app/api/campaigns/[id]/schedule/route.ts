import { NextRequest, NextResponse } from "next/server";
import { scheduleCampaign, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { scheduledAt, sendNow } = await request.json().catch(() => ({}));

  // Sequenzy requires a future timestamp; "send now" schedules a few seconds out.
  const when = sendNow ? new Date(Date.now() + 15_000).toISOString() : scheduledAt;
  if (!when) {
    return NextResponse.json({ error: "scheduledAt or sendNow is required" }, { status: 400 });
  }

  try {
    const result = await scheduleCampaign(id, { scheduledAt: when });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to schedule campaign" }, { status: 500 });
  }
}

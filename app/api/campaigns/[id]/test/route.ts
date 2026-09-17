import { NextRequest, NextResponse } from "next/server";
import { sendCampaignTest, SequenzyError } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { emails } = await request.json().catch(() => ({ emails: [] }));
  const list: string[] = Array.isArray(emails) ? emails : [emails].filter(Boolean);
  if (list.length === 0) {
    return NextResponse.json({ error: "At least one email address is required" }, { status: 400 });
  }

  try {
    await Promise.all(list.map((to) => sendCampaignTest(id, to)));
    return NextResponse.json({ ok: true, sentTo: list });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}

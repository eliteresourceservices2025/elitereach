import { NextRequest, NextResponse } from "next/server";
import { allAudience, createCampaign, listCampaigns, SequenzyError, tagAudience, type CampaignStatus } from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const result = await listCampaigns({
      status: (searchParams.get("status") as CampaignStatus) || undefined,
      limit: Number(searchParams.get("limit") ?? "50"),
      offset: Number(searchParams.get("offset") ?? "0"),
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.subject || !body?.bodyHtml) {
    return NextResponse.json({ error: "name, subject, and bodyHtml are required" }, { status: 400 });
  }
  const html = body.wrap ? wrapBrandedEmail({ previewText: body.previewText, bodyHtml: body.bodyHtml }) : body.bodyHtml;
  const targetLists = body.audience?.type === "tag" ? tagAudience(body.audience.tag) : allAudience();

  try {
    const campaign = await createCampaign({
      name: body.name,
      subject: body.subject,
      previewText: body.previewText || undefined,
      html,
      targetLists,
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

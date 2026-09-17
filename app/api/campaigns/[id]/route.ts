import { NextRequest, NextResponse } from "next/server";
import { allAudience, deleteCampaign, getCampaign, SequenzyError, tagAudience, updateCampaign } from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";
import { getEmailBranding } from "@/lib/get-email-branding";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const campaign = await getCampaign(id);
    return NextResponse.json(campaign);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load campaign" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.subject !== undefined) update.subject = body.subject;
  if (body.previewText !== undefined) update.previewText = body.previewText;
  if (body.bodyHtml !== undefined) {
    if (body.wrap) {
      const { theme, brand } = await getEmailBranding();
      update.html = wrapBrandedEmail({ previewText: body.previewText, bodyHtml: body.bodyHtml, theme, brand });
    } else {
      update.html = body.bodyHtml;
    }
  }
  if (body.audience !== undefined) {
    update.targetLists = body.audience?.type === "tag" ? tagAudience(body.audience.tag) : allAudience();
  }

  try {
    const campaign = await updateCampaign(id, update);
    return NextResponse.json(campaign);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}

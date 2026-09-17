import { NextRequest, NextResponse } from "next/server";
import { createSequence, listSequences, SequenzyError } from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";

export async function GET() {
  try {
    const result = await listSequences();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load sequences" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !Array.isArray(body?.steps) || body.steps.length === 0) {
    return NextResponse.json({ error: "name and at least one step are required" }, { status: 400 });
  }
  if (body.trigger === "tag_added" && !body.tagName) {
    return NextResponse.json({ error: "tagName is required for the tag_added trigger" }, { status: 400 });
  }

  try {
    const sequence = await createSequence({
      name: body.name,
      trigger: body.trigger === "tag_added" ? "tag_added" : "contact_added",
      tagName: body.tagName,
      steps: body.steps.map((step: { subject: string; previewText?: string; bodyHtml: string; delayDays: number; wrap?: boolean }) => ({
        subject: step.subject,
        previewText: step.previewText,
        html: step.wrap === false ? step.bodyHtml : wrapBrandedEmail({ previewText: step.previewText, bodyHtml: step.bodyHtml }),
        delayDays: step.delayDays,
      })),
    });
    return NextResponse.json(sequence, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });
  }
}

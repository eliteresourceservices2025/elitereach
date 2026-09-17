import { NextRequest, NextResponse } from "next/server";
import { generateEmail, SequenzyError } from "@/lib/sequenzy";
import { blocksToHtml } from "@/lib/email-blocks-to-html";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  try {
    const result = await generateEmail({ prompt: body.prompt, style: body.style, tone: body.tone });
    return NextResponse.json({
      subject: result.subject,
      previewText: result.previewText,
      bodyHtml: blocksToHtml(result.blocks as { type: string }[]),
    });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 });
  }
}

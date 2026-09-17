import { NextRequest, NextResponse } from "next/server";
import { sendTransactionalEmail, SequenzyError } from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";
import { getEmailBranding } from "@/lib/get-email-branding";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const to: string[] = Array.isArray(body?.to) ? body.to.filter(Boolean) : [];
  if (to.length === 0 || !body?.subject || !body?.bodyHtml) {
    return NextResponse.json({ error: "to, subject, and bodyHtml are required" }, { status: 400 });
  }

  const { theme, brand } = body.wrap ? await getEmailBranding() : { theme: undefined, brand: undefined };
  const html = body.wrap
    ? wrapBrandedEmail({ previewText: body.previewText, bodyHtml: body.bodyHtml, theme, brand })
    : body.bodyHtml;

  try {
    const result = await sendTransactionalEmail({
      to,
      subject: body.subject,
      body: html,
      fromName: body.fromName || undefined,
      fromEmail: body.fromEmail || undefined,
      replyTo: body.replyTo || undefined,
      replyToName: body.replyToName || undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to send transactional email" }, { status: 500 });
  }
}

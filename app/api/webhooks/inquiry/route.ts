import { NextRequest, NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";
import { getEmailBranding } from "@/lib/get-email-branding";

const FIELD_LABELS: Record<string, string> = {
  companyName: "Company name",
  companyWebsite: "Company website",
  howHeard: "How did you hear about us?",
  reasonForContact: "Reason for contact",
  message: "Message",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Sequenzy posts subscriber.created events here. The URL itself carries the
// verification token, target list, and notification recipients — this app
// has no database, so that's where per-form configuration lives.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const listId = searchParams.get("listId");
  const notify = (searchParams.get("notify") ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const formName = searchParams.get("formName") ?? "your website";

  // This app has no database, so there's no server-side secret to compare
  // against. Security instead comes from the URL itself: `token` is a long
  // random value generated when the form was created and known only to us
  // and Sequenzy (the same way Zapier/IFTTT-style webhook URLs work). Anyone
  // who doesn't have this exact URL can't trigger a notification.
  if (!token || token.length < 20 || !listId || notify.length === 0) {
    return NextResponse.json({ error: "Misconfigured or missing webhook credentials" }, { status: 400 });
  }

  const event = await request.json().catch(() => null);
  if (event?.type !== "subscriber.created") {
    return NextResponse.json({ ok: true, skipped: "not a subscriber.created event" });
  }

  const data = event.data ?? {};
  if (!Array.isArray(data.list_ids) || !data.list_ids.includes(listId)) {
    return NextResponse.json({ ok: true, skipped: "not this form's list" });
  }

  const firstName: string = data.first_name ?? "";
  const lastName: string = data.last_name ?? "";
  const email: string = data.email ?? "";
  const phone: string | undefined = data.phone ?? undefined;
  const customAttributes: Record<string, unknown> = data.custom_attributes ?? {};

  const rows = [
    ["Name", `${firstName} ${lastName}`.trim() || "—"],
    ["Email", email],
    ...(phone ? [["Phone", phone]] : []),
    ...Object.entries(customAttributes)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [FIELD_LABELS[key] ?? key, String(value)]),
  ];

  const bodyHtml = `
    <h2>New inquiry from ${escapeHtml(formName)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap;"><strong>${escapeHtml(
              label
            )}</strong></td><td style="padding:6px 0;font-size:13px;">${escapeHtml(value)}</td></tr>`
        )
        .join("")}
    </table>
    <p style="margin-top:20px;font-size:13px;color:#6b7280;">Reply directly to this email to respond to ${escapeHtml(
      email
    )}.</p>
  `;

  try {
    const { theme, brand } = await getEmailBranding();
    await sendTransactionalEmail({
      to: notify,
      subject: `New inquiry: ${firstName || email}`.trim(),
      body: wrapBrandedEmail({ bodyHtml, theme, brand }),
      replyTo: email || undefined,
      replyToName: `${firstName} ${lastName}`.trim() || undefined,
    });
  } catch (err) {
    console.error("Failed to send inquiry notification", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

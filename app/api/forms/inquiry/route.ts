import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createForm,
  createList,
  createSequence,
  createTag,
  createWebhook,
  enableSequence,
  SequenzyError,
  updateForm,
  type FormBlock,
} from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";
import { getEmailBranding } from "@/lib/get-email-branding";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function selectOptions(lines: string[]): { value: string }[] {
  return lines.map((line) => ({ value: line.trim() })).filter((o) => o.value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const slug = slugify(body.name) || Date.now().toString(36);
    const tagName = `inquiry-${slug}`;

    const [list, tag] = await Promise.all([
      createList(`EliteReach inquiry form: ${body.name}`),
      createTag({ name: tagName, color: "violet" }),
    ]);

    const created = await createForm({
      name: body.name,
      listIds: [list.id],
      tagIds: [tag.id],
      headline: body.headline || "Contact Us",
      description: body.description,
      buttonText: body.buttonText || "Send Inquiry",
      successMessage: body.successMessage || "Thanks! We've received your inquiry.",
    });

    const blocks: FormBlock[] = [
      { id: "heading", kind: "heading", content: body.headline || "Contact Us", level: 2 },
      ...(body.description ? [{ id: "description", kind: "text", content: body.description } as FormBlock] : []),
      { id: "firstName", kind: "form-field", fieldType: "text", name: "firstName", label: "First name", mapsTo: "firstName", required: true, width: "half" },
      { id: "lastName", kind: "form-field", fieldType: "text", name: "lastName", label: "Last name", mapsTo: "lastName", required: true, width: "half" },
      { id: "email", kind: "form-field", fieldType: "email", name: "email", label: "Email", mapsTo: "email", required: true, width: "half" },
      { id: "phone", kind: "form-field", fieldType: "phone", name: "phone", label: "Phone", mapsTo: "phone", width: "half" },
      { id: "companyName", kind: "form-field", fieldType: "text", name: "companyName", label: "Company name", mapsTo: "customAttribute", width: "half" },
      { id: "companyWebsite", kind: "form-field", fieldType: "text", name: "companyWebsite", label: "Company website", mapsTo: "customAttribute", width: "half" },
      {
        id: "howHeard",
        kind: "form-field",
        fieldType: "select",
        name: "howHeard",
        label: "How did you hear about us?",
        placeholder: "Select one",
        mapsTo: "customAttribute",
        options: selectOptions(body.howHeardOptions ?? ["Google Search", "Referral", "Social Media", "LinkedIn", "Other"]),
      },
      {
        id: "reasonForContact",
        kind: "form-field",
        fieldType: "select",
        name: "reasonForContact",
        label: "Reason for contact",
        placeholder: "Select one",
        required: true,
        mapsTo: "customAttribute",
        options: selectOptions(
          body.reasonOptions ?? ["General Inquiry", "Request a Quote", "Careers", "Support", "Other"]
        ),
      },
      { id: "message", kind: "form-field", fieldType: "textarea", name: "message", label: "Message (optional)", mapsTo: "customAttribute" },
      { id: "submit", kind: "submit-button", text: body.buttonText || "Send Inquiry" },
    ];

    await updateForm(created.form.id, { blocks });

    const confirmationBody = body.confirmationBody
      ? `<p>${body.confirmationBody}</p>`
      : "<p>Hi {{FIRST_NAME}},</p><p>Thanks for reaching out to Elite Resource Services. We've received your inquiry and will get back to you within 1 business day.</p>";

    const notifyEmails: string[] = Array.isArray(body.notifyEmails) ? body.notifyEmails.filter(Boolean) : [];

    const { theme, brand } = await getEmailBranding();
    const sequence = await createSequence({
      name: `${body.name} — Confirmation`,
      trigger: "tag_added",
      tagName,
      steps: [
        {
          subject: body.confirmationSubject || "We've received your inquiry",
          html: wrapBrandedEmail({ bodyHtml: confirmationBody, theme, brand }),
          delayDays: 0,
        },
      ],
    });
    await enableSequence(sequence.id);

    let webhookWarning: string | null = null;
    const appBaseUrl = process.env.APP_BASE_URL;
    if (notifyEmails.length > 0) {
      if (!appBaseUrl || appBaseUrl.includes("localhost")) {
        webhookWarning =
          "Staff notifications are configured but won't fire until this app is deployed to a public URL (set APP_BASE_URL).";
      } else {
        const token = randomBytes(16).toString("hex");
        const webhookUrl = new URL("/api/webhooks/inquiry", appBaseUrl);
        webhookUrl.searchParams.set("token", token);
        webhookUrl.searchParams.set("listId", list.id);
        webhookUrl.searchParams.set("notify", notifyEmails.join(","));
        webhookUrl.searchParams.set("formName", body.name);
        await createWebhook({
          name: `EliteReach inquiry notify: ${body.name}`,
          url: webhookUrl.toString(),
          events: ["subscriber.created"],
        });
      }
    }

    return NextResponse.json(
      { form: created.form, embed: created.embed, sequenceId: sequence.id, warning: webhookWarning },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create inquiry form" }, { status: 500 });
  }
}

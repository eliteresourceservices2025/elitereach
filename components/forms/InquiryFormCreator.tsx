"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormPreview, type PreviewField } from "./FormPreview";

const DEFAULT_HOW_HEARD = ["Google Search", "Referral", "Social Media", "LinkedIn", "Other"];
const DEFAULT_REASONS = ["General Inquiry", "Request a Quote", "Careers", "Support", "Other"];

function linesToOptions(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function InquiryFormCreator() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("Contact Us");
  const [description, setDescription] = useState("Tell us a bit about your business and we'll be in touch.");
  const [buttonText, setButtonText] = useState("Send Inquiry");
  const [successMessage, setSuccessMessage] = useState("Thanks! We've received your inquiry.");
  const [howHeardText, setHowHeardText] = useState(DEFAULT_HOW_HEARD.join("\n"));
  const [reasonText, setReasonText] = useState(DEFAULT_REASONS.join("\n"));
  const [notifyEmails, setNotifyEmails] = useState("");
  const [confirmationSubject, setConfirmationSubject] = useState("We've received your inquiry");
  const [confirmationBody, setConfirmationBody] = useState(
    "Hi {{FIRST_NAME}}, thanks for reaching out to Elite Resource Services. We've received your inquiry and will get back to you within 1 business day."
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/forms/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          headline,
          description,
          buttonText,
          successMessage,
          howHeardOptions: linesToOptions(howHeardText),
          reasonOptions: linesToOptions(reasonText),
          notifyEmails: notifyEmails.split(",").map((e) => e.trim()).filter(Boolean),
          confirmationSubject,
          confirmationBody,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create inquiry form.");
        return;
      }
      const created = await res.json();
      router.push(created.warning ? `/forms?warning=${encodeURIComponent(created.warning)}` : "/forms");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const previewFields: PreviewField[] = [
    { label: "First name", type: "text", required: true, half: true },
    { label: "Last name", type: "text", required: true, half: true },
    { label: "Email", type: "email", required: true, half: true },
    { label: "Phone", type: "phone", half: true },
    { label: "Company name", type: "text", half: true },
    { label: "Company website", type: "text", half: true },
    { label: "How did you hear about us?", type: "select", options: linesToOptions(howHeardText) },
    { label: "Reason for contact", type: "select", options: linesToOptions(reasonText), required: true },
    { label: "Message (optional)", type: "textarea" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Form name (internal)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website Contact Form"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Headline</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">&ldquo;How did you hear about us?&rdquo; options</label>
            <textarea
              value={howHeardText}
              onChange={(e) => setHowHeardText(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">One option per line.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">&ldquo;Reason for contact&rdquo; options</label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">One option per line.</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Button text</label>
          <input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Success message</label>
          <input
            value={successMessage}
            onChange={(e) => setSuccessMessage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">Notify these staff emails on each submission</label>
          <input
            value={notifyEmails}
            onChange={(e) => setNotifyEmails(e.target.value)}
            placeholder="sales@eliteresourceservices.com, oann0228@gmail.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            They get their own email showing everything the person filled out (name, email, phone, company, etc.) —
            not a copy of the customer&apos;s confirmation. It&apos;s pre-addressed so replying goes straight to the
            person who submitted.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Confirmation email subject</label>
          <input
            value={confirmationSubject}
            onChange={(e) => setConfirmationSubject(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Confirmation email message</label>
          <textarea
            value={confirmationBody}
            onChange={(e) => setConfirmationBody(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">Use {"{{FIRST_NAME}}"} to personalize. Sent instantly, wrapped in the ELITE template.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create inquiry form"}
        </button>
      </form>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</p>
        <FormPreview headline={headline} description={description} buttonText={buttonText} fields={previewFields} />
      </div>
    </div>
  );
}

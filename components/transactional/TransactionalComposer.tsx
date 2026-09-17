"use client";

import { useState } from "react";
import type { EmailTheme } from "@/lib/sequenzy";
import { wrapBrandedEmail, type EmailBrand } from "@/lib/email-template";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import { AIGenerator } from "@/components/email/AIGenerator";
import { GrapesEmailBuilder } from "@/components/email/GrapesEmailBuilder";
import { DevicePreview } from "@/components/email/DevicePreview";
import { SenderReplyFields, emptySenderReply, type SenderReplyValue } from "@/components/email/SenderReplyFields";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Mode = "write" | "ai" | "design" | "html";

export function TransactionalComposer({
  theme,
  brand,
  defaultSender,
}: {
  theme?: EmailTheme;
  brand?: EmailBrand;
  defaultSender?: Partial<SenderReplyValue>;
}) {
  const [mode, setMode] = useState<Mode>("write");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [designHtml, setDesignHtml] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [senderReply, setSenderReply] = useState<SenderReplyValue>(() => emptySenderReply(defaultSender));
  const [showPreview, setShowPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const wrap = mode !== "html" && mode !== "design";
  const currentBody = mode === "html" ? rawHtml : mode === "design" ? designHtml : bodyHtml;
  const previewHtml = wrap
    ? wrapBrandedEmail({ previewText, bodyHtml: currentBody || "<p></p>", theme, brand })
    : currentBody || "<p></p>";

  const recipients = to
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  function validate(): string | null {
    if (recipients.length === 0) return "At least one recipient email is required.";
    if (!subject.trim() || !currentBody.trim()) return "Subject and body content are required.";
    return null;
  }

  async function handleSend() {
    setError(null);
    setSent(null);
    setSending(true);
    try {
      const res = await fetch("/api/transactional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          subject,
          previewText,
          bodyHtml: currentBody,
          wrap,
          fromName: senderReply.fromName || undefined,
          fromEmail: senderReply.fromEmail || undefined,
          replyToName: senderReply.replyToName || undefined,
          replyTo: senderReply.replyTo || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to send transactional email.");
        return;
      }
      setSent(`Sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`);
      setTo("");
      setSubject("");
      setPreviewText("");
      setBodyHtml("");
      setDesignHtml("");
      setRawHtml("");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient1@..., recipient2@..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">Sends immediately to each address — there&apos;s no draft or schedule step.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Subject line</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Preview text (optional)</label>
          <input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <SenderReplyFields value={senderReply} onChange={setSenderReply} showCc={false} showBcc={false} />

        <div>
          <div className="mb-2 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
            {(["write", "ai", "design", "html"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-1.5 font-medium transition ${
                  mode === m ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "write" ? "Write" : m === "ai" ? "AI Generate" : m === "design" ? "Design" : "Paste HTML"}
              </button>
            ))}
          </div>

          {mode === "ai" && (
            <div className="mb-3">
              <AIGenerator
                onGenerated={(result) => {
                  setSubject(result.subject);
                  setPreviewText(result.previewText);
                  setBodyHtml(result.bodyHtml);
                }}
              />
            </div>
          )}

          {mode === "html" ? (
            <div>
              <textarea
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                rows={12}
                placeholder="<p>Paste your pre-built HTML email here...</p>"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
              />
              <p className="mt-1 text-xs text-gray-400">Sent as-is — no ELITE wrapper is applied.</p>
            </div>
          ) : mode === "design" ? (
            <div>
              <GrapesEmailBuilder value={designHtml} onChange={setDesignHtml} />
              <p className="mt-1 text-xs text-gray-400">
                Drag-and-drop builder — sent as-is, no ELITE wrapper. Add your own logo/footer blocks as needed.
              </p>
            </div>
          ) : (
            <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {sent && <p className="text-sm text-green-600">{sent}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-lg border border-elite-violet/30 px-4 py-2 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5"
          >
            {showPreview ? "Hide preview" : "Preview"}
          </button>
          <button
            type="button"
            onClick={() => {
              const validationError = validate();
              if (validationError) {
                setError(validationError);
                return;
              }
              setError(null);
              setConfirming(true);
            }}
            disabled={sending}
            className="ml-auto rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send now"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</p>
          <DevicePreview html={previewHtml} />
        </div>
      )}

      {confirming && (
        <ConfirmModal
          title="Send transactional email"
          message={`This sends immediately to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}: ${recipients.join(", ")}. This can't be undone.`}
          confirmLabel="Send now"
          variant="default"
          onConfirm={handleSend}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

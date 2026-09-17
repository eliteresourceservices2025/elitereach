"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tag, EmailTheme } from "@/lib/sequenzy";
import { wrapBrandedEmail, type EmailBrand } from "@/lib/email-template";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import { AIGenerator } from "@/components/email/AIGenerator";
import { GrapesEmailBuilder } from "@/components/email/GrapesEmailBuilder";
import { EmailPreview } from "@/components/email/EmailPreview";
import { RecipientSelector, type Audience } from "./RecipientSelector";

type Mode = "write" | "ai" | "design" | "html";

export function CampaignComposer({
  allTags,
  theme,
  brand,
}: {
  allTags: Tag[];
  theme?: EmailTheme;
  brand?: EmailBrand;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("write");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [designHtml, setDesignHtml] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [audience, setAudience] = useState<Audience>({ type: "all" });
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The drag-and-drop builder produces a complete, self-contained design —
  // wrapping it in the ELITE header/footer template would double up the chrome.
  const wrap = mode !== "html" && mode !== "design";
  const currentBody = mode === "html" ? rawHtml : mode === "design" ? designHtml : bodyHtml;
  const previewHtml = wrap
    ? wrapBrandedEmail({ previewText, bodyHtml: currentBody || "<p></p>", theme, brand })
    : currentBody || "<p></p>";

  function openPreviewInNewTab() {
    // An anchor-driven navigation to a blob: URL survives popup blockers that would
    // otherwise kill a plain window.open() call made from inside a React handler.
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handleCreateDraft() {
    setError(null);
    if (!name.trim() || !subject.trim() || !currentBody.trim()) {
      setError("Name, subject, and body content are all required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          previewText,
          bodyHtml: currentBody,
          wrap,
          audience,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create campaign draft.");
        return;
      }
      const campaign = await res.json();
      router.push(`/campaigns/${campaign.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Campaign name (internal)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. September Newsletter"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
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

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Recipients</label>
          <RecipientSelector allTags={allTags} value={audience} onChange={setAudience} />
        </div>

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
            onClick={openPreviewInNewTab}
            className="rounded-lg border border-elite-violet/30 px-4 py-2 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5"
          >
            Open preview in new tab
          </button>
          <button
            type="button"
            onClick={handleCreateDraft}
            disabled={saving}
            className="ml-auto rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create draft"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</p>
          <EmailPreview html={previewHtml} />
        </div>
      )}
    </div>
  );
}

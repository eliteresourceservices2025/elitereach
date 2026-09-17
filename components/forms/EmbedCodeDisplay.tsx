"use client";

import { useState } from "react";
import type { FormEmbed } from "@/lib/sequenzy";

export function EmbedCodeDisplay({ formId }: { formId: string }) {
  const [embed, setEmbed] = useState<FormEmbed | null>(null);
  const [mode, setMode] = useState<"javascript" | "nativeForm">("javascript");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (embed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}/embed`);
      const data = await res.json();
      setEmbed(data.embed ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    const text = embed ? (mode === "javascript" ? embed.javascript : embed.nativeForm) : "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <button onClick={toggle} className="text-sm text-elite-violet hover:underline">
        {open ? "Hide embed code" : "Get embed code"}
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {embed && (
            <>
              <div className="mb-2 flex gap-1 text-xs">
                <button
                  onClick={() => setMode("javascript")}
                  className={`rounded px-2 py-1 font-medium ${mode === "javascript" ? "bg-elite-violet text-white" : "bg-white text-gray-600"}`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setMode("nativeForm")}
                  className={`rounded px-2 py-1 font-medium ${mode === "nativeForm" ? "bg-elite-violet text-white" : "bg-white text-gray-600"}`}
                >
                  HTML form
                </button>
              </div>
              <pre className="max-h-48 overflow-auto rounded bg-white p-3 text-xs text-gray-700">
                {mode === "javascript" ? embed.javascript : embed.nativeForm}
              </pre>
              <button
                onClick={copy}
                className="mt-2 rounded-lg border border-elite-violet/30 px-3 py-1.5 text-xs font-medium text-elite-navy-dark hover:bg-elite-violet/5"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

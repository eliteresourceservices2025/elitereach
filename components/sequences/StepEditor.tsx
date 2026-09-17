"use client";

import { useState } from "react";
import type { EmailTheme } from "@/lib/sequenzy";
import { wrapBrandedEmail, type EmailBrand } from "@/lib/email-template";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import { AIGenerator } from "@/components/email/AIGenerator";
import { GrapesEmailBuilder } from "@/components/email/GrapesEmailBuilder";
import { DevicePreview } from "@/components/email/DevicePreview";

export type StepValue = {
  subject: string;
  previewText: string;
  bodyHtml: string;
  delayDays: number;
  /** false when bodyHtml is a complete design (from the drag-and-drop builder) and should be sent as-is. */
  wrap?: boolean;
};

const DELAY_PRESETS = [
  { label: "Immediately", value: 0 },
  { label: "1 day later", value: 1 },
  { label: "3 days later", value: 3 },
  { label: "1 week later", value: 7 },
];

export function StepEditor({
  index,
  value,
  onChange,
  onRemove,
  removable,
  theme,
  brand,
}: {
  index: number;
  value: StepValue;
  onChange: (value: StepValue) => void;
  onRemove: () => void;
  removable: boolean;
  theme?: EmailTheme;
  brand?: EmailBrand;
}) {
  const [mode, setMode] = useState<"write" | "ai" | "design">("write");
  const [designHtml, setDesignHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const isPreset = DELAY_PRESETS.some((p) => p.value === value.delayDays);
  const previewHtml =
    value.wrap === false
      ? value.bodyHtml || "<p></p>"
      : wrapBrandedEmail({ previewText: value.previewText, bodyHtml: value.bodyHtml || "<p></p>", theme, brand });

  return (
    <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-elite-navy-dark">Email {index + 1}</p>
        {removable && (
          <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline">
            Remove
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Delay</label>
        <select
          value={isPreset ? value.delayDays : "custom"}
          onChange={(e) => {
            if (e.target.value === "custom") return;
            onChange({ ...value, delayDays: Number(e.target.value) });
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {DELAY_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom...</option>
        </select>
        {!isPreset && (
          <input
            type="number"
            min={0}
            value={value.delayDays}
            onChange={(e) => onChange({ ...value, delayDays: Math.max(0, Number(e.target.value)) })}
            className="ml-2 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Days"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Subject line</label>
        <input
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Preview text (optional)</label>
        <input
          value={value.previewText}
          onChange={(e) => onChange({ ...value, previewText: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-2 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        {(["write", "ai", "design"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${
              mode === m ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "write" ? "Write" : m === "ai" ? "AI Generate" : "Design"}
          </button>
        ))}
      </div>

      {mode === "ai" && (
        <AIGenerator
          onGenerated={(result) =>
            onChange({ ...value, subject: result.subject, previewText: result.previewText, bodyHtml: result.bodyHtml, wrap: true })
          }
        />
      )}

      {mode === "design" ? (
        <div>
          <GrapesEmailBuilder
            value={designHtml}
            onChange={(html) => {
              setDesignHtml(html);
              onChange({ ...value, bodyHtml: html, wrap: false });
            }}
          />
          <p className="mt-1 text-xs text-gray-400">
            Drag-and-drop builder — sent as-is, no ELITE wrapper. Add your own logo/footer blocks as needed.
          </p>
        </div>
      ) : (
        <RichTextEditor value={value.bodyHtml} onChange={(bodyHtml) => onChange({ ...value, bodyHtml, wrap: true })} />
      )}

      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="rounded-lg border border-elite-violet/30 px-4 py-2 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5"
      >
        {showPreview ? "Hide preview" : "Preview"}
      </button>

      {showPreview && <DevicePreview html={previewHtml} />}
    </div>
  );
}

"use client";

import type { BuilderBlock } from "./builderTypes";

export function FormBlockEditor({
  block,
  onChange,
  locked,
}: {
  block: BuilderBlock;
  onChange: (next: BuilderBlock) => void;
  /** true for the required email field — type/mapsTo/required can't change. */
  locked?: boolean;
}) {
  if (block.kind === "field") {
    const field = block;
    const isChoice = field.fieldType === "select" || field.fieldType === "radio" || field.fieldType === "checkbox";
    const options = field.options ?? [];

    function updateOption(i: number, value: string) {
      const next = options.map((o, idx) => (idx === i ? { value, label: value } : o));
      onChange({ ...field, options: next });
    }
    function addOption() {
      onChange({ ...field, options: [...options, { value: `option-${options.length + 1}`, label: `Option ${options.length + 1}` }] });
    }
    function removeOption(i: number) {
      onChange({ ...field, options: options.filter((_, idx) => idx !== i) });
    }

    return (
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Label</span>
          <input
            value={field.label ?? ""}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        {field.fieldType !== "hidden" && field.fieldType !== "consent" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Placeholder</span>
            <input
              value={field.placeholder ?? ""}
              onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        )}

        {field.fieldType === "consent" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Consent text</span>
            <textarea
              value={field.consentText ?? ""}
              onChange={(e) => onChange({ ...field, consentText: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        )}

        {field.fieldType === "hidden" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              Value {!field.defaultValue && <span className="text-gray-400">(leave blank to capture whatever the page submits, e.g. a UTM param)</span>}
            </span>
            <input
              value={field.defaultValue ?? ""}
              onChange={(e) => onChange({ ...field, defaultValue: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        )}

        {isChoice && (
          <div className="space-y-2">
            <span className="block text-xs font-medium text-gray-500">Options</span>
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={o.value}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
                <button type="button" onClick={() => removeOption(i)} className="text-xs text-red-500">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addOption} className="text-xs text-elite-violet hover:underline">
              + Add option
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {!locked && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={field.required ?? false} onChange={(e) => onChange({ ...field, required: e.target.checked })} />
              Required
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={field.width === "half"}
              onChange={(e) => onChange({ ...field, width: e.target.checked ? "half" : "full" })}
            />
            Half width
          </label>
        </div>
        {locked && <p className="text-xs text-gray-400">This is the form&apos;s email field — every form needs exactly one.</p>}
      </div>
    );
  }

  if (block.kind === "heading" || block.kind === "text") {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Content</span>
          <textarea
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            rows={block.kind === "heading" ? 1 : 3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-center gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Align</span>
            <select
              value={block.align}
              onChange={(e) => onChange({ ...block, align: e.target.value as "left" | "center" | "right" })}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          {block.kind === "heading" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Size</span>
              <select
                value={block.level}
                onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value={1}>Largest</option>
                <option value={2}>Medium</option>
                <option value={3}>Smallest</option>
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Style</span>
              <select
                value={block.variant}
                onChange={(e) => onChange({ ...block, variant: e.target.value as "paragraph" | "eyebrow" | "caption" })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="paragraph">Paragraph</option>
                <option value="eyebrow">Eyebrow</option>
                <option value="caption">Caption</option>
              </select>
            </label>
          )}
        </div>
      </div>
    );
  }

  if (block.kind === "image") {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Image URL</span>
          <input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Alt text</span>
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
    );
  }

  if (block.kind === "spacer") {
    return (
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Height (px)</span>
        <input
          type="number"
          min={8}
          max={160}
          value={block.height}
          onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
          className="w-full max-w-[120px] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
    );
  }

  return <p className="text-sm text-gray-400">Nothing to configure for a divider.</p>;
}

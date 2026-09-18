"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormBlock, FormTheme, Tag } from "@/lib/sequenzy";
import {
  type BuilderBlock,
  FIELD_TYPE_LABELS,
  CONTENT_BLOCK_LABELS,
  emptyFieldBlock,
  emptyContentBlock,
  makeEmailField,
  toFormBlocks,
  fromFormBlocks,
} from "./builderTypes";
import { FormBlockCanvas } from "./FormBlockCanvas";
import { FormBlockEditor } from "./FormBlockEditor";
import { FormPreview } from "./FormPreview";

const DEFAULT_THEME: FormTheme = { accentColor: "#8a2be2", borderRadius: 8, density: "balanced" };

type FormBuilderProps =
  | {
      mode: "create";
      allTags: Tag[];
    }
  | {
      mode: "edit";
      allTags: Tag[];
      formId: string;
      initialName: string;
      initialBlocks: FormBlock[];
      initialButtonText: string;
      initialSuccessMessage: string;
      initialRedirectUrl: string;
      initialTagIds: string[];
      initialTheme: FormTheme;
    };

export function FormBuilder(props: FormBuilderProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [name, setName] = useState(isEdit ? props.initialName : "");
  const [initial] = useState(() =>
    isEdit
      ? fromFormBlocks(props.initialBlocks)
      : {
          editable: [
            { id: "default-heading", kind: "heading" as const, content: "Stay in the loop", level: 2 as const, align: "left" as const },
            {
              id: "default-text",
              kind: "text" as const,
              content: "Get updates from Elite Resource Services.",
              variant: "paragraph" as const,
              align: "left" as const,
            },
            makeEmailField(),
          ],
          passthrough: [] as FormBlock[],
        }
  );
  const [blocks, setBlocks] = useState<BuilderBlock[]>(initial.editable);
  const passthroughBlocks = useRef<FormBlock[]>(initial.passthrough);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState(isEdit ? props.initialButtonText : "Subscribe");
  const [successMessage, setSuccessMessage] = useState(isEdit ? props.initialSuccessMessage : "Thanks! You're all set.");
  const [redirectUrl, setRedirectUrl] = useState(isEdit ? props.initialRedirectUrl : "");
  const [tagIds, setTagIds] = useState<string[]>(isEdit ? props.initialTagIds : []);
  const [theme, setTheme] = useState<FormTheme>(isEdit ? props.initialTheme : DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockedEmailId = blocks.find((b) => b.kind === "field" && b.mapsTo === "email")?.id;
  const lockedIds = new Set(lockedEmailId ? [lockedEmailId] : []);
  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  function addField(fieldType: keyof typeof FIELD_TYPE_LABELS) {
    const block = emptyFieldBlock(fieldType);
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
  }
  function addContent(kind: keyof typeof CONTENT_BLOCK_LABELS) {
    const block = emptyContentBlock(kind);
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
  }
  function updateBlock(next: BuilderBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === next.id ? next : b)));
  }
  function removeBlock(id: string) {
    if (lockedIds.has(id)) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError("Form name is required.");
    setSaving(true);
    try {
      const submitBlock: FormBlock = { id: "form-submit", kind: "submit-button", text: buttonText || "Submit" };
      const successBlock: FormBlock = { id: "form-success", kind: "success-screen", message: successMessage || "Thanks!" };
      const payload = {
        name,
        tagIds,
        buttonText,
        successMessage,
        redirectUrl: redirectUrl || undefined,
        theme,
        blocks: [...toFormBlocks(blocks), submitBlock, successBlock, ...passthroughBlocks.current],
      };
      const res = await fetch(isEdit ? `/api/forms/${props.formId}` : "/api/forms", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save form.");
        return;
      }
      router.push("/forms");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_320px]">
      <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-gray-400">Fields</p>
        {(Object.keys(FIELD_TYPE_LABELS) as (keyof typeof FIELD_TYPE_LABELS)[]).map((ft) => (
          <button
            key={ft}
            type="button"
            onClick={() => addField(ft)}
            className="block w-full rounded-lg p-2 text-left text-sm text-elite-navy-dark hover:bg-elite-violet/5"
          >
            {FIELD_TYPE_LABELS[ft]}
          </button>
        ))}
        <div className="my-1 border-t border-gray-100" />
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-gray-400">Content</p>
        {(Object.keys(CONTENT_BLOCK_LABELS) as (keyof typeof CONTENT_BLOCK_LABELS)[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => addContent(k)}
            className="block w-full rounded-lg p-2 text-left text-sm text-elite-navy-dark hover:bg-elite-violet/5"
          >
            {CONTENT_BLOCK_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Form name (internal)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homepage Newsletter Signup"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <FormBlockCanvas
            blocks={blocks}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={setBlocks}
            onRemove={removeBlock}
            lockedIds={lockedIds}
          />
        </div>

        {selectedBlock && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Edit block</p>
              <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                Close
              </button>
            </div>
            <FormBlockEditor block={selectedBlock} onChange={updateBlock} locked={lockedIds.has(selectedBlock.id)} />
          </div>
        )}

        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">On submit</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Button text</span>
              <input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Redirect URL (optional)</span>
              <input
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="Leave blank to show a message instead"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          {!redirectUrl && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Success message</span>
              <input
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          )}
          <div>
            <span className="mb-1 block text-xs font-medium text-gray-500">Apply tags to submitters</span>
            <div className="flex flex-wrap gap-2">
              {props.allTags.length === 0 && <p className="text-xs text-gray-400">No tags yet — add one from the Tags page.</p>}
              {props.allTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    tagIds.includes(t.id) ? "border-elite-violet bg-elite-violet/10 text-elite-violet" : "border-gray-200 text-gray-500"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              A tag applied here can trigger a sequence automatically — see the sequence trigger presets.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Accent</span>
              <input
                type="color"
                value={theme.accentColor || "#8a2be2"}
                onChange={(e) => setTheme((t) => ({ ...t, accentColor: e.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Background</span>
              <input
                type="color"
                value={theme.backgroundColor || "#ffffff"}
                onChange={(e) => setTheme((t) => ({ ...t, backgroundColor: e.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Radius (px)</span>
              <input
                type="number"
                min={0}
                max={32}
                value={theme.borderRadius ?? 8}
                onChange={(e) => setTheme((t) => ({ ...t, borderRadius: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Density</span>
            <select
              value={theme.density ?? "balanced"}
              onChange={(e) => setTheme((t) => ({ ...t, density: e.target.value as FormTheme["density"] }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="compact">Compact</option>
              <option value="balanced">Balanced</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create form"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</p>
        <FormPreview blocks={blocks} buttonText={buttonText} theme={theme} />
      </div>
    </div>
  );
}

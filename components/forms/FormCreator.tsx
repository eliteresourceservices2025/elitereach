"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@/lib/sequenzy";
import { FormPreview, type PreviewField } from "./FormPreview";

export function FormCreator({ allTags }: { allTags: Tag[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("Stay in the Loop");
  const [description, setDescription] = useState("Get VA hiring tips, industry insights, and updates from ELITE.");
  const [buttonText, setButtonText] = useState("Subscribe");
  const [showFirstName, setShowFirstName] = useState(true);
  const [tagId, setTagId] = useState("");
  const [successMessage, setSuccessMessage] = useState("Thanks for subscribing! Check your inbox.");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, headline, description, buttonText, showFirstName, tagId: tagId || undefined, successMessage }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create form.");
        return;
      }
      router.push("/forms");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const previewFields: PreviewField[] = [
    ...(showFirstName ? [{ label: "First name", type: "text" as const }] : []),
    { label: "Email", type: "email", required: true },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Form name (internal)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Homepage Newsletter Signup"
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
          <label className="mb-1 block text-xs font-medium text-gray-500">Button text</label>
          <input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Auto-tag new subscribers</label>
          <select
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">No tag</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={showFirstName} onChange={(e) => setShowFirstName(e.target.checked)} />
        Ask for first name
      </label>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Success message</label>
        <input
          value={successMessage}
          onChange={(e) => setSuccessMessage(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create form"}
      </button>
    </form>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</p>
        <FormPreview headline={headline} description={description} buttonText={buttonText} fields={previewFields} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@/lib/sequenzy";
import { StepEditor, type StepValue } from "./StepEditor";

const MAX_STEPS = 5;

function emptyStep(): StepValue {
  return { subject: "", previewText: "", bodyHtml: "", delayDays: 0 };
}

export function SequenceForm({ allTags }: { allTags: Tag[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<"contact_added" | "tag_added">("contact_added");
  const [tagName, setTagName] = useState(allTags[0]?.name ?? "");
  const [steps, setSteps] = useState<StepValue[]>([emptyStep()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateStep(index: number, value: StepValue) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addStep() {
    if (steps.length >= MAX_STEPS) return;
    setSteps((prev) => [...prev, emptyStep()]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Sequence name is required.");
      return;
    }
    if (trigger === "tag_added" && !tagName) {
      setError("Choose a tag to trigger this sequence.");
      return;
    }
    if (steps.some((s) => !s.subject.trim() || !s.bodyHtml.trim())) {
      setError("Every email needs a subject and body content.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, trigger, tagName: trigger === "tag_added" ? tagName : undefined, steps }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create sequence.");
        return;
      }
      const created = await res.json();
      router.push(`/sequences/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Sequence name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Welcome Series"
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Trigger</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as "contact_added" | "tag_added")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="contact_added">When a new contact is added</option>
              <option value="tag_added">When a tag is added to a contact</option>
            </select>
            {trigger === "tag_added" && (
              <select
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {allTags.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            You can also manually enroll any contact into this sequence later from the Contacts page.
          </p>
        </div>
      </div>

      {steps.map((step, i) => (
        <StepEditor
          key={i}
          index={i}
          value={step}
          onChange={(v) => updateStep(i, v)}
          onRemove={() => removeStep(i)}
          removable={steps.length > 1}
        />
      ))}

      {steps.length < MAX_STEPS && (
        <button
          type="button"
          onClick={addStep}
          className="w-full rounded-xl border-2 border-dashed border-elite-violet/30 py-3 text-sm font-medium text-elite-violet hover:bg-elite-violet/5"
        >
          + Add another email
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create sequence (draft)"}
        </button>
      </div>
    </div>
  );
}

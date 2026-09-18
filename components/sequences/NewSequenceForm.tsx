"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@/lib/sequenzy";

export function NewSequenceForm({ allTags }: { allTags: Tag[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<"contact_added" | "tag_added">("contact_added");
  const [tagName, setTagName] = useState(allTags[0]?.name ?? "");
  const [mode, setMode] = useState<"blank" | "ai">("blank");
  const [goal, setGoal] = useState("");
  const [emailCount, setEmailCount] = useState(5);
  const [durationDays, setDurationDays] = useState(14);
  const [emailStyle, setEmailStyle] = useState<"visual" | "plain">("visual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (mode === "ai" && !goal.trim()) {
      setError("Describe what you want this sequence to do.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trigger,
          tagName: trigger === "tag_added" ? tagName : undefined,
          goal: mode === "ai" ? goal : undefined,
          emailCount: mode === "ai" ? emailCount : undefined,
          durationDays: mode === "ai" ? durationDays : undefined,
          emailStyle: mode === "ai" ? emailStyle : undefined,
        }),
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
    <div className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Sequence name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Welcome Series"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Starting point</label>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
          {(["blank", "ai"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === m ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "blank" ? "Start from scratch" : "Describe with AI"}
            </button>
          ))}
        </div>
      </div>

      {mode === "blank" ? (
        <p className="text-xs text-gray-400">You&apos;ll build out the steps on the visual canvas after creating this.</p>
      ) : (
        <div className="space-y-3 rounded-lg bg-elite-violet/5 p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Describe what this sequence should do</span>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="e.g. Welcome new healthcare clinic clients, introduce our virtual assistant services, and offer a free consultation by the last email."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Emails</span>
              <input
                type="number"
                min={1}
                max={10}
                value={emailCount}
                onChange={(e) => setEmailCount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Over (days)</span>
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Style</span>
              <select
                value={emailStyle}
                onChange={(e) => setEmailStyle(e.target.value as "visual" | "plain")}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="visual">Visual</option>
                <option value="plain">Plain</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-gray-400">
            Sequenzy&apos;s AI writes the emails and lays out the delays for you — you can still edit everything on the canvas
            afterward.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
      >
        {saving ? (mode === "ai" ? "Generating..." : "Creating...") : "Create sequence"}
      </button>
    </div>
  );
}

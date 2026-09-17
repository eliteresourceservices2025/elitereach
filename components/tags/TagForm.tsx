"use client";

import { useState } from "react";
import type { TagColor } from "@/lib/sequenzy";
import { tagColorHex } from "@/lib/tag-colors";

const SWATCHES: TagColor[] = ["violet", "purple", "blue", "green", "amber", "red", "pink"];

export function TagForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>(SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create tag.");
        return;
      }
      setName("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <input
        placeholder="New tag name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-1">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => setColor(swatch)}
            className={`h-6 w-6 rounded-full border-2 ${color === swatch ? "border-elite-navy-dark" : "border-transparent"}`}
            style={{ backgroundColor: tagColorHex(swatch) }}
            aria-label={`Choose color ${swatch}`}
            title={swatch}
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create tag"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

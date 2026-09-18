"use client";

import { useState } from "react";
import { LabelBadge } from "./LabelBadge";

/** Controlled labels editor — chips plus an add-input. The parent owns
 * persistence (calling the update endpoint) via onChange; this component
 * only manages the in-progress input text. Sequenzy auto-creates a label on
 * first use, so there's no separate "create label" step. */
export function LabelsEditor({
  labels,
  onChange,
  disabled,
}: {
  labels: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function addLabel() {
    const name = draft.trim();
    if (!name || labels.includes(name)) {
      setDraft("");
      return;
    }
    onChange([...labels, name]);
    setDraft("");
  }

  function removeLabel(name: string) {
    onChange(labels.filter((l) => l !== name));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((name) => (
        <LabelBadge key={name} name={name} onRemove={disabled ? undefined : () => removeLabel(name)} />
      ))}
      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLabel();
            }
          }}
          onBlur={addLabel}
          placeholder="Add label..."
          className="w-28 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs focus:border-elite-violet focus:outline-none"
        />
      )}
    </div>
  );
}

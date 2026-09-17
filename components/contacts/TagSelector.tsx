"use client";

import { useState } from "react";
import type { Tag } from "@/lib/sequenzy";
import { tagColorHex } from "@/lib/tag-colors";

export function TagSelector({
  allTags,
  selected,
  onChange,
}: {
  allTags: Tag[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(tagName: string) {
    if (selected.includes(tagName)) {
      onChange(selected.filter((t) => t !== tagName));
    } else {
      onChange([...selected, tagName]);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm text-gray-600"
      >
        {selected.length > 0 ? selected.join(", ") : "Select tags..."}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {allTags.length === 0 && <p className="px-2 py-1 text-sm text-gray-400">No tags yet.</p>}
          {allTags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={selected.includes(tag.name)} onChange={() => toggle(tag.name)} />
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: tagColorHex(tag.color) }}
              />
              {tag.name}
            </label>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded-lg bg-gray-50 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

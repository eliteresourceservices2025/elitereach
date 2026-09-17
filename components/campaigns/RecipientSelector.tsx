"use client";

import type { Tag } from "@/lib/sequenzy";

export type Audience = { type: "all" } | { type: "tag"; tag: string };

export function RecipientSelector({
  allTags,
  value,
  onChange,
}: {
  allTags: Tag[];
  value: Audience;
  onChange: (audience: Audience) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <select
        value={value.type === "tag" ? value.tag : "__all__"}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "__all__" ? { type: "all" } : { type: "tag", tag: v });
        }}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="__all__">All active contacts</option>
        {allTags.map((t) => (
          <option key={t.id} value={t.name}>
            Tagged &ldquo;{t.name}&rdquo;
          </option>
        ))}
      </select>
    </div>
  );
}

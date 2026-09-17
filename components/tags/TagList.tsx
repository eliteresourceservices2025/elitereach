"use client";

import { useEffect, useState } from "react";
import type { Tag } from "@/lib/sequenzy";
import { tagColorHex } from "@/lib/tag-colors";
import { TagForm } from "./TagForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTags() {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount: loadTags sets state asynchronously inside its own promise callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTags();
  }, []);

  async function handleDelete(tag: Tag) {
    setError(null);
    const res = await fetch(`/api/tags/${encodeURIComponent(tag.id)}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete tag.");
      return;
    }
    loadTags();
  }

  return (
    <div className="space-y-4">
      <TagForm onCreated={loadTags} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Tag</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                  Loading tags...
                </td>
              </tr>
            )}
            {!loading && tags.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                  No tags yet. Create one above.
                </td>
              </tr>
            )}
            {!loading &&
              tags.map((tag) => (
                <tr key={tag.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tagColorHex(tag.color) }}
                    >
                      {tag.name}
                    </span>
                    {tag.isSystem && <span className="ml-2 text-xs text-gray-400">System tag</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!tag.isSystem && (
                      <button onClick={() => setPendingDelete(tag)} className="text-sm text-red-500 hover:underline">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Delete tag"
          message={`Deleting "${pendingDelete.name}" will remove it from all subscribers who have it. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

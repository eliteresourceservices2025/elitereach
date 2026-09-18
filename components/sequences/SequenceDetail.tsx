"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SequenceDetail as SequenceDetailType,
  SequenceStepStats,
  Tag,
  SequenceList,
  EmailTheme,
} from "@/lib/sequenzy";
import type { EmailBrand } from "@/lib/email-template";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SequenceBuilder } from "./builder/SequenceBuilder";

type Stats = {
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  enrollmentCounts: { active: number; waiting: number; total: number };
  steps: SequenceStepStats[];
};

export function SequenceDetail({
  sequence,
  allTags,
  lists,
  theme,
  brand,
}: {
  sequence: SequenceDetailType;
  allTags: Tag[];
  lists: SequenceList[];
  theme?: EmailTheme;
  brand?: EmailBrand;
}) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sequences/${sequence.id}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, [sequence.id]);

  async function toggleEnabled() {
    setBusy(true);
    setError(null);
    try {
      const action = sequence.acceptsNewEnrollments ? "disable" : "enable";
      const res = await fetch(`/api/sequences/${sequence.id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update sequence.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/sequences/${sequence.id}`, { method: "DELETE" });
    router.push("/sequences");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
          <p className="text-sm text-gray-700">{sequence.effectiveStatusSummary}</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={busy}
          className="ml-auto rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {sequence.acceptsNewEnrollments ? "Disable" : "Enable"}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-500 hover:underline">
          Delete
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-4">
          <Stat label="Enrolled" value={stats.enrollmentCounts.total} />
          <Stat label="Active" value={stats.enrollmentCounts.active} />
          <Stat label="Sent (30d)" value={stats.sent} />
          <Stat label="Open rate" value={`${stats.openRate.toFixed(1)}%`} />
        </div>
      )}

      <SequenceBuilder sequence={sequence} allTags={allTags} lists={lists} theme={theme} brand={brand} />

      {confirmDelete && (
        <ConfirmModal
          title="Delete sequence"
          message="This permanently deletes the sequence and its steps. Enrolled contacts stop receiving it. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-elite-navy-dark">{value}</p>
    </div>
  );
}

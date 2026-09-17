"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Sequence } from "@/lib/sequenzy";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  live: "bg-green-100 text-green-700",
  enrollment_paused: "bg-amber-100 text-amber-700",
  paused: "bg-amber-100 text-amber-700",
  archived: "bg-gray-100 text-gray-500",
};

export function SequenceTable() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/sequences");
      const data = await res.json();
      setSequences(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount: load sets state asynchronously inside its own promise callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function toggle(seq: Sequence) {
    setBusyId(seq.id);
    try {
      const action = seq.acceptsNewEnrollments ? "disable" : "enable";
      await fetch(`/api/sequences/${seq.id}/${action}`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                Loading sequences...
              </td>
            </tr>
          )}
          {!loading && sequences.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                No sequences yet.
              </td>
            </tr>
          )}
          {!loading &&
            sequences.map((seq) => (
              <tr key={seq.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/sequences/${seq.id}`} className="font-medium text-elite-navy-dark hover:underline">
                    {seq.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[seq.effectiveStatus] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {seq.effectiveStatus.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(seq)}
                    disabled={busyId === seq.id}
                    className="text-sm text-elite-violet hover:underline disabled:opacity-40"
                  >
                    {seq.acceptsNewEnrollments ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

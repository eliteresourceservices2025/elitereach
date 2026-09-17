"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Campaign } from "@/lib/sequenzy";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  waiting_approval: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  sending: "bg-amber-100 text-amber-700",
  paused: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns?limit=100")
      .then((res) => res.json())
      .then((data) => setCampaigns(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                Loading campaigns...
              </td>
            </tr>
          )}
          {!loading && campaigns.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                No campaigns yet.
              </td>
            </tr>
          )}
          {!loading &&
            campaigns.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/campaigns/${c.id}`} className="font-medium text-elite-navy-dark hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.subject}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

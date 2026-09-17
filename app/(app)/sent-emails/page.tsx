import Link from "next/link";
import { listEmailSends, type EmailSendType } from "@/lib/sequenzy";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "campaign", label: "Campaigns" },
  { value: "sequence", label: "Sequences" },
  { value: "transactional", label: "Transactional" },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]["value"];

async function safeListEmailSends() {
  try {
    return await listEmailSends({ limit: 100 });
  } catch {
    return null;
  }
}

function statusBadge(send: { status: string; openedAt: string | null; clickedAt: string | null; bouncedAt: string | null }) {
  if (send.bouncedAt) return { label: "Bounced", className: "bg-red-100 text-red-700" };
  if (send.clickedAt) return { label: "Clicked", className: "bg-green-100 text-green-700" };
  if (send.openedAt) return { label: "Opened", className: "bg-blue-100 text-blue-700" };
  if (send.status === "delivered") return { label: "Delivered", className: "bg-gray-100 text-gray-600" };
  return { label: send.status, className: "bg-gray-100 text-gray-600" };
}

export default async function SentEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const typeFilter: TypeFilter = TYPE_FILTERS.some((t) => t.value === params.type) ? (params.type as TypeFilter) : "all";

  const result = await safeListEmailSends();
  const rows = (result?.emailSends ?? [])
    .filter((s) => typeFilter === "all" || s.type === (typeFilter as EmailSendType))
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-elite-navy-dark">Sent Emails</h1>
          <p className="text-sm text-gray-500">
            Last {result?.retentionDays ?? 14} days — Sequenzy&apos;s send-log retention window.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-white p-1 text-sm shadow-sm">
          {TYPE_FILTERS.map((t) => (
            <Link
              key={t.value}
              href={t.value === "all" ? "/sent-emails" : `/sent-emails?type=${t.value}`}
              className={`rounded-md px-3 py-1.5 font-medium ${
                typeFilter === t.value ? "bg-elite-violet text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sent</th>
            </tr>
          </thead>
          <tbody>
            {!result && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Unable to reach Sequenzy.
                </td>
              </tr>
            )}
            {result && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No emails sent in this window.
                </td>
              </tr>
            )}
            {rows.map((send) => {
              const badge = statusBadge(send);
              return (
                <tr key={send.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{send.recipientEmail}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {send.subject}
                    {send.isTestEmail && <span className="ml-2 text-xs text-gray-400">(test)</span>}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{send.type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(send.sentAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

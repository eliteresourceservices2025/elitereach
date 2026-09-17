import Link from "next/link";
import {
  getEmailLeaderboard,
  getMetricsDetail,
  getSendEventBreakdown,
  getTestEmailCount,
  MONTHLY_EMAIL_QUOTA,
  type MetricsPeriod,
} from "@/lib/sequenzy";
import { SendTrendChart } from "@/components/analytics/SendTrendChart";

const PERIODS: { value: MetricsPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "campaign", label: "Campaigns" },
  { value: "sequence", label: "Sequences" },
] as const;

type EmailTypeFilter = (typeof TYPE_FILTERS)[number]["value"];

async function safeMetrics(period: MetricsPeriod) {
  try {
    return await getMetricsDetail(period);
  } catch {
    return null;
  }
}

async function safeTestCount() {
  try {
    return await getTestEmailCount();
  } catch {
    return null;
  }
}

async function safeLeaderboard(period: MetricsPeriod) {
  try {
    return await getEmailLeaderboard({ period, limit: 25 });
  } catch {
    return null;
  }
}

async function safeBreakdown() {
  try {
    return await getSendEventBreakdown();
  } catch {
    return null;
  }
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const params = await searchParams;
  const period: MetricsPeriod = PERIODS.some((p) => p.value === params.period) ? (params.period as MetricsPeriod) : "30d";
  const typeFilter: EmailTypeFilter = TYPE_FILTERS.some((t) => t.value === params.type)
    ? (params.type as EmailTypeFilter)
    : "all";

  const [metrics, testEmails, leaderboard, breakdown] = await Promise.all([
    safeMetrics(period),
    safeTestCount(),
    safeLeaderboard(period),
    safeBreakdown(),
  ]);

  const estimatedUsed = (metrics?.sent ?? 0) + (testEmails?.count ?? 0);
  const rows = leaderboard?.rows.filter((r) => typeFilter === "all" || r.emailType === typeFilter) ?? [];

  function periodHref(value: MetricsPeriod) {
    return `/analytics?period=${value}${typeFilter !== "all" ? `&type=${typeFilter}` : ""}`;
  }

  function typeHref(value: EmailTypeFilter) {
    return `/analytics?period=${period}${value !== "all" ? `&type=${value}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-elite-navy-dark">Analytics</h1>
          <p className="text-sm text-gray-500">Performance across campaigns and sequences.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={periodHref(p.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                period === p.value ? "bg-elite-violet text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Emails sent"
          value={(metrics?.sent ?? 0).toLocaleString()}
          sub={metrics ? `${metrics.delivered.toLocaleString()} delivered` : undefined}
        />
        <StatCard label="Deliverability" value={metrics ? `${metrics.deliveryRate.toFixed(1)}%` : "—"} sub="of emails delivered" />
        <StatCard
          label="Open rate"
          value={metrics ? `${metrics.openRate.toFixed(1)}%` : "—"}
          sub={metrics ? `${metrics.opened.toLocaleString()} opens` : undefined}
        />
        <StatCard
          label="Click rate"
          value={metrics ? `${metrics.clickRate.toFixed(1)}%` : "—"}
          sub={metrics ? `${metrics.clicked.toLocaleString()} clicks` : undefined}
        />
        <StatCard
          label="Unsub rate"
          value={metrics ? `${metrics.unsubscribeRate.toFixed(1)}%` : "—"}
          sub={metrics ? `${metrics.unsubscribed.toLocaleString()} unsubs` : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active contacts" value={metrics?.activeSubscriberCount.toLocaleString() ?? "—"} />
        <StatCard
          label="Bounce rate"
          value={metrics ? `${metrics.bounceRate.toFixed(1)}%` : "—"}
          sub={metrics ? `${metrics.bounced.toLocaleString()} bounced` : undefined}
        />
        <StatCard
          label="Est. monthly quota used"
          value={`${estimatedUsed.toLocaleString()} / ${MONTHLY_EMAIL_QUOTA.toLocaleString()}`}
        />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Sends per day</p>
          <p className="text-xs text-gray-400">Last {breakdown?.retentionDays ?? 14} days</p>
        </div>
        {breakdown && breakdown.dailySent.length > 0 ? (
          <SendTrendChart data={breakdown.dailySent} />
        ) : (
          <p className="text-sm text-gray-400">No sends recorded in this window.</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Bounce &amp; deliverability detail — last {breakdown?.retentionDays ?? 14} days (Sequenzy&apos;s send-log retention window)
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Permanent bounce"
            value={breakdown ? `${breakdown.permanentBounceRate.toFixed(1)}%` : "—"}
            sub={breakdown ? `${breakdown.permanentBounces.toLocaleString()} bounced` : undefined}
          />
          <StatCard
            label="Temporary bounce"
            value={breakdown ? `${breakdown.temporaryBounceRate.toFixed(1)}%` : "—"}
            sub={breakdown ? `${breakdown.temporaryBounces.toLocaleString()} bounced` : undefined}
          />
          <StatCard
            label="Complaint rate"
            value={breakdown ? `${breakdown.complaintRate.toFixed(1)}%` : "—"}
            sub={breakdown ? `${breakdown.complaints.toLocaleString()} complaints` : undefined}
          />
          <StatCard
            label="Delivery delays"
            value={breakdown ? `${breakdown.delayRate.toFixed(1)}%` : "—"}
            sub={breakdown ? `${breakdown.delayed.toLocaleString()} delayed recipients` : undefined}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Campaigns &amp; sequence emails</p>
          <div className="flex gap-1 text-xs">
            {TYPE_FILTERS.map((t) => (
              <Link
                key={t.value}
                href={typeHref(t.value)}
                className={`rounded-full px-3 py-1 font-medium ${
                  typeFilter === t.value ? "bg-elite-violet text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">No emails sent yet in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Sent</th>
                  <th className="py-2 pr-4">Open rate</th>
                  <th className="py-2 pr-4">Click rate</th>
                  <th className="py-2 pr-4">Bounced</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.emailId} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4">
                      {row.emailType === "campaign" ? (
                        <Link href={`/campaigns/${row.campaignId}`} className="font-medium text-elite-navy-dark hover:underline">
                          {row.name}
                        </Link>
                      ) : (
                        <Link href={`/sequences/${row.sequenceId}`} className="font-medium text-elite-navy-dark hover:underline">
                          {row.sequenceName} — {row.name}
                        </Link>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {row.emailType === "campaign" ? "Campaign" : `Sequence step ${row.step ?? ""}`}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{row.stats.sent.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-gray-500">{row.stats.openRate.toFixed(1)}%</td>
                    <td className="py-2 pr-4 text-gray-500">{row.stats.clickRate.toFixed(1)}%</td>
                    <td className="py-2 pr-4 text-gray-500">{row.stats.bounced.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

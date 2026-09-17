import Link from "next/link";
import { getAccountMetrics, getEmailLeaderboard, getTestEmailCount, MONTHLY_EMAIL_QUOTA } from "@/lib/sequenzy";

async function safeMetrics() {
  try {
    return await getAccountMetrics();
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

async function safeLeaderboard() {
  try {
    return await getEmailLeaderboard({ period: "30d", limit: 1 });
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const [metrics, testEmails, leaderboard] = await Promise.all([safeMetrics(), safeTestCount(), safeLeaderboard()]);
  const realSent = metrics?.emailsSent30d ?? 0;
  const testSent = testEmails?.count ?? 0;
  const estimatedUsed = realSent + testSent;
  const pct = Math.min(100, Math.round((estimatedUsed / MONTHLY_EMAIL_QUOTA) * 100));
  const contactCount = metrics?.subscriberCount ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back to EliteReach.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Est. monthly quota used</p>
          {metrics ? (
            <>
              <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">
                {estimatedUsed.toLocaleString()}{" "}
                <span className="text-sm font-normal text-gray-400">/ {MONTHLY_EMAIL_QUOTA.toLocaleString()}</span>
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-elite-violet" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {realSent.toLocaleString()} real send{realSent === 1 ? "" : "s"} (30d)
                {testEmails && (
                  <>
                    {" "}
                    + {testSent.toLocaleString()} test{testSent === 1 ? "" : "s"} ({testEmails.retentionDays}d)
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-400">Connect your Sequenzy API key to see usage.</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Contacts</p>
          <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">
            {contactCount !== null ? contactCount.toLocaleString() : "—"}
          </p>
          <Link href="/contacts" className="mt-3 inline-block text-sm text-elite-violet hover:underline">
            View all contacts →
          </Link>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Quick actions</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/campaigns/new"
              className="rounded-lg bg-elite-violet px-3 py-2 text-center text-sm font-medium text-white hover:bg-elite-navy-dark"
            >
              New Campaign
            </Link>
            <Link
              href="/contacts/new"
              className="rounded-lg border border-elite-violet/30 px-3 py-2 text-center text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5"
            >
              Add Contact
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Analytics (last 30 days)</p>
          <Link href="/analytics" className="text-sm text-elite-violet hover:underline">
            View full analytics →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Avg. open rate</p>
            <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">
              {leaderboard ? `${leaderboard.totals.openRate.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Avg. click rate</p>
            <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">
              {leaderboard ? `${leaderboard.totals.clickRate.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Bounce rate</p>
            <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">
              {leaderboard ? `${leaderboard.totals.bounceRate.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

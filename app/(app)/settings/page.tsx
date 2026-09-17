import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAccountMetrics, getTestEmailCount, MONTHLY_EMAIL_QUOTA } from "@/lib/sequenzy";
import packageJson from "@/package.json";

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

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/");

  const [metrics, testEmails] = await Promise.all([safeMetrics(), safeTestCount()]);
  const apiKey = process.env.SEQUENZY_API_KEY ?? "";
  const masked = apiKey ? `${apiKey.slice(0, 8)}${"•".repeat(Math.max(0, apiKey.length - 12))}${apiKey.slice(-4)}` : "Not set";

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Settings</h1>
        <p className="text-sm text-gray-500">Admin-only configuration.</p>
      </div>

      <div className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Sequenzy API key</p>
        <p className="font-mono text-sm text-gray-700">{masked}</p>
        <p className="text-xs text-gray-400">Update this via the SEQUENZY_API_KEY environment variable in Vercel.</p>
      </div>

      <div className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Est. monthly quota used</p>
        {metrics ? (
          <>
            <p className="text-sm text-gray-700">
              {(metrics.emailsSent30d + (testEmails?.count ?? 0)).toLocaleString()} / {MONTHLY_EMAIL_QUOTA.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              {metrics.emailsSent30d.toLocaleString()} real send{metrics.emailsSent30d === 1 ? "" : "s"} (30d)
              {testEmails && (
                <>
                  {" "}
                  + {testEmails.count.toLocaleString()} test{testEmails.count === 1 ? "" : "s"} ({testEmails.retentionDays}d)
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              Sequenzy only exposes test-send history for the last {testEmails?.retentionDays ?? 14} days, so this is an
              estimate, not an exact monthly total.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">Unable to reach Sequenzy. Check your API key.</p>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Approved team emails</p>
        <p className="text-sm text-gray-700">{(process.env.APPROVED_EMAILS ?? "").split(",").length} team members</p>
        <p className="text-xs text-gray-400">Managed via the APPROVED_EMAILS environment variable in Vercel.</p>
      </div>

      <div className="space-y-1 rounded-xl bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">App version</p>
        <p className="text-sm text-gray-700">v{packageJson.version}</p>
      </div>
    </div>
  );
}

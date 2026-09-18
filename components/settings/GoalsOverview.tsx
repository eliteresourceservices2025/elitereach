import Link from "next/link";
import type { SequenceGoal } from "@/lib/sequenzy";
import { formatAttributionWindow, goalTriggerSummary } from "@/lib/goal-format";

export type SequenceGoalsEntry = {
  sequence: { id: string; name: string };
  goals: SequenceGoal[];
  conversions: number;
  revenueCents: number;
};

/** Consolidated view across every sequence's goals — the closest we can get
 * to Sequenzy's own Goals analytics page without an API for it. Company-wide
 * goals and per-goal (rather than per-sequence) conversion/revenue
 * attribution are dashboard-only in Sequenzy; there's no documented endpoint
 * for either, so this shows each sequence's own aggregate instead. */
export function GoalsOverview({ entries }: { entries: SequenceGoalsEntry[] }) {
  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-400">
        Sequence goals only — Sequenzy has no API for company-wide goals or the richer per-goal analytics its own
        dashboard shows (total conversions, attribution rate, revenue per email); manage those directly in Sequenzy.
        Conversions and revenue below are each sequence&apos;s own aggregate across all its goals combined.
      </p>

      {entries.length === 0 && <p className="text-sm text-gray-400">No sequences yet.</p>}

      {entries.map((entry) => (
        <div key={entry.sequence.id} className="space-y-1 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/sequences/${entry.sequence.id}`} className="text-sm font-medium text-elite-navy-dark hover:underline">
              {entry.sequence.name}
            </Link>
            <span className="shrink-0 text-xs text-gray-400">
              {entry.conversions} conversion{entry.conversions === 1 ? "" : "s"} · ${(entry.revenueCents / 100).toFixed(2)}
            </span>
          </div>
          {entry.goals.length === 0 ? (
            <p className="text-xs text-gray-400">No goals set.</p>
          ) : (
            <ul className="space-y-0.5">
              {entry.goals.map((goal) => (
                <li key={goal.id} className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">{goal.name}</span> — {goalTriggerSummary(goal)} · window:{" "}
                  {formatAttributionWindow(goal.attributionWindowHours)}
                  {!goal.isActive && <span className="ml-1 text-gray-400">(inactive)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import { LabelBadge } from "@/components/ui/LabelBadge";

export type LabelDirectoryEntry = {
  name: string;
  sequences: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
};

/** Read-only directory: Sequenzy has no separate "label" entity to manage,
 * only freeform strings attached to sequences/campaigns, so this is just an
 * aggregated view of what's already in use — not a create/manage flow. */
export function LabelsDirectory({ labels }: { labels: LabelDirectoryEntry[] }) {
  if (labels.length === 0) {
    return <p className="rounded-xl bg-white p-5 text-sm text-gray-400 shadow-sm">No labels in use yet. Add one from a sequence or campaign page.</p>;
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      {labels.map((label) => (
        <div key={label.name} className="flex flex-wrap items-center gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
          <LabelBadge name={label.name} />
          <span className="text-xs text-gray-400">
            {label.sequences.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ", "}
                <Link href={`/sequences/${s.id}`} className="hover:underline">
                  {s.name}
                </Link>
              </span>
            ))}
            {label.sequences.length > 0 && label.campaigns.length > 0 && ", "}
            {label.campaigns.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/campaigns/${c.id}`} className="hover:underline">
                  {c.name}
                </Link>
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

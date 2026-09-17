import Link from "next/link";
import { SequenceTable } from "@/components/sequences/SequenceTable";

export default function SequencesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-elite-navy-dark">Sequences</h1>
          <p className="text-sm text-gray-500">Automated email drips triggered by contact activity.</p>
        </div>
        <Link
          href="/sequences/new"
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark"
        >
          New Sequence
        </Link>
      </div>
      <SequenceTable />
    </div>
  );
}

import { SequenceForm } from "@/components/sequences/SequenceForm";
import { listTags } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function NewSequencePage() {
  const tags = await safeListTags();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">New Sequence</h1>
        <p className="text-sm text-gray-500">Build an automated email drip with up to 5 steps.</p>
      </div>
      <SequenceForm allTags={tags} />
    </div>
  );
}

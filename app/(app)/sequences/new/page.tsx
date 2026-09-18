import { NewSequenceForm } from "@/components/sequences/NewSequenceForm";
import { listTags, listEventSchemas } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

async function safeListEventSchemas() {
  try {
    return await listEventSchemas();
  } catch {
    return [];
  }
}

export default async function NewSequencePage() {
  const [tags, knownEvents] = await Promise.all([safeListTags(), safeListEventSchemas()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">New Sequence</h1>
        <p className="text-sm text-gray-500">Start from scratch or describe it to AI — you&apos;ll build it out on the canvas.</p>
      </div>
      <NewSequenceForm allTags={tags} knownEvents={knownEvents} />
    </div>
  );
}

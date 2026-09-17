import { SequenceForm } from "@/components/sequences/SequenceForm";
import { listTags } from "@/lib/sequenzy";
import { getEmailBranding } from "@/lib/get-email-branding";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function NewSequencePage() {
  const [tags, { theme, brand, defaultSender }] = await Promise.all([safeListTags(), getEmailBranding()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">New Sequence</h1>
        <p className="text-sm text-gray-500">Build an automated email drip with up to 5 steps.</p>
      </div>
      <SequenceForm allTags={tags} theme={theme} brand={brand} defaultSender={defaultSender} />
    </div>
  );
}

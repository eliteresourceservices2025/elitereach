import { ContactForm } from "@/components/contacts/ContactForm";
import { listTags } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function NewContactPage() {
  const tags = await safeListTags();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Add Contact</h1>
        <p className="text-sm text-gray-500">Add a single subscriber to your pool.</p>
      </div>
      <ContactForm allTags={tags} />
    </div>
  );
}

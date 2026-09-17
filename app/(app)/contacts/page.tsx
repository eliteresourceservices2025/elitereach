import { ContactTable } from "@/components/contacts/ContactTable";
import { listSequences, listTags } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

async function safeListSequences() {
  try {
    const res = await listSequences();
    return res.data;
  } catch {
    return [];
  }
}

export default async function ContactsPage() {
  const [tags, sequences] = await Promise.all([safeListTags(), safeListSequences()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Contacts</h1>
        <p className="text-sm text-gray-500">Everyone in your EliteReach subscriber pool.</p>
      </div>
      <ContactTable allTags={tags} allSequences={sequences} />
    </div>
  );
}

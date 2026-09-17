import { CSVImporter } from "@/components/contacts/CSVImporter";
import { listTags } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function ImportContactsPage() {
  const tags = await safeListTags();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Import Contacts</h1>
        <p className="text-sm text-gray-500">Bulk-add contacts from a CSV file.</p>
      </div>
      <CSVImporter allTags={tags} />
    </div>
  );
}

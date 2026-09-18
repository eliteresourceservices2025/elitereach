import { FormBuilder } from "@/components/forms/FormBuilder";
import { listTags } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function NewFormPage() {
  const tags = await safeListTags();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">New form</h1>
        <p className="text-sm text-gray-500">Build the fields, layout, and theme, then embed it anywhere.</p>
      </div>
      <FormBuilder mode="create" allTags={tags} />
    </div>
  );
}

import { NewFormClient } from "@/components/forms/NewFormClient";
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
  return <NewFormClient allTags={tags} />;
}

import { notFound } from "next/navigation";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { getForm, listTags } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [form, tags] = await Promise.all([getForm(id), safeListTags()]);
  if (!form) notFound();

  const blocks = form.content?.blocks ?? [];
  const submitBlock = blocks.find((b) => b.kind === "submit-button") as { text?: string } | undefined;
  const successBlock = blocks.find((b) => b.kind === "success-screen") as { message?: string } | undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Edit form</h1>
        <p className="text-sm text-gray-500">{form.name}</p>
      </div>
      <FormBuilder
        mode="edit"
        allTags={tags}
        formId={form.id}
        initialName={form.name}
        initialBlocks={blocks}
        initialButtonText={submitBlock?.text ?? "Subscribe"}
        initialSuccessMessage={successBlock?.message ?? "Thanks!"}
        initialRedirectUrl={form.content?.settings?.redirectUrl ?? ""}
        initialTagIds={form.content?.settings?.tagIds ?? []}
        initialTheme={form.content?.theme ?? {}}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { SequenceDetail } from "@/components/sequences/SequenceDetail";
import { getSequence, listTags, listLists, listEventSchemas, SequenzyError } from "@/lib/sequenzy";
import { getEmailBranding } from "@/lib/get-email-branding";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

async function safeListLists() {
  try {
    return await listLists();
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

export default async function SequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sequence = await getSequence(id).catch((err) => {
    if (err instanceof SequenzyError && err.status === 404) return null;
    throw err;
  });

  if (!sequence) notFound();

  const [allTags, lists, knownEvents, { theme, brand }] = await Promise.all([
    safeListTags(),
    safeListLists(),
    safeListEventSchemas(),
    getEmailBranding(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">{sequence.name}</h1>
      </div>
      <SequenceDetail sequence={sequence} allTags={allTags} lists={lists} knownEvents={knownEvents} theme={theme} brand={brand} />
    </div>
  );
}

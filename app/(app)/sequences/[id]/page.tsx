import { notFound } from "next/navigation";
import { SequenceDetail } from "@/components/sequences/SequenceDetail";
import { getSequence, SequenzyError } from "@/lib/sequenzy";

export default async function SequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sequence = await getSequence(id).catch((err) => {
    if (err instanceof SequenzyError && err.status === 404) return null;
    throw err;
  });

  if (!sequence) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">{sequence.name}</h1>
      </div>
      <SequenceDetail sequence={sequence} />
    </div>
  );
}

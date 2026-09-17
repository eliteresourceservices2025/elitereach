import { notFound } from "next/navigation";
import { ContactDetail } from "@/components/contacts/ContactDetail";
import { getSubscriber, listTags, SequenzyError } from "@/lib/sequenzy";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function ContactDetailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const decoded = decodeURIComponent(email);

  const [contact, tags] = await Promise.all([
    getSubscriber(decoded).catch((err) => {
      if (err instanceof SequenzyError && err.status === 404) return null;
      throw err;
    }),
    safeListTags(),
  ]);

  if (!contact) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">
          {contact.firstName || contact.lastName ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() : contact.email}
        </h1>
        <p className="text-sm text-gray-500">Manage this contact&apos;s details and tags.</p>
      </div>
      <ContactDetail contact={contact} allTags={tags} />
    </div>
  );
}

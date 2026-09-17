import { TransactionalComposer } from "@/components/transactional/TransactionalComposer";
import { getEmailBranding } from "@/lib/get-email-branding";

export default async function TransactionalPage() {
  const { theme, brand, defaultSender } = await getEmailBranding();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Transactional Email</h1>
        <p className="text-sm text-gray-500">Send a one-off email to specific recipients, outside of campaigns and sequences.</p>
      </div>
      <TransactionalComposer theme={theme} brand={brand} defaultSender={defaultSender} />
    </div>
  );
}

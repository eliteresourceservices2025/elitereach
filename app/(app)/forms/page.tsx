import Link from "next/link";
import { FormTable } from "@/components/forms/FormTable";

export default async function FormsPage({ searchParams }: { searchParams: Promise<{ warning?: string }> }) {
  const { warning } = await searchParams;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-elite-navy-dark">Signup Forms</h1>
          <p className="text-sm text-gray-500">Embeddable forms for eliteresourceservices.com.</p>
        </div>
        <Link
          href="/forms/new"
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark"
        >
          New Form
        </Link>
      </div>
      {warning && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</div>
      )}
      <FormTable />
    </div>
  );
}

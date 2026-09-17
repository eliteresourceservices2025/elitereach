import Link from "next/link";
import { CampaignTable } from "@/components/campaigns/CampaignTable";

export default function CampaignsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-elite-navy-dark">Campaigns</h1>
          <p className="text-sm text-gray-500">Newsletters and one-time sends to your contacts.</p>
        </div>
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark"
        >
          New Campaign
        </Link>
      </div>
      <CampaignTable />
    </div>
  );
}

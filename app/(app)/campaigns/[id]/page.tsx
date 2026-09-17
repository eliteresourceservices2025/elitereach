import { notFound } from "next/navigation";
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { getCampaign, SequenzyError } from "@/lib/sequenzy";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campaign = await getCampaign(id).catch((err) => {
    if (err instanceof SequenzyError && err.status === 404) return null;
    throw err;
  });

  if (!campaign) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">{campaign.name}</h1>
        <p className="text-sm text-gray-500">{campaign.subject}</p>
      </div>
      <CampaignDetail campaign={campaign} />
    </div>
  );
}

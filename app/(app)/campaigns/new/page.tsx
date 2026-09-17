import { CampaignComposer } from "@/components/campaigns/CampaignComposer";
import { listTags } from "@/lib/sequenzy";
import { getEmailBranding } from "@/lib/get-email-branding";

async function safeListTags() {
  try {
    const res = await listTags();
    return res.data;
  } catch {
    return [];
  }
}

export default async function NewCampaignPage() {
  const [tags, { theme, brand }] = await Promise.all([safeListTags(), getEmailBranding()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">New Campaign</h1>
        <p className="text-sm text-gray-500">Compose, preview, and save a draft before sending.</p>
      </div>
      <CampaignComposer allTags={tags} theme={theme} brand={brand} />
    </div>
  );
}

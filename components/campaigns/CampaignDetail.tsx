"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign, CampaignMetrics, ClickedLink } from "@/lib/sequenzy";
import { EmailPreview } from "@/components/email/EmailPreview";
import { TestEmailButton } from "@/components/email/TestEmailButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LabelsEditor } from "@/components/ui/LabelsEditor";

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [audience, setAudience] = useState<{ summary: string; recipientCount: number } | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [clickedLinks, setClickedLinks] = useState<ClickedLink[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [confirmAction, setConfirmAction] = useState<"sendNow" | "schedule" | "cancel" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [labels, setLabels] = useState(campaign.labels ?? []);
  const [labelsSaving, setLabelsSaving] = useState(false);

  async function handleLabelsChange(next: string[]) {
    setLabels(next); // optimistic
    setLabelsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: next }),
      });
      if (!res.ok) {
        setActionError("Failed to update labels.");
        setLabels(campaign.labels ?? []); // revert
      }
    } finally {
      setLabelsSaving(false);
    }
  }

  useEffect(() => {
    fetch(`/api/campaigns/${campaign.id}/render`)
      .then((res) => res.json())
      .then((data) => setRenderedHtml(data.html ?? null))
      .catch(() => {});
    fetch(`/api/campaigns/${campaign.id}/audience`)
      .then((res) => res.json())
      .then((data) => setAudience({ summary: data.summary, recipientCount: data.recipientCount }))
      .catch(() => {});
    if (campaign.status === "sent") {
      fetch(`/api/campaigns/${campaign.id}/metrics`)
        .then((res) => res.json())
        .then((data) => {
          setMetrics(data.stats ?? null);
          setClickedLinks(Array.isArray(data.clickedLinks) ? data.clickedLinks : []);
        })
        .catch(() => {});
    }
  }, [campaign.id, campaign.status]);

  async function runAction(action: "sendNow" | "schedule" | "cancel" | "delete") {
    setBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      if (action === "sendNow" || action === "schedule") {
        const res = await fetch(`/api/campaigns/${campaign.id}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "sendNow" ? { sendNow: true } : { scheduledAt: new Date(scheduledAt).toISOString() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setActionError(data.error ?? "Failed to schedule campaign.");
          return;
        }
        const data = await res.json();
        setActionMessage(
          data.status === "waiting_approval"
            ? "Held for a quick safety review — it will send automatically once approved."
            : "Campaign scheduled."
        );
        router.refresh();
      } else if (action === "cancel") {
        const res = await fetch(`/api/campaigns/${campaign.id}/cancel`, { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setActionError(data.error ?? "Failed to cancel campaign.");
          return;
        }
        router.refresh();
      } else if (action === "delete") {
        const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setActionError(data.error ?? "Failed to delete campaign.");
          return;
        }
        router.push("/campaigns");
      }
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  const canEdit = campaign.status === "draft";
  const canSchedule = campaign.status === "draft";
  const canCancel = ["scheduled", "sending", "paused", "waiting_approval", "rejected"].includes(campaign.status);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Labels</p>
          <LabelsEditor labels={labels} onChange={handleLabelsChange} disabled={labelsSaving} />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Recipients</p>
          <p className="mt-1 text-sm text-gray-700">{audience ? audience.summary : "Loading..."}</p>
          {audience && <p className="mt-1 text-2xl font-semibold text-elite-navy-dark">{audience.recipientCount.toLocaleString()}</p>}
        </div>

        {campaign.status === "rejected" && campaign.rejectionComment && (
          <div className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
            <p className="font-medium">Rejected during safety review</p>
            <p className="mt-1">{campaign.rejectionComment}</p>
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-3">
            <Stat label="Sent" value={metrics.sent} />
            <Stat label="Delivered" value={metrics.delivered} />
            <Stat label="Opened" value={`${metrics.openRate.toFixed(1)}%`} />
            <Stat label="Clicked" value={`${metrics.clickRate.toFixed(1)}%`} />
            <Stat label="Bounced" value={metrics.bounced} />
            <Stat label="Unsubscribed" value={metrics.unsubscribed} />
          </div>
        )}

        {clickedLinks.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Clicked links</p>
            <div className="space-y-2">
              {clickedLinks.map((link) => (
                <div key={link.url} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-elite-navy-dark" title={link.url}>
                    {link.url}
                  </span>
                  <span className="shrink-0 text-gray-400">
                    {link.clicks} ({link.percentage.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canEdit && (
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <TestEmailButton campaignId={campaign.id} />
          </div>
        )}

        {canSchedule && (
          <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Send</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setConfirmAction("schedule")}
                disabled={!scheduledAt || busy}
                className="rounded-lg border border-elite-violet/30 px-4 py-2 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5 disabled:opacity-60"
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction("sendNow")}
                disabled={busy}
                className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
              >
                Send now
              </button>
            </div>
          </div>
        )}

        {campaign.status === "scheduled" && campaign.scheduledAt && (
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Scheduled for</p>
            <p className="mt-1 text-sm text-gray-700">{new Date(campaign.scheduledAt).toLocaleString()}</p>
          </div>
        )}

        {actionMessage && <p className="text-sm text-green-700">{actionMessage}</p>}
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}

        <div className="flex gap-4 pt-2 text-sm">
          {canCancel && (
            <button onClick={() => setConfirmAction("cancel")} className="text-amber-600 hover:underline">
              Cancel send
            </button>
          )}
          {canEdit && (
            <button onClick={() => setConfirmAction("delete")} className="text-red-500 hover:underline">
              Delete draft
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Preview</p>
        {renderedHtml ? <EmailPreview html={renderedHtml} /> : <p className="text-sm text-gray-400">Loading preview...</p>}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction === "sendNow"
              ? "Send now"
              : confirmAction === "schedule"
              ? "Schedule campaign"
              : confirmAction === "cancel"
              ? "Cancel send"
              : "Delete draft"
          }
          message={
            confirmAction === "sendNow"
              ? `Send "${campaign.name}" to ${audience?.recipientCount ?? "all matching"} recipients right now?`
              : confirmAction === "schedule"
              ? `Schedule "${campaign.name}" for ${scheduledAt ? new Date(scheduledAt).toLocaleString() : ""}?`
              : confirmAction === "cancel"
              ? "This stops the send. Recipients who already received it keep their copy."
              : "This permanently deletes the draft. This can't be undone."
          }
          confirmLabel={confirmAction === "delete" || confirmAction === "cancel" ? "Confirm" : "Send"}
          variant={confirmAction === "delete" ? "danger" : "default"}
          onConfirm={() => runAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-elite-navy-dark">{value}</p>
    </div>
  );
}

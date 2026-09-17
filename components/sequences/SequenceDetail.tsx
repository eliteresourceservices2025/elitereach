"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SequenceDetail as SequenceDetailType, SequenceEmailStep, SequenceStepStats } from "@/lib/sequenzy";
import { EmailPreview } from "@/components/email/EmailPreview";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Stats = {
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  enrollmentCounts: { active: number; waiting: number; total: number };
  steps: SequenceStepStats[];
};

function StepPreview({
  sequenceId,
  step,
  stepStats,
}: {
  sequenceId: string;
  step: SequenceEmailStep;
  stepStats?: SequenceStepStats;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPreview() {
    if (html) {
      setShowPreview((v) => !v);
      return;
    }
    const res = await fetch(`/api/sequences/${sequenceId}/nodes/${step.nodeId}/render`);
    const data = await res.json();
    setHtml(data.html ?? null);
    setShowPreview(true);
  }

  async function sendTest() {
    if (!testEmail.trim()) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sequences/${sequenceId}/nodes/${step.nodeId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: testEmail.split(",").map((e) => e.trim()).filter(Boolean) }),
      });
      if (res.ok) setMessage("Test sent.");
      else setMessage("Failed to send test.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{step.delayDisplay ?? "Immediately"}</p>
          <p className="text-sm font-semibold text-elite-navy-dark">{step.subject}</p>
        </div>
        <button onClick={loadPreview} className="text-sm text-elite-violet hover:underline">
          {showPreview ? "Hide preview" : "Preview"}
        </button>
      </div>

      {stepStats && (
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span>{stepStats.stats.sent} sent</span>
          <span>{stepStats.stats.openRate.toFixed(1)}% opened</span>
          <span>{stepStats.stats.clickRate.toFixed(1)}% clicked</span>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={sendTest}
          disabled={sending || !testEmail.trim()}
          className="rounded-lg border border-elite-violet/30 px-3 py-1.5 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send test"}
        </button>
      </div>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}

      {showPreview && html && (
        <div className="mt-3">
          <EmailPreview html={html} />
        </div>
      )}
    </div>
  );
}

export function SequenceDetail({ sequence }: { sequence: SequenceDetailType }) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sequences/${sequence.id}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, [sequence.id]);

  async function toggleEnabled() {
    setBusy(true);
    setError(null);
    try {
      const action = sequence.acceptsNewEnrollments ? "disable" : "enable";
      const res = await fetch(`/api/sequences/${sequence.id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update sequence.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/sequences/${sequence.id}`, { method: "DELETE" });
    router.push("/sequences");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
          <p className="text-sm text-gray-700">{sequence.effectiveStatusSummary}</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={busy}
          className="ml-auto rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {sequence.acceptsNewEnrollments ? "Disable" : "Enable"}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-500 hover:underline">
          Delete
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-4">
          <Stat label="Enrolled" value={stats.enrollmentCounts.total} />
          <Stat label="Active" value={stats.enrollmentCounts.active} />
          <Stat label="Sent (30d)" value={stats.sent} />
          <Stat label="Open rate" value={`${stats.openRate.toFixed(1)}%`} />
        </div>
      )}

      <div className="space-y-3">
        {sequence.emails.map((step) => (
          <StepPreview
            key={step.nodeId}
            sequenceId={sequence.id}
            step={step}
            stepStats={stats?.steps.find((s) => s.nodeId === step.nodeId)}
          />
        ))}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete sequence"
          message="This permanently deletes the sequence and its steps. Enrolled contacts stop receiving it. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
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

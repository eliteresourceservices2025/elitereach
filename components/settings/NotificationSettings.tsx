"use client";

import { useState } from "react";
import type { NotificationEvent, NotificationMode } from "@/lib/sequenzy";

const EVENT_LABELS: Record<NotificationEvent, string> = {
  new_subscriber: "New subscriber",
  form_submitted: "Form submitted",
  campaign_completed: "Campaign finished sending",
  weekly_report: "Weekly report",
};

const MODE_LABELS: Record<NotificationMode, string> = {
  off: "Off",
  instant: "Instant",
  daily: "Daily digest",
  weekly: "Weekly",
};

export function NotificationSettings({
  initialPreferences,
  supportedModes,
}: {
  initialPreferences: { event: NotificationEvent; mode: NotificationMode }[];
  supportedModes: Record<NotificationEvent, NotificationMode[]>;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setMode(event: NotificationEvent, mode: NotificationMode) {
    setPreferences((prev) => prev.map((p) => (p.event === event ? { ...p, mode } : p)));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save notification preferences.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Notifications (email)</p>

      <div className="divide-y divide-gray-100">
        {preferences.map((p) => (
          <div key={p.event} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-700">{EVENT_LABELS[p.event]}</span>
            <select
              value={p.mode}
              onChange={(e) => setMode(p.event, e.target.value as NotificationMode)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              {(supportedModes[p.event] ?? ["off"]).map((mode) => (
                <option key={mode} value={mode}>
                  {MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save notifications"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </div>
  );
}

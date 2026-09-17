"use client";

import { useState } from "react";

export function TestEmailButton({ campaignId }: { campaignId: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const emails = email
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const res = await fetch(`/api/campaigns/${campaignId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to send test email.");
        return;
      }
      setMessage(`Test sent to ${emails.join(", ")}.`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500">Send a test email</label>
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com, teammate@example.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="rounded-lg border border-elite-violet/30 px-4 py-2 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send test"}
        </button>
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

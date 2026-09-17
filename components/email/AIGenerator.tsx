"use client";

import { useState } from "react";

export function AIGenerator({
  onGenerated,
}: {
  onGenerated: (result: { subject: string; previewText: string; bodyHtml: string }) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to generate email.");
        return;
      }
      const data = await res.json();
      onGenerated(data);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-elite-violet/30 bg-elite-violet/5 p-4">
      <label className="block text-xs font-medium text-gray-500">Describe the email you want</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="e.g. Announce our new healthcare virtual assistant services with a call to action to book a free consultation"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="casual">Casual</option>
          <option value="promotional">Promotional</option>
        </select>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="rounded-lg bg-elite-violet px-4 py-1.5 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {generating ? "Generating..." : "Generate draft"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">The draft appears in the editor below — review and edit before sending.</p>
    </div>
  );
}

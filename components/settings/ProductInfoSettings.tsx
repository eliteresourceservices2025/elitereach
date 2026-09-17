"use client";

import { useState } from "react";

const SOCIAL_KEYS = ["facebook", "instagram", "linkedin", "tiktok"] as const;

export function ProductInfoSettings({
  initialName,
  initialLogoUrl,
  initialSocialLinks,
  initialPrivacyUrl,
  initialTermsUrl,
  initialAddress,
}: {
  initialName: string;
  initialLogoUrl: string | null;
  initialSocialLinks: Record<string, string> | null;
  initialPrivacyUrl: string | null;
  initialTermsUrl: string | null;
  initialAddress: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    facebook: initialSocialLinks?.facebook ?? "",
    instagram: initialSocialLinks?.instagram ?? "",
    linkedin: initialSocialLinks?.linkedin ?? "",
    tiktok: initialSocialLinks?.tiktok ?? "",
  });
  const [privacyUrl, setPrivacyUrl] = useState(initialPrivacyUrl ?? "");
  const [termsUrl, setTermsUrl] = useState(initialTermsUrl ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl,
          socialLinks,
          privacyPolicyUrl: privacyUrl,
          termsUrl,
          address,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save product info.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Product info</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500">Company name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500">Logo URL</span>
          <input
            value={logoUrl}
            onChange={(e) => {
              setLogoUrl(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs text-gray-500">Social links</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs capitalize text-gray-500">{key}</span>
              <input
                value={socialLinks[key] ?? ""}
                onChange={(e) => {
                  setSocialLinks((s) => ({ ...s, [key]: e.target.value }));
                  setSaved(false);
                }}
                placeholder={`https://${key}.com/...`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500">Privacy policy URL</span>
          <input
            value={privacyUrl}
            onChange={(e) => {
              setPrivacyUrl(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500">Terms URL</span>
          <input
            value={termsUrl}
            onChange={(e) => {
              setTermsUrl(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-gray-500">Legal address</span>
        <input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save product info"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </div>
  );
}

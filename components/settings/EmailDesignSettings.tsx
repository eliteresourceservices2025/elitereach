"use client";

import { useMemo, useState } from "react";
import type { BrandColors, EmailButtonStyle, EmailTheme, EmailThemePresetId } from "@/lib/sequenzy";
import { wrapBrandedEmail } from "@/lib/email-template";
import { EmailPreview } from "@/components/email/EmailPreview";

const PRESETS: { value: EmailThemePresetId; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "soft", label: "Soft" },
  { value: "editorial", label: "Editorial" },
  { value: "bold", label: "Bold" },
];

const SAMPLE_BODY = `
  <h2>Your account summary</h2>
  <p>Hi there — here's a quick look at what's new this week.</p>
  <p style="margin:20px 0;"><a href="#" style="display:inline-block;background:{{BUTTON_BG}};color:{{BUTTON_TEXT}};padding:{{BTN_PAD_Y}}px {{BTN_PAD_X}}px;border-radius:{{BTN_RADIUS}}px;text-decoration:none;font-weight:600;">View details</a></p>
  <p>Questions? Just reply to this email.</p>
`;

export function EmailDesignSettings({
  companyName,
  logoUrl,
  websiteUrl,
  initialBrandColors,
  initialTheme,
}: {
  companyName: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  initialBrandColors: BrandColors | null;
  initialTheme: EmailTheme;
}) {
  // Spread the original object first: Sequenzy's brandColors PATCH replaces the
  // whole object rather than merging, so any keys our UI doesn't expose (it only
  // edits primary/secondary/accent) must be carried through untouched on save.
  const [brandColors, setBrandColors] = useState<BrandColors>({
    ...initialBrandColors,
    primary: initialBrandColors?.primary ?? "#6225a7",
    secondary: initialBrandColors?.secondary ?? "#e2be2b",
    accent: initialBrandColors?.accent ?? "#7b70c9",
  });
  const [theme, setTheme] = useState<EmailTheme>(initialTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setColor(key: keyof EmailTheme["colors"], value: string) {
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));
    setSaved(false);
  }
  function setLayout(key: keyof EmailTheme["layout"], value: number) {
    setTheme((t) => ({ ...t, layout: { ...t.layout, [key]: value } }));
    setSaved(false);
  }
  function setTypography(key: keyof EmailTheme["typography"], value: number) {
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value } }));
    setSaved(false);
  }
  function setBrandColor(key: keyof BrandColors, value: string) {
    setBrandColors((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  const previewHtml = useMemo(() => {
    const body = SAMPLE_BODY.replace("{{BUTTON_BG}}", theme.colors.primary)
      .replace("{{BUTTON_TEXT}}", theme.colors.buttonText)
      .replace("{{BTN_PAD_Y}}", String(theme.layout.buttonPaddingY))
      .replace("{{BTN_PAD_X}}", String(theme.layout.buttonPaddingX))
      .replace("{{BTN_RADIUS}}", String(theme.layout.buttonRadius));
    return wrapBrandedEmail({
      bodyHtml: body,
      theme,
      brand: { companyName, logoUrl, websiteUrl: websiteUrl ?? undefined },
    });
  }, [theme, companyName, logoUrl, websiteUrl]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandColors,
          // Only the fields Sequenzy's PATCH accepts — `theme` also carries
          // read-only fields (e.g. radiiFromBrand) echoed back by GET, which
          // the API rejects if sent back verbatim.
          emailTheme: {
            presetId: theme.presetId,
            buttonStyle: theme.buttonStyle,
            colors: theme.colors,
            layout: theme.layout,
            typography: theme.typography,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save email design.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Brand colors</p>
          <div className="grid grid-cols-3 gap-3">
            <ColorInput label="Primary" value={brandColors.primary ?? "#000000"} onChange={(v) => setBrandColor("primary", v)} />
            <ColorInput label="Secondary" value={brandColors.secondary ?? "#000000"} onChange={(v) => setBrandColor("secondary", v)} />
            <ColorInput label="Accent" value={brandColors.accent ?? "#000000"} onChange={(v) => setBrandColor("accent", v)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Style</p>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setTheme((t) => ({ ...t, presetId: p.value }));
                  setSaved(false);
                }}
                className={`flex-1 rounded-md py-1.5 font-medium transition ${
                  theme.presetId === p.value ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
            {(["solid", "outline"] as EmailButtonStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setTheme((t) => ({ ...t, buttonStyle: s }));
                  setSaved(false);
                }}
                className={`flex-1 rounded-md py-1.5 font-medium capitalize transition ${
                  theme.buttonStyle === s ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s} buttons
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Typography</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Text size (px)"
              value={theme.typography.baseFontSize}
              onChange={(v) => setTypography("baseFontSize", v)}
            />
            <NumberInput
              label="Line height"
              value={theme.typography.baseLineHeight}
              step={0.1}
              onChange={(v) => setTypography("baseLineHeight", v)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Spacing</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Card & image radius (px)" value={theme.layout.baseRadius} onChange={(v) => setLayout("baseRadius", v)} />
            <NumberInput label="Button radius (px)" value={theme.layout.buttonRadius} onChange={(v) => setLayout("buttonRadius", v)} />
            <NumberInput label="Block gap (px)" value={theme.layout.blockSpacing} onChange={(v) => setLayout("blockSpacing", v)} />
            <NumberInput label="Content width (px)" value={theme.layout.contentWidth} onChange={(v) => setLayout("contentWidth", v)} />
            <NumberInput
              label="Horizontal padding (px)"
              value={theme.layout.containerPaddingX}
              onChange={(v) => setLayout("containerPaddingX", v)}
            />
            <NumberInput
              label="Vertical padding (px)"
              value={theme.layout.containerPaddingY}
              onChange={(v) => setLayout("containerPaddingY", v)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Colors</p>
          <div className="grid grid-cols-3 gap-3">
            <ColorInput label="Email background" value={theme.colors.background} onChange={(v) => setColor("background", v)} />
            <ColorInput label="Content / card bg" value={theme.colors.surface} onChange={(v) => setColor("surface", v)} />
            <ColorInput label="Text" value={theme.colors.text} onChange={(v) => setColor("text", v)} />
            <ColorInput label="Muted text" value={theme.colors.mutedText} onChange={(v) => setColor("mutedText", v)} />
            <ColorInput label="Headings" value={theme.colors.heading} onChange={(v) => setColor("heading", v)} />
            <ColorInput label="Borders" value={theme.colors.border} onChange={(v) => setColor("border", v)} />
            <ColorInput label="Links" value={theme.colors.link} onChange={(v) => setColor("link", v)} />
          </div>
          <p className="mt-2 text-xs text-gray-400">Sequenzy doesn&apos;t have a separate card color — cards reuse the content background above.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save email design"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</p>
        <EmailPreview html={previewHtml} />
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-5 w-5 shrink-0 cursor-pointer border-0 bg-transparent p-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 border-0 p-0 text-xs text-gray-600 focus:outline-none"
        />
      </div>
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

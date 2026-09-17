import type { EmailTheme } from "./sequenzy";

const FALLBACK_LOGO_URL = "https://eliteresourceservices.com/wp-content/themes/ers-theme/assets/images/ELITE-RESOURCE-PRO-LOGO-ICON.png";

const FALLBACK_THEME: EmailTheme = {
  presetId: "default",
  buttonStyle: "solid",
  colors: {
    background: "#faf8ff",
    surface: "#ffffff",
    text: "#1a1330",
    mutedText: "#6b7280",
    heading: "#1a1330",
    border: "#e5e7eb",
    link: "#8a2be2",
    primary: "#8a2be2",
    buttonText: "#ffffff",
  },
  layout: {
    contentWidth: 600,
    containerPaddingX: 32,
    containerPaddingY: 24,
    sectionPadding: 28,
    blockSpacing: 20,
    baseRadius: 12,
    buttonRadius: 8,
    buttonPaddingX: 24,
    buttonPaddingY: 12,
    borderedBlockPadding: 12,
  },
  typography: {
    baseFontSize: 15,
    baseLineHeight: 1.6,
    leadFontSize: 17,
    heading1Size: 28,
    heading2Size: 22,
    heading3Size: 18,
    headingFontWeight: 700,
    headingLetterSpacing: 0,
    buttonFontSize: 14,
    buttonFontWeight: 600,
  },
};

export type EmailBrand = {
  companyName?: string;
  logoUrl?: string | null;
  websiteUrl?: string;
  phone?: string;
};

const FALLBACK_BRAND: Required<EmailBrand> = {
  companyName: "Elite Resource Services",
  logoUrl: FALLBACK_LOGO_URL,
  websiteUrl: "https://eliteresourceservices.com",
  phone: "(302) 582-2037",
};

export function wrapBrandedEmail({
  previewText,
  bodyHtml,
  theme,
  brand,
}: {
  previewText?: string;
  bodyHtml: string;
  theme?: EmailTheme;
  brand?: EmailBrand;
}): string {
  const t = theme ?? FALLBACK_THEME;
  const b = { ...FALLBACK_BRAND, ...brand, logoUrl: brand?.logoUrl || FALLBACK_BRAND.logoUrl };
  const { colors, layout, typography } = t;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(b.companyName)}</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.background};font-family:Arial,Helvetica,sans-serif;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.background};padding:${layout.containerPaddingY}px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="${layout.contentWidth}" cellpadding="0" cellspacing="0" style="max-width:${layout.contentWidth}px;width:100%;background-color:${colors.surface};border-radius:${layout.baseRadius}px;overflow:hidden;">
        <tr>
          <td align="center" style="background-color:${colors.primary};padding:${layout.sectionPadding}px ${layout.containerPaddingX}px;">
            <img src="${b.logoUrl}" alt="${escapeHtml(b.companyName)}" width="64" height="58" style="display:block;" />
          </td>
        </tr>
        <tr>
          <td style="padding:${layout.containerPaddingY}px ${layout.containerPaddingX}px 8px;color:${colors.text};font-size:${typography.baseFontSize}px;line-height:${typography.baseLineHeight};">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:${layout.blockSpacing}px ${layout.containerPaddingX}px ${layout.containerPaddingY}px;">
            <hr style="border:none;border-top:1px solid ${colors.border};margin:0 0 20px;" />
            <p style="margin:0 0 4px;font-size:13px;color:${colors.mutedText};font-weight:600;">${escapeHtml(b.companyName)}</p>
            <p style="margin:0 0 4px;font-size:12px;color:${colors.mutedText};">
              <a href="${b.websiteUrl}" style="color:${colors.link};text-decoration:none;">${b.websiteUrl.replace(/^https?:\/\//, "")}</a>
              &nbsp;·&nbsp; ${escapeHtml(b.phone)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

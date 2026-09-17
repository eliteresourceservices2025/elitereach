import { getCompanyProfile, type EmailTheme } from "./sequenzy";
import type { EmailBrand } from "./email-template";

/**
 * Fetches the current Email Design (Settings → Email Design / Product Info)
 * from Sequenzy so outgoing emails render with the team's actual brand theme
 * instead of the hardcoded fallback. Falls back to `undefined` (which makes
 * wrapBrandedEmail use its built-in defaults) if Sequenzy is unreachable, so
 * a branding-settings hiccup never blocks sending.
 */
export async function getEmailBranding(): Promise<{ theme: EmailTheme | undefined; brand: EmailBrand | undefined }> {
  try {
    const company = await getCompanyProfile();
    return {
      theme: company.emailTheme,
      brand: {
        companyName: company.name,
        logoUrl: company.logoUrl,
        websiteUrl: company.websiteUrl ?? undefined,
      },
    };
  } catch {
    return { theme: undefined, brand: undefined };
  }
}

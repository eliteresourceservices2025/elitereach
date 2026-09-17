import { getCompanyProfile, type EmailTheme } from "./sequenzy";
import type { EmailBrand } from "./email-template";
import type { SenderReplyValue } from "@/components/email/SenderReplyFields";

/**
 * Fetches the current Email Design (Settings → Email Design / Product Info)
 * from Sequenzy so outgoing emails render with the team's actual brand theme
 * instead of the hardcoded fallback. Falls back to `undefined` (which makes
 * wrapBrandedEmail use its built-in defaults) if Sequenzy is unreachable, so
 * a branding-settings hiccup never blocks sending. Also surfaces the
 * account's default sender/reply-to identity to prefill the From/Reply-to
 * fields on new campaigns and sequences.
 */
export async function getEmailBranding(): Promise<{
  theme: EmailTheme | undefined;
  brand: EmailBrand | undefined;
  defaultSender: Partial<SenderReplyValue> | undefined;
}> {
  try {
    const company = await getCompanyProfile();
    return {
      theme: company.emailTheme,
      brand: {
        companyName: company.name,
        logoUrl: company.logoUrl,
        websiteUrl: company.websiteUrl ?? undefined,
      },
      defaultSender: {
        fromName: company.defaultFromName ?? "",
        fromEmail: company.defaultFromEmail ?? "",
        replyToName: company.defaultReplyToName ?? "",
        replyTo: company.defaultReplyToEmail ?? "",
      },
    };
  } catch {
    return { theme: undefined, brand: undefined, defaultSender: undefined };
  }
}

const LOGO_URL = "https://eliteresourceservices.com/wp-content/themes/ers-theme/assets/images/ELITE-RESOURCE-PRO-LOGO-ICON.png";

export function wrapBrandedEmail({ previewText, bodyHtml }: { previewText?: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Elite Resource Services</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8ff;font-family:Arial,Helvetica,sans-serif;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8ff;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td align="center" style="background-color:#8a2be2;padding:28px 24px;">
            <img src="${LOGO_URL}" alt="Elite Resource Services" width="64" height="58" style="display:block;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;color:#1a1330;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;">
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600;">Elite Resource Services</p>
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              <a href="https://eliteresourceservices.com" style="color:#8a2be2;text-decoration:none;">eliteresourceservices.com</a>
              &nbsp;·&nbsp; (302) 582-2037
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

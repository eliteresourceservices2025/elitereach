const BASE_URL = process.env.SEQUENZY_API_BASE_URL ?? "https://api.sequenzy.com/api/v1";

// Sequenzy free tier: 2,500 emails/month. Not exposed by the API itself,
// so this is tracked here as a fixed reference point for the quota widget.
export const MONTHLY_EMAIL_QUOTA = 2500;

export const TAG_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export class SequenzyError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Sequenzy API error (${status})`;
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}
): Promise<T> {
  const apiKey = process.env.SEQUENZY_API_KEY;
  if (!apiKey) throw new Error("SEQUENZY_API_KEY env var is not set");

  const url = new URL(`${BASE_URL}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Node's default fetch User-Agent trips a Sequenzy server-side quirk that
      // silently drops fields from some responses (observed: weekly_report missing
      // from /notification-preferences). A normal UA avoids it.
      "User-Agent": "EliteReach/1.0 (+https://eliteresourceservices.com)",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new SequenzyError(res.status, data);
  }

  return data as T;
}

// ---- Types ----

export type SubscriberStatus = "active" | "unsubscribed" | "bounced";

export type Subscriber = {
  id: string;
  email: string;
  externalId?: string | null;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  status: SubscriberStatus;
  tags: string[];
  customAttributes?: Record<string, unknown>;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  color?: TagColor;
  isSystem?: boolean;
};

export type ListResult<T> = {
  data: T[];
  meta: { total: number | null; page: number | null; limit: number; hasMore: boolean };
};

// ---- Subscribers ----

export async function listSubscribers(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  tag?: string;
}): Promise<ListResult<Subscriber>> {
  const res = await request<{
    success: boolean;
    subscribers: Subscriber[];
    pagination: { page: number | null; limit: number; total: number | null; hasMore: boolean };
  }>("/subscribers", {
    query: {
      page: params?.page,
      limit: params?.perPage,
      query: params?.search,
      tags: params?.tag,
    },
  });
  return {
    data: res.subscribers,
    meta: { total: res.pagination.total, page: res.pagination.page, limit: res.pagination.limit, hasMore: res.pagination.hasMore },
  };
}

export async function createSubscriber(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  customAttributes?: Record<string, unknown>;
}): Promise<Subscriber> {
  const res = await request<{ success: boolean; subscriber: Subscriber }>("/subscribers", {
    method: "POST",
    body: input,
  });
  return res.subscriber;
}

export async function getSubscriber(email: string): Promise<Subscriber> {
  const res = await request<{ success: boolean; subscriber: Subscriber }>(`/subscribers/${encodeURIComponent(email)}`);
  return res.subscriber;
}

export async function updateSubscriber(
  email: string,
  input: Partial<Pick<Subscriber, "firstName" | "lastName" | "status" | "phone" | "customAttributes">>
): Promise<Subscriber> {
  const res = await request<{ success: boolean; subscriber: Subscriber }>(`/subscribers/${encodeURIComponent(email)}`, {
    method: "PATCH",
    body: input,
  });
  return res.subscriber;
}

export async function deleteSubscriber(email: string): Promise<void> {
  await request<{ success: boolean; deleted: boolean }>(`/subscribers/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}

export async function importSubscribers(
  records: { firstName?: string; lastName?: string; email: string }[],
  tags?: string[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;
  for (const record of records) {
    try {
      await createSubscriber({ ...record, tags });
      imported += 1;
    } catch {
      skipped += 1;
    }
  }
  return { imported, skipped };
}

export async function addTagToSubscriber(email: string, tag: string): Promise<void> {
  await request("/subscribers/tags", { method: "POST", body: { email, tag } });
}

export async function removeTagFromSubscriber(email: string, tag: string): Promise<void> {
  await request("/subscribers/tags/remove", { method: "POST", body: { email, tag } });
}

export async function bulkAddTag(emails: string[], tag: string): Promise<void> {
  await request("/subscribers/bulk/tags/add", { method: "POST", body: { emails, tags: [tag] } });
}

export async function bulkRemoveTag(emails: string[], tag: string): Promise<void> {
  await request("/subscribers/bulk/tags/remove", { method: "POST", body: { emails, tags: [tag] } });
}

// ---- Tags ----

export async function listTags(): Promise<{ data: Tag[] }> {
  const res = await request<{ success: boolean; tags: Tag[] }>("/tags");
  return { data: res.tags };
}

export async function createTag(input: { name: string; color?: TagColor }): Promise<Tag> {
  const res = await request<{ success: boolean; tag: Tag }>("/tags", { method: "POST", body: input });
  return res.tag;
}

export async function updateTag(id: string, input: { color: TagColor }): Promise<Tag> {
  const res = await request<{ success: boolean; tag: Tag }>(`/tags/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
  return res.tag;
}

export async function deleteTag(id: string): Promise<void> {
  await request<{ success: boolean }>(`/tags/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Account / metrics ----

export async function getAccountMetrics(): Promise<{ emailsSent30d: number; subscriberCount: number; activeSubscriberCount: number }> {
  const res = await request<{
    success: boolean;
    subscriberCount: number;
    activeSubscriberCount: number;
    stats: { sent: number };
  }>("/metrics", { query: { period: "30d" } });
  return {
    emailsSent30d: res.stats.sent,
    subscriberCount: res.subscriberCount,
    activeSubscriberCount: res.activeSubscriberCount,
  };
}

/**
 * Counts test-send emails over the trailing N days (max 14 — Sequenzy's email-send
 * history retention). Test sends never appear in /metrics.stats.sent, but they still
 * count against the account's real monthly quota, so this fills that gap.
 */
export async function getTestEmailCount(days = 14): Promise<{ count: number; retentionDays: number }> {
  let page = 1;
  let count = 0;
  let retentionDays = days;
  // Small-team scale: a handful of pages is always enough, but cap defensively.
  for (let i = 0; i < 10; i++) {
    const res = await request<{
      retentionDays: number;
      emailSends: { isTestEmail: boolean }[];
      pagination: { page: number; totalPages: number };
    }>("/email-sends", { query: { days, page, limit: 100 } });
    retentionDays = res.retentionDays;
    count += res.emailSends.filter((e) => e.isTestEmail).length;
    if (page >= res.pagination.totalPages) break;
    page += 1;
  }
  return { count, retentionDays };
}

export type EmailSendType = "campaign" | "sequence" | "transactional";

export type EmailSend = {
  id: string;
  type: EmailSendType;
  isTestEmail: boolean;
  recipientEmail: string;
  subject: string;
  status: string;
  sentAt: string;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  bounceType: string | null;
};

/** Paginated send history — the same 14-day retention window used elsewhere in this file. */
export async function listEmailSends(params?: {
  days?: number;
  page?: number;
  limit?: number;
}): Promise<{ emailSends: EmailSend[]; retentionDays: number; pagination: { page: number; limit: number; totalPages: number } }> {
  const res = await request<{
    retentionDays: number;
    emailSends: EmailSend[];
    pagination: { page: number; limit: number; totalPages: number };
  }>("/email-sends", { query: { days: params?.days ?? 14, page: params?.page ?? 1, limit: params?.limit ?? 50 } });
  return { emailSends: res.emailSends, retentionDays: res.retentionDays, pagination: res.pagination };
}

export type MetricsPeriod = "7d" | "30d" | "90d";

export type MetricsDetail = {
  period: MetricsPeriod;
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  subscriberCount: number;
  activeSubscriberCount: number;
};

/** Account-wide send/engagement stats for the given window — mirrors Sequenzy's own analytics summary cards. */
export async function getMetricsDetail(period: MetricsPeriod = "30d"): Promise<MetricsDetail> {
  const res = await request<{
    success: boolean;
    stats: {
      sent: number;
      delivered: number;
      bounced: number;
      opened: number;
      clicked: number;
      unsubscribed: number;
      deliveryRate: number;
      bounceRate: number;
      openRate: number;
      clickRate: number;
      unsubscribeRate: number;
    };
    subscriberCount: number;
    activeSubscriberCount: number;
  }>("/metrics", { query: { period } });
  return {
    period,
    ...res.stats,
    subscriberCount: res.subscriberCount,
    activeSubscriberCount: res.activeSubscriberCount,
  };
}

export type SendEventBreakdown = {
  retentionDays: number;
  sent: number;
  delivered: number;
  permanentBounces: number;
  temporaryBounces: number;
  complaints: number;
  delayed: number;
  permanentBounceRate: number;
  temporaryBounceRate: number;
  complaintRate: number;
  delayRate: number;
  dailySent: { date: string; count: number }[];
};

// Sequenzy doesn't expose a "delayed" flag directly, so a send counts as delayed once
// delivery took more than 5 minutes after being sent — long enough to rule out normal
// SMTP handshake time, short enough to flag real receiving-server backpressure.
const DELAY_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Bounce/complaint/delivery-delay breakdown, derived from the raw per-recipient send
 * log rather than /metrics (which only totals sent/delivered/bounced). Limited to the
 * same 14-day retention window as getTestEmailCount — Sequenzy doesn't keep send-level
 * detail any longer than that, regardless of the period selected elsewhere on the page.
 */
export async function getSendEventBreakdown(days = 14): Promise<SendEventBreakdown> {
  type Send = {
    isTestEmail: boolean;
    bounceType: string | null;
    complainedAt: string | null;
    sentAt: string;
    deliveredAt: string | null;
  };
  let page = 1;
  let retentionDays = days;
  const sends: Send[] = [];
  for (let i = 0; i < 10; i++) {
    const res = await request<{
      retentionDays: number;
      emailSends: Send[];
      pagination: { page: number; totalPages: number };
    }>("/email-sends", { query: { days, page, limit: 100 } });
    retentionDays = res.retentionDays;
    sends.push(...res.emailSends.filter((e) => !e.isTestEmail));
    if (page >= res.pagination.totalPages) break;
    page += 1;
  }

  const sent = sends.length;
  const delivered = sends.filter((e) => e.deliveredAt).length;
  const permanentBounces = sends.filter((e) => e.bounceType === "permanent").length;
  const temporaryBounces = sends.filter((e) => e.bounceType && e.bounceType !== "permanent").length;
  const complaints = sends.filter((e) => e.complainedAt).length;
  const delayed = sends.filter(
    (e) => e.deliveredAt && new Date(e.deliveredAt).getTime() - new Date(e.sentAt).getTime() > DELAY_THRESHOLD_MS
  ).length;

  const dailyMap = new Map<string, number>();
  for (const e of sends) {
    const day = e.sentAt.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const dailySent = [...dailyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

  const pct = (n: number, denom: number) => (denom > 0 ? (n / denom) * 100 : 0);

  return {
    retentionDays,
    sent,
    delivered,
    permanentBounces,
    temporaryBounces,
    complaints,
    delayed,
    permanentBounceRate: pct(permanentBounces, sent),
    temporaryBounceRate: pct(temporaryBounces, sent),
    complaintRate: pct(complaints, delivered),
    delayRate: pct(delayed, delivered),
    dailySent,
  };
}

// ---- Company profile / email design ----
//
// Sequenzy stores brand identity and the email design system on the company
// record, exactly as shown in Sequenzy's own dashboard (Settings). There's no
// per-app storage for this — reading/writing it here reads/writes the same
// record the team sees in Sequenzy, so it stays in sync everywhere emails are
// sent from.

export type EmailThemePresetId = "default" | "soft" | "editorial" | "bold";
export type EmailButtonStyle = "solid" | "outline";

export type EmailThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  heading: string;
  border: string;
  link: string;
  primary: string;
  buttonText: string;
};

export type EmailThemeLayout = {
  contentWidth: number;
  containerPaddingX: number;
  containerPaddingY: number;
  sectionPadding: number;
  blockSpacing: number;
  baseRadius: number;
  buttonRadius: number;
  buttonPaddingX: number;
  buttonPaddingY: number;
  borderedBlockPadding: number;
};

export type EmailThemeTypography = {
  baseFontSize: number;
  baseLineHeight: number;
  leadFontSize: number;
  heading1Size: number;
  heading2Size: number;
  heading3Size: number;
  headingFontWeight: number;
  headingLetterSpacing: number;
  buttonFontSize: number;
  buttonFontWeight: number;
};

export type EmailTheme = {
  presetId: EmailThemePresetId;
  buttonStyle: EmailButtonStyle;
  colors: EmailThemeColors;
  layout: EmailThemeLayout;
  typography: EmailThemeTypography;
};

export type BrandColors = { primary?: string; secondary?: string; accent?: string; background?: string };

export type CompanyProfile = {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  primaryColor: string | null;
  brandColors: BrandColors | null;
  socialLinks: Record<string, string> | null;
  privacyPolicyUrl: string | null;
  termsUrl: string | null;
  address: string | null;
  emailTheme: EmailTheme;
  defaultFromEmail: string | null;
  defaultFromName: string | null;
  defaultReplyToName: string | null;
  defaultReplyToEmail: string | null;
};

async function getCurrentCompanyId(): Promise<string> {
  const res = await request<{ success: boolean; currentCompanyId: string }>("/account");
  return res.currentCompanyId;
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const companyId = await getCurrentCompanyId();
  const res = await request<{ success: boolean; company: CompanyProfile }>(`/companies/${encodeURIComponent(companyId)}`);
  return res.company;
}

export type CompanyProfilePatch = Partial<{
  name: string;
  logoUrl: string;
  primaryColor: string;
  brandColors: BrandColors;
  socialLinks: Record<string, string>;
  privacyPolicyUrl: string;
  termsUrl: string;
  address: string;
  emailTheme: Partial<Omit<EmailTheme, "colors" | "layout" | "typography">> & {
    colors?: Partial<EmailThemeColors>;
    layout?: Partial<EmailThemeLayout>;
    typography?: Partial<EmailThemeTypography>;
  };
}>;

export async function updateCompanyProfile(patch: CompanyProfilePatch): Promise<CompanyProfile> {
  const companyId = await getCurrentCompanyId();
  const res = await request<{ success: boolean; company: CompanyProfile }>(`/companies/${encodeURIComponent(companyId)}`, {
    method: "PATCH",
    body: patch,
  });
  return res.company;
}

// ---- Notification preferences ----

export type NotificationEvent = "new_subscriber" | "form_submitted" | "campaign_completed" | "weekly_report";
export type NotificationMode = "off" | "instant" | "daily" | "weekly";

export async function getNotificationPreferences(): Promise<{
  preferences: { event: NotificationEvent; mode: NotificationMode }[];
  supportedModes: Record<NotificationEvent, NotificationMode[]>;
}> {
  const res = await request<{
    success: boolean;
    notificationPreferences: { event: NotificationEvent; mode: NotificationMode }[];
    supportedModes: Record<NotificationEvent, NotificationMode[]>;
  }>("/notification-preferences");
  return { preferences: res.notificationPreferences, supportedModes: res.supportedModes };
}

export async function updateNotificationPreferences(
  preferences: { event: NotificationEvent; mode: NotificationMode }[]
): Promise<void> {
  await request("/notification-preferences", { method: "PATCH", body: { notificationPreferences: preferences } });
}

// ---- Campaigns ----

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "waiting_approval"
  | "rejected"
  | "sending"
  | "paused"
  | "sent"
  | "cancelled";

export type CampaignAudience =
  | { type: "all" }
  | { type: "lists"; listIds: string[] }
  | { type: "segment"; segmentId: string }
  | { type: "filtered"; filters: { id: string; field: string; operator: string; value: string }[]; filterJoinOperator: "and" | "or" };

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  hasAudience: boolean;
  rejectionComment: string | null;
  labels: string[];
  targetLists?: CampaignAudience;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  url: string;
  previewUrl: string;
  fromName?: string | null;
  fromEmail?: string | null;
  replyToName?: string | null;
  replyToEmail?: string | null;
  ccEmails?: string[] | null;
  bccEmails?: string[] | null;
};

export type CampaignDetail = Campaign & {
  preheaderText: string | null;
  blocks: unknown[];
};

/** Builds a campaign audience that targets all contacts carrying a given tag. */
export function tagAudience(tag: string): CampaignAudience {
  return { type: "filtered", filters: [{ id: "f1", field: "tag", operator: "is", value: tag }], filterJoinOperator: "and" };
}

export function allAudience(): CampaignAudience {
  return { type: "all" };
}

export async function listCampaigns(params?: { status?: CampaignStatus; limit?: number; offset?: number }): Promise<{
  data: Campaign[];
  meta: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const res = await request<{
    success: boolean;
    campaigns: Campaign[];
    pagination: { limit: number; offset: number; count: number; total: number; hasMore: boolean };
  }>("/campaigns", { query: { status: params?.status, limit: params?.limit, offset: params?.offset } });
  return {
    data: res.campaigns,
    meta: { total: res.pagination.total, limit: res.pagination.limit, offset: res.pagination.offset, hasMore: res.pagination.hasMore },
  };
}

/**
 * Sender/reply-to fields shared by campaigns and sequences. `fromName` requires
 * `fromEmail` (and vice versa isn't required), same for `replyToName`/`replyTo` —
 * Sequenzy rejects a name sent without its paired address. `ccEmails` is
 * campaign-only; Sequenzy silently ignores it on sequences.
 */
export type SenderReplyFields = {
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  replyToName?: string;
  ccEmails?: string[];
  bccEmails?: string[];
};

export async function createCampaign(
  input: {
    name: string;
    subject: string;
    previewText?: string;
    html: string;
    targetLists?: CampaignAudience;
  } & SenderReplyFields
): Promise<Campaign> {
  // Sequenzy's POST /campaigns silently ignores ccEmails/bccEmails (confirmed by
  // testing — they're accepted on PUT but dropped on create with no error), so
  // creating with CC/BCC set requires an immediate follow-up PUT.
  const { ccEmails, bccEmails, ...createInput } = input;
  const res = await request<{ success: boolean; campaign: Campaign }>("/campaigns", { method: "POST", body: createInput });
  const campaign = res.campaign;
  if (ccEmails?.length || bccEmails?.length) {
    return updateCampaign(campaign.id, { ccEmails, bccEmails });
  }
  return campaign;
}

export async function getCampaign(id: string): Promise<CampaignDetail> {
  const res = await request<{ success: boolean; campaign: CampaignDetail }>(`/campaigns/${encodeURIComponent(id)}`);
  return res.campaign;
}

export async function updateCampaign(
  id: string,
  input: Partial<
    { name: string; subject: string; previewText: string; html: string; targetLists: CampaignAudience } & SenderReplyFields
  >
): Promise<Campaign> {
  const res = await request<{ success: boolean; campaign: Campaign }>(`/campaigns/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
  });
  return res.campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  await request<{ success: boolean }>(`/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function sendCampaignTest(id: string, to: string): Promise<void> {
  await request(`/campaigns/${encodeURIComponent(id)}/test`, { method: "POST", body: { to } });
}

export async function scheduleCampaign(
  id: string,
  input: { scheduledAt: string; targetLists?: CampaignAudience }
): Promise<{ status: CampaignStatus; scheduledAt: string; message: string }> {
  const res = await request<{ success: boolean; message: string; scheduledAt: string; campaign: { status: CampaignStatus } }>(
    `/campaigns/${encodeURIComponent(id)}/schedule`,
    { method: "POST", body: input }
  );
  return { status: res.campaign.status, scheduledAt: res.scheduledAt, message: res.message };
}

export async function cancelCampaign(id: string): Promise<void> {
  await request(`/campaigns/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export async function renderCampaign(id: string): Promise<{ html: string; subject: string; previewText: string | null }> {
  const res = await request<{ success: boolean; html: string; subject: string; previewText: string | null }>(
    `/campaigns/${encodeURIComponent(id)}/render`,
    { method: "POST", body: {} }
  );
  return { html: res.html, subject: res.subject, previewText: res.previewText };
}

export async function getCampaignAudience(id: string): Promise<{ summary: string; recipientCount: number; isUnset: boolean }> {
  const res = await request<{
    success: boolean;
    audience: { summary: string; isUnset: boolean };
    recipientCount: number;
  }>(`/campaigns/${encodeURIComponent(id)}/audience`);
  return { summary: res.audience.summary, recipientCount: res.recipientCount, isUnset: res.audience.isUnset };
}

export type CampaignMetrics = {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
};

export type ClickedLink = { url: string; clicks: number; percentage: number };

export async function getCampaignMetrics(id: string): Promise<{ stats: CampaignMetrics; clickedLinks: ClickedLink[] }> {
  const res = await request<{ success: boolean; stats: CampaignMetrics; clickedLinks?: ClickedLink[] }>(
    `/metrics/campaigns/${encodeURIComponent(id)}`
  );
  return { stats: res.stats, clickedLinks: res.clickedLinks ?? [] };
}

// ---- AI generation ----

export type GeneratedEmail = {
  subject: string;
  previewText: string;
  blocks: Record<string, unknown>[];
};

export async function generateEmail(input: {
  prompt: string;
  style?: string;
  tone?: string;
}): Promise<GeneratedEmail> {
  const res = await request<{ success: boolean; subject: string; previewText: string; blocks: Record<string, unknown>[] }>(
    "/generate/email",
    { method: "POST", body: { ...input, applyBranding: false, emailType: "marketing" } }
  );
  return { subject: res.subject, previewText: res.previewText, blocks: res.blocks };
}

export async function generateSubjects(topic: string, count = 5): Promise<string[]> {
  const res = await request<{ success: boolean; subjects: string[] }>("/generate/subjects", {
    method: "POST",
    body: { topic, count },
  });
  return res.subjects;
}

// ---- Sequences ----

export type SequenceStatus = "draft" | "active" | "paused" | "archived";
export type SequenceEffectiveStatus = "draft" | "live" | "enrollment_paused" | "paused" | "archived";
export type SequenceTrigger = "contact_added" | "tag_added";

export type Sequence = {
  id: string;
  name: string;
  status: SequenceStatus;
  effectiveStatus: SequenceEffectiveStatus;
  effectiveStatusSummary: string;
  acceptsNewEnrollments: boolean;
  createdAt: string;
};

export type SequenceEmailStep = {
  nodeId: string;
  emailId: string;
  stepNumber: number;
  subject: string;
  previewText: string | null;
  delayDisplay: string | null;
  nodeType: string;
};

export type SequenceDetail = Sequence & {
  trigger: string;
  emails: SequenceEmailStep[];
  fromName?: string | null;
  fromEmail?: string | null;
  replyToName?: string | null;
  replyToEmail?: string | null;
  bccEmails?: string[] | null;
};

export type SequenceStepInput = {
  subject: string;
  previewText?: string;
  html: string;
  delayDays: number;
};

export async function listSequences(): Promise<{ data: Sequence[] }> {
  const res = await request<{ success: boolean; sequences: Sequence[] }>("/sequences");
  return { data: res.sequences };
}

export async function createSequence(
  input: {
    name: string;
    trigger: SequenceTrigger;
    tagName?: string;
    steps: SequenceStepInput[];
  } & Pick<SenderReplyFields, "fromName" | "fromEmail" | "replyTo" | "replyToName" | "bccEmails">
): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    name: input.name,
    trigger: input.trigger,
    fromName: input.fromName || undefined,
    fromEmail: input.fromEmail || undefined,
    replyTo: input.replyTo || undefined,
    replyToName: input.replyToName || undefined,
    bccEmails: input.bccEmails && input.bccEmails.length > 0 ? input.bccEmails : undefined,
    steps: input.steps.map((step) => ({
      type: "email",
      subject: step.subject,
      previewText: step.previewText || undefined,
      html: step.html,
      delay: { mode: "duration", days: step.delayDays },
    })),
  };
  if (input.trigger === "tag_added") body.tagName = input.tagName;
  const res = await request<{ success: boolean; sequence: { id: string } }>("/sequences", {
    method: "POST",
    body,
  });
  return { id: res.sequence.id };
}

export async function getSequence(id: string): Promise<SequenceDetail> {
  const res = await request<{ success: boolean; sequence: SequenceDetail }>(`/sequences/${encodeURIComponent(id)}`);
  return res.sequence;
}

export async function enableSequence(id: string): Promise<void> {
  await request(`/sequences/${encodeURIComponent(id)}/enable`, { method: "POST" });
}

export async function disableSequence(id: string): Promise<void> {
  await request(`/sequences/${encodeURIComponent(id)}/disable`, { method: "POST" });
}

export async function deleteSequence(id: string): Promise<void> {
  await request(`/sequences/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function enrollInSequence(id: string, emails: string[]): Promise<{ enrolled: number; skipped: number; notFound: string[] }> {
  return request(`/sequences/${encodeURIComponent(id)}/enroll`, { method: "POST", body: { emails } });
}

export type SequenceStepStats = {
  step: number;
  nodeId: string;
  subject: string;
  stats: { sent: number; opened: number; clicked: number; openRate: number; clickRate: number };
};

export async function getSequenceStats(id: string): Promise<{
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  enrollmentCounts: { active: number; waiting: number; total: number };
  steps: SequenceStepStats[];
}> {
  const res = await request<{
    success: boolean;
    stats: { sent: number; opened: number; clicked: number; openRate: number; clickRate: number };
    enrollmentCounts: { active: number; waiting: number; total: number };
    steps: SequenceStepStats[];
  }>(`/sequences/${encodeURIComponent(id)}/stats`, { query: { period: "30d" } });
  return { ...res.stats, enrollmentCounts: res.enrollmentCounts, steps: res.steps ?? [] };
}

export async function renderSequenceStep(
  sequenceId: string,
  nodeId: string
): Promise<{ html: string; subject: string; previewText: string | null }> {
  const res = await request<{ success: boolean; html: string; subject: string; previewText: string | null }>(
    `/sequences/${encodeURIComponent(sequenceId)}/nodes/${encodeURIComponent(nodeId)}/render`,
    { method: "POST", body: {} }
  );
  return { html: res.html, subject: res.subject, previewText: res.previewText };
}

export async function sendSequenceStepTest(sequenceId: string, nodeId: string, recipients: string[]): Promise<void> {
  await request(`/sequences/${encodeURIComponent(sequenceId)}/nodes/${encodeURIComponent(nodeId)}/test`, {
    method: "POST",
    body: { recipients },
  });
}

// ---- Lists (internal use — Sequenzy forms require a list) ----

export async function createList(name: string): Promise<{ id: string; name: string }> {
  const res = await request<{ success: boolean; list: { id: string; name: string } }>("/lists", {
    method: "POST",
    body: { name, isPrivate: true },
  });
  return res.list;
}

// ---- Signup forms (widgets) ----

export type SignupForm = {
  id: string;
  name: string;
  status: string;
  submissionCount: number;
  actionUrl: string;
  url: string;
};

export type FormEmbed = {
  actionUrl: string;
  scriptUrl: string;
  javascript: string;
  nativeForm: string;
};

export async function listForms(): Promise<{ data: SignupForm[] }> {
  const res = await request<{ success: boolean; forms: SignupForm[] }>("/forms");
  return { data: res.forms };
}

export async function createForm(input: {
  name: string;
  listIds: string[];
  tagIds?: string[];
  headline?: string;
  description?: string;
  buttonText?: string;
  showFirstName?: boolean;
  successMessage?: string;
}): Promise<{ form: SignupForm; embed: FormEmbed }> {
  const res = await request<{ success: boolean; form: SignupForm; embed: FormEmbed }>("/forms", {
    method: "POST",
    body: {
      ...input,
      theme: { accentColor: "#8a2be2", borderRadius: 8 },
    },
  });
  return { form: res.form, embed: res.embed };
}

export async function getFormEmbed(formId: string): Promise<{ form: SignupForm; embed: FormEmbed }> {
  const res = await request<{ success: boolean; form: SignupForm; embed: FormEmbed }>(
    `/forms/embed/${encodeURIComponent(formId)}`
  );
  return { form: res.form, embed: res.embed };
}

export type FormFieldBlock = {
  id: string;
  kind: "form-field";
  fieldType: "text" | "email" | "phone" | "number" | "textarea" | "select" | "radio" | "checkbox" | "consent" | "hidden";
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  mapsTo?: "email" | "firstName" | "lastName" | "phone" | "customAttribute";
  options?: { value: string; label?: string }[];
  width?: "full" | "half";
};

export type FormBlock =
  | FormFieldBlock
  | { id: string; kind: "heading"; content: string; level?: 1 | 2 | 3 }
  | { id: string; kind: "text"; content: string; variant?: "paragraph" | "eyebrow" | "caption" }
  | { id: string; kind: "submit-button"; text: string };

export async function updateForm(
  id: string,
  input: Partial<{ blocks: FormBlock[]; headline: string; description: string; buttonText: string; successMessage: string; theme: object }>
): Promise<{ form: SignupForm; embed?: FormEmbed }> {
  const res = await request<{ success: boolean; form: SignupForm; embed?: FormEmbed }>(`/forms/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
  return { form: res.form, embed: res.embed };
}

// ---- Outbound webhooks ----

export async function createWebhook(input: { name: string; url: string; events: string[] }): Promise<{ id: string }> {
  const res = await request<{ success: boolean; webhook: { id: string } }>("/webhooks", {
    method: "POST",
    body: input,
  });
  return { id: res.webhook.id };
}

export async function deleteWebhook(id: string): Promise<void> {
  await request(`/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Transactional email ----

export async function sendTransactionalEmail(input: {
  to: string[];
  subject: string;
  body: string;
  replyTo?: string;
  replyToName?: string;
  fromName?: string;
  fromEmail?: string;
}): Promise<{ emailSendId: string }> {
  const res = await request<{ success: boolean; emailSendId: string }>("/transactional/send", {
    method: "POST",
    body: input,
  });
  return { emailSendId: res.emailSendId };
}

// ---- Cross-email analytics ----

export type EmailLeaderboardRow = {
  emailType: "campaign" | "sequence";
  emailId: string;
  name: string;
  campaignId: string | null;
  sequenceId: string | null;
  sequenceName: string | null;
  step: number | null;
  stats: {
    sent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
};

export type EmailLeaderboardTotals = EmailLeaderboardRow["stats"] & { emails: number };

export async function getEmailLeaderboard(params?: {
  period?: "1h" | "24h" | "7d" | "30d" | "90d";
  limit?: number;
}): Promise<{ rows: EmailLeaderboardRow[]; totals: EmailLeaderboardTotals }> {
  const res = await request<{ success: boolean; emails: EmailLeaderboardRow[]; totals: EmailLeaderboardTotals }>(
    "/metrics/emails",
    { query: { period: params?.period ?? "30d", limit: params?.limit ?? 20, sort: "sent" } }
  );
  return { rows: res.emails, totals: res.totals };
}

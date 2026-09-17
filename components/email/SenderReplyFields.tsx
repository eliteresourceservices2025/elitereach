export type SenderReplyValue = {
  fromName: string;
  fromEmail: string;
  replyToName: string;
  replyTo: string;
  cc: string;
  bcc: string;
};

export function emptySenderReply(defaults?: Partial<SenderReplyValue>): SenderReplyValue {
  return {
    fromName: defaults?.fromName ?? "",
    fromEmail: defaults?.fromEmail ?? "",
    replyToName: defaults?.replyToName ?? "",
    replyTo: defaults?.replyTo ?? "",
    cc: defaults?.cc ?? "",
    bcc: defaults?.bcc ?? "",
  };
}

/** Splits a comma-separated email list into a clean array, or undefined if empty. */
export function parseEmailList(raw: string): string[] | undefined {
  const emails = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return emails.length > 0 ? emails : undefined;
}

export function SenderReplyFields({
  value,
  onChange,
  showCc = true,
}: {
  value: SenderReplyValue;
  onChange: (value: SenderReplyValue) => void;
  showCc?: boolean;
}) {
  function set<K extends keyof SenderReplyValue>(key: K, v: SenderReplyValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">From</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={value.fromName}
            onChange={(e) => set("fromName", e.target.value)}
            placeholder="Sender name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={value.fromEmail}
            onChange={(e) => set("fromEmail", e.target.value)}
            placeholder="sender@news.eliteresourceservices.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Reply-to</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={value.replyToName}
            onChange={(e) => set("replyToName", e.target.value)}
            placeholder="Reply-to name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={value.replyTo}
            onChange={(e) => set("replyTo", e.target.value)}
            placeholder="staff@eliteresourceservices.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className={`grid gap-2 ${showCc ? "grid-cols-2" : "grid-cols-1"}`}>
        {showCc && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">CC</label>
            <input
              value={value.cc}
              onChange={(e) => set("cc", e.target.value)}
              placeholder="staff1@..., staff2@..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">BCC</label>
          <input
            value={value.bcc}
            onChange={(e) => set("bcc", e.target.value)}
            placeholder="staff1@..., staff2@..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

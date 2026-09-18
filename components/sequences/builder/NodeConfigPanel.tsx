"use client";

import { useState } from "react";
import type { CustomAttributeUpdate, EventSchemaSummary, SequenceEmailStep, SequenceList, SequenceNode, Tag, EmailTheme } from "@/lib/sequenzy";
import type { EmailBrand } from "@/lib/email-template";
import { wrapBrandedEmail } from "@/lib/email-template";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import { DevicePreview } from "@/components/email/DevicePreview";
import { EventNameField } from "../EventNameField";
import { DelayFields, emptyDelay } from "./DelayFields";
import { isBranchNode, isSupportedNodeType, isTriggerNode } from "./types";

export function NodeConfigPanel({
  node,
  email,
  allTags,
  lists,
  knownEvents,
  theme,
  brand,
  onSave,
  onDelete,
  onClose,
}: {
  node: SequenceNode;
  email?: SequenceEmailStep;
  allTags: Tag[];
  lists: SequenceList[];
  knownEvents: EventSchemaSummary[];
  theme?: EmailTheme;
  brand?: EmailBrand;
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const isEnd = node.config?.isEndNode === true;

  if (isTriggerNode(node) || isEnd) {
    return (
      <Panel title={isEnd ? "Sequence complete" : "Trigger"} onClose={onClose}>
        <p className="text-sm text-gray-500">
          {isEnd ? "Recipients reaching here have finished the sequence." : "Edit the trigger from the sequence settings above."}
        </p>
      </Panel>
    );
  }

  if (isBranchNode(node)) {
    const branches = Array.isArray(node.config?.branches) ? (node.config.branches as Record<string, unknown>[]) : [];
    return (
      <Panel title="If / Else" onClose={onClose}>
        <p className="text-sm text-gray-700">{(node.config?.label as string) || "Branch"}</p>
        {branches.map((b, i) => (
          <p key={i} className="text-xs text-gray-500">
            If: {String(b.conditionType ?? "").replace(/_/g, " ")}
            {b.tagName ? ` "${b.tagName}"` : ""}
          </p>
        ))}
        <p className="text-xs text-gray-400">
          Condition editing isn&apos;t supported here yet — add steps to each path by clicking the + below them. Deleting
          this branch keeps the Else path&apos;s continuation and discards the If path along with any steps in it.
        </p>
        <div className="flex justify-between pt-1">
          <button onClick={onDelete} className="text-xs text-red-500 hover:underline">
            Delete branch
          </button>
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200">
            Close
          </button>
        </div>
      </Panel>
    );
  }

  if (!isSupportedNodeType(node.nodeType)) {
    return (
      <Panel title={node.nodeType.replace(/^(action|logic)_/, "").replace(/_/g, " ")} onClose={onClose}>
        <p className="text-sm text-gray-500">
          This step type isn&apos;t editable here yet. Manage it from Sequenzy&apos;s own dashboard for now.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
          {JSON.stringify(node.config, null, 2)}
        </pre>
      </Panel>
    );
  }

  switch (node.nodeType) {
    case "action_email":
      return (
        <EmailPanel email={email} theme={theme} brand={brand} onSave={onSave} onDelete={onDelete} onClose={onClose} />
      );
    case "logic_delay":
      return <DelayPanel node={node} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
    case "logic_wait_for_event":
      return <WaitForEventPanel node={node} knownEvents={knownEvents} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
    case "action_add_tag":
    case "action_remove_tag":
      return <TagActionPanel node={node} allTags={allTags} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
    case "action_add_to_list":
    case "action_remove_from_list":
      return <ListActionPanel node={node} lists={lists} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
    case "action_update_attributes":
      return <UpdateSubscriberPanel node={node} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
    default:
      return null;
  }
}

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold capitalize text-elite-navy-dark">{title}</h3>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PanelActions({
  onSave,
  onDelete,
  saving,
}: {
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      <button onClick={onDelete} className="text-xs text-red-500 hover:underline">
        Delete step
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-elite-violet px-3 py-1.5 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function EmailPanel({
  email,
  theme,
  brand,
  onSave,
  onDelete,
  onClose,
}: {
  email?: SequenceEmailStep & { previewText?: string | null };
  theme?: EmailTheme;
  brand?: EmailBrand;
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(email?.subject ?? "");
  const [previewText, setPreviewText] = useState(email?.previewText ?? "");
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewHtml = wrapBrandedEmail({ previewText, bodyHtml: html || "<p></p>", theme, brand });

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ subject, previewText, html: html || undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Send Email" onClose={onClose}>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Subject line</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Preview text</span>
        <input
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <div>
        <span className="mb-1 block text-xs font-medium text-gray-500">
          Body {!html && <span className="text-gray-400">(leave blank to keep the current content)</span>}
        </span>
        <RichTextEditor value={html} onChange={setHtml} />
      </div>
      <button type="button" onClick={() => setShowPreview((v) => !v)} className="text-xs text-elite-violet hover:underline">
        {showPreview ? "Hide preview" : "Preview"}
      </button>
      {showPreview && <DevicePreview html={previewHtml} />}
      <PanelActions onSave={handleSave} onDelete={onDelete} saving={saving} />
    </Panel>
  );
}

function DelayPanel({
  node,
  onSave,
  onDelete,
  onClose,
}: {
  node: SequenceNode;
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const c = node.config;
  const [delay, setDelay] = useState(
    emptyDelay({ days: Number(c?.delayDays ?? 0), hours: Number(c?.delayHours ?? 0), minutes: Number(c?.delayMinutes ?? 0) })
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ delay });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Delay" onClose={onClose}>
      <DelayFields value={delay} onChange={setDelay} />
      <PanelActions onSave={handleSave} onDelete={onDelete} saving={saving} />
    </Panel>
  );
}

function WaitForEventPanel({
  node,
  knownEvents,
  onSave,
  onDelete,
  onClose,
}: {
  node: SequenceNode;
  knownEvents: EventSchemaSummary[];
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const c = node.config;
  const [eventName, setEventName] = useState((c?.eventName as string) ?? "");
  const [timeoutDays, setTimeoutDays] = useState(Number(c?.timeoutDays ?? 7));
  const [timeoutAction, setTimeoutAction] = useState<"continue" | "exit">((c?.timeoutAction as "continue" | "exit") ?? "continue");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ eventName, timeoutDays, timeoutAction });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Wait for Event" onClose={onClose}>
      <EventNameField id="edit-wait" value={eventName} onChange={setEventName} knownEvents={knownEvents} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Timeout (days)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={timeoutDays}
            onChange={(e) => setTimeoutDays(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">On timeout</span>
          <select
            value={timeoutAction}
            onChange={(e) => setTimeoutAction(e.target.value as "continue" | "exit")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="continue">Continue sequence</option>
            <option value="exit">Exit sequence</option>
          </select>
        </label>
      </div>
      <PanelActions onSave={handleSave} onDelete={onDelete} saving={saving} />
    </Panel>
  );
}

function TagActionPanel({
  node,
  allTags,
  onSave,
  onDelete,
  onClose,
}: {
  node: SequenceNode;
  allTags: Tag[];
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const isAdd = node.nodeType === "action_add_tag";
  const [tagName, setTagName] = useState((node.config?.tagName as string) ?? allTags[0]?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ tagName });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={isAdd ? "Add Tag" : "Remove Tag"} onClose={onClose}>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Tag</span>
        <select
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {allTags.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <PanelActions onSave={handleSave} onDelete={onDelete} saving={saving} />
    </Panel>
  );
}

function ListActionPanel({
  node,
  lists,
  onSave,
  onDelete,
  onClose,
}: {
  node: SequenceNode;
  lists: SequenceList[];
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const isAdd = node.nodeType === "action_add_to_list";
  const [listId, setListId] = useState((node.config?.listId as string) ?? lists[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ listId });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={isAdd ? "Add to List" : "Remove from List"} onClose={onClose}>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">List</span>
        <select
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <PanelActions onSave={handleSave} onDelete={onDelete} saving={saving} />
    </Panel>
  );
}

function UpdateSubscriberPanel({
  node,
  onSave,
  onDelete,
  onClose,
}: {
  node: SequenceNode;
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const c = node.config;
  const [firstName, setFirstName] = useState((c?.firstName as string) ?? "");
  const [lastName, setLastName] = useState((c?.lastName as string) ?? "");
  const [attrs, setAttrs] = useState<CustomAttributeUpdate[]>(
    Array.isArray(c?.customAttributeUpdates) ? (c.customAttributeUpdates as CustomAttributeUpdate[]) : []
  );
  const [saving, setSaving] = useState(false);

  function addRow() {
    setAttrs((prev) => [...prev, { name: "", value: "", valueType: "text" }]);
  }
  function updateRow(i: number, patch: Partial<CustomAttributeUpdate>) {
    setAttrs((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeRow(i: number) {
    setAttrs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        customAttributeUpdates: attrs.filter((a) => a.name.trim()),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Update Subscriber" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">First name</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Last name</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="space-y-2">
        <span className="block text-xs font-medium text-gray-500">Custom attributes</span>
        {attrs.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={a.name}
              onChange={(e) => updateRow(i, { name: e.target.value })}
              placeholder="field name"
              className="w-1/3 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
            />
            <input
              value={a.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              placeholder="value or {{merge.tag}}"
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
            />
            <select
              value={a.valueType}
              onChange={(e) => updateRow(i, { valueType: e.target.value as CustomAttributeUpdate["valueType"] })}
              className="rounded-lg border border-gray-300 px-1 py-1.5 text-xs"
            >
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
            <button type="button" onClick={() => removeRow(i)} className="text-xs text-red-500">
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-xs text-elite-violet hover:underline">
          + Add field
        </button>
      </div>
      <PanelActions onSave={handleSave} onDelete={onDelete} saving={saving} />
    </Panel>
  );
}

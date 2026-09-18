"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import type { CustomAttributeUpdate, EventSchemaSummary, InsertableStep, SequenceList, Tag } from "@/lib/sequenzy";
import { ADD_STEP_TYPES, type SupportedNodeType } from "./types";
import { DelayFields, emptyDelay } from "./DelayFields";
import { EventNameField } from "../EventNameField";
import { AIGenerator } from "@/components/email/AIGenerator";
import { RichTextEditor } from "@/components/email/RichTextEditor";

export function AddStepModal({
  allTags,
  lists,
  knownEvents,
  initialType = null,
  onSubmit,
  onSelectBranch,
  onCancel,
}: {
  allTags: Tag[];
  lists: SequenceList[];
  knownEvents: EventSchemaSummary[];
  initialType?: SupportedNodeType | null;
  onSubmit: (step: InsertableStep) => Promise<void>;
  onSelectBranch: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<SupportedNodeType | null>(initialType);
  const [emailMode, setEmailMode] = useState<"write" | "ai">("write");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [html, setHtml] = useState("");
  const [delay, setDelay] = useState(emptyDelay());
  const [eventName, setEventName] = useState("");
  const [timeoutDays, setTimeoutDays] = useState(7);
  const [timeoutAction, setTimeoutAction] = useState<"continue" | "exit">("continue");
  const [tagName, setTagName] = useState(allTags[0]?.name ?? "");
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [attrs, setAttrs] = useState<CustomAttributeUpdate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addAttrRow() {
    setAttrs((prev) => [...prev, { name: "", value: "", valueType: "text" }]);
  }
  function updateAttrRow(i: number, patch: Partial<CustomAttributeUpdate>) {
    setAttrs((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeAttrRow(i: number) {
    setAttrs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!type) return;
    setError(null);

    let step: InsertableStep;
    switch (type) {
      case "action_email":
        if (!subject.trim()) return setError("Subject is required.");
        step = { subject, html: html || "<p></p>", previewText: previewText || undefined };
        break;
      case "logic_delay":
        if (delay.days === 0 && delay.hours === 0 && delay.minutes === 0) return setError("Enter a delay greater than zero.");
        step = { nodeType: "logic_delay", delay };
        break;
      case "logic_wait_for_event":
        if (!eventName.trim()) return setError("Event name is required.");
        step = { nodeType: "logic_wait_for_event", config: { eventName, timeoutDays, timeoutAction } };
        break;
      case "action_add_tag":
      case "action_remove_tag":
        if (!tagName.trim()) return setError("Choose a tag.");
        step = { nodeType: type, config: { tagName } };
        break;
      case "action_add_to_list":
      case "action_remove_from_list":
        if (!listId.trim()) return setError("Choose a list.");
        step = { nodeType: type, config: { listId } };
        break;
      case "action_update_attributes":
        if (!firstName.trim() && !lastName.trim() && attrs.length === 0) {
          return setError("Set at least one field to update.");
        }
        step = {
          nodeType: "action_update_attributes",
          config: {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            customAttributeUpdates: attrs.filter((a) => a.name.trim()),
          },
        };
        break;
    }

    setSubmitting(true);
    try {
      await onSubmit(step);
    } catch {
      setError("Failed to add step.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-elite-navy-dark">Add a step</h2>

        {!type ? (
          <div className="mt-3 space-y-2">
            {ADD_STEP_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-elite-violet/40 hover:bg-elite-violet/5"
              >
                <p className="text-sm font-medium text-elite-navy-dark">{t.label}</p>
                <p className="text-xs text-gray-400">{t.description}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={onSelectBranch}
              className="flex w-full items-start gap-2 rounded-lg border border-gray-200 p-3 text-left hover:border-fuchsia-300 hover:bg-fuchsia-50"
            >
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" />
              <span>
                <p className="text-sm font-medium text-elite-navy-dark">Branch (If/Else)</p>
                <p className="text-xs text-gray-400">Split the sequence based on a condition.</p>
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <button type="button" onClick={() => setType(null)} className="text-xs text-elite-violet hover:underline">
              ← Choose a different type
            </button>

            {type === "action_email" && (
              <div className="space-y-3">
                <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-xs">
                  {(["write", "ai"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEmailMode(m)}
                      className={`flex-1 rounded-md py-1.5 font-medium transition ${
                        emailMode === m ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {m === "write" ? "Write" : "Describe with AI"}
                    </button>
                  ))}
                </div>

                {emailMode === "ai" && (
                  <AIGenerator
                    onGenerated={(result) => {
                      setSubject(result.subject);
                      setPreviewText(result.previewText);
                      setHtml(result.bodyHtml);
                    }}
                  />
                )}

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">Subject line</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    autoFocus
                  />
                </label>

                {emailMode === "ai" && html ? (
                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-500">
                      Body (generated — you can still edit after adding)
                    </span>
                    <RichTextEditor value={html} onChange={setHtml} />
                  </div>
                ) : (
                  <span className="block text-xs text-gray-400">You&apos;ll write the body after adding this step.</span>
                )}
              </div>
            )}

            {type === "logic_delay" && <DelayFields value={delay} onChange={setDelay} />}

            {type === "logic_wait_for_event" && (
              <>
                <EventNameField id="add-step-wait" value={eventName} onChange={setEventName} knownEvents={knownEvents} autoFocus />
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
              </>
            )}

            {(type === "action_add_tag" || type === "action_remove_tag") && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Tag</span>
                <select
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {allTags.length === 0 && <option value="">No tags available</option>}
                  {allTags.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {(type === "action_add_to_list" || type === "action_remove_from_list") && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">List</span>
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {lists.length === 0 && <option value="">No lists available</option>}
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {type === "action_update_attributes" && (
              <div className="space-y-2">
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
                        onChange={(e) => updateAttrRow(i, { name: e.target.value })}
                        placeholder="field name"
                        className="w-1/3 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <input
                        value={a.value}
                        onChange={(e) => updateAttrRow(i, { value: e.target.value })}
                        placeholder="value or {{merge.tag}}"
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <select
                        value={a.valueType}
                        onChange={(e) => updateAttrRow(i, { valueType: e.target.value as CustomAttributeUpdate["valueType"] })}
                        className="rounded-lg border border-gray-300 px-1 py-1.5 text-xs"
                      >
                        <option value="text">text</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                      <button type="button" onClick={() => removeAttrRow(i)} className="text-xs text-red-500">
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addAttrRow} className="text-xs text-elite-violet hover:underline">
                    + Add field
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-elite-violet px-3 py-1.5 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add step"}
              </button>
            </div>
          </div>
        )}

        {!type && (
          <div className="mt-4 flex justify-end">
            <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { BranchCondition, EventSchemaSummary, InsertableStep, SequenceList, Tag } from "@/lib/sequenzy";
import { BRANCH_CONDITION_TYPES, type BranchConditionTypeOption } from "./types";
import { BranchPathStepPicker } from "./BranchPathStepPicker";
import { EventNameField } from "../EventNameField";

export function AddBranchModal({
  allTags,
  lists,
  knownEvents,
  onSubmit,
  onCancel,
}: {
  allTags: Tag[];
  lists: SequenceList[];
  knownEvents: EventSchemaSummary[];
  onSubmit: (input: { label: string; condition: BranchCondition; ifSteps: InsertableStep[]; elseSteps: InsertableStep[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [conditionType, setConditionType] = useState<BranchConditionTypeOption>("has_tag");
  const [tagName, setTagName] = useState(allTags[0]?.name ?? "");
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [eventName, setEventName] = useState("");
  const [activityScope, setActivityScope] = useState<"this_sequence" | "previous_email" | "ever">("ever");
  const [ifStep, setIfStep] = useState<InsertableStep | null>(null);
  const [elseStep, setElseStep] = useState<InsertableStep | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    let condition: BranchCondition;
    switch (conditionType) {
      case "has_tag":
      case "does_not_have_tag":
        if (!tagName) return setError("Choose a tag.");
        condition = { conditionType, tagName };
        break;
      case "in_list":
        if (!listId) return setError("Choose a list.");
        condition = { conditionType: "in_list", listId };
        break;
      case "event_received":
        if (!eventName.trim()) return setError("Enter an event name.");
        condition = { conditionType: "event_received", eventName, activityScope };
        break;
      case "link_clicked":
        condition = { conditionType: "link_clicked", activityScope };
        break;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        label: label.trim() || "Branch",
        condition,
        ifSteps: ifStep ? [ifStep] : [],
        elseSteps: elseStep ? [elseStep] : [],
      });
    } catch {
      setError("Failed to add branch.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-elite-navy-dark">Add a branch (If/Else)</h2>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Label (optional)</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Has VIP tag?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">If</span>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value as BranchConditionTypeOption)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {BRANCH_CONDITION_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {(conditionType === "has_tag" || conditionType === "does_not_have_tag") && (
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
        )}

        {conditionType === "in_list" && (
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
        )}

        {conditionType === "event_received" && (
          <EventNameField id="branch-condition" value={eventName} onChange={setEventName} knownEvents={knownEvents} />
        )}

        {(conditionType === "event_received" || conditionType === "link_clicked") && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">When</span>
            <select
              value={activityScope}
              onChange={(e) => setActivityScope(e.target.value as "this_sequence" | "previous_email" | "ever")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ever">Any time</option>
              <option value="this_sequence">During this sequence</option>
              <option value="previous_email">On the previous email</option>
            </select>
          </label>
        )}

        <BranchPathStepPicker label="If true" allTags={allTags} lists={lists} onChange={setIfStep} />
        <BranchPathStepPicker label="Else" allTags={allTags} lists={lists} onChange={setElseStep} />
        <p className="text-xs text-gray-400">
          Both paths reconnect to the rest of the sequence automatically. You can add more steps to a path later, once it
          has at least one step.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-elite-violet px-3 py-1.5 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add branch"}
          </button>
        </div>
      </div>
    </div>
  );
}

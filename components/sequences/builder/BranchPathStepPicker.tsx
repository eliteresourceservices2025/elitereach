"use client";

import { useEffect, useState } from "react";
import type { InsertableStep, SequenceList, Tag } from "@/lib/sequenzy";
import { BRANCH_STEP_TYPES, type SupportedNodeType } from "./types";

/** Picks at most one step to seed a branch path with, at branch-creation
 * time — Sequenzy rejects inserting steps directly after a branch node
 * later, so this is the only point a path's first step can be set. */
export function BranchPathStepPicker({
  label,
  allTags,
  lists,
  onChange,
}: {
  label: string;
  allTags: Tag[];
  lists: SequenceList[];
  onChange: (step: InsertableStep | null) => void;
}) {
  const [type, setType] = useState<SupportedNodeType | "none">("none");
  const [subject, setSubject] = useState("");
  const [tagName, setTagName] = useState(allTags[0]?.name ?? "");
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (type === "none") return onChange(null);
    if (type === "action_email") return onChange(subject.trim() ? { subject, html: "<p></p>" } : null);
    if (type === "action_add_tag" || type === "action_remove_tag") {
      return onChange(tagName ? { nodeType: type, config: { tagName } } : null);
    }
    if (type === "action_add_to_list" || type === "action_remove_from_list") {
      return onChange(listId ? { nodeType: type, config: { listId } } : null);
    }
    if (type === "action_update_attributes") {
      return onChange(
        firstName.trim() || lastName.trim()
          ? { nodeType: "action_update_attributes", config: { firstName: firstName || undefined, lastName: lastName || undefined } }
          : null
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, subject, tagName, listId, firstName, lastName]);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as SupportedNodeType | "none")}
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
      >
        <option value="none">No step — just continue</option>
        {BRANCH_STEP_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {type === "action_email" && (
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject line"
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
      )}
      {(type === "action_add_tag" || type === "action_remove_tag") && (
        <select
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        >
          {allTags.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      {(type === "action_add_to_list" || type === "action_remove_from_list") && (
        <select
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        >
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      )}
      {type === "action_update_attributes" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}

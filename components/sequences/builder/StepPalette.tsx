"use client";

import { Mail, Clock, Hourglass, Tag, TagIcon as TagOffIcon, ListPlus, ListMinus, UserCog } from "lucide-react";
import { ADD_STEP_TYPES, type SupportedNodeType } from "./types";

const ICONS: Record<SupportedNodeType, React.ComponentType<{ className?: string }>> = {
  action_email: Mail,
  logic_delay: Clock,
  logic_wait_for_event: Hourglass,
  action_add_tag: Tag,
  action_remove_tag: TagOffIcon,
  action_add_to_list: ListPlus,
  action_remove_from_list: ListMinus,
  action_update_attributes: UserCog,
};

/** Always-visible floating palette of step types — clicking one adds it to
 * the end of the sequence. To insert at a specific point instead, use a "+"
 * button on the canvas, which opens the same picker scoped to that spot. */
export function StepPalette({ onSelect }: { onSelect: (type: SupportedNodeType) => void }) {
  return (
    <div className="w-56 shrink-0 space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-gray-400">Add a step</p>
      {ADD_STEP_TYPES.map((t) => {
        const Icon = ICONS[t.value];
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            className="flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-elite-violet/5"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-elite-violet/10 text-elite-violet">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-elite-navy-dark">{t.label}</p>
              <p className="truncate text-xs text-gray-400">{t.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

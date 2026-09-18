import type { SequenceGoal } from "@/lib/sequenzy";

export function formatAttributionWindow(hours: number): string {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function goalTriggerSummary(goal: SequenceGoal): string {
  if (goal.triggerType === "event") {
    const revenue = goal.eventPropertyName ? `, tracking "${goal.eventPropertyLabel || goal.eventPropertyName}"` : "";
    return `Event: ${goal.triggerEventName}${revenue}`;
  }
  if (goal.triggerType === "tag_added") return `Tag added: ${goal.triggerTagName}`;
  return `Attribute changed: ${goal.attributePath}`;
}

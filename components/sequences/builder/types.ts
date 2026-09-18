import type { SequenceNode } from "@/lib/sequenzy";

/** Node types this builder can render a dedicated editor for. Anything else
 * (branch, webhook, ai, sms, discount, ab_test, other trigger kinds) falls
 * back to a read-only "unsupported" card — Phase 2 territory. */
export const SUPPORTED_NODE_TYPES = [
  "action_email",
  "logic_delay",
  "logic_wait_for_event",
  "action_add_tag",
  "action_remove_tag",
  "action_add_to_list",
  "action_remove_from_list",
  "action_update_attributes",
] as const;

export type SupportedNodeType = (typeof SUPPORTED_NODE_TYPES)[number];

export function isSupportedNodeType(nodeType: string): nodeType is SupportedNodeType {
  return (SUPPORTED_NODE_TYPES as readonly string[]).includes(nodeType);
}

export function isTriggerNode(node: SequenceNode): boolean {
  return node.nodeType.startsWith("trigger_");
}

export const ADD_STEP_TYPES: { value: SupportedNodeType; label: string; description: string }[] = [
  { value: "action_email", label: "Send Email", description: "Compose and send an email to the contact." },
  { value: "logic_delay", label: "Delay", description: "Wait a fixed amount of time before continuing." },
  { value: "logic_wait_for_event", label: "Wait for Event", description: "Pause until an event fires, or time out." },
  { value: "action_add_tag", label: "Add Tag", description: "Apply a tag to the contact." },
  { value: "action_remove_tag", label: "Remove Tag", description: "Remove a tag from the contact." },
  { value: "action_add_to_list", label: "Add to List", description: "Add the contact to a list." },
  { value: "action_remove_from_list", label: "Remove from List", description: "Remove the contact from a list." },
  { value: "action_update_attributes", label: "Update Subscriber", description: "Update the contact's name or custom fields." },
];

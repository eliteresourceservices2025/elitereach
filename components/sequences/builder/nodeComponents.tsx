"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Mail,
  Clock,
  Hourglass,
  Tag,
  TagIcon as TagOffIcon,
  ListPlus,
  ListMinus,
  UserCog,
  Plus,
  Zap,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import type { SequenceNode } from "@/lib/sequenzy";

export const NODE_WIDTH = 260;

type ShellProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  color: string;
  selected?: boolean;
  showTarget?: boolean;
  showSource?: boolean;
};

function NodeShell({ icon: Icon, title, subtitle, color, selected, showTarget = true, showSource = true }: ShellProps) {
  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={`cursor-pointer rounded-xl border-2 bg-white p-3 shadow-sm transition ${
        selected ? "border-elite-violet" : "border-transparent hover:border-elite-violet/30"
      }`}
    >
      {showTarget && <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-gray-300" />}
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-elite-navy-dark">{title}</p>
          {subtitle && <p className="truncate text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {showSource && <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-gray-300" />}
    </div>
  );
}

export type BuilderNodeData = {
  node: SequenceNode;
  emailSubject?: string;
};

type BuilderNode = Node<BuilderNodeData, string>;

export function TriggerNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  const triggerType = (data.node.config?.triggerType as string) ?? data.node.nodeType.replace("trigger_", "");
  return (
    <NodeShell icon={Zap} title="Trigger" subtitle={triggerType} color="bg-elite-navy-dark" selected={selected} showTarget={false} />
  );
}

export function EmailNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  return <NodeShell icon={Mail} title="Send Email" subtitle={data.emailSubject ?? "Untitled"} color="bg-elite-violet" selected={selected} />;
}

export function DelayNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  const c = data.node.config;
  const label = (c?.delayDisplay as string) ?? (c?.description as string) ?? "Delay";
  return <NodeShell icon={Clock} title="Delay" subtitle={label} color="bg-amber-500" selected={selected} />;
}

export function WaitForEventNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  const c = data.node.config;
  const label = c?.eventName ? `Event: ${c.eventName}` : "No event set";
  return <NodeShell icon={Hourglass} title="Wait for Event" subtitle={label} color="bg-sky-500" selected={selected} />;
}

export function TagActionNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  const isAdd = data.node.nodeType === "action_add_tag";
  const c = data.node.config;
  const tagName = (c?.tagName as string) ?? "No tag set";
  return (
    <NodeShell
      icon={isAdd ? Tag : TagOffIcon}
      title={isAdd ? "Add Tag" : "Remove Tag"}
      subtitle={tagName}
      color={isAdd ? "bg-emerald-500" : "bg-rose-500"}
      selected={selected}
    />
  );
}

export function ListActionNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  const isAdd = data.node.nodeType === "action_add_to_list";
  const c = data.node.config;
  const listId = (c?.listId as string) ?? "No list set";
  return (
    <NodeShell
      icon={isAdd ? ListPlus : ListMinus}
      title={isAdd ? "Add to List" : "Remove from List"}
      subtitle={listId}
      color={isAdd ? "bg-teal-500" : "bg-orange-500"}
      selected={selected}
    />
  );
}

export function UpdateSubscriberNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  const c = data.node.config;
  const updates = Array.isArray(c?.customAttributeUpdates) ? (c.customAttributeUpdates as unknown[]).length : 0;
  const parts = [c?.firstName ? "first name" : null, c?.lastName ? "last name" : null, updates > 0 ? `${updates} field(s)` : null].filter(
    Boolean
  );
  return (
    <NodeShell
      icon={UserCog}
      title="Update Subscriber"
      subtitle={parts.length > 0 ? parts.join(", ") : "No updates set"}
      color="bg-indigo-500"
      selected={selected}
    />
  );
}

export function EndNodeComponent({ selected }: NodeProps<BuilderNode>) {
  return <NodeShell icon={CheckCircle2} title="Sequence complete" color="bg-gray-400" selected={selected} showSource={false} />;
}

export function UnsupportedNodeComponent({ data, selected }: NodeProps<BuilderNode>) {
  return (
    <NodeShell
      icon={HelpCircle}
      title={data.node.nodeType.replace(/^(action|logic)_/, "").replace(/_/g, " ")}
      subtitle="Not editable here yet"
      color="bg-gray-400"
      selected={selected}
    />
  );
}

export function AddStepNodeComponent({ data }: NodeProps<Node<{ onClick: () => void }, string>>) {
  return (
    <div className="flex justify-center" style={{ width: NODE_WIDTH }}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-gray-300" />
      <button
        type="button"
        onClick={data.onClick}
        className="nodrag nopan flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-elite-violet/40 bg-white text-elite-violet hover:border-elite-violet hover:bg-elite-violet/5"
      >
        <Plus className="h-4 w-4" />
      </button>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-gray-300" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNodeComponent,
  action_email: EmailNodeComponent,
  logic_delay: DelayNodeComponent,
  logic_wait_for_event: WaitForEventNodeComponent,
  tagAction: TagActionNodeComponent,
  listAction: ListActionNodeComponent,
  action_update_attributes: UpdateSubscriberNodeComponent,
  end: EndNodeComponent,
  unsupported: UnsupportedNodeComponent,
  addStep: AddStepNodeComponent,
};

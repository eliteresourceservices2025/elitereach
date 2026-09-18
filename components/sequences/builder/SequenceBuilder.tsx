"use client";

import { useMemo, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  SequenceDetail as SequenceDetailType,
  SequenceNode,
  SequenceEdge,
  Tag,
  SequenceList,
  EmailTheme,
  InsertableStep,
} from "@/lib/sequenzy";
import type { EmailBrand } from "@/lib/email-template";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { nodeTypes } from "./nodeComponents";
import { AddStepModal } from "./AddStepModal";
import { NodeConfigPanel } from "./NodeConfigPanel";

const ROW_HEIGHT = 90;
const GAP_HEIGHT = 60;

function mapRfType(node: SequenceNode): keyof typeof nodeTypes {
  if (node.nodeType.startsWith("trigger_")) return "trigger";
  if (node.config?.isEndNode) return "end";
  if (node.nodeType === "action_email") return "action_email";
  if (node.nodeType === "logic_delay") return "logic_delay";
  if (node.nodeType === "logic_wait_for_event") return "logic_wait_for_event";
  if (node.nodeType === "action_add_tag" || node.nodeType === "action_remove_tag") return "tagAction";
  if (node.nodeType === "action_add_to_list" || node.nodeType === "action_remove_from_list") return "listAction";
  if (node.nodeType === "action_update_attributes") return "action_update_attributes";
  return "unsupported";
}

/** Phase 1 only supports linear graphs (no branches), so this just walks
 * single outgoing edges from the trigger to the end node. A branch node would
 * have more than one outgoing edge, which this ignores — out of scope until
 * Phase 2 adds branch rendering. */
function buildLinearOrder(nodes: SequenceNode[], edges: SequenceEdge[]): SequenceNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nextByFrom = new Map(edges.map((e) => [e.sourceNodeId, e.targetNodeId]));
  const trigger = nodes.find((n) => n.nodeType.startsWith("trigger_"));
  if (!trigger) return nodes;

  const order: SequenceNode[] = [trigger];
  const seen = new Set([trigger.id]);
  let currentId = trigger.id;
  while (nextByFrom.has(currentId)) {
    const nextId = nextByFrom.get(currentId)!;
    if (seen.has(nextId)) break;
    const nextNode = byId.get(nextId);
    if (!nextNode) break;
    order.push(nextNode);
    seen.add(nextId);
    currentId = nextId;
  }
  return order;
}

export function SequenceBuilder({
  sequence: initialSequence,
  allTags,
  lists,
  theme,
  brand,
}: {
  sequence: SequenceDetailType;
  allTags: Tag[];
  lists: SequenceList[];
  theme?: EmailTheme;
  brand?: EmailBrand;
}) {
  const [sequence, setSequence] = useState(initialSequence);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addAfterNodeId, setAddAfterNodeId] = useState<string | null>(null);
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const order = useMemo(() => buildLinearOrder(sequence.nodes, sequence.edges), [sequence.nodes, sequence.edges]);

  const { rfNodes, rfEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let y = 0;
    let prevId: string | null = null;

    for (const node of order) {
      const isEnd = node.config?.isEndNode === true;
      const email = sequence.emails.find((e) => e.nodeId === node.id);
      nodes.push({
        id: node.id,
        type: mapRfType(node),
        position: { x: 0, y },
        data: { node, emailSubject: email?.subject },
        draggable: false,
        selectable: !isEnd,
      });
      if (prevId) edges.push({ id: `${prevId}->${node.id}`, source: prevId, target: node.id });
      y += ROW_HEIGHT + 24;
      prevId = node.id;

      if (!isEnd) {
        const addId = `add-after-${node.id}`;
        nodes.push({
          id: addId,
          type: "addStep",
          position: { x: 0, y },
          data: { onClick: () => setAddAfterNodeId(node.id) },
          draggable: false,
          selectable: false,
        });
        edges.push({ id: `${prevId}->${addId}`, source: prevId, target: addId });
        y += GAP_HEIGHT + 24;
        prevId = addId;
      }
    }
    return { rfNodes: nodes, rfEdges: edges };
  }, [order, sequence.emails]);

  const selectedNode = selectedNodeId ? sequence.nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEmail = selectedNode ? sequence.emails.find((e) => e.nodeId === selectedNode.id) : undefined;

  async function handleAddStep(step: InsertableStep) {
    setError(null);
    const res = await fetch(`/api/sequences/${sequence.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ afterNodeId: addAfterNodeId ?? undefined, step, confirmStructuralChange: sequence.status === "active" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to add step");
    }
    const updated = await res.json();
    setSequence(updated);
    setAddAfterNodeId(null);
  }

  async function handleSaveNode(changes: Record<string, unknown>) {
    if (!selectedNode) return;
    setError(null);
    const res = await fetch(`/api/sequences/${sequence.id}/nodes/${selectedNode.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expectedUpdatedAt: selectedNode.updateHints?.expectedUpdatedAt,
        changes,
        confirmLiveChange: sequence.status === "active",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save step.");
      return;
    }
    const updated = await res.json();
    setSequence(updated);
  }

  async function handleDeleteNode() {
    if (!confirmDeleteNodeId) return;
    setError(null);
    const res = await fetch(`/api/sequences/${sequence.id}/nodes/${confirmDeleteNodeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graphRevision: sequence.graphRevision, confirmStructuralChange: sequence.status === "active" }),
    });
    setConfirmDeleteNodeId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete step.");
      return;
    }
    const updated = await res.json();
    setSequence(updated);
    setSelectedNodeId(null);
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
        <div style={{ height: 600 }} className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <ReactFlowProvider>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => {
                if (node.type === "addStep") return;
                setSelectedNodeId(node.id);
              }}
              fitView
              nodesConnectable={false}
              elementsSelectable
            >
              <Background />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <div>
          {selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              email={selectedEmail}
              allTags={allTags}
              lists={lists}
              theme={theme}
              brand={brand}
              onSave={handleSaveNode}
              onDelete={() => setConfirmDeleteNodeId(selectedNode.id)}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : (
            <div className="rounded-xl bg-white p-4 text-sm text-gray-400 shadow-sm">
              Click a step to edit it, or use a + button to add a new one.
            </div>
          )}
        </div>
      </div>

      {addAfterNodeId && (
        <AddStepModal allTags={allTags} lists={lists} onSubmit={handleAddStep} onCancel={() => setAddAfterNodeId(null)} />
      )}

      {confirmDeleteNodeId && (
        <ConfirmModal
          title="Delete step"
          message="This removes the step from the sequence. Contacts currently waiting at this step move on to the next one immediately. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteNode}
          onCancel={() => setConfirmDeleteNodeId(null)}
        />
      )}
    </div>
  );
}

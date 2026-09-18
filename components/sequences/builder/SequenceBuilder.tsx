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
  EventSchemaSummary,
  EmailTheme,
  InsertableStep,
  BranchCondition,
} from "@/lib/sequenzy";
import type { EmailBrand } from "@/lib/email-template";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { nodeTypes } from "./nodeComponents";
import { AddStepModal } from "./AddStepModal";
import { AddBranchModal } from "./AddBranchModal";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { StepPalette } from "./StepPalette";
import { isBranchNode, type SupportedNodeType } from "./types";

const ROW_HEIGHT = 90;
const GAP_HEIGHT = 60;
const COLUMN_WIDTH = 300;

function mapRfType(node: SequenceNode): keyof typeof nodeTypes {
  if (node.nodeType.startsWith("trigger_")) return "trigger";
  if (node.config?.isEndNode) return "end";
  if (node.nodeType === "action_email") return "action_email";
  if (node.nodeType === "logic_delay") return "logic_delay";
  if (node.nodeType === "logic_wait_for_event") return "logic_wait_for_event";
  if (node.nodeType === "action_add_tag" || node.nodeType === "action_remove_tag") return "tagAction";
  if (node.nodeType === "action_add_to_list" || node.nodeType === "action_remove_from_list") return "listAction";
  if (node.nodeType === "action_update_attributes") return "action_update_attributes";
  if (node.nodeType === "logic_branch") return "logic_branch";
  return "unsupported";
}

type NodeLayout = { depth: number; column: number };

/**
 * General DAG layout: walks the graph in topological order from the trigger,
 * assigning each node a row (depth = longest path from the trigger) and a
 * column. A fork (branch node with N outgoing edges) spreads its children
 * across N columns centered on its own column; a merge (a node with multiple
 * incoming edges, e.g. where an if/else's paths reconnect) averages the
 * columns proposed by each incoming edge, which naturally re-centers it back
 * onto the trunk once every path has arrived. Verified against a real
 * two-branch sequence (including a branch whose path led into a second,
 * nested branch) before writing this.
 */
function layoutGraph(nodes: SequenceNode[], edges: SequenceEdge[]): Map<string, NodeLayout> {
  const outByNode = new Map<string, SequenceEdge[]>();
  const inCount = new Map<string, number>();
  for (const n of nodes) inCount.set(n.id, 0);
  for (const e of edges) {
    if (!outByNode.has(e.sourceNodeId)) outByNode.set(e.sourceNodeId, []);
    outByNode.get(e.sourceNodeId)!.push(e);
    inCount.set(e.targetNodeId, (inCount.get(e.targetNodeId) ?? 0) + 1);
  }

  const trigger = nodes.find((n) => n.nodeType.startsWith("trigger_"));
  const layout = new Map<string, NodeLayout>();
  if (!trigger) return layout;

  layout.set(trigger.id, { depth: 0, column: 0 });
  const arrived = new Map<string, number>();
  const queued = new Set([trigger.id]);
  const queue: string[] = [trigger.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const { depth, column } = layout.get(id)!;
    const outs = outByNode.get(id) ?? [];
    const isFork = outs.length > 1;

    outs.forEach((e, i) => {
      const targetId = e.targetNodeId;
      const proposedColumn = isFork ? column + (i - (outs.length - 1) / 2) : column;
      const proposedDepth = depth + 1;

      const count = (arrived.get(targetId) ?? 0) + 1;
      arrived.set(targetId, count);

      const existing = layout.get(targetId);
      if (existing) {
        layout.set(targetId, {
          depth: Math.max(existing.depth, proposedDepth),
          column: (existing.column * (count - 1) + proposedColumn) / count,
        });
      } else {
        layout.set(targetId, { depth: proposedDepth, column: proposedColumn });
      }

      if (count === (inCount.get(targetId) ?? 0) && !queued.has(targetId)) {
        queued.add(targetId);
        queue.push(targetId);
      }
    });
  }

  return layout;
}

export function SequenceBuilder({
  sequence: initialSequence,
  allTags,
  lists,
  knownEvents,
  theme,
  brand,
}: {
  sequence: SequenceDetailType;
  allTags: Tag[];
  lists: SequenceList[];
  knownEvents: EventSchemaSummary[];
  theme?: EmailTheme;
  brand?: EmailBrand;
}) {
  const [sequence, setSequence] = useState(initialSequence);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addAfterNodeId, setAddAfterNodeId] = useState<string | null>(null);
  const [addInitialType, setAddInitialType] = useState<SupportedNodeType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchAfterNodeId, setBranchAfterNodeId] = useState<string | null>(null);
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const layout = useMemo(() => layoutGraph(sequence.nodes, sequence.edges), [sequence.nodes, sequence.edges]);

  const lastInsertableNodeId = useMemo(() => {
    const endNode = sequence.nodes.find((n) => n.config?.isEndNode === true);
    if (!endNode) return undefined;
    const incoming = sequence.edges.filter((e) => e.targetNodeId === endNode.id);
    return (incoming.find((e) => !e.condition) ?? incoming[0])?.sourceNodeId;
  }, [sequence.nodes, sequence.edges]);

  function openAddModal(afterNodeId: string | null, initialType: SupportedNodeType | null = null) {
    setAddAfterNodeId(afterNodeId);
    setAddInitialType(initialType);
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setAddAfterNodeId(null);
    setAddInitialType(null);
  }

  const { rfNodes, rfEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeById = new Map(sequence.nodes.map((n) => [n.id, n]));

    for (const node of sequence.nodes) {
      const pos = layout.get(node.id);
      if (!pos) continue; // unreachable from trigger — shouldn't happen in a valid graph
      const isEnd = node.config?.isEndNode === true;
      const email = sequence.emails.find((e) => e.nodeId === node.id);
      nodes.push({
        id: node.id,
        type: mapRfType(node),
        position: { x: pos.column * COLUMN_WIDTH, y: pos.depth * (ROW_HEIGHT + GAP_HEIGHT + 48) },
        data: { node, emailSubject: email?.subject },
        draggable: false,
        selectable: !isEnd,
      });
    }

    for (const e of sequence.edges) {
      const sourcePos = layout.get(e.sourceNodeId);
      const targetPos = layout.get(e.targetNodeId);
      const sourceNode = nodeById.get(e.sourceNodeId);
      if (!sourcePos || !targetPos || !sourceNode) continue;

      // Sequenzy rejects inserting linear steps directly after a branch node
      // (confirmed live), so an edge leaving a branch connects straight to
      // its target — there's no "+" for adding a path's first step here yet.
      if (isBranchNode(sourceNode)) {
        edges.push({ id: `${e.sourceNodeId}->${e.targetNodeId}-${e.condition?.branchId ?? ""}`, source: e.sourceNodeId, target: e.targetNodeId });
        continue;
      }

      const addId = `add-${e.sourceNodeId}->${e.targetNodeId}`;
      const midColumn = (sourcePos.column + targetPos.column) / 2;
      nodes.push({
        id: addId,
        type: "addStep",
        position: { x: midColumn * COLUMN_WIDTH, y: sourcePos.depth * (ROW_HEIGHT + GAP_HEIGHT + 48) + ROW_HEIGHT + 24 },
        data: { onClick: () => openAddModal(e.sourceNodeId) },
        draggable: false,
        selectable: false,
      });
      edges.push({ id: `${e.sourceNodeId}->${addId}`, source: e.sourceNodeId, target: addId });
      edges.push({ id: `${addId}->${e.targetNodeId}`, source: addId, target: e.targetNodeId });
    }

    return { rfNodes: nodes, rfEdges: edges };
  }, [sequence.nodes, sequence.edges, sequence.emails, layout]);

  const selectedNode = selectedNodeId ? sequence.nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEmail = selectedNode ? sequence.emails.find((e) => e.nodeId === selectedNode.id) : undefined;

  async function handleAddStep(step: InsertableStep) {
    setError(null);
    const res = await fetch(`/api/sequences/${sequence.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        afterNodeId: addAfterNodeId ?? lastInsertableNodeId,
        step,
        confirmStructuralChange: sequence.status === "active",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to add step");
    }
    const updated = await res.json();
    setSequence(updated);
    closeAddModal();
  }

  async function handleAddBranch(input: {
    label: string;
    condition: BranchCondition;
    ifSteps: InsertableStep[];
    elseSteps: InsertableStep[];
  }) {
    setError(null);
    const afterNodeId = branchAfterNodeId ?? lastInsertableNodeId;
    const res = await fetch(`/api/sequences/${sequence.id}/branch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ afterNodeId, ...input, confirmStructuralChange: sequence.status === "active" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to add branch");
    }
    const updated = await res.json();
    setSequence(updated);
    setShowBranchModal(false);
    setBranchAfterNodeId(null);
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

  async function deleteNodeRequest(current: SequenceDetailType, nodeId: string, edges: SequenceEdge[] | undefined) {
    const res = await fetch(`/api/sequences/${current.id}/nodes/${nodeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graphRevision: current.graphRevision,
        edges,
        confirmStructuralChange: current.status === "active",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to delete step.");
    }
    return (await res.json()) as SequenceDetailType;
  }

  async function handleDeleteNode() {
    if (!confirmDeleteNodeId) return;
    setError(null);
    const nodeToDelete = sequence.nodes.find((n) => n.id === confirmDeleteNodeId);

    try {
      if (nodeToDelete && isBranchNode(nodeToDelete)) {
        // Deleting a split node requires the complete replacement topology.
        // We keep the Else path's continuation and drop the If path (and any
        // steps in it) — a defined, if opinionated, default for a "remove
        // this branch" action rather than asking which path to keep. Any
        // nodes that only exist along the discarded If path must be deleted
        // too (one at a time, reconnecting around each), since leaving one
        // in place with no edges would make the graph reject as
        // disconnected from the trigger.
        const ifEdge = sequence.edges.find((e) => e.sourceNodeId === confirmDeleteNodeId && e.condition?.branchId === "if");
        const elseEdge = sequence.edges.find((e) => e.sourceNodeId === confirmDeleteNodeId && e.condition?.branchId === "else");
        const incomingEdge = sequence.edges.find((e) => e.targetNodeId === confirmDeleteNodeId);
        if (!elseEdge || !incomingEdge) {
          throw new Error("Could not determine how to remove this branch.");
        }

        const ifPathNodeIds: string[] = [];
        let cursor = ifEdge?.targetNodeId;
        while (cursor && cursor !== elseEdge.targetNodeId && !ifPathNodeIds.includes(cursor)) {
          ifPathNodeIds.push(cursor);
          cursor = sequence.edges.find((e) => e.sourceNodeId === cursor)?.targetNodeId;
        }

        let current = sequence;
        for (const nodeId of ifPathNodeIds) {
          const inc = current.edges.find((e) => e.targetNodeId === nodeId);
          const out = current.edges.find((e) => e.sourceNodeId === nodeId);
          if (!inc || !out) break;
          const edges = current.edges
            .filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
            .concat([{ sourceNodeId: inc.sourceNodeId, targetNodeId: out.targetNodeId, condition: inc.condition }]);
          current = await deleteNodeRequest(current, nodeId, edges);
        }

        const finalIncoming = current.edges.find((e) => e.targetNodeId === confirmDeleteNodeId);
        const finalElse = current.edges.find((e) => e.sourceNodeId === confirmDeleteNodeId && e.condition?.branchId === "else");
        if (!finalIncoming || !finalElse) throw new Error("Could not determine how to remove this branch.");
        const replacementEdges = current.edges
          .filter((e) => e.sourceNodeId !== confirmDeleteNodeId && e.targetNodeId !== confirmDeleteNodeId)
          .concat([{ sourceNodeId: finalIncoming.sourceNodeId, targetNodeId: finalElse.targetNodeId }]);
        const updated = await deleteNodeRequest(current, confirmDeleteNodeId, replacementEdges);
        setConfirmDeleteNodeId(null);
        setSequence(updated);
        setSelectedNodeId(null);
        return;
      }

      const updated = await deleteNodeRequest(sequence, confirmDeleteNodeId, undefined);
      setConfirmDeleteNodeId(null);
      setSequence(updated);
      setSelectedNodeId(null);
    } catch (err) {
      setConfirmDeleteNodeId(null);
      setError(err instanceof Error ? err.message : "Failed to delete step.");
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-4">
        <StepPalette
          onSelect={(type) => openAddModal(null, type)}
          onSelectBranch={() => {
            setBranchAfterNodeId(null);
            setShowBranchModal(true);
          }}
        />

        <div style={{ height: 600 }} className="flex-1 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
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
      </div>

      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          email={selectedEmail}
          allTags={allTags}
          lists={lists}
          knownEvents={knownEvents}
          theme={theme}
          brand={brand}
          onSave={handleSaveNode}
          onDelete={() => setConfirmDeleteNodeId(selectedNode.id)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {showAddModal && (
        <AddStepModal
          allTags={allTags}
          lists={lists}
          knownEvents={knownEvents}
          initialType={addInitialType}
          onSubmit={handleAddStep}
          onSelectBranch={() => {
            setBranchAfterNodeId(addAfterNodeId);
            closeAddModal();
            setShowBranchModal(true);
          }}
          onCancel={closeAddModal}
        />
      )}

      {showBranchModal && (
        <AddBranchModal
          allTags={allTags}
          lists={lists}
          knownEvents={knownEvents}
          onSubmit={handleAddBranch}
          onCancel={() => {
            setShowBranchModal(false);
            setBranchAfterNodeId(null);
          }}
        />
      )}

      {confirmDeleteNodeId && (
        <ConfirmModal
          title={isBranchNode(sequence.nodes.find((n) => n.id === confirmDeleteNodeId)!) ? "Delete branch" : "Delete step"}
          message={
            isBranchNode(sequence.nodes.find((n) => n.id === confirmDeleteNodeId)!)
              ? "This removes the branch, keeping the Else path's continuation. The If path and any steps in it are discarded. This can't be undone."
              : "This removes the step from the sequence. Contacts currently waiting at this step move on to the next one immediately. This can't be undone."
          }
          confirmLabel="Delete"
          onConfirm={handleDeleteNode}
          onCancel={() => setConfirmDeleteNodeId(null)}
        />
      )}
    </div>
  );
}

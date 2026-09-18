"use client";

import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Heading as HeadingIcon, Type, Image as ImageIcon, Minus, MoveVertical, X } from "lucide-react";
import type { BuilderBlock } from "./builderTypes";
import { FIELD_TYPE_LABELS } from "./builderTypes";

const CONTENT_ICONS = {
  heading: HeadingIcon,
  text: Type,
  image: ImageIcon,
  divider: Minus,
  spacer: MoveVertical,
};

function blockSummary(block: BuilderBlock): { label: string; sub: string } {
  if (block.kind === "field") {
    return { label: block.label || FIELD_TYPE_LABELS[block.fieldType], sub: FIELD_TYPE_LABELS[block.fieldType] };
  }
  if (block.kind === "heading" || block.kind === "text") {
    return { label: block.content || "(empty)", sub: block.kind === "heading" ? "Heading" : "Text" };
  }
  if (block.kind === "image") return { label: block.alt || block.src || "Image", sub: "Image" };
  if (block.kind === "spacer") return { label: `${block.height}px gap`, sub: "Spacer" };
  return { label: "Divider", sub: "Divider" };
}

function SortableRow({
  block,
  selected,
  locked,
  onSelect,
  onRemove,
}: {
  block: BuilderBlock;
  selected: boolean;
  locked?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const { label, sub } = blockSummary(block);
  const Icon = block.kind === "field" ? null : CONTENT_ICONS[block.kind];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
        selected ? "border-elite-violet bg-elite-violet/5" : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500" aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-elite-navy-dark">{label}</p>
        <p className="truncate text-xs text-gray-400">{sub}</p>
      </div>
      {!locked && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 text-gray-300 hover:text-red-500"
          aria-label="Remove block"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function FormBlockCanvas({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
  lockedIds,
}: {
  blocks: BuilderBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (blocks: BuilderBlock[]) => void;
  onRemove: (id: string) => void;
  lockedIds: Set<string>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  if (blocks.length === 0) {
    return <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">Add a block to get started.</p>;
  }

  return (
    <DndContext id="form-blocks" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {blocks.map((block) => (
            <SortableRow
              key={block.id}
              block={block}
              selected={block.id === selectedId}
              locked={lockedIds.has(block.id)}
              onSelect={() => onSelect(block.id)}
              onRemove={() => onRemove(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

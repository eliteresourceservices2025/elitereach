import type { FormBlock, FormFieldBlock } from "@/lib/sequenzy";

/** Working representation used only inside the builder UI — simpler than
 * Sequenzy's own FormBlock (no submit-button/success-screen as draggable
 * blocks; those stay as top-level form settings) so drag-reorder and editing
 * only ever deal with content the user can actually rearrange. */
export type BuilderBlock =
  | { id: string; kind: "heading"; content: string; level: 1 | 2 | 3; align: "left" | "center" | "right" }
  | { id: string; kind: "text"; content: string; variant: "paragraph" | "eyebrow" | "caption"; align: "left" | "center" | "right" }
  | { id: string; kind: "image"; src: string; alt: string; fit: "cover" | "contain" }
  | { id: string; kind: "divider" }
  | { id: string; kind: "spacer"; height: number }
  | ({ id: string; kind: "field" } & Omit<FormFieldBlock, "id" | "kind">);

export const FIELD_TYPE_LABELS: Record<FormFieldBlock["fieldType"], string> = {
  text: "Short text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  textarea: "Long text",
  select: "Dropdown",
  radio: "Radio buttons",
  checkbox: "Checkboxes",
  consent: "Consent checkbox",
  hidden: "Hidden field",
};

export const CONTENT_BLOCK_LABELS: Record<Exclude<BuilderBlock["kind"], "field">, string> = {
  heading: "Heading",
  text: "Text",
  image: "Image",
  divider: "Divider",
  spacer: "Spacer",
};

let counter = 0;
export function newBlockId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function emptyFieldBlock(fieldType: FormFieldBlock["fieldType"]): BuilderBlock {
  const base = {
    id: newBlockId("field"),
    kind: "field" as const,
    fieldType,
    name: newBlockId(fieldType),
    label: FIELD_TYPE_LABELS[fieldType],
    showLabel: true,
    required: false,
    width: "full" as const,
  };
  if (fieldType === "select" || fieldType === "radio" || fieldType === "checkbox") {
    return { ...base, options: [{ value: "option-1", label: "Option 1" }] };
  }
  if (fieldType === "consent") {
    return { ...base, consentText: "I agree to receive emails and accept the privacy policy." };
  }
  return base;
}

export function emptyContentBlock(kind: Exclude<BuilderBlock["kind"], "field">): BuilderBlock {
  switch (kind) {
    case "heading":
      return { id: newBlockId("heading"), kind: "heading", content: "Heading", level: 2, align: "left" };
    case "text":
      return { id: newBlockId("text"), kind: "text", content: "Add some text.", variant: "paragraph", align: "left" };
    case "image":
      return { id: newBlockId("image"), kind: "image", src: "", alt: "", fit: "cover" };
    case "divider":
      return { id: newBlockId("divider"), kind: "divider" };
    case "spacer":
      return { id: newBlockId("spacer"), kind: "spacer", height: 24 };
  }
}

/** The one field every form must keep — Sequenzy rejects an update that
 * doesn't leave exactly one required email field. */
export function makeEmailField(): BuilderBlock {
  return {
    id: newBlockId("field"),
    kind: "field",
    fieldType: "email",
    name: "email",
    label: "Email",
    showLabel: true,
    required: true,
    mapsTo: "email",
    width: "full",
  };
}

export function toFormBlocks(blocks: BuilderBlock[]): FormBlock[] {
  return blocks.map((b) => {
    if (b.kind === "field") {
      return { ...b, kind: "form-field" } as FormBlock;
    }
    return b as FormBlock;
  });
}

/** Reverses toFormBlocks for editing an existing form — content/success/error
 * blocks we don't render an editor for (form-step, group, custom-html, etc.)
 * are dropped from the working list but preserved separately by the caller
 * so a save doesn't lose them. */
export function fromFormBlocks(blocks: FormBlock[]): { editable: BuilderBlock[]; passthrough: FormBlock[] } {
  const editable: BuilderBlock[] = [];
  const passthrough: FormBlock[] = [];
  for (const block of blocks) {
    if (block.kind === "form-field") {
      editable.push({ ...(block as FormFieldBlock), kind: "field" });
    } else if (
      block.kind === "heading" ||
      block.kind === "text" ||
      block.kind === "image" ||
      block.kind === "divider" ||
      block.kind === "spacer"
    ) {
      editable.push(block as BuilderBlock);
    } else if (block.kind === "submit-button" || block.kind === "success-screen" || block.kind === "error-state") {
      // Handled as top-level form settings (buttonText/successMessage), not
      // draggable blocks — drop them here since the builder regenerates them.
      continue;
    } else {
      passthrough.push(block);
    }
  }
  return { editable, passthrough };
}

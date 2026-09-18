import type { FormTheme } from "@/lib/sequenzy";
import type { BuilderBlock } from "./builderTypes";

export function FormPreview({
  blocks,
  buttonText,
  theme,
}: {
  blocks: BuilderBlock[];
  buttonText: string;
  theme?: FormTheme;
}) {
  const accent = theme?.accentColor || "#8a2be2";
  const radius = theme?.borderRadius ?? 8;

  return (
    <div
      className="rounded-xl border border-gray-200 p-6 shadow-sm"
      style={{ maxWidth: 420, background: theme?.backgroundColor || "#ffffff", color: theme?.textColor || undefined }}
    >
      <div className="flex flex-wrap gap-3">
        {blocks.map((block) => (
          <PreviewBlock key={block.id} block={block} radius={radius} muted={theme?.mutedTextColor} />
        ))}
      </div>
      <button
        disabled
        className="mt-4 w-full px-4 py-2 text-sm font-medium text-white opacity-90"
        style={{ background: accent, borderRadius: radius }}
      >
        {buttonText || "Submit"}
      </button>
    </div>
  );
}

function PreviewBlock({ block, radius, muted }: { block: BuilderBlock; radius: number; muted?: string }) {
  if (block.kind === "heading") {
    const Tag = (`h${block.level + 1}` as unknown) as "h2" | "h3" | "h4";
    return (
      <Tag className="w-full font-semibold text-elite-navy-dark" style={{ textAlign: block.align }}>
        {block.content}
      </Tag>
    );
  }
  if (block.kind === "text") {
    return (
      <p
        className="w-full text-sm"
        style={{
          textAlign: block.align,
          color: muted || "#6b7280",
          fontStyle: block.variant === "eyebrow" ? "normal" : undefined,
          fontSize: block.variant === "caption" ? "0.75rem" : undefined,
          textTransform: block.variant === "eyebrow" ? "uppercase" : undefined,
        }}
      >
        {block.content}
      </p>
    );
  }
  if (block.kind === "image") {
    return block.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={block.src} alt={block.alt} className="w-full rounded-lg object-cover" style={{ borderRadius: radius }} />
    ) : (
      <div className="flex w-full items-center justify-center rounded-lg bg-gray-50 py-6 text-xs text-gray-400" style={{ borderRadius: radius }}>
        No image URL set
      </div>
    );
  }
  if (block.kind === "divider") return <hr className="w-full border-gray-200" />;
  if (block.kind === "spacer") return <div className="w-full" style={{ height: block.height }} />;

  // field
  const widthClass = block.width === "half" ? "w-[calc(50%-6px)]" : "w-full";
  return (
    <div className={widthClass}>
      {block.showLabel !== false && (
        <label className="mb-1 block text-xs font-medium text-gray-500">
          {block.label}
          {block.required && <span className="text-red-400"> *</span>}
        </label>
      )}
      {block.fieldType === "textarea" ? (
        <textarea disabled rows={3} placeholder={block.placeholder} className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400" style={{ borderRadius: radius }} />
      ) : block.fieldType === "select" ? (
        <select disabled className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400" style={{ borderRadius: radius }}>
          <option>{block.placeholder || "Select one"}</option>
          {block.options?.map((o) => (
            <option key={o.value}>{o.label ?? o.value}</option>
          ))}
        </select>
      ) : block.fieldType === "radio" || block.fieldType === "checkbox" ? (
        <div className="space-y-1">
          {(block.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm text-gray-500">
              <input disabled type={block.fieldType === "radio" ? "radio" : "checkbox"} />
              {o.label ?? o.value}
            </label>
          ))}
        </div>
      ) : block.fieldType === "consent" ? (
        <label className="flex items-start gap-2 text-xs text-gray-500">
          <input disabled type="checkbox" className="mt-0.5" />
          {block.consentText}
        </label>
      ) : block.fieldType === "hidden" ? (
        <p className="text-xs italic text-gray-300">(hidden field — not shown to visitors)</p>
      ) : (
        <input
          disabled
          type={block.fieldType}
          placeholder={block.placeholder}
          className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400"
          style={{ borderRadius: radius }}
        />
      )}
    </div>
  );
}

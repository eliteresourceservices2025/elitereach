import { tagColorHex } from "@/lib/tag-colors";

export function TagBadge({ name, color, onRemove }: { name: string; color?: string; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: tagColorHex(color) }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 leading-none opacity-80 hover:opacity-100" aria-label={`Remove ${name} tag`}>
          ×
        </button>
      )}
    </span>
  );
}

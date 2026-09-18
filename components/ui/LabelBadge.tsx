import { labelColorHex } from "@/lib/tag-colors";

export function LabelBadge({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: labelColorHex(name) }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 leading-none opacity-80 hover:opacity-100" aria-label={`Remove ${name} label`}>
          ×
        </button>
      )}
    </span>
  );
}

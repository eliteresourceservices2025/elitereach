import type { EventSchemaSummary } from "@/lib/sequenzy";

/**
 * Sequenzy only "documents" a handful of built-in events (e.g. e-commerce
 * ones) — there's no create-an-event step, since custom events are freeform:
 * whatever name you send when triggering one via a webhook, integration, or
 * the API becomes a valid event name. So this offers known events as
 * suggestions via a native datalist while still accepting anything typed.
 */
export function EventNameField({
  id,
  value,
  onChange,
  knownEvents,
  label = "Event name",
  placeholder = "e.g. ecommerce.order_placed, or a custom event name",
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  knownEvents: EventSchemaSummary[];
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const listId = `${id}-events`;
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        autoFocus={autoFocus}
      />
      <datalist id={listId}>
        {knownEvents.map((e) => (
          <option key={e.eventName} value={e.eventName}>
            {e.label} ({e.category})
          </option>
        ))}
      </datalist>
      <span className="mt-1 block text-xs text-gray-400">
        Pick a known event or type a custom one fired via webhook, integration, or the API.
      </span>
    </label>
  );
}

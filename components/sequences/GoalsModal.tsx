"use client";

import { useEffect, useState } from "react";
import type { EventSchemaSummary, SequenceGoal, Tag } from "@/lib/sequenzy";
import { EventNameField } from "./EventNameField";

function formatAttributionWindow(hours: number): string {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

function goalTriggerSummary(goal: SequenceGoal): string {
  if (goal.triggerType === "event") {
    const revenue = goal.eventPropertyName ? `, tracking "${goal.eventPropertyLabel || goal.eventPropertyName}"` : "";
    return `Event: ${goal.triggerEventName}${revenue}`;
  }
  if (goal.triggerType === "tag_added") return `Tag added: ${goal.triggerTagName}`;
  return `Attribute changed: ${goal.attributePath}`;
}

export function GoalsModal({
  sequenceId,
  allTags,
  knownEvents,
  onClose,
}: {
  sequenceId: string;
  allTags: Tag[];
  knownEvents: EventSchemaSummary[];
  onClose: () => void;
}) {
  const [goals, setGoals] = useState<SequenceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadGoals() {
    setLoading(true);
    fetch(`/api/sequences/${sequenceId}/goals`)
      .then((res) => res.json())
      .then((data) => setGoals(Array.isArray(data.goals) ? data.goals : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Standard fetch-on-mount: loadGoals sets state asynchronously inside its
    // own promise callback, not synchronously during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGoals();
  }, [sequenceId]);

  async function handleDelete(goalId: string) {
    setError(null);
    const res = await fetch(`/api/sequences/${sequenceId}/goals/${goalId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete goal.");
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-elite-navy-dark">Goals</h2>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
            Close
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Track conversions this sequence drives — a purchase, a tag applied, or any custom event — within an attribution
          window after a recipient&apos;s last email touch. Revenue is already tracked automatically for purchase events; add a
          goal here for anything else you want counted, like a booked call or a signed contract.
        </p>

        {loading && <p className="text-sm text-gray-400">Loading...</p>}

        {!loading && goals.length === 0 && !showAdd && <p className="text-sm text-gray-400">No goals yet.</p>}

        <div className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-elite-navy-dark">
                  {goal.name}
                  {!goal.isActive && <span className="ml-2 text-xs font-normal text-gray-400">(inactive)</span>}
                </p>
                <p className="truncate text-xs text-gray-500">{goalTriggerSummary(goal)}</p>
                <p className="text-xs text-gray-400">Attribution window: {formatAttributionWindow(goal.attributionWindowHours)}</p>
              </div>
              <button onClick={() => handleDelete(goal.id)} className="shrink-0 text-xs text-red-500 hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {showAdd ? (
          <AddGoalForm
            sequenceId={sequenceId}
            allTags={allTags}
            knownEvents={knownEvents}
            onCancel={() => setShowAdd(false)}
            onCreated={(goal) => {
              setGoals((prev) => [...prev, goal]);
              setShowAdd(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full rounded-lg border border-dashed border-elite-violet/40 px-3 py-2 text-sm font-medium text-elite-violet hover:bg-elite-violet/5"
          >
            + Add goal
          </button>
        )}
      </div>
    </div>
  );
}

function AddGoalForm({
  sequenceId,
  allTags,
  knownEvents,
  onCancel,
  onCreated,
}: {
  sequenceId: string;
  allTags: Tag[];
  knownEvents: EventSchemaSummary[];
  onCancel: () => void;
  onCreated: (goal: SequenceGoal) => void;
}) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"event" | "tag_added">("event");
  const [eventName, setEventName] = useState("");
  const [trackRevenue, setTrackRevenue] = useState(false);
  const [eventPropertyName, setEventPropertyName] = useState("amount");
  const [eventPropertyLabel, setEventPropertyLabel] = useState("Revenue");
  const [tagName, setTagName] = useState(allTags[0]?.name ?? "");
  const [attributionWindowDays, setAttributionWindowDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (triggerType === "event" && !eventName.trim()) return setError("Enter an event name.");
    if (triggerType === "tag_added" && !tagName) return setError("Choose a tag.");

    const body =
      triggerType === "event"
        ? {
            name,
            triggerType: "event" as const,
            triggerEventName: eventName,
            eventPropertyName: trackRevenue ? eventPropertyName || undefined : undefined,
            eventPropertyLabel: trackRevenue ? eventPropertyLabel || undefined : undefined,
            attributionWindowHours: attributionWindowDays * 24,
          }
        : {
            name,
            triggerType: "tag_added" as const,
            triggerTagName: tagName,
            attributionWindowHours: attributionWindowDays * 24,
          };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sequences/${sequenceId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create goal.");
        return;
      }
      onCreated(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Goal name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Discovery call booked"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          autoFocus
        />
      </label>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-xs">
        {(["event", "tag_added"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTriggerType(t)}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${
              triggerType === t ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "event" ? "When an event happens" : "When a tag is added"}
          </button>
        ))}
      </div>

      {triggerType === "event" && (
        <div className="space-y-2">
          <EventNameField id="goal-event" value={eventName} onChange={setEventName} knownEvents={knownEvents} />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={trackRevenue} onChange={(e) => setTrackRevenue(e.target.checked)} />
            Track a numeric value from this event (e.g. revenue)
          </label>
          {trackRevenue && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Event property</span>
                <input
                  value={eventPropertyName}
                  onChange={(e) => setEventPropertyName(e.target.value)}
                  placeholder="amount"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Display label</span>
                <input
                  value={eventPropertyLabel}
                  onChange={(e) => setEventPropertyLabel(e.target.value)}
                  placeholder="Revenue"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {triggerType === "tag_added" && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Tag</span>
          <select
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {allTags.length === 0 && <option value="">No tags available</option>}
            {allTags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Attribution window (days)</span>
        <input
          type="number"
          min={1}
          max={30}
          value={attributionWindowDays}
          onChange={(e) => setAttributionWindowDays(Number(e.target.value))}
          className="w-full max-w-[120px] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-400">
          How far back to look for a qualifying email touch before crediting a conversion to it.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-elite-violet px-3 py-1.5 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add goal"}
        </button>
      </div>
    </div>
  );
}

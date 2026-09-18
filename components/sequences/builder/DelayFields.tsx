import { useState } from "react";

export type DelayValue = { days: number; hours: number; minutes: number };

export function emptyDelay(defaults?: Partial<DelayValue>): DelayValue {
  return { days: defaults?.days ?? 1, hours: defaults?.hours ?? 0, minutes: defaults?.minutes ?? 0 };
}

/** Weeks isn't a unit Sequenzy's API accepts — it only takes days/hours/minutes
 * — so this is purely a client-side convenience that folds into days on change. */
export function DelayFields({ value, onChange }: { value: DelayValue; onChange: (value: DelayValue) => void }) {
  const [weeks, setWeeks] = useState(0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Weeks</span>
          <input
            type="number"
            min={0}
            value={weeks}
            onChange={(e) => {
              const nextWeeks = Math.max(0, Number(e.target.value));
              const prevWeeksAsDays = weeks * 7;
              setWeeks(nextWeeks);
              onChange({ ...value, days: Math.max(0, value.days - prevWeeksAsDays + nextWeeks * 7) });
            }}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Days</span>
          <input
            type="number"
            min={0}
            value={value.days}
            onChange={(e) => onChange({ ...value, days: Math.max(0, Number(e.target.value)) })}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Hours</span>
          <input
            type="number"
            min={0}
            max={23}
            value={value.hours}
            onChange={(e) => onChange({ ...value, hours: Math.max(0, Number(e.target.value)) })}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Minutes</span>
          <input
            type="number"
            min={0}
            max={59}
            value={value.minutes}
            onChange={(e) => onChange({ ...value, minutes: Math.max(0, Number(e.target.value)) })}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-gray-400">Weeks just adds to the days field — Sequenzy stores delays in days/hours/minutes.</p>
    </div>
  );
}

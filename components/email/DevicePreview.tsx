"use client";

import { useState } from "react";
import { EmailPreview } from "./EmailPreview";

type Device = "desktop" | "tablet" | "mobile";

const DEVICES: { value: Device; label: string; width: number }[] = [
  { value: "desktop", label: "Desktop", width: 640 },
  { value: "tablet", label: "Tablet", width: 480 },
  { value: "mobile", label: "Mobile", width: 375 },
];

export function DevicePreview({ html }: { html: string }) {
  const [device, setDevice] = useState<Device>("desktop");
  const width = DEVICES.find((d) => d.value === device)!.width;

  return (
    <div>
      <div className="mb-2 flex w-fit gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        {DEVICES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDevice(d.value)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              device === d.value ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="mx-auto transition-all" style={{ maxWidth: width }}>
        <EmailPreview html={html} />
      </div>
    </div>
  );
}

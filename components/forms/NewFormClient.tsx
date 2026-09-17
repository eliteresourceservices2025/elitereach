"use client";

import { useState } from "react";
import type { Tag } from "@/lib/sequenzy";
import { FormCreator } from "./FormCreator";
import { InquiryFormCreator } from "./InquiryFormCreator";

export function NewFormClient({ allTags }: { allTags: Tag[] }) {
  const [type, setType] = useState<"signup" | "inquiry">("signup");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">New Form</h1>
        <p className="text-sm text-gray-500">Embeddable forms for eliteresourceservices.com.</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm max-w-sm">
        {(["signup", "inquiry"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${
              type === t ? "bg-white text-elite-navy-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "signup" ? "Newsletter Signup" : "Contact / Inquiry"}
          </button>
        ))}
      </div>

      {type === "signup" ? <FormCreator allTags={allTags} /> : <InquiryFormCreator />}
    </div>
  );
}

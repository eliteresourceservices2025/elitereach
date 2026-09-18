"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SignupForm } from "@/lib/sequenzy";
import { EmbedCodeDisplay } from "./EmbedCodeDisplay";

export function FormTable() {
  const [forms, setForms] = useState<SignupForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forms")
      .then((res) => res.json())
      .then((data) => setForms(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading forms...</p>;
  if (forms.length === 0) return <p className="text-sm text-gray-400">No signup forms yet.</p>;

  return (
    <div className="space-y-3">
      {forms.map((form) => (
        <div key={form.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-elite-navy-dark">{form.name}</p>
              <p className="text-xs text-gray-400">
                {form.status} · {form.submissionCount.toLocaleString()} submission{form.submissionCount === 1 ? "" : "s"}
              </p>
            </div>
            <Link href={`/forms/${form.id}/edit`} className="text-sm text-elite-violet hover:underline">
              Edit
            </Link>
          </div>
          <div className="mt-3">
            <EmbedCodeDisplay formId={form.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

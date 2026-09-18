"use client";

import { useEffect, useMemo, useState } from "react";
import type { Subscriber } from "@/lib/sequenzy";

/** Shared by two entry points on a sequence: "Enroll contacts" (multi-select,
 * for real production use) and "Test sequence" (single-select — enrolling a
 * real contact, e.g. yourself, to run the live sequence with actual delays
 * and branch logic, since Sequenzy has no separate sequence-level test API). */
export function EnrollContactsModal({
  sequenceId,
  mode,
  onClose,
}: {
  sequenceId: string;
  mode: "enroll" | "test";
  onClose: () => void;
}) {
  const [contacts, setContacts] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contacts?perPage=200")
      .then((res) => res.json())
      .then((data) => setContacts(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) => c.email.toLowerCase().includes(q) || `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  function toggle(email: string) {
    setSelected((prev) => {
      if (mode === "test") return prev.has(email) ? new Set() : new Set([email]);
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/sequences/${sequenceId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [...selected] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to enroll contacts.");
        return;
      }
      const notFoundNote =
        Array.isArray(data.notFound) && data.notFound.length > 0 ? ` Not found: ${data.notFound.join(", ")}.` : "";
      setResult(`Enrolled ${data.enrolled}, skipped ${data.skipped}.${notFoundNote}`);
      setSelected(new Set());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-elite-navy-dark">{mode === "test" ? "Test sequence" : "Enroll contacts"}</h2>
        <p className="text-xs text-gray-400">
          {mode === "test"
            ? "Pick a real contact — e.g. yourself or a teammate — to run through this sequence live, with real delays and branch logic."
            : "Pick one or more contacts to enroll in this sequence."}
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-1">
          {loading && <p className="p-2 text-sm text-gray-400">Loading contacts...</p>}
          {!loading && filtered.length === 0 && <p className="p-2 text-sm text-gray-400">No contacts found.</p>}
          {filtered.map((c) => (
            <label key={c.email} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-gray-50">
              <input
                type={mode === "test" ? "radio" : "checkbox"}
                name="enroll-contact"
                checked={selected.has(c.email)}
                onChange={() => toggle(c.email)}
              />
              <span className="min-w-0 flex-1 truncate">
                {c.firstName || c.lastName ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : c.email}
                {(c.firstName || c.lastName) && <span className="ml-1 text-gray-400">{c.email}</span>}
              </span>
            </label>
          ))}
        </div>

        {result && <p className="text-sm text-green-600">{result}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selected.size === 0}
            className="rounded-lg bg-elite-violet px-3 py-1.5 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
          >
            {submitting ? "Enrolling..." : mode === "test" ? "Enroll for test" : `Enroll ${selected.size || ""}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}

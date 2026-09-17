"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Sequence, Subscriber, Tag } from "@/lib/sequenzy";
import { TagBadge } from "@/components/tags/TagBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ContactTable({ allTags, allSequences }: { allTags: Tag[]; allSequences: Sequence[] }) {
  const [contacts, setContacts] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [bulkSequence, setBulkSequence] = useState("");
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const tagColor = useMemo(() => {
    const map = new Map<string, string | undefined>();
    allTags.forEach((t) => map.set(t.name, t.color));
    return map;
  }, [allTags]);

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts?perPage=200");
      const data = await res.json();
      setContacts(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount: loadContacts sets state asynchronously inside its own
    // promise callback, not synchronously during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !tagFilter || c.tags?.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  function toggleSelect(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.email)));
  }

  async function handleDelete(email: string) {
    await fetch(`/api/contacts/${encodeURIComponent(email)}`, { method: "DELETE" });
    setPendingDelete(null);
    loadContacts();
  }

  async function handleBulkTag(action: "add" | "remove") {
    if (!bulkTag || selected.size === 0) return;
    await fetch(`/api/tags/bulk-${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: [...selected], tag: bulkTag }),
    });
    setSelected(new Set());
    loadContacts();
  }

  async function handleEnroll() {
    if (!bulkSequence || selected.size === 0) return;
    setEnrollMessage(null);
    const res = await fetch(`/api/sequences/${bulkSequence}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: [...selected] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEnrollMessage(data.error ?? "Failed to enroll contacts.");
      return;
    }
    setEnrollMessage(`Enrolled ${data.enrolled}, skipped ${data.skipped}.`);
    setSelected(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <Link
          href="/contacts/new"
          className="ml-auto rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark"
        >
          Add Contact
        </Link>
        <Link
          href="/contacts/import"
          className="rounded-lg border border-elite-violet/30 px-4 py-2 text-sm font-medium text-elite-navy-dark hover:bg-elite-violet/5"
        >
          Import CSV
        </Link>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-elite-violet/10 px-3 py-2 text-sm">
          <span>{selected.size} selected</span>
          <select
            value={bulkTag}
            onChange={(e) => setBulkTag(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">Choose tag...</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <button onClick={() => handleBulkTag("add")} className="text-elite-violet hover:underline">
            Add tag
          </button>
          <button onClick={() => handleBulkTag("remove")} className="text-elite-violet hover:underline">
            Remove tag
          </button>
          {allSequences.length > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <select
                value={bulkSequence}
                onChange={(e) => setBulkSequence(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="">Choose sequence...</option>
                {allSequences.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button onClick={handleEnroll} className="text-elite-violet hover:underline">
                Enroll
              </button>
            </>
          )}
          {enrollMessage && <span className="text-xs text-gray-500">{enrollMessage}</span>}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Loading contacts...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No contacts found.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((c) => (
                <tr key={c.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(c.email)} onChange={() => toggleSelect(c.email)} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${encodeURIComponent(c.email)}`} className="font-medium text-elite-navy-dark hover:underline">
                      {c.firstName || c.lastName ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === "active"
                          ? "bg-green-100 text-green-700"
                          : c.status === "bounced"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.map((t) => (
                        <TagBadge key={t} name={t} color={tagColor.get(t)} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setPendingDelete(c.email)} className="text-sm text-red-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Delete contact"
          message={`Are you sure you want to delete ${pendingDelete}? This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

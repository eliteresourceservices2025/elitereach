"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Subscriber, Tag } from "@/lib/sequenzy";
import { TagBadge } from "@/components/tags/TagBadge";
import { TagSelector } from "./TagSelector";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ContactDetail({ contact, allTags }: { contact: Subscriber; allTags: Tag[] }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(contact.firstName ?? "");
  const [lastName, setLastName] = useState(contact.lastName ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [businessName, setBusinessName] = useState(String(contact.customAttributes?.businessName ?? ""));
  const [address, setAddress] = useState(String(contact.customAttributes?.address ?? ""));
  const [tags, setTags] = useState<string[]>(contact.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tagColor = new Map(allTags.map((t) => [t.name, t.color]));

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/contacts/${encodeURIComponent(contact.email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || undefined,
          customAttributes: { ...contact.customAttributes, businessName, address },
        }),
      });
      const added = tags.filter((t) => !contact.tags?.includes(t));
      const removed = (contact.tags ?? []).filter((t) => !tags.includes(t));
      await Promise.all([
        ...added.map((tag) =>
          fetch(`/api/contacts/${encodeURIComponent(contact.email)}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag }),
          })
        ),
        ...removed.map((tag) =>
          fetch(`/api/contacts/${encodeURIComponent(contact.email)}/tags`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag }),
          })
        ),
      ]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/contacts/${encodeURIComponent(contact.email)}`, { method: "DELETE" });
    router.push("/contacts");
  }

  return (
    <div className="max-w-md space-y-6 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</p>
        <p className="text-sm text-gray-700">{contact.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Business name</label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Tags</label>
        <TagSelector allTags={allTags} selected={tags} onChange={setTags} />
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <TagBadge key={t} name={t} color={tagColor.get(t)} onRemove={() => setTags(tags.filter((x) => x !== t))} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-500 hover:underline">
          Delete contact
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete contact"
          message={`Are you sure you want to delete ${contact.email}? This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

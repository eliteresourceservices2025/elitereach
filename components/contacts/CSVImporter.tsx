"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@/lib/sequenzy";
import { parseContactsCsv, type CsvContactRow } from "@/lib/csv-parser";
import { TagSelector } from "./TagSelector";

export function CSVImporter({ allTags }: { allTags: Tag[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<CsvContactRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      setRows(parseContactsCsv(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV.");
      setRows([]);
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows, tags }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Import failed.");
        return;
      }
      const data = await res.json();
      setResult(data);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">CSV file</label>
        <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />
        <p className="mt-1 text-xs text-gray-400">Columns: first_name, last_name, email</p>
      </div>

      {fileName && !error && (
        <p className="text-sm text-gray-600">
          {fileName}: <strong>{rows.length}</strong> contact{rows.length === 1 ? "" : "s"} found.
        </p>
      )}

      {rows.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Auto-tag imported contacts (optional)</label>
          <TagSelector allTags={allTags} selected={tags} onChange={setTags} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-green-700">
          Imported {result.imported}, skipped {result.skipped}.
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={rows.length === 0 || importing}
          className="rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark disabled:opacity-60"
        >
          {importing ? "Importing..." : `Import ${rows.length || ""} contacts`}
        </button>
        <button
          type="button"
          onClick={() => router.push("/contacts")}
          className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          Back to contacts
        </button>
      </div>
    </div>
  );
}

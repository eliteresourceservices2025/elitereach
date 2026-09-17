export type CsvContactRow = { firstName?: string; lastName?: string; email: string };

export function parseContactsCsv(text: string): CsvContactRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  const firstIdx = header.indexOf("first_name");
  const lastIdx = header.indexOf("last_name");

  if (emailIdx === -1) {
    throw new Error("CSV must include an 'email' column (first_name, last_name optional).");
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      email: cols[emailIdx] ?? "",
      firstName: firstIdx >= 0 ? cols[firstIdx] : undefined,
      lastName: lastIdx >= 0 ? cols[lastIdx] : undefined,
    };
  }).filter((row) => row.email);
}

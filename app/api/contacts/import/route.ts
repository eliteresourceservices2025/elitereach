import { NextRequest, NextResponse } from "next/server";
import { importSubscribers, SequenzyError } from "@/lib/sequenzy";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.records) || body.records.length === 0) {
    return NextResponse.json({ error: "No records to import" }, { status: 400 });
  }
  try {
    const result = await importSubscribers(body.records, body.tags);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 });
  }
}

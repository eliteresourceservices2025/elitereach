import { NextRequest, NextResponse } from "next/server";
import { listEmailSends, SequenzyError } from "@/lib/sequenzy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const result = await listEmailSends({
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "50"),
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load sent emails" }, { status: 500 });
  }
}

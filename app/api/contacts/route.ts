import { NextRequest, NextResponse } from "next/server";
import { createSubscriber, listSubscribers, SequenzyError } from "@/lib/sequenzy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const result = await listSubscribers({
      page: Number(searchParams.get("page") ?? "1"),
      perPage: Number(searchParams.get("perPage") ?? "50"),
      search: searchParams.get("search") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  try {
    const customAttributes: Record<string, unknown> = {};
    if (body.businessName) customAttributes.businessName = body.businessName;
    if (body.address) customAttributes.address = body.address;

    const subscriber = await createSubscriber({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || undefined,
      tags: body.tags,
      customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
    });
    return NextResponse.json(subscriber, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

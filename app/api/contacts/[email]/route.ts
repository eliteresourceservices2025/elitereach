import { NextRequest, NextResponse } from "next/server";
import { deleteSubscriber, getSubscriber, SequenzyError, updateSubscriber } from "@/lib/sequenzy";

type Params = { params: Promise<{ email: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { email } = await params;
  try {
    const subscriber = await getSubscriber(decodeURIComponent(email));
    return NextResponse.json(subscriber);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load contact" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { email } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    const subscriber = await updateSubscriber(decodeURIComponent(email), body);
    return NextResponse.json(subscriber);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { email } = await params;
  try {
    await deleteSubscriber(decodeURIComponent(email));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}

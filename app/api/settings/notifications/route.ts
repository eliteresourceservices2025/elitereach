import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  SequenzyError,
  type NotificationEvent,
  type NotificationMode,
} from "@/lib/sequenzy";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const result = await getNotificationPreferences();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load notification preferences" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { preferences?: { event: NotificationEvent; mode: NotificationMode }[] } | null;
  if (!body?.preferences) return NextResponse.json({ error: "preferences is required" }, { status: 400 });

  try {
    await updateNotificationPreferences(body.preferences);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 });
  }
}

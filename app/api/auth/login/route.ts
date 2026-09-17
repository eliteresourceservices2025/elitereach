import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, isApprovedEmail, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({ email: "" }));

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isApprovedEmail(email)) {
    return NextResponse.json({ error: "That email isn't on the approved list." }, { status: 403 });
  }

  const token = await createSessionToken(email);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}

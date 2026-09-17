import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ers_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Session = {
  email: string;
  isAdmin: boolean;
};

function getSecret() {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export function getApprovedEmails(): string[] {
  return (process.env.APPROVED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isApprovedEmail(email: string): boolean {
  return getApprovedEmails().includes(email.trim().toLowerCase());
}

export function getAdminEmails(): string[] {
  // ADMIN_EMAILS is the canonical var; ADMIN_EMAIL is kept for backwards compatibility.
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function createSessionToken(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  return new SignJWT({ email: normalized, isAdmin: isAdminEmail(normalized) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.email !== "string") return null;
    return { email: payload.email, isAdmin: Boolean(payload.isAdmin) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

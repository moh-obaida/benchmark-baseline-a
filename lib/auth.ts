import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { all, one, run } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { id, nowIso } from "@/lib/utils";

export const SESSION_COOKIE = "yra_session";
export const GUEST_COOKIE = "yra_guest";

const SESSION_MS = 1000 * 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return "yra3-dev-session-secret";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function hashToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  run(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    hashToken(token),
    userId,
    Date.now() + SESSION_MS,
  );
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token));
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return one<SessionUser>(
    `SELECT u.id, u.name, u.email, u.role, u.password_hash AS passwordHash
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    hashToken(token),
    Date.now(),
  );
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin/login");
  return user;
}

export function tooManyAttempts(email: string) {
  const since = Date.now() - 15 * 60 * 1000;
  const row = one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM login_attempts WHERE email = ? AND created_at > ?",
    email.toLowerCase(),
    since,
  );
  return Number(row?.c ?? 0) >= 8;
}

export function recordAttempt(email: string) {
  run("INSERT INTO login_attempts (id, email, created_at) VALUES (?, ?, ?)", id(), email.toLowerCase(), Date.now());
}

export function clearAttempts(email: string) {
  run("DELETE FROM login_attempts WHERE email = ?", email.toLowerCase());
}

export async function viewerId() {
  const user = await getCurrentUser();
  if (user && user.role !== "guest") return user.id;
  const jar = await cookies();
  const guest = jar.get(GUEST_COOKIE)?.value;
  if (!guest) return null;
  const row = one<{ id: string }>("SELECT id FROM users WHERE id = ? AND role = 'guest'", guest);
  return row?.id ?? null;
}

export async function ensureViewer() {
  const user = await getCurrentUser();
  if (user) return user.id;
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) {
    const row = one<{ id: string }>("SELECT id FROM users WHERE id = ? AND role = 'guest'", existing);
    if (row) return row.id;
  }
  const guestId = id();
  run(
    "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, NULL, NULL, 'guest', ?)",
    guestId,
    "زائر",
    nowIso(),
  );
  jar.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return guestId;
}

export async function mergeGuestInto(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId || guestId === userId) return;
  const guest = one<{ id: string }>("SELECT id FROM users WHERE id = ? AND role = 'guest'", guestId);
  if (!guest) {
    jar.delete(GUEST_COOKIE);
    return;
  }
  const rows = all<{ story_id: string; created_at: string }>(
    "SELECT story_id, created_at FROM favorites WHERE user_id = ?",
    guestId,
  );
  for (const row of rows) {
    run(
      "INSERT OR IGNORE INTO favorites (user_id, story_id, created_at) VALUES (?, ?, ?)",
      userId,
      row.story_id,
      row.created_at,
    );
  }
  run("UPDATE events SET user_id = ? WHERE user_id = ?", userId, guestId);
  run("DELETE FROM favorites WHERE user_id = ?", guestId);
  run("DELETE FROM users WHERE id = ?", guestId);
  jar.delete(GUEST_COOKIE);
}

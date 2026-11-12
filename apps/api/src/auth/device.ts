/**
 * A device the person has signed in from before.
 *
 * Five wrong passwords lock an account for fifteen minutes. That stops
 * guessing, and it also hands any stranger who can reach the sign-in page a
 * way to keep the only administrator locked out: five requests every fifteen
 * minutes (found on 13 November 2026). Locking by address instead would let
 * a guesser spread across many addresses try as often as they like.
 *
 * So a successful sign-in leaves a signed cookie on that browser, and while
 * the account is locked, the right password still works from a browser that
 * carries it. A stranger has no such cookie and stays locked out; the person
 * it belongs to is not.
 *
 * Wrong guesses from a browser that carries it are still refused, and still
 * counted by the address limit. The cookie is tied to the account and to the
 * password it was made with, so choosing a new password ends every one of
 * them, and it says nothing a guesser could use: it proves a past sign-in,
 * not a password.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";

export const DEVICE_COOKIE = "offset_device";
const DAYS = 30;

/**
 * Wrong passwords tried from a known browser while the account is locked. The
 * lock does not stop that browser, so this does: ten wrong in an hour and the
 * browser is treated like any other until the hour is up. Without it, anyone
 * holding the cookie (a shared computer, a copied profile) could guess far
 * faster than the five-an-hour the lock allows everyone else.
 */
const MAX_TRUSTED_FAILURES = 10;
const WINDOW_MS = 3_600_000;
const failures = new Map<string, { count: number; since: number }>();

export function trustedBlocked(userId: string, now = Date.now()): boolean {
  const f = failures.get(userId);
  if (f && now - f.since >= WINDOW_MS) failures.delete(userId);
  return (failures.get(userId)?.count ?? 0) >= MAX_TRUSTED_FAILURES;
}

export function noteTrustedFailure(userId: string, now = Date.now()): void {
  if (failures.size > 10_000) for (const [k, v] of failures) if (now - v.since >= WINDOW_MS) failures.delete(k);
  const f = failures.get(userId);
  if (!f || now - f.since >= WINDOW_MS) failures.set(userId, { count: 1, since: now });
  else f.count += 1;
}

export function clearTrustedFailures(userId: string): void {
  failures.delete(userId);
}

/** For tests. */
export function resetTrustedFailures(): void {
  failures.clear();
}

const sign = (value: string): string =>
  createHmac("sha256", config.SESSION_SECRET).update(`device|${value}`).digest("base64url");

/** Changes whenever the password does, so a new password retires every device. */
const fingerprint = (passwordHash: string): string =>
  createHash("sha256").update(passwordHash).digest("base64url").slice(0, 12);

/** Leaves the cookie on this browser. */
export function rememberDevice(reply: FastifyReply, userId: string, passwordHash: string): void {
  const expires = new Date(Date.now() + DAYS * 86_400_000);
  const value = `${userId}.${expires.getTime()}.${fingerprint(passwordHash)}`;
  reply.setCookie(DEVICE_COOKIE, `${value}.${sign(value)}`, {
    path: "/",
    httpOnly: true,
    secure: reply.request.protocol === "https",
    sameSite: "lax",
    expires,
  });
}

/** True when this browser carries a valid cookie made for this account and this password. */
export function knownDevice(request: FastifyRequest, userId: string, passwordHash: string): boolean {
  const raw = request.cookies[DEVICE_COOKIE];
  if (!raw) return false;
  const cut = raw.lastIndexOf(".");
  if (cut <= 0) return false;
  const value = raw.slice(0, cut);
  const [id, expires, print] = value.split(".");
  const a = Buffer.from(raw.slice(cut + 1));
  const b = Buffer.from(sign(value));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return id === userId && print === fingerprint(passwordHash) && Number(expires) > Date.now();
}

import type { FastifyRequest } from "fastify";
import { conflict } from "./errors.js";

/**
 * Two people editing the same record (GL-5, go-live check 15 Nov 2026).
 *
 * The page sends the record's `updated_at` as it last saw it, in the
 * `x-record-version` header, with every change. If the record has been saved
 * by somebody else since, the change is refused with a plain message instead
 * of silently overwriting theirs. No header (an older page, a script): no
 * check, as before.
 */
export const RECORD_VERSION_HEADER = "x-record-version";

export const CHANGED_MEANWHILE =
  "Someone else changed this while you were editing it. Reload the page to see their change, then make yours.";

export function assertUnchanged(request: FastifyRequest, before: object): void {
  const seen = request.headers[RECORD_VERSION_HEADER];
  if (typeof seen !== "string" || !seen) return;
  const now = (before as { updated_at?: unknown }).updated_at;
  if (typeof now === "string" && now !== seen) throw conflict(CHANGED_MEANWHILE);
}

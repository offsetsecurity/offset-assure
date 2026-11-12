import type { FastifyRequest } from "fastify";

/**
 * For a request that is allowed to be silent for a long time while the server
 * works: putting back a large backup, or making one. The idle timeout
 * (SOCKET_IDLE_TIMEOUT_MS) closes a connection that says nothing for five
 * minutes, which is right for a stranger who stalls and wrong for an
 * administrator waiting for a multi-gigabyte restore. These routes need an
 * administrator, so the exemption is not open to a stranger.
 */
export function noIdleTimeout(request: Pick<FastifyRequest, "raw">): void {
  // A request made inside the process (the tests, and the approval of a
  // suggestion) has a stand-in socket with no timer to switch off.
  const socket = request.raw.socket;
  if (socket && typeof socket.setTimeout === "function") socket.setTimeout(0);
}

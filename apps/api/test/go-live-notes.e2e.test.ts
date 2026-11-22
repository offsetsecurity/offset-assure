import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import net, { type AddressInfo } from "node:net";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { seedControls } from "../src/db/seed.js";
import { pool, query } from "../src/db/pool.js";
import { CHANGED_MEANWHILE, versioned } from "../src/lib/record-version.js";

/**
 * The six small notes left by the second developer's review of the go-live
 * fixes (15 Nov 2026), each with the test that shows it is closed.
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;
const PASSWORD = "correct-horse-battery-staple";

maybe("go-live review notes", () => {
  let app: FastifyInstance;
  let headers: Record<string, string> = {};

  const read = async (path: string, key: string) =>
    ((await app.inject({ method: "GET", url: path, headers })).json() as Record<string, Record<string, unknown>>)[key]!;
  const save = (path: string, payload: Record<string, unknown>, version?: string) =>
    app.inject({ method: "PATCH", url: path, headers: { ...headers, ...(version ? { "x-record-version": version } : {}) }, payload });
  const multipart = (url: string) => {
    const boundary = "----offsettest";
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="note.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      Buffer.from("a signed note"),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return app.inject({ method: "POST", url, headers: { ...headers, "content-type": `multipart/form-data; boundary=${boundary}` }, payload: body });
  };

  beforeAll(async () => {
    await migrate();
    for (const t of ["audit_log", "attachments", "sessions", "tasks", "evidence_controls", "evidence", "risk_controls", "risks", "users"]) await query(`delete from ${t}`);
    await query("delete from controls");
    await seedControls();
    app = await buildApp();
    await app.ready();
    const boot = await app.inject({
      method: "POST", url: "/api/v1/auth/bootstrap",
      payload: { username: "noter", name: "Nora Noter", email: "noter@example.test", password: PASSWORD },
    });
    expect(boot.statusCode).toBe(201);
    const set = ([boot.headers["set-cookie"] ?? []].flat() as string[]).join(";");
    const sid = /offset_sid=([^;]+)/.exec(set)?.[1] ?? "";
    const csrf = /offset_csrf=([^;]+)/.exec(set)?.[1] ?? "";
    headers = { cookie: `offset_sid=${sid}; offset_csrf=${csrf}`, "x-csrf-token": csrf };
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await pool.end();
  });

  const cases: { name: string; create: () => Promise<string>; path: (id: string) => string; key: string; change: (n: number) => Record<string, unknown> }[] = [
    {
      name: "a risk",
      create: async () => ((await app.inject({ method: "POST", url: "/api/v1/risks", headers, payload: { title: "Notes risk", likelihood: 2, impact: 2 } })).json() as { risk: { id: string } }).risk.id,
      path: (id) => `/api/v1/risks/${id}`, key: "risk", change: (n) => ({ title: `Notes risk ${n}` }),
    },
    {
      name: "a control",
      create: async () => (await query<{ id: string }>("select id from controls order by ref limit 1 offset 5")).rows[0]!.id,
      path: (id) => `/api/v1/controls/${id}`, key: "control", change: (n) => ({ notes: `Changed ${n}` }),
    },
    {
      name: "evidence",
      create: async () => ((await app.inject({ method: "POST", url: "/api/v1/evidence", headers, payload: { name: "Notes evidence" } })).json() as { evidence: { id: string } }).evidence.id,
      path: (id) => `/api/v1/evidence/${id}`, key: "evidence", change: (n) => ({ notes: `Changed ${n}` }),
    },
    {
      name: "a register entry (a task)",
      create: async () => ((await app.inject({ method: "POST", url: "/api/v1/tasks", headers, payload: { title: "Notes task" } })).json() as { task: { id: string } }).task.id,
      path: (id) => `/api/v1/tasks/${id}`, key: "task", change: (n) => ({ title: `Notes task ${n}` }),
    },
  ];

  for (const c of cases) {
    it(`note 5: ${c.name}: a save answers with the record's new version, and the next save from it goes through`, async () => {
      const id = await c.create();
      const seen = String((await read(c.path(id), c.key))["updated_at"]);
      await new Promise((r) => setTimeout(r, 5));
      const first = await save(c.path(id), c.change(1), seen);
      expect(first.statusCode, first.body).toBe(200);
      const answered = String((first.json() as Record<string, Record<string, unknown>>)[c.key]!["updated_at"]);
      expect(answered).not.toBe(seen);
      expect(answered).toBe(String((await read(c.path(id), c.key))["updated_at"]));
      expect((await save(c.path(id), c.change(2), answered)).statusCode).toBe(200);
    });

    it(`note 3: ${c.name}: saves sent at the same moment from one version: exactly one goes through`, async () => {
      const id = await c.create();
      const seen = String((await read(c.path(id), c.key))["updated_at"]);
      await new Promise((r) => setTimeout(r, 5));
      const all = await Promise.all([1, 2, 3, 4].map((n) => save(c.path(id), c.change(10 + n), seen)));
      expect(all.map((r) => r.statusCode).sort()).toEqual([200, 409, 409, 409]);
      for (const r of all.filter((x) => x.statusCode === 409)) expect((r.json() as { error: string }).error).toBe(CHANGED_MEANWHILE);
    });
  }

  it("note 2: attaching a file to evidence names the new version, and the next save from it goes through", async () => {
    const id = await cases[2]!.create();
    const res = await multipart(`/api/v1/evidence/${id}/file`);
    expect(res.statusCode, res.body).toBe(201);
    expect(res.headers["x-record-id"]).toBe(id);
    const version = String(res.headers["x-record-version"]);
    expect(version).toBe(String((await read(`/api/v1/evidence/${id}`, "evidence"))["updated_at"]));
    expect((await save(`/api/v1/evidence/${id}`, { notes: "After the file" }, version)).statusCode).toBe(200);
    // Removing the file does the same.
    const before = String((await read(`/api/v1/evidence/${id}`, "evidence"))["updated_at"]);
    await new Promise((r) => setTimeout(r, 5));
    const gone = await app.inject({ method: "DELETE", url: `/api/v1/evidence/${id}/file`, headers });
    expect(gone.statusCode).toBe(204);
    const after = String(gone.headers["x-record-version"]);
    expect(after).not.toBe(before);
    expect((await save(`/api/v1/evidence/${id}`, { notes: "After removing it" }, after)).statusCode).toBe(200);
  });

  it("note 2: attaching a file to a register entry names the new version too", async () => {
    const id = await cases[3]!.create();
    const res = await multipart(`/api/v1/attachments/tasks/${id}`);
    expect(res.statusCode, res.body).toBe(201);
    expect(res.headers["x-record-id"]).toBe(id);
    const version = String(res.headers["x-record-version"]);
    expect(version).toBe(String((await read(`/api/v1/tasks/${id}`, "task"))["updated_at"]));
    expect((await save(`/api/v1/tasks/${id}`, { title: "After the file" }, version)).statusCode).toBe(200);
  });

  /** A raw connection: what comes back, or 0 if it was closed with no answer. */
  const rawRequest = (port: number, send: (sock: net.Socket) => void, waitMs: number) =>
    new Promise<{ status: number; closedAfter: number }>((resolve) => {
      const started = Date.now();
      let got = "";
      let settled = false;
      const sock = net.connect({ host: "127.0.0.1", port }, () => send(sock));
      const done = () => {
        if (settled) return;
        settled = true;
        const m = /^HTTP\/1\.1 (\d{3})/.exec(got);
        resolve({ status: m ? Number(m[1]) : 0, closedAfter: Date.now() - started });
        sock.destroy();
      };
      sock.on("data", (d: Buffer) => { got += d.toString("latin1"); if (got.includes("\r\n\r\n")) done(); });
      sock.on("error", () => { /* read in done() */ });
      sock.on("close", done);
      setTimeout(done, waitMs);
    });

  it("note 1: a body that trickles in is cut off at the body limit, not after an hour", async () => {
    const live = await buildApp({ bodyTimeoutMs: 1500 });
    await live.listen({ port: 0, host: "127.0.0.1" });
    const port = (live.server.address() as AddressInfo).port;
    try {
      const slow = await rawRequest(port, (sock) => {
        sock.write("POST /api/v1/auth/login HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{");
        const drip = setInterval(() => { if (!sock.destroyed) sock.write(" "); }, 300);
        sock.on("close", () => clearInterval(drip));
      }, 10_000);
      expect(slow.closedAfter, "the connection should be closed soon after 1.5 s").toBeLessThan(5000);
      expect(slow.closedAfter).toBeGreaterThanOrEqual(1400);
      // A normal request on the same server is not affected.
      const ok = await rawRequest(port, (sock) => {
        const body = JSON.stringify({ username: "nobody", password: "wrong-password-here" });
        sock.write(`POST /api/v1/auth/login HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\n\r\n${body}`);
      }, 5000);
      expect(ok.status).toBe(401);
    } finally {
      await live.close();
    }
  }, 30_000);

  it("note 4: an oversized body sent without saying its length first is answered with 413", async () => {
    const live = await buildApp();
    await live.listen({ port: 0, host: "127.0.0.1" });
    const port = (live.server.address() as AddressInfo).port;
    try {
      const big = Buffer.from(`{"title":"${"a".repeat(3_000_000)}"}`);
      const res = await rawRequest(port, (sock) => {
        sock.write("POST /api/v1/auth/login HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n");
        for (let i = 0; i < big.length; i += 65_536) {
          const part = big.subarray(i, i + 65_536);
          sock.write(`${part.length.toString(16)}\r\n`);
          sock.write(part);
          sock.write("\r\n");
        }
        sock.write("0\r\n\r\n");
      }, 10_000);
      expect(res.status, "0: the connection was cut with no answer").toBe(413);
    } finally {
      await live.close();
    }
  }, 30_000);

  /** Like rawRequest, but waits for the connection to close, keeping the status seen on the way. */
  const untilClosed = (port: number, send: (sock: net.Socket) => void, waitMs: number) =>
    new Promise<{ status: number; closedAfter: number }>((resolve) => {
      const started = Date.now();
      let got = "";
      let settled = false;
      const sock = net.connect({ host: "127.0.0.1", port }, () => send(sock));
      const done = () => {
        if (settled) return;
        settled = true;
        const m = /^HTTP\/1\.1 (\d{3})/.exec(got);
        resolve({ status: m ? Number(m[1]) : 0, closedAfter: Date.now() - started });
        sock.destroy();
      };
      sock.on("data", (d: Buffer) => { got += d.toString("latin1"); });
      sock.on("error", () => { /* read in done() */ });
      sock.on("close", done);
      setTimeout(done, waitMs);
    });
  const trickle = (sock: net.Socket) => {
    const drip = setInterval(() => { if (!sock.destroyed) sock.write("1\r\n \r\n"); }, 200);
    sock.on("close", () => clearInterval(drip));
  };

  it("note 1 (review): a body still trickling after an early refusal is cut off at the body limit too", async () => {
    const live = await buildApp({ bodyTimeoutMs: 1500 });
    await live.listen({ port: 0, host: "127.0.0.1" });
    const port = (live.server.address() as AddressInfo).port;
    try {
      // Refused before the body is read (nobody signed in), then the body keeps coming.
      const refused = await untilClosed(port, (sock) => {
        sock.write("POST /api/v1/backups/upload HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: multipart/form-data; boundary=x\r\nTransfer-Encoding: chunked\r\n\r\n");
        trickle(sock);
      }, 10_000);
      expect(refused.status).toBe(401);
      expect(refused.closedAfter, "closed at the body limit, not held").toBeLessThan(5000);
      // Over the size limit with no length declared: the 413 arrives, then a trickle is still ended.
      const big = Buffer.from(`{"title":"${"a".repeat(2_200_000)}"}`);
      const tooBig = await untilClosed(port, (sock) => {
        sock.write("POST /api/v1/auth/login HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n");
        sock.write(`${big.length.toString(16)}\r\n`);
        sock.write(big);
        sock.write("\r\n");
        trickle(sock);
      }, 10_000);
      expect(tooBig.status).toBe(413);
      expect(tooBig.closedAfter, "closed at the body limit, not held").toBeLessThan(5000);
    } finally {
      await live.close();
    }
  }, 30_000);

  it("note 3 (review): a save is refused when the record changes between the check and the update", async () => {
    const id = await cases[3]!.create();
    const seen = String((await read(`/api/v1/tasks/${id}`, "task"))["updated_at"]);
    // Somebody else's save lands after the check has passed, before this update runs.
    await query("update tasks set title = 'Saved by somebody else', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now', '+1 second') where id = $1", [id]);
    const sets = ["title = $2"];
    const params: unknown[] = [id, "Saved from the old version"];
    const same = versioned({ headers: { "x-record-version": seen } } as never, { updated_at: seen }, sets, params);
    const { rows } = await query(`update tasks set ${sets.join(", ")} where id = $1${same} returning *`, params);
    expect(rows).toHaveLength(0);
    expect(String((await read(`/api/v1/tasks/${id}`, "task"))["title"])).toBe("Saved by somebody else");
  });
});

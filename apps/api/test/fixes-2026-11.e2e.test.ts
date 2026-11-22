import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import net, { type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import tls from "node:tls";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { pool, query } from "../src/db/pool.js";
import { resetAddressLimits } from "../src/auth/address-limit.js";
import { resetTrustedFailures } from "../src/auth/device.js";
import { issueTemporaryPassword } from "../src/auth/temporary.js";
import { noIdleTimeout } from "../src/lib/long-request.js";

/**
 * Findings of the whole-product check of 13 November 2026, one test each, and
 * of the independent review of the fixes:
 *
 *   S1  a half-sent request was held open for ever (plain and HTTPS)
 *   S2  a stranger could keep the only administrator locked out
 *   S4  the TLS minimum was only Node's default, not set
 *   S5  names and titles accepted line breaks and control characters
 *   G5  the big lists were read whole, then cut
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;

const PASSWORD = "correct-horse-battery-staple";
const work = mkdtempSync(join(tmpdir(), "offset-fixes-"));

const cookiesOf = (res: { headers: Record<string, unknown> }): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const c of [res.headers["set-cookie"] ?? []].flat() as string[]) {
    const m = /^([^=]+)=([^;]*)/.exec(c);
    if (m) out[m[1]!] = m[2]!;
  }
  return out;
};

/** Says how long the server took to close a connection that went quiet, or -1 if it never did. */
function stall(socket: net.Socket | tls.TLSSocket, ms = 12_000): Promise<number> {
  const started = Date.now();
  return new Promise((resolve) => {
    socket.on("close", () => resolve(Date.now() - started));
    socket.on("error", () => {});
    setTimeout(() => resolve(-1), ms);
  });
}
const HALF = "POST /api/v1/auth/login HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{";

maybe("whole-product check fixes", () => {
  let app: FastifyInstance;
  let admin = { sid: "", csrf: "" };
  let n = 0;

  const login = (username: string, password: string, cookie = "") =>
    app.inject({ method: "POST", url: "/api/v1/auth/login", headers: cookie ? { cookie } : {}, payload: { username, password } });
  const browser = () => ({ cookie: `offset_sid=${admin.sid}; offset_csrf=${admin.csrf}`, "x-csrf-token": admin.csrf });
  /** A new person, made through the product. */
  const person = async (password = PASSWORD, role = "contributor") => {
    const username = `p${++n}x${Math.random().toString(36).slice(2, 6)}`;
    const res = await app.inject({
      method: "POST", url: "/api/v1/users", headers: browser(),
      payload: { username, name: `Person ${n}`, email: `${username}@example.test`, role, password },
    });
    expect(res.statusCode, res.body).toBe(201);
    const id = (await query<{ id: string }>("select id from users where username = $1", [username])).rows[0]!.id;
    return { username, id, password };
  };
  const lock = (id: string) => query("update users set failed_logins = 5, locked_until = $2 where id = $1", [id, new Date(Date.now() + 600_000).toISOString()]);
  const certificate = (name: string): { key: Buffer; cert: Buffer } => {
    const key = join(work, `${name}.key`);
    const cert = join(work, `${name}.crt`);
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2", "-keyout", key, "-out", cert, "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"], { stdio: "ignore" });
    return { key: readFileSync(key), cert: readFileSync(cert) };
  };

  beforeAll(async () => {
    await migrate();
    for (const t of ["audit_log", "sessions", "users"]) await query(`delete from ${t}`);
    resetAddressLimits();
    resetTrustedFailures();
    app = await buildApp();
    await app.ready();
    const boot = await app.inject({
      method: "POST", url: "/api/v1/auth/bootstrap",
      payload: { username: "keeper", name: "The Keeper", email: "keeper@example.test", password: PASSWORD },
    });
    expect(boot.statusCode).toBe(201);
    const c = cookiesOf(boot);
    admin = { sid: c["offset_sid"]!, csrf: c["offset_csrf"]! };
  }, 60_000);

  afterAll(async () => {
    vi.useRealTimers();
    await app?.close();
    await pool.end();
    rmSync(work, { recursive: true, force: true });
  });

  // ── S1 ────────────────────────────────────────────────────────────────────
  it("S1: a plain connection that sends half a request and stops is closed by the server", async () => {
    const quick = await buildApp({ socketIdleTimeoutMs: 1500 });
    await quick.listen({ port: 0, host: "127.0.0.1" });
    const port = (quick.server.address() as AddressInfo).port;
    try {
      const socket = net.connect(port, "127.0.0.1");
      const closed = stall(socket);
      socket.write(HALF);
      const after = await closed;
      expect(after, "the server never closed the stalled connection").toBeGreaterThan(0);
      expect(after).toBeLessThan(10_000);
      socket.destroy();
      expect((await fetch(`http://127.0.0.1:${port}/api/v1/health`)).status).toBe(200);
    } finally {
      await quick.close();
    }
  }, 30_000);

  it("S1: the same over HTTPS, which is how most installs are served", async () => {
    const secure = await buildApp({ https: certificate("s1"), socketIdleTimeoutMs: 1500 });
    await secure.listen({ port: 0, host: "127.0.0.1" });
    const port = (secure.server.address() as AddressInfo).port;
    try {
      const socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
        const s = tls.connect({ port, host: "127.0.0.1", rejectUnauthorized: false }, () => resolve(s));
        s.on("error", reject);
      });
      const closed = stall(socket);
      socket.write(HALF);
      const after = await closed;
      expect(after, "the HTTPS server never closed the stalled connection").toBeGreaterThan(0);
      expect(after).toBeLessThan(10_000);
    } finally {
      await secure.close();
    }
  }, 30_000);

  it("S1: the default settings are five minutes of silence and an hour for one whole request, on both servers", async () => {
    expect(app.server.timeout).toBe(300_000);
    expect(app.server.requestTimeout).toBe(3_600_000);
    const secure = await buildApp({ https: certificate("s1d") });
    try {
      expect(secure.server.timeout).toBe(300_000);
      expect(secure.server.requestTimeout).toBe(3_600_000);
    } finally {
      await secure.close();
    }
  });

  it("S1: putting back or making a backup, which can be silent for a long time, is exempt from the idle timeout", () => {
    const calls: number[] = [];
    noIdleTimeout({ raw: { socket: { setTimeout: (ms: number) => calls.push(ms) } } } as never);
    expect(calls).toEqual([0]);
    expect(() => noIdleTimeout({ raw: {} } as never)).not.toThrow();
    expect(() => noIdleTimeout({ raw: { socket: {} } } as never)).not.toThrow();
  });

  // ── S2 ────────────────────────────────────────────────────────────────────
  it("S2: a locked account takes the right password from a browser it signed in from, and from no other", async () => {
    resetAddressLimits(); resetTrustedFailures();
    const p = await person();
    const first = await login(p.username, p.password);
    expect(first.statusCode).toBe(200);
    const device = cookiesOf(first)["offset_device"];
    expect(device, "no device cookie was set").toBeTruthy();
    expect(first.headers["set-cookie"]!.toString()).toMatch(/offset_device=[^;]+;[^]*HttpOnly/i);

    for (let i = 0; i < 5; i++) expect((await login(p.username, "not-the-password-1")).statusCode).toBe(401);
    expect((await query<{ locked_until: string | null }>("select locked_until from users where id = $1", [p.id])).rows[0]!.locked_until).toBeTruthy();

    expect((await login(p.username, p.password)).statusCode, "no cookie").toBe(401);
    expect((await login(p.username, p.password, `offset_device=${device}x`)).statusCode, "altered cookie").toBe(401);
    expect((await login(p.username, p.password, `offset_device=${device!.replace(/^[^.]+/, "00000000-0000-0000-0000-000000000000")}`)).statusCode, "another person's id").toBe(401);
    expect((await login(p.username, "still-not-it-1234", `offset_device=${device}`)).statusCode, "wrong password with the cookie").toBe(401);
    const back = await login(p.username, p.password, `offset_device=${device}`);
    expect(back.statusCode).toBe(200);
    expect((await query("select 1 from audit_log where action like 'Signed in (account was locked%' and entity_id = $1", [p.id])).rows.length).toBeGreaterThan(0);
    expect((await query<{ locked_until: string | null }>("select locked_until from users where id = $1", [p.id])).rows[0]!.locked_until).toBeNull();
  });

  it("S2: one person's cookie does not unlock another person's account", async () => {
    resetAddressLimits(); resetTrustedFailures();
    const a = await person(); const b = await person();
    const theirs = cookiesOf(await login(b.username, b.password))["offset_device"]!;
    const mine = cookiesOf(await login(a.username, a.password))["offset_device"]!;
    await lock(a.id);
    expect((await login(a.username, a.password, `offset_device=${theirs}`)).statusCode).toBe(401);
    expect((await login(a.username, a.password, `offset_device=${mine}`)).statusCode).toBe(200);
  });

  it("S2: the cookie stops working after 30 days", async () => {
    resetAddressLimits(); resetTrustedFailures();
    const p = await person();
    const device = cookiesOf(await login(p.username, p.password))["offset_device"]!;
    await lock(p.id);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(Date.now() + 29 * 86_400_000);
      await lock(p.id);
      expect((await login(p.username, p.password, `offset_device=${device}`)).statusCode, "day 29").toBe(200);
      vi.setSystemTime(Date.now() + 2 * 86_400_000);
      await lock(p.id);
      expect((await login(p.username, p.password, `offset_device=${device}`)).statusCode, "day 31").toBe(401);
    } finally {
      vi.useRealTimers();
    }
  });

  it("S2: choosing a new password retires the old browsers and leaves this one remembered", async () => {
    resetAddressLimits(); resetTrustedFailures();
    const p = await person();
    const signed = await login(p.username, p.password);
    const old = cookiesOf(signed)["offset_device"]!;
    const c = cookiesOf(signed);
    const changed = await app.inject({
      method: "POST", url: "/api/v1/auth/password",
      headers: { cookie: `offset_sid=${c["offset_sid"]}; offset_csrf=${c["offset_csrf"]}`, "x-csrf-token": c["offset_csrf"]! },
      payload: { currentPassword: p.password, newPassword: "a-brand-new-passphrase-77" },
    });
    expect(changed.statusCode).toBe(200);
    const fresh = cookiesOf(changed)["offset_device"];
    expect(fresh, "no cookie after the change").toBeTruthy();
    await lock(p.id);
    expect((await login(p.username, "a-brand-new-passphrase-77", `offset_device=${old}`)).statusCode, "the old cookie").toBe(401);
    expect((await login(p.username, "a-brand-new-passphrase-77", `offset_device=${fresh}`)).statusCode, "the new cookie").toBe(200);
  });

  it("S2: the way back after a reset (temporary password, then a new one) ends with a remembered browser", async () => {
    resetAddressLimits(); resetTrustedFailures();
    const p = await person();
    const temp = await issueTemporaryPassword(p.id, null, "invite");
    const signed = await login(p.username, temp);
    expect(signed.statusCode).toBe(200);
    expect(cookiesOf(signed)["offset_device"], "a temporary password must not mark the browser").toBeUndefined();
    const c = cookiesOf(signed);
    const chosen = await app.inject({
      method: "POST", url: "/api/v1/auth/password",
      headers: { cookie: `offset_sid=${c["offset_sid"]}; offset_csrf=${c["offset_csrf"]}`, "x-csrf-token": c["offset_csrf"]! },
      payload: { newPassword: "chosen-after-the-reset-88" },
    });
    expect(chosen.statusCode, chosen.body).toBe(200);
    const device = cookiesOf(chosen)["offset_device"];
    expect(device).toBeTruthy();
    await lock(p.id);
    expect((await login(p.username, "chosen-after-the-reset-88", `offset_device=${device}`)).statusCode).toBe(200);
  });

  it("S2: a known browser cannot guess past the lock: ten wrong passwords in an hour and it is treated like any other", async () => {
    resetAddressLimits(); resetTrustedFailures();
    const p = await person();
    const device = cookiesOf(await login(p.username, p.password))["offset_device"]!;
    await lock(p.id);
    for (let i = 0; i < 10; i++) {
      resetAddressLimits(); // the address limit is its own protection and is tested elsewhere
      expect((await login(p.username, `wrong-guess-${i}-xx`, `offset_device=${device}`)).statusCode).toBe(401);
    }
    resetAddressLimits();
    expect((await login(p.username, p.password, `offset_device=${device}`)).statusCode, "the right password, after ten wrong ones").toBe(401);
    resetTrustedFailures();
    expect((await login(p.username, p.password, `offset_device=${device}`)).statusCode, "an hour later").toBe(200);
  });

  // ── S4 ────────────────────────────────────────────────────────────────────
  it("S4: the HTTPS server refuses TLS older than 1.2, even if Node's own default were lowered", async () => {
    const before = tls.DEFAULT_MIN_VERSION;
    tls.DEFAULT_MIN_VERSION = "TLSv1"; // what a changed Node, or a changed start-up flag, could do
    const secure = await buildApp({ https: certificate("s4") });
    try {
      await secure.listen({ port: 0, host: "127.0.0.1" });
      const port = (secure.server.address() as AddressInfo).port;
      const old = await new Promise<string>((resolve) => {
        const s = tls.connect({ port, host: "127.0.0.1", rejectUnauthorized: false, minVersion: "TLSv1", maxVersion: "TLSv1.1", ciphers: "ALL:@SECLEVEL=0" }, () => { s.destroy(); resolve("connected"); });
        s.on("error", (e) => resolve(`refused: ${e.message}`));
      });
      expect(old, "TLS 1.1 was accepted").toMatch(/^refused/);
      // The setting itself, so the test fails if it is dropped (Node's bundled
      // OpenSSL happens to refuse TLS 1.1 on its own, which would hide that).
      expect((secure.server as unknown as { minVersion?: string }).minVersion).toBe("TLSv1.2");
      const modern = await new Promise<string>((resolve) => {
        const s = tls.connect({ port, host: "127.0.0.1", rejectUnauthorized: false }, () => { const v = s.getProtocol() ?? ""; s.destroy(); resolve(v); });
        s.on("error", (e) => resolve(`error: ${e.message}`));
      });
      expect(modern).toMatch(/^TLSv1\.[23]$/);
    } finally {
      tls.DEFAULT_MIN_VERSION = before;
      await secure.close();
    }
  }, 30_000);

  // ── S5 ────────────────────────────────────────────────────────────────────
  it("S5: names and titles refuse line breaks, control characters and forced direction; Arabic and Hebrew pasted from Word are fine", async () => {
    const post = (url: string, payload: Record<string, unknown>) => app.inject({ method: "POST", url, headers: browser(), payload });
    const user = (name: string) => post("/api/v1/users", { username: `u${Math.random().toString(36).slice(2, 8)}`, name, email: `${Math.random().toString(36).slice(2, 8)}@example.test`, role: "readonly", password: "some-long-passphrase-9" });
    for (const bad of ["Evil\r\nBcc: x@example.test", "Null\u0000Name", "Reversed ‮Text", "Forced ‭Text", "Line\nbreak"]) {
      const res = await user(bad);
      expect(res.statusCode, JSON.stringify(bad)).toBe(400);
      expect(res.json().error).toMatch(/one line|character U\+/);
    }
    expect((await user("Null\u0000Name")).json().error).toContain("U+0000");
    for (const bad of ["Title\r\nwith a break", "Null\u0000", "Back‮wards"]) {
      expect((await post("/api/v1/risks", { title: bad, likelihood: 2, impact: 2 })).statusCode, JSON.stringify(bad)).toBe(400);
    }
    // What is fine stays fine: other alphabets, emoji, the marks and isolates that pasted Arabic and Hebrew carry, U+0085, tabs and line breaks in a description.
    for (const good of ["تقرير الأمن", "安全报告", "Zoë Müller 🔒", "O'Brien-Smith", "‏تقرير‎ مع Report ⁧الأمن⁩", "‫عنوان‬", "؜نص", "Old text\u0085with NEL"]) {
      expect((await post("/api/v1/risks", { title: good, likelihood: 2, impact: 2 })).statusCode, JSON.stringify(good)).toBe(201);
    }
    expect((await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { username: "nobody", password: "pass‮word\u0001" } })).statusCode).toBe(401);
    expect((await post("/api/v1/risks", { title: "Several lines in the description", description: "First line\r\nSecond line\n\tThird, indented", likelihood: 2, impact: 2 })).statusCode).toBe(201);
    // A body too big to check is refused, not waved through.
    const huge = { title: "x", likelihood: 2, impact: 2, items: Array.from({ length: 60_000 }, () => 1), tail: "Bad\u0000" };
    const refused = await post("/api/v1/risks", huge);
    expect(refused.statusCode).toBe(400);
    expect(refused.json().error).toMatch(/too large|too deeply/);
  });

});

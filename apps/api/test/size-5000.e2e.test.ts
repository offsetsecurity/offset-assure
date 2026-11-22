import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { seedControls } from "../src/db/seed.js";
import { db, pool, query } from "../src/db/pool.js";

/**
 * The product's promise on size: with 5,000 risks, 5,000 assets, 2,000 tasks
 * and 2,000 pieces of evidence, no screen's request takes more than 2 seconds
 * (lasting-code rule 10). One test per request, so a slow one names itself.
 *
 * The limit is a ceiling on a busy machine, not a target: the same requests
 * take well under half a second on a quiet one.
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;

const LIMIT_MS = 2000;
const SIZES = { risks: 5000, assets: 5000, tasks: 2000, evidence: 2000 } as const;

maybe("size: 5,000 rows", () => {
  let app: FastifyInstance;
  let cookie = "";

  beforeAll(async () => {
    await migrate();
    for (const t of [
      "asset_controls", "asset_risks", "policy_controls", "policy_versions", "policy_acknowledgements",
      "incident_controls", "incident_risks", "finding_controls", "assets", "policies", "tasks", "incidents",
      "findings", "risk_controls", "evidence_controls", "risks", "evidence", "control_tests", "audit_log",
      "sessions", "users", "controls",
    ]) await query(`delete from ${t}`);
    await seedControls();
    app = await buildApp();
    await app.ready();

    const boot = await app.inject({
      method: "POST", url: "/api/v1/auth/bootstrap",
      payload: { username: "admin", name: "Test Admin", email: "admin@example.test", password: "correct-horse-battery-staple" },
    });
    cookie = (boot.headers["set-cookie"] as string[]).map((c) => c.split(";")[0]).join("; ");

    const fill = db.transaction(() => {
      const risk = db.prepare("insert into risks (id, seq, title, likelihood, impact) values (?, ?, ?, ?, ?)");
      for (let i = 1; i <= SIZES.risks; i++) risk.run(randomUUID(), i, `Risk number ${i}`, 1 + (i % 5), 1 + (i % 4));
      const asset = db.prepare("insert into assets (id, seq, name) values (?, ?, ?)");
      for (let i = 1; i <= SIZES.assets; i++) asset.run(randomUUID(), i, `Asset number ${i}`);
      const task = db.prepare("insert into tasks (id, seq, title) values (?, ?, ?)");
      for (let i = 1; i <= SIZES.tasks; i++) task.run(randomUUID(), i, `Task number ${i}`);
      const ev = db.prepare("insert into evidence (id, name) values (?, ?)");
      for (let i = 1; i <= SIZES.evidence; i++) ev.run(randomUUID(), `Evidence item ${i}`);
    });
    fill();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await pool.end();
  });

  const urls = [
    "/api/v1/risks", "/api/v1/risks/summary", "/api/v1/assets", "/api/v1/tasks", "/api/v1/evidence",
    "/api/v1/evidence/summary", "/api/v1/controls", "/api/v1/controls/summary", "/api/v1/findings",
    "/api/v1/audit", "/api/v1/readiness", "/api/v1/readiness/dashboard",
  ];

  it.each(urls)("%s answers in under 2 seconds", async (url) => {
    const started = performance.now();
    const res = await app.inject({ url, headers: { cookie } });
    const ms = Math.round(performance.now() - started);
    console.log(`size-5000 ${url}: ${res.statusCode} in ${ms} ms, ${res.rawPayload.length} bytes`);
    expect(res.statusCode).toBeLessThan(400);
    expect(ms).toBeLessThan(LIMIT_MS);
  });
});

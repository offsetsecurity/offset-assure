import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { pool } from "../src/db/pool.js";

/**
 * The page policy (14 Nov 2026): no inline styles and no inline scripts are
 * allowed, and the page may not be embedded with anything it does not control.
 * The page's styles live in their own file (built by apps/web/build/esbuild.mjs).
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;

maybe("page policy headers", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    await migrate();
    app = await buildApp();
  });
  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("refuses inline styles and scripts", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/health" });
    const csp = String(res.headers["content-security-policy"]);
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("sets the cross-origin embedder policy", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(res.headers["cross-origin-embedder-policy"]).toBe("require-corp");
  });
});

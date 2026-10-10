import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { pool, query } from "../src/db/pool.js";
import { seedControls } from "../src/db/seed.js";
import { loadPackJourney } from "../src/journey/journey.js";
import { hasCheck } from "../src/journey/checks.js";

/**
 * Offset Assure's readiness plan, and the checks written for it.
 *
 * ISO 27001 asks for things SAMA does not - a justified Statement of
 * Applicability, internal audit, corrective action - so its plan leans on
 * checks no other pack used before. Each one is exercised here against real
 * rows, because a check that is always green or never green looks exactly like
 * a working one on screen.
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;

const PACKS = resolve(process.cwd(), "../../packs");
const ASSURE_PACK = resolve(PACKS, "assure");

/** Every screen a plan step may send somebody to, and the feature that shows it. */
const SCREENS: Record<string, string | null> = {
  getready: "journey", dashboard: null, isms: "ismsScreen", profile: "tiers", soa: "statementOfApplicability",
  system: "baselines", controls: null, evidence: null, risks: null, assets: null,
  policies: null, tasks: null, incidents: null, findings: null, reports: null,
  people: null, backups: null, settings: null, audit: null,
  vendors: "ismsRegisters", training: "ismsRegisters", objectives: "ismsRegisters",
  parties: "ismsRegisters", reviews: "ismsRegisters", communications: "ismsRegisters",
  calendar: "calendar", gaps: "gapAnalysis", help: "help", guides: "help",
};

interface PackTask { id: string; title: string; do: string; why: string; check?: string; goto?: string }

describe("readiness plans in every pack that ships one", () => {
  // Whatever packs are here. A written list fails in a repository that holds
  // one product, and silently skips a new one in a repository that holds five.
  const ids = readdirSync(PACKS, { withFileTypes: true })
    .filter((d) => (d.isDirectory() || d.isSymbolicLink()) && existsSync(resolve(PACKS, d.name, "journey.json")))
    .map((d) => d.name);

  for (const id of ids) {
    it(`${id}: sends people only to screens its product shows`, async () => {
      const pack = JSON.parse(await readFile(resolve(PACKS, id, "pack.json"), "utf8")) as {
        features?: Record<string, boolean>;
      };
      const journey = JSON.parse(await readFile(resolve(PACKS, id, "journey.json"), "utf8")) as {
        stages: { tasks: PackTask[] }[];
      };
      expect(pack.features?.["journey"]).toBe(true);
      for (const t of journey.stages.flatMap((s) => s.tasks)) {
        if (!t.goto) continue;
        expect(Object.hasOwn(SCREENS, t.goto), `${t.id} goes to ${t.goto}, which is not a screen`).toBe(true);
        const needs = SCREENS[t.goto];
        if (needs) expect(pack.features?.[needs], `${t.id} goes to ${t.goto}, hidden in ${id}`).toBe(true);
      }
    });
  }
});

maybe("Offset Assure readiness plan", () => {
  let app: FastifyInstance;
  let sid = "";
  let csrf = "";

  const read = () => ({ cookie: `offset_sid=${sid}; offset_csrf=${csrf}` });

  interface Task { id: string; state: string; automatic: boolean; detail: string }
  interface Plan { stages: { id: string; tasks: Task[] }[] }

  const task = async (id: string): Promise<Task> => {
    const res = await app.inject({ url: "/api/v1/journey", headers: read() });
    expect(res.statusCode).toBe(200);
    const plan = res.json().journey as Plan;
    const t = plan.stages.flatMap((s) => s.tasks).find((x) => x.id === id);
    expect(t, `no task ${id}`).toBeTruthy();
    return t!;
  };

  beforeAll(async () => {
    process.env["PACK_DIR"] = ASSURE_PACK;
    await migrate();
    for (const t of [
      "audit_log", "sessions", "users", "evidence_controls", "risk_controls", "controls",
      "programme", "risks", "evidence", "assets", "policies", "tasks", "findings",
      "journey_tasks", "settings",
    ]) {
      await query(`delete from ${t}`);
    }
    await seedControls();

    app = await buildApp();
    await app.ready();

    const boot = await app.inject({
      method: "POST",
      url: "/api/v1/auth/bootstrap",
      payload: {
        username: "admin", name: "Test Admin",
        email: "admin@example.test", password: "correct-horse-battery-staple",
      },
    });
    for (const c of boot.headers["set-cookie"] as string[]) {
      const m = /^(offset_sid|offset_csrf)=([^;]+)/.exec(c);
      if (m?.[1] === "offset_sid") sid = m[2]!;
      if (m?.[1] === "offset_csrf") csrf = m[2]!;
    }
  }, 60_000);

  afterAll(async () => {
    delete process.env["PACK_DIR"];
    await app?.close();
    await pool.end();
  });

  it("names only checks that exist, and says what and why for every step", async () => {
    const journey = await loadPackJourney();
    const ids = new Set<string>();
    let automatic = 0;
    for (const stage of journey.stages) {
      for (const t of stage.tasks) {
        expect(ids.has(t.id), `duplicate task id: ${t.id}`).toBe(false);
        ids.add(t.id);
        expect(t.do.length, `${t.id} has no instructions`).toBeGreaterThan(20);
        expect(t.why.length, `${t.id} does not say why it matters`).toBeGreaterThan(20);
        if (t.check) {
          automatic++;
          expect(hasCheck(t.check), `journey.json names a check that does not exist: ${t.check}`).toBe(true);
        }
      }
    }
    expect(journey.stages.map((s) => s.id)).toEqual(
      ["setup", "scope", "lead", "risk", "soa", "prove", "check", "certify"],
    );
    expect(automatic).toBeGreaterThan(15);
  });

  it("wants a reason against every control, not just the exclusions", async () => {
    // Nothing excluded and nothing written: not finished, whatever it looks like.
    let t = await task("soa.justified");
    expect(t.automatic).toBe(true);
    expect(t.state).toBe("outstanding");
    expect(t.detail).toContain("0 of 93");

    await query("update controls set justification = 'Treats risk R-1' where ref <> 'A.7.4'");
    await query("update controls set status = 'not_applicable' where ref = 'A.7.4'");
    t = await task("soa.justified");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toContain("92 of 93");
    expect(t.detail).toContain("1 exclusion with no reason");

    await query("update controls set justification = 'No premises of our own' where ref = 'A.7.4'");
    t = await task("soa.justified");
    expect(t.state).toBe("done");
    expect(t.detail).toBe("93 of 93 have a reason");
  });

  it("asks for owners only on the controls that apply", async () => {
    await query("update controls set owner = 'Priya' where status <> 'not_applicable'");
    let t = await task("soa.owners");
    expect(t.state).toBe("done");
    expect(t.detail).toBe("92 of 92 that apply have an owner");

    await query("update controls set owner = '' where ref = 'A.5.1'");
    t = await task("soa.owners");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toBe("91 of 92 that apply have an owner");
  });

  it("counts a policy approved only with an approver and a date", async () => {
    expect((await task("lead.approved")).detail).toBe("no policies yet");

    await query(
      `insert into policies (id, seq, name, status, approver, approval_date, review_date)
       values ($1, 1, 'Information security policy', 'Approved', 'Managing Director', '2026-09-01', '2027-09-01'),
              ($2, 2, 'Access control policy', 'Approved', '', null, null)`,
      [randomUUID(), randomUUID()],
    );
    let t = await task("lead.approved");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toBe("1 of 2 approved, with approver and date");
    expect((await task("prove.review")).detail).toBe("1 of 2 have a review date");

    await query(
      "update policies set approver = 'Managing Director', approval_date = '2026-09-02', review_date = '2027-09-02' where seq = 2",
    );
    t = await task("lead.approved");
    expect(t.state).toBe("done");
    expect((await task("prove.review")).state).toBe("done");
  });

  it("wants every risk owned, and every risk being reduced linked to a control", async () => {
    const reduce = randomUUID();
    const accept = randomUUID();
    await query(
      `insert into risks (id, seq, title, likelihood, impact, treatment, owner)
       values ($1, 1, 'Phishing', 4, 4, 'Mitigate', 'CISO'),
              ($2, 2, 'Office flood', 1, 3, 'Accept', '')`,
      [reduce, accept],
    );
    let owned = await task("risk.owners");
    expect(owned.state).toBe("outstanding");
    expect(owned.detail).toBe("1 of 2 have an owner");

    // An accepted risk is not expected to point at a control.
    let linked = await task("risk.linked");
    expect(linked.state).toBe("outstanding");
    expect(linked.detail).toBe("0 of 1 linked to a control");

    await query(
      "insert into risk_controls (risk_id, control_id) select $1, id from controls where ref = 'A.6.3'",
      [reduce],
    );
    await query("update risks set owner = 'Facilities Manager' where id = $1", [accept]);
    owned = await task("risk.owners");
    linked = await task("risk.linked");
    expect(owned.state).toBe("done");
    expect(linked.state).toBe("done");
  });

  it("notices the Statement of Applicability being exported", async () => {
    expect((await task("soa.export")).state).toBe("outstanding");

    const res = await app.inject({ url: "/api/v1/reports/statement-of-applicability", headers: read() });
    expect(res.statusCode).toBe(200);

    const t = await task("soa.export");
    expect(t.state).toBe("done");
    expect(t.detail).toContain("last exported");
  });

  it("follows findings from recorded to owned and dated", async () => {
    expect((await task("check.audit")).state).toBe("outstanding");
    expect((await task("certify.corrective")).detail).toBe("no findings recorded yet");

    const id = randomUUID();
    await query(
      `insert into findings (id, seq, title, type, source)
       values ($1, 1, 'Leavers not removed from payroll system', 'Minor nonconformity', 'Internal audit')`,
      [id],
    );
    expect((await task("check.audit")).state).toBe("done");
    let t = await task("certify.corrective");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toBe("1 open finding with no owner or due date");

    await query("update findings set owner = 'HR Manager', due_date = '2026-10-31' where id = $1", [id]);
    t = await task("certify.corrective");
    expect(t.state).toBe("done");
    expect(t.detail).toBe("1 open finding, all with an owner and a due date");
  });

  it("wants the risk method and a date on every piece of evidence", async () => {
    expect((await task("risk.method")).state).toBe("outstanding");
    await query(
      `insert into programme (id, methodology) values (1, $1)
       on conflict (id) do update set methodology = excluded.methodology`,
      ["Likelihood times impact, 1 to 5 each. Twelve or more needs treatment; only the CEO accepts above that."],
    );
    expect((await task("risk.method")).state).toBe("done");

    const ev = randomUUID();
    await query("insert into evidence (id, name) values ($1, 'Training completion report')", [ev]);
    let dated = await task("prove.dated");
    expect(dated.detail).toBe("0 of 1 have a collected date");
    expect((await task("prove.linked")).detail).toBe("0 of 1 linked to a control");

    await query("update evidence set collected_date = '2026-09-10' where id = $1", [ev]);
    dated = await task("prove.dated");
    expect(dated.state).toBe("done");
  });
});

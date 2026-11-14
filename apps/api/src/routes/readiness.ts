import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, withTransaction } from "../db/pool.js";
import { canRead, canWrite, requireAuth, assertCanWrite } from "../auth/rbac.js";
import { audit } from "../audit/audit.js";
import { badRequest, notFound } from "../lib/errors.js";
import { hasFeature } from "../lib/pack.js";
import { readinessWords } from "./readiness-shared.js";
import { likelyFindings, quickWins } from "./readiness-findings.js";
import { keyDate, readinessDashboard } from "./readiness-dashboard.js";

/**
 * "If the auditor came today": what a certification auditor (Assure) or a
 * SAMA assessor (Irtiqa) would most likely raise, worked out from the records
 * as they stand. Ported from Offset Attest, where it was built for SOC.
 *
 * It is a forecast, not an audit. Each rule is one an assessment really
 * applies - a control that failed its own test, a control claimed in place
 * with nothing to prove it, evidence over a year old, a finding left past its
 * date, a critical supplier nobody reviewed, a policy not approved, no
 * internal audit or management review in the last year - so the list reads
 * the way an auditor's would, and each item says what to do about it.
 *
 * The words that differ by product, and the references each rule cites, come
 * from the pack's `readiness` block, so the code is the same in every product
 * that turns the feature on.
 */

const bulkBody = z
  .object({
    theme: z.string().min(1).max(40),
    owner: z.string().max(200).optional(),
    outOfScope: z.string().max(2000).optional(),
  })
  .strict();

export async function readinessRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/readiness", { preHandler: canRead }, async () => {
    if (!(await hasFeature("readiness"))) throw notFound("This product has no readiness view.");
    const [found, wins, key, words] = await Promise.all([likelyFindings(), quickWins(), keyDate(), readinessWords()]);
    const fixFirst = [...found].sort((a, b) => b.weight - a.weight).slice(0, 3);
    return { ranAt: new Date().toISOString(), keyDate: key, words, findings: found, fixFirst, quickWins: wins };
  });

  app.get("/api/v1/readiness/dashboard", { preHandler: canRead }, async () => {
    if (!(await hasFeature("readiness"))) throw notFound("This product has no readiness dashboard.");
    return readinessDashboard();
  });

  /**
   * One owner for a whole theme, or a whole theme out of scope.
   *
   * The two decisions a team makes by theme rather than by control, and the
   * two that otherwise take dozens of clicks. One audit row per control, so
   * the trail still says what happened to each.
   */
  app.post("/api/v1/controls/bulk", { preHandler: canWrite }, async (request) => {
    if (!(await hasFeature("readiness"))) throw notFound("This product has no bulk update.");
    requireAuth(request);
    assertCanWrite(request.user.role);
    const body = bulkBody.parse(request.body);
    if (body.owner === undefined && body.outOfScope === undefined) throw badRequest("Say what to change: an owner, or out of scope with a reason.");
    if (body.outOfScope !== undefined && !body.outOfScope.trim()) throw badRequest("Say why this theme is out of scope.");
    // Only where the framework lets a whole area be excluded with a reason,
    // as the Statement of Applicability does. SAMA's domains all apply.
    if (body.outOfScope !== undefined && !(await hasFeature("statementOfApplicability"))) {
      throw badRequest("Every domain of this framework applies, so a whole one cannot be taken out of scope.");
    }

    const { rows } = await query<{ id: string; ref: string; owner: string; status: string; justification: string }>(
      "select id, ref, owner, status, justification from controls where theme = $1",
      [body.theme],
    );
    if (!rows.length) throw notFound("No such theme.");
    const targets = body.owner !== undefined ? rows.filter((r) => r.status !== "not_applicable") : rows;

    await withTransaction(async (tx) => {
      for (const r of targets) {
        if (body.owner !== undefined) {
          await tx.query("update controls set owner = $1 where id = $2", [body.owner.trim(), r.id]);
        } else {
          await tx.query("update controls set status = 'not_applicable', justification = $1 where id = $2", [body.outOfScope!.trim(), r.id]);
        }
      }
    });
    for (const r of targets) {
      await audit(request, {
        action: "Control updated",
        entity: "control",
        entityId: r.ref,
        before: { owner: r.owner, status: r.status, justification: r.justification },
        after: body.owner !== undefined
          ? { owner: body.owner.trim(), status: r.status, justification: r.justification }
          : { owner: r.owner, status: "not_applicable", justification: body.outOfScope!.trim() },
      });
    }
    return { updated: targets.length };
  });
}

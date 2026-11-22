import { query } from "../db/pool.js";
import { kpiRow, table } from "./pdf.js";
import { freshnessSql } from "../lib/time.js";
import { ReportSpec, dash } from "./report-shared.js";

/** The risk register and the evidence register. */

// ── risk register ────────────────────────────────────────────────────────────
export const riskRegister: ReportSpec = {
  id: "risk-register",
  title: "Risk register",
  description: "Every risk with its scores, treatment, owner and current status.",
  landscape: true,
  async build() {
    const { rows } = await query<{
      seq: number; title: string; category: string; owner: string; treatment: string;
      status: string; likelihood: number; impact: number; inherent: number; residual: number;
      accepted_by: string | null;
    }>(
      `select seq, title, category, owner, treatment, status, likelihood, impact,
              (likelihood * impact) as inherent,
              (coalesce(res_likelihood, likelihood) * coalesce(res_impact, impact)) as residual,
              accepted_by
         from risks
        order by (likelihood * impact) desc, seq`,
    );

    const band = (n: number): string => (n >= 20 ? "Critical" : n >= 12 ? "Elevated" : "Acceptable");

    return [
      kpiRow([
        { label: "Risks", value: String(rows.length), note: "in the register" },
        { label: "Critical", value: String(rows.filter((r) => r.inherent >= 20).length), note: "inherent 20 or more" },
        { label: "Open", value: String(rows.filter((r) => r.status === "Open").length), note: "not yet treated" },
        { label: "Accepted", value: String(rows.filter((r) => r.status === "Accepted").length), note: "formally accepted" },
      ]),
      { text: "Register", style: "h2" },
      table(
        ["#", "Risk", "Category", "Owner", "Treatment", "Status", "L", "I", "Inherent", "Residual", "Band"],
        rows.map((r) => [
          r.seq, r.title, dash(r.category), dash(r.owner), r.treatment, r.status,
          r.likelihood, r.impact, r.inherent, r.residual, band(r.inherent),
        ]),
        [20, "*", 66, 74, 56, 50, 16, 16, 42, 42, 52],
      ),
      {
        text: rows.some((r) => r.status === "Accepted" && !r.accepted_by)
          ? "Warning: at least one accepted risk does not name who accepted it."
          : "",
        style: "small",
        color: "#b91c1c",
      },
    ];
  },
};

// ── evidence register ────────────────────────────────────────────────────────
export const evidenceRegister: ReportSpec = {
  id: "evidence-register",
  title: "Evidence register",
  description:
    "What has been collected, how recent it is, and which controls each item supports.",
  landscape: true,
  async build() {
    const { rows } = await query<{
      name: string; type: string; owner: string; collected_date: string | null;
      next_review: string | null; freshness: string; refs: string;
    }>(
      `select e.name, e.type, e.owner, e.collected_date, e.next_review,
              ${freshnessSql("e.collected_date", ["Fresh", "Ageing", "Due", "Stale", "No date"])} as freshness,
              coalesce((select group_concat(c.ref, ', ')
                          from evidence_controls ec
                          join controls c on c.id = ec.control_id
                         where ec.evidence_id = e.id), '') as refs
         from evidence e
        order by e.collected_date desc, e.name`,
    );

    const count = (f: string): number => rows.filter((r) => r.freshness === f).length;

    return [
      kpiRow([
        { label: "Evidence", value: String(rows.length), note: "items recorded" },
        { label: "Fresh", value: String(count("Fresh")), note: "within 30 days" },
        { label: "Due or stale", value: String(count("Due") + count("Stale")), note: "older than 60 days" },
        { label: "Unlinked", value: String(rows.filter((r) => !r.refs).length), note: "proves nothing yet" },
      ]),
      { text: "Register", style: "h2" },
      table(
        ["Evidence", "Type", "Owner", "Collected", "Age", "Next review", "Supports"],
        rows.map((r) => [
          r.name, r.type, dash(r.owner), dash(r.collected_date), r.freshness,
          dash(r.next_review), dash(r.refs),
        ]),
        ["*", 58, 74, 58, 44, 58, 150],
      ),
    ];
  },
};

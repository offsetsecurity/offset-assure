import { query } from "../db/pool.js";
import { hasFeature } from "../lib/pack.js";
import { kpiRow, table } from "./pdf.js";
import { staleSql } from "../lib/time.js";
import { ReportSpec, labels, dash, MATURITY_LEVELS, maturityStats } from "./report-shared.js";

/** The management review pack. */

// ── management review pack ───────────────────────────────────────────────────
/**
 * The inputs clause 9.3 lists, gathered into the document the meeting reads.
 *
 * Every number in it comes from the same queries the screens use, so the pack
 * cannot quietly disagree with the product it was produced from. What it does
 * not do is decide anything: the decisions are minuted afterwards, in Audits
 * and reviews, which is where an auditor looks for them.
 */
export const managementReviewPack: ReportSpec = {
  id: "management-review-pack",
  title: "Management review pack",
  description:
    "What a management review reads: objectives, risks, incidents, findings, audits, supplier assurance and where the controls stand.",
  requires: "ismsRegisters",
  landscape: true,
  async build() {
    const one = async <T>(sql: string): Promise<T[]> => (await query<T>(sql)).rows;

    const [controls, objectives, risks, incidents, findings, reviews, vendors, evidence] =
      await Promise.all([
        one<{ status: string; n: number }>(
          "select status, count(*) as n from controls group by status",
        ),
        one<{
          title: string; measure: string; target: string; owner: string;
          due_date: string | null; status: string;
        }>("select title, measure, target, owner, due_date, status from objectives order by status, due_date"),
        one<{ title: string; score: number; treatment: string; owner: string; status: string }>(
          `select title, likelihood * impact as score, treatment, owner, status
             from risks where status <> 'Closed' order by likelihood * impact desc limit 15`,
        ),
        one<{ title: string; severity: string; status: string; detected_date: string | null }>(
          `select title, severity, status, detected_date from incidents
            where detected_date is null or detected_date > date(today(), '-365 days')
            order by detected_date desc limit 20`,
        ),
        one<{ title: string; type: string; status: string; owner: string; due_date: string | null }>(
          "select title, type, status, owner, due_date from findings where status <> 'Closed' order by due_date",
        ),
        one<{
          title: string; kind: string; status: string;
          planned_date: string | null; held_date: string | null; outcome: string;
        }>(
          `select title, kind, status, planned_date, held_date, outcome from reviews
            order by coalesce(held_date, planned_date) desc limit 12`,
        ),
        one<{ name: string; criticality: string; status: string; assurance: string; review_date: string | null }>(
          `select name, criticality, status, assurance, review_date from vendors
            where status <> 'Exited' order by criticality = 'High' desc, name`,
        ),
        one<{ n: number; stale: number }>(
          `select count(*) as n,
                  sum(case when ${staleSql("collected_date")}
                           then 1 else 0 end) as stale
             from evidence`,
        ),
      ]);

    const count = (status: string): number => controls.find((c) => c.status === status)?.n ?? 0;
    const total = controls.reduce((sum, c) => sum + c.n, 0);
    const applicable = total - count("not_applicable");
    const done = applicable > 0 ? Math.round((count("implemented") / applicable) * 100) : 0;
    const { item } = await labels();
    // A scored framework never sets a status, so "implemented" would read nought
    // for ever. It reports maturity instead, the way its other reports do.
    const scored = await hasFeature("maturity");
    const m = scored ? await maturityStats() : null;

    return [
      kpiRow([
        m
          ? { label: "At or above target", value: `${m.atTargetPct}%`, note: `${m.atTarget} of ${m.scored} assessed` }
          : { label: "Implemented", value: `${done}%`, note: `of ${applicable} that apply` },
        { label: "Open risks", value: String(risks.length), note: "top fifteen listed" },
        { label: "Open findings", value: String(findings.length), note: "nonconformities and observations" },
        { label: "Stale evidence", value: String(evidence[0]?.stale ?? 0), note: `of ${evidence[0]?.n ?? 0} items` },
      ]),

      { text: "Audits and reviews, and what came of them", style: "h2" },
      table(
        ["Audit or review", "Type", "Status", "Planned", "Held", "Outcome"],
        reviews.length
          ? reviews.map((r) => [r.title, r.kind, r.status, dash(r.planned_date), dash(r.held_date), dash(r.outcome)])
          : [["None recorded", "-", "-", "-", "-", "-"]],
        [130, 86, 58, 58, 58, "*"],
      ),

      { text: "Security objectives", style: "h2" },
      table(
        ["Objective", "How it is measured", "Target", "Owner", "Due", "Status"],
        objectives.length
          ? objectives.map((o) => [o.title, dash(o.measure), dash(o.target), dash(o.owner), dash(o.due_date), o.status])
          : [["None set", "-", "-", "-", "-", "-"]],
        ["*", 130, 70, 78, 58, 58],
      ),

      { text: "Risks carrying the most weight", style: "h2" },
      table(
        ["Risk", "Score", "Treatment", "Owner", "Status"],
        risks.length
          ? risks.map((r) => [r.title, String(r.score), r.treatment, dash(r.owner), r.status])
          : [["None recorded", "-", "-", "-", "-"]],
        ["*", 42, 66, 90, 58],
      ),

      { text: "Incidents in the last year", style: "h2" },
      table(
        ["Incident", "Severity", "Status", "Detected"],
        incidents.length
          ? incidents.map((i) => [i.title, i.severity, i.status, dash(i.detected_date)])
          : [["None recorded", "-", "-", "-"]],
        ["*", 58, 72, 58],
      ),

      { text: "Nonconformities and findings still open", style: "h2" },
      table(
        ["Finding", "Type", "Status", "Owner", "Due"],
        findings.length
          ? findings.map((f) => [f.title, f.type, f.status, dash(f.owner), dash(f.due_date)])
          : [["None open", "-", "-", "-", "-"]],
        ["*", 110, 58, 90, 58],
      ),

      { text: "Suppliers and the assurance they gave", style: "h2" },
      table(
        ["Supplier", "Criticality", "Status", "Assurance", "Next review"],
        vendors.length
          ? vendors.map((v) => [v.name, v.criticality, v.status, dash(v.assurance), dash(v.review_date)])
          : [["None recorded", "-", "-", "-", "-"]],
        ["*", 58, 66, 150, 62],
      ),

      { text: `Where the ${item.toLowerCase()}s stand`, style: "h2" },
      m
        ? table(
            [...MATURITY_LEVELS.map((lv) => `${lv.level} ${lv.name}`), "Not assessed"],
            [[...MATURITY_LEVELS.map((lv) => String(m.byLevel[lv.level] ?? 0)), String(m.unscored)]],
            ["*", "*", "*", "*", "*", "*", "*"],
          )
        : table(
            ["Not started", "In progress", "Implemented", "Not applicable"],
            [[
              String(count("not_started")), String(count("in_progress")),
              String(count("implemented")), String(count("not_applicable")),
            ]],
            ["*", "*", "*", "*"],
          ),
    ];
  },
};

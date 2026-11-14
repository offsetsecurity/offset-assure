import { query } from "../db/pool.js";
import { MATURITY_DEFAULT_TARGET } from "../config.js";
import { hasFeature } from "../lib/pack.js";
import { kpiRow, table, barChart, stackedBar, radar, heatMap } from "./pdf.js";
import { boardPdf } from "./board.js";
import { staleSql } from "../lib/time.js";
import type { ReportSpec } from "./report-shared.js";
import { labels, themeTitles, dash, MATURITY_LEVELS, controls, maturityStats, readiness } from "./report-shared.js";

/** The executive summary. */

// ── executive summary ────────────────────────────────────────────────────────
export const executiveSummary: ReportSpec = {
  id: "executive-summary",
  title: "Executive summary",
  description:
    "Readiness, open risk and outstanding work on one or two pages. The one to take to a board meeting.",
  scoredDescription:
    "Maturity, open risk and outstanding work on one or two pages. The one to take to a board meeting.",
  // Products with the board paper lay this one out as one: a verdict, the
  // decisions asked for, and what changed since the last paper.
  async document(generatedBy, pack) {
    return (await hasFeature("boardReport")) ? boardPdf(generatedBy, pack) : null;
  },
  async build() {
    const l = await labels();
    const scored = await hasFeature("maturity");
    const r = await readiness();
    const m = await maturityStats();
    const titles = await themeTitles();
    const name = (key: string): string => titles.get(key) ?? key;

    const all = await controls();
    const statusCount = (s: string) => all.filter((c) => c.status === s).length;

    const heat = await query<{ likelihood: number; impact: number; n: number }>(
      `select likelihood, impact, count(*) as n from risks where status <> 'Closed'
        group by likelihood, impact`,
    );
    const grid = [1, 2, 3, 4, 5].map(() => [0, 0, 0, 0, 0]);
    for (const h of heat.rows) {
      if (h.likelihood >= 1 && h.likelihood <= 5 && h.impact >= 1 && h.impact <= 5) {
        grid[h.likelihood - 1]![h.impact - 1] = h.n;
      }
    }

    const themeBars = scored
      ? [...m.byTheme.entries()].map(([theme, t]) => ({
          label: name(theme),
          pct: t.scored ? (t.atTarget / t.scored) * 100 : 0,
          note: t.scored ? `${t.atTarget} of ${t.scored} at target · avg ${(t.sum / t.scored).toFixed(1)}` : "not assessed",
        }))
      : [...r.byTheme.entries()].map(([theme, t]) => ({
          label: name(theme),
          pct: t.applicable ? (t.implemented / t.applicable) * 100 : 0,
          note: `${t.implemented} of ${t.applicable} in scope`,
        }));

    const risks = await query<{ n: number; critical: number; open: number }>(
      `select count(*) as n,
              sum(case when (likelihood * impact) >= 20 then 1 else 0 end) as critical,
              sum(case when status = 'Open' then 1 else 0 end) as open
         from risks`,
    );
    const rk = risks.rows[0] ?? { n: 0, critical: 0, open: 0 };

    const ev = await query<{ total: number; stale: number; gaps: number }>(
      `select (select count(*) from evidence) as total,
              (select count(*) from evidence
                where ${staleSql("collected_date")}) as stale,
              (select count(*) from controls c
                where c.status = 'implemented'
                  and not exists (select 1 from evidence_controls ec where ec.control_id = c.id)) as gaps`,
    );
    const e = ev.rows[0] ?? { total: 0, stale: 0, gaps: 0 };

    const overdue = await query<{ tasks: number; findings: number }>(
      `select (select count(*) from tasks
                where status <> 'Done' and due_date is not null and due_date < today()) as tasks,
              (select count(*) from findings
                where status <> 'Closed' and due_date is not null and due_date < today()) as findings`,
    );
    const od = overdue.rows[0] ?? { tasks: 0, findings: 0 };

    const topRisks = await query<{
      seq: number; title: string; owner: string; status: string; inherent: number; residual: number;
    }>(
      `select seq, title, owner, status,
              (likelihood * impact) as inherent,
              (coalesce(res_likelihood, likelihood) * coalesce(res_impact, impact)) as residual
         from risks
        where status <> 'Closed'
        order by inherent desc, seq
        limit 10`,
    );

    return [
      /**
       * Four figures either way, but not the same four.
       *
       * A scored framework never sets a status, so "evidence gaps" - which
       * counts implemented items with nothing attached - would read nought
       * for ever and say so reassuringly. A figure that is always nought and
       * always comforting is worse on a board paper than no figure at all, so
       * the average takes its place.
       */
      scored
        ? kpiRow([
            {
              label: "At or above target",
              value: `${m.atTargetPct}%`,
              note: `${m.atTarget} of ${m.scored} assessed`,
            },
            {
              label: "Average maturity",
              value: m.average.toFixed(1),
              note: m.unscored
                ? `out of 5 · ${m.unscored} not yet assessed`
                : "out of 5, all assessed",
            },
            { label: "Open risks", value: String(rk.open ?? 0), note: `${rk.critical ?? 0} critical` },
            {
              label: "Overdue",
              value: String((od.tasks ?? 0) + (od.findings ?? 0)),
              note: "tasks and findings",
            },
          ])
        : kpiRow([
            { label: "Readiness", value: `${r.pct}%`, note: `${r.implemented} of ${r.applicable} in scope` },
            { label: "Open risks", value: String(rk.open ?? 0), note: `${rk.critical ?? 0} critical` },
            { label: "Evidence gaps", value: String(e.gaps), note: "implemented, nothing to prove it" },
            { label: "Overdue", value: String((od.tasks ?? 0) + (od.findings ?? 0)), note: "tasks and findings" },
          ]),

      scored
        ? { text: `At target, by ${l.theme.toLowerCase()}`, style: "h2" }
        : { text: `Readiness by ${l.theme.toLowerCase()}`, style: "h2" },
      barChart(themeBars),

      // A chart and its heading stay on the same page.
      {
        unbreakable: true,
        stack: [
          { text: "Coverage profile", style: "h2" },
          radar(themeBars.map((b) => ({ label: b.label, pct: b.pct }))),
        ],
      },

      scored
        ? { text: "Maturity levels", style: "h2" }
        : { text: `${l.item} status`, style: "h2" },
      scored
        ? stackedBar([
            ...MATURITY_LEVELS.map((lv, i) => ({
              label: `${lv.level} ${lv.name}`,
              value: m.byLevel[i] ?? 0,
              color: ["#b91c1c", "#ea580c", "#d97706", "#2457D6", "#0891b2", "#16a34a"][i]!,
            })),
            { label: "Not assessed", value: m.unscored, color: "#cbd5e1" },
          ])
        : stackedBar([
            { label: "Implemented", value: statusCount("implemented"), color: "#16a34a" },
            { label: "In progress", value: statusCount("in_progress"), color: "#d97706" },
            { label: "Not started", value: statusCount("not_started"), color: "#94a3b8" },
            { label: "Not applicable", value: statusCount("not_applicable"), color: "#e2e8f0" },
          ]),

      { unbreakable: true, stack: [{ text: "Risk heat map", style: "h2" }, heatMap(grid)] },

      { text: "Highest risks", style: "h2" },
      table(
        ["#", "Risk", "Owner", "Status", "Inherent", "Residual"],
        topRisks.rows.map((x) => [x.seq, x.title, dash(x.owner), x.status, x.inherent, x.residual]),
        [22, "*", 90, 60, 45, 45],
      ),

      {
        text: scored
          ? `Assessed against a target of level ${MATURITY_DEFAULT_TARGET} unless a ` +
            `${l.item.toLowerCase()} carries its own. ` +
            `Evidence: ${e.total} items recorded, ${e.stale} of them older than 90 days or undated.`
          : `Evidence: ${e.total} items recorded, ${e.stale} of them older than 90 days or undated. ` +
            `${e.gaps} implemented items have nothing attached to prove it.`,
        style: "small",
        margin: [0, 4, 0, 0],
      },
    ];
  },
};

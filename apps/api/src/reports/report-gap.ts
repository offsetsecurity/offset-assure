import { MATURITY_DEFAULT_TARGET } from "../config.js";
import { hasFeature } from "../lib/pack.js";
import { compareRefs } from "../lib/refs.js";
import { buildJourney } from "../journey/journey.js";
import { kpiRow, table } from "./pdf.js";
import type { ReportSpec } from "./report-shared.js";
import { STATUS_LABEL, labels, dash, MATURITY_LEVELS, levelName, targetOf, controls, attrOf, maturityStats } from "./report-shared.js";

/** The gap report. */

// ── gap report ───────────────────────────────────────────────────────────────
export const gapReport: ReportSpec = {
  id: "gap-report",
  title: "Gap report",
  description:
    "Everything in scope that is not yet implemented, with its owner and how far along it is.",
  scoredDescription:
    "Everything below its target level, worst gap first, plus anything nobody has assessed yet.",
  landscape: true,
  async build() {
    const l = await labels();
    const scored = await hasFeature("maturity");

    /**
     * What counts as a gap depends on how the framework is assessed. Ticked:
     * anything in scope that is not implemented. Scored: anything sitting
     * below its target level, worst first, because that is the order the
     * remediation plan gets written in. Unassessed items are listed too - not
     * knowing is its own gap - but they sort last, since there is no number
     * to rank them by.
     */
    const all = await controls();
    const rows = scored
      ? all
          .filter((c) => c.maturity === null || c.maturity < targetOf(c))
          .sort((a, b) => {
            const ga = a.maturity === null ? -1 : targetOf(a) - a.maturity;
            const gb = b.maturity === null ? -1 : targetOf(b) - b.maturity;
            return gb - ga || compareRefs(a.ref, b.ref);
          })
      : all.filter((c) => c.status !== "implemented" && c.status !== "not_applicable");

    const inProgress = rows.filter((c) => c.status === "in_progress").length;
    const unowned = rows.filter((c) => !c.owner.trim()).length;
    const unassessed = rows.filter((c) => c.maturity === null).length;
    const levelsShort = rows.reduce(
      (n, c) => n + (c.maturity === null ? 0 : targetOf(c) - c.maturity),
      0,
    );

    return [
      scored
        ? kpiRow([
            { label: "Below target", value: String(rows.length - unassessed), note: "assessed, short of target" },
            { label: "Not assessed", value: String(unassessed), note: "nobody has scored these" },
            { label: "Levels to climb", value: String(levelsShort), note: "total gap across all of them" },
            { label: "Unassigned", value: String(unowned), note: "nobody named" },
          ])
        : kpiRow([
            { label: "Open items", value: String(rows.length), note: "in scope, not implemented" },
            { label: "In progress", value: String(inProgress), note: "started" },
            { label: "Not started", value: String(rows.length - inProgress), note: "no work recorded" },
            { label: "Unassigned", value: String(unowned), note: "nobody named" },
          ]),
      { text: scored ? "Below target" : "Open items", style: "h2" },
      scored
        ? table(
            ["Ref", l.item, l.theme, "Current", "Target", "Gap", "Owner"],
            rows.map((c) => [
              c.ref,
              c.title,
              c.theme,
              levelName(c.maturity),
              String(targetOf(c)),
              c.maturity === null ? "-" : String(Math.max(0, targetOf(c) - c.maturity)),
              dash(c.owner),
            ]),
            [40, "*", 40, 126, 38, 28, 74],
          )
        : table(
            ["Ref", l.item, l.theme, "Status", "Owner", "Priority"],
            rows.map((c) => [
              c.ref,
              c.title,
              c.theme,
              STATUS_LABEL[c.status] ?? c.status,
              dash(c.owner),
              dash(attrOf(c, "priority")),
            ]),
            [58, "*", 46, 62, 90, 52],
          ),
    ];
  },
};

// -- readiness plan ----------------------------------------------------------
/**
 * The plan on paper.
 *
 * Written for a customer with no security team, so it is a to-do list first
 * and a status report second: what is left comes before what is finished,
 * because the reader is usually about to do the next bit rather than admire
 * the last bit.
 *
 * It says who decided each item. "Checked by the product" and "marked done by
 * Sara" are different claims, and a reader deciding whether to trust this
 * page deserves to know which is which.
 */
export const readinessPlan: ReportSpec = {
  id: "readiness-plan",
  title: "Readiness plan",
  description:
    "The stages, what is done, what is left and who is doing it. The one to take to management when nobody has asked for a report yet.",
  requires: "journey",
  landscape: true,
  async build() {
    const plan = await buildJourney();

    const STATE_LABEL: Record<string, string> = {
      done: "Done",
      outstanding: "To do",
      not_applicable: "Excluded",
    };

    const outstanding = plan.stages.flatMap((stage) =>
      stage.tasks
        .filter((t) => t.state === "outstanding")
        .map((t) => [stage.name, t.title, t.do, t.detail || "-"]),
    );
    const excluded = plan.stages.flatMap((stage) =>
      stage.tasks
        .filter((t) => t.state === "not_applicable")
        .map((t) => [stage.name, t.title, t.reason || "-", t.actorName || "-"]),
    );

    return [
      kpiRow([
        {
          label: "Overall",
          value: `${plan.pct}%`,
          note: `${plan.done} of ${plan.applicable} steps done`,
        },
        {
          label: "Still to do",
          value: String(plan.applicable - plan.done),
          note: "across every stage",
        },
        {
          label: "Stages finished",
          value: `${plan.stages.filter((x) => x.complete).length} of ${plan.stages.length}`,
          note: "start to finish",
        },
        {
          label: "Suggested next",
          value: plan.suggested
            ? String(plan.stages.findIndex((x) => x.id === plan.suggested) + 1)
            : "-",
          note: plan.suggested
            ? (plan.stages.find((x) => x.id === plan.suggested)?.name ?? "")
            : "everything is done",
        },
      ]),

      { text: "Where each stage stands", style: "h2" },
      table(
        ["#", "Stage", "What it is for", "Done", "Of", "Progress"],
        plan.stages.map((stage, i) => [
          i + 1,
          stage.name,
          stage.aim,
          stage.done,
          stage.applicable,
          stage.applicable === 0 ? "nothing to do" : `${stage.pct}%`,
        ]),
        [18, 128, "*", 34, 26, 56],
      ),

      { text: "What is still to do", style: "h2" },
      table(["Stage", "Step", "What to do", "Where it stands"], outstanding, [110, 140, "*", 120]),

      { text: "Excluded, and why", style: "h2", pageBreak: "before" },
      table(["Stage", "Step", "Why it does not apply", "Excluded by"], excluded, [110, 140, "*", 90]),

      { text: "Everything, in order", style: "h2" },
      table(
        ["Stage", "Step", "State", "Decided by", "Detail"],
        plan.stages.flatMap((stage) =>
          stage.tasks.map((t) => [
            stage.name,
            t.title,
            STATE_LABEL[t.state] ?? t.state,
            t.state === "not_applicable"
              ? (t.actorName || "a person")
              : t.automatic
                ? "the product"
                : t.state === "done"
                  ? (t.actorName || "a person")
                  : "-",
            t.detail || t.reason || "-",
          ]),
        ),
        [110, 150, 50, 72, "*"],
      ),

      {
        text:
          "Steps marked \"the product\" are checked against this instance's own data every time this " +
          "report is produced. The rest are asserted by the person named, because no software can see " +
          "whether a board approved a policy or whether staff follow it.",
        style: "small",
        margin: [0, 4, 0, 0],
      },
    ];
  },
};

// -- maturity assessment -----------------------------------------------------
/**
 * The whole assessment on paper: every item, what it scored, what it should
 * score. This is the document a regulator or a client asks to see, so it lists
 * everything rather than only the gaps, and it carries the scale itself so a
 * reader who never saw the screen can still tell what a 3 means.
 */
export const maturityAssessment: ReportSpec = {
  id: "maturity-assessment",
  title: "Maturity assessment",
  description:
    "Every item with its current level, its target and the gap between them, plus the scale they were scored against.",
  requires: "maturity",
  landscape: true,
  async build() {
    const l = await labels();
    const m = await maturityStats();

    return [
      kpiRow([
        {
          label: "At or above target",
          value: `${m.atTargetPct}%`,
          note: `${m.atTarget} of ${m.scored} assessed`,
        },
        { label: "Average maturity", value: m.average.toFixed(1), note: "out of 5" },
        { label: "Assessed", value: `${m.scored} of ${m.total}`, note: `${m.unscored} outstanding` },
        {
          label: "Default target",
          value: String(MATURITY_DEFAULT_TARGET),
          note: "unless the item says otherwise",
        },
      ]),

      { text: "The scale", style: "h2" },
      table(
        ["Level", "Name", "What it means"],
        MATURITY_LEVELS.map((x) => [String(x.level), x.name, x.note]),
        [38, 150, "*"],
      ),

      { text: `Spread across the ${l.item.toLowerCase()}s`, style: "h2" },
      table(
        ["Level", "Name", "Count", "Share of assessed"],
        MATURITY_LEVELS.map((x) => [
          String(x.level),
          x.name,
          String(m.byLevel[x.level] ?? 0),
          m.scored ? `${Math.round(((m.byLevel[x.level] ?? 0) / m.scored) * 100)}%` : "-",
        ]),
        [38, 150, 50, "*"],
      ),

      { text: `By ${l.theme.toLowerCase()}`, style: "h2" },
      table(
        [l.theme, "Assessed", "At target", "Average", "Not assessed"],
        [...m.byTheme.entries()].map(([theme, t]) => [
          theme,
          t.scored,
          `${t.scored ? Math.round((t.atTarget / t.scored) * 100) : 0}%`,
          t.scored ? (t.sum / t.scored).toFixed(1) : "-",
          t.total - t.scored,
        ]),
        ["*", 55, 60, 55, 70],
      ),

      { text: "Full assessment", style: "h2", pageBreak: "before" },
      table(
        ["Ref", l.item, l.theme, "Current", "Target", "Gap", "Owner"],
        m.rows.map((c) => [
          c.ref,
          c.title,
          c.theme,
          levelName(c.maturity),
          String(targetOf(c)),
          c.maturity === null ? "-" : String(Math.max(0, targetOf(c) - c.maturity)),
          dash(c.owner),
        ]),
        [40, "*", 40, 126, 38, 28, 74],
      ),
    ];
  },
};

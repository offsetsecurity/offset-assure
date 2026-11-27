import { query } from "../db/pool.js";
import { hasFeature, packMeta, themeOrder } from "../lib/pack.js";
import { dayIso, todayIso } from "../lib/time.js";
import type { FindingLabel, LikelyFinding, QuickWin, ControlRow } from "./readiness-shared.js";
import { readinessWords, plural, guideRecords, themeNames, controlsInScope, inPlaceTest } from "./readiness-shared.js";

/** What an auditor would likely find, and the quick fixes that clear the most. */

export async function likelyFindings(): Promise<LikelyFinding[]> {
  const [records, names, order, words, scored] = await Promise.all([
    guideRecords(), themeNames(), themeOrder(), readinessWords(), hasFeature("maturity"),
  ]);
  const { auditorShort: who, refs } = words;
  const inPlace = inPlaceTest(scored);
  const yearAgo = dayIso(-365);
  const today = todayIso();
  const controls = await controlsInScope();
  const out: LikelyFinding[] = [];

  // A control that failed its own test: the auditor's sample would fail too.
  for (const c of controls) {
    if (c.last_result === "Fail" || c.last_result === "Partial") {
      out.push({
        id: `test:${c.ref}`, ref: c.ref,
        title: `${c.title}: last test ${c.last_result === "Fail" ? "failed" : "partly passed"} on ${c.last_test}`,
        label: c.last_result === "Fail" ? "Fail" : "Partial",
        says: `Your own test on ${c.last_test} found this was not fully working. An ${who} looking at the same thing would find the same.`,
        fix: "Fix the cause, then test it again and record the result.",
        action: { label: "Record a new test", route: "controls" }, weight: 1, controlId: c.id,
      });
    }
  }

  // Claimed in place with nothing to prove it, or only old proof.
  for (const c of controls.filter(inPlace)) {
    if (c.evidence === 0) {
      out.push({
        id: `noev:${c.ref}`, ref: c.ref, title: `${c.title}: ${scored ? "scored at target" : "marked in place"}, but nothing proves it`, label: "Gap",
        says: `The control is described as working, but there is no evidence an ${who} could look at.`,
        fix: records[c.ref] ? `Attach the records an ${who} asks for: ${records[c.ref]}` : "Attach evidence that shows it working.",
        action: { label: "Attach evidence", route: "evidence" }, weight: 1,
      });
    } else if (c.fresh === 0) {
      out.push({
        id: `stale:${c.ref}`, ref: c.ref, title: `${c.title}: all its evidence is over a year old or undated`, label: "Stale",
        says: "The evidence does not show the control working now.",
        fix: "Add evidence produced in the last year, with the date it was produced.",
        action: { label: "Add recent evidence", route: "evidence" }, weight: 1,
      });
    }
  }

  // Controls not in place yet, one line per theme so the list stays readable.
  // Called what the framework calls them: a control, a subcategory, a requirement.
  const one = ((await packMeta()).itemLabel || "Control").toLowerCase();
  const many = one.endsWith("y") ? `${one.slice(0, -1)}ies` : `${one}s`;
  const notYet = new Map<string, ControlRow[]>();
  for (const c of controls.filter((x) => !inPlace(x))) notYet.set(c.theme, [...(notYet.get(c.theme) ?? []), c]);
  for (const theme of [...notYet.keys()].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))) {
    const list = notYet.get(theme)!;
    const shown = list.slice(0, 6).map((c) => c.ref).join(", ");
    out.push({
      id: `notyet:${theme}`, ref: theme,
      title: `${plural(list.length, one, many)} in ${names[theme] ?? theme} ${scored ? "below target or not scored yet" : "not in place yet"}`,
      label: "Gap",
      says: `There is no working control yet for ${shown}${list.length > 6 ? ` and ${list.length - 6} more` : ""}.`,
      fix: scored
        ? "Open each control: it says what is expected at each level. Score it honestly, then raise what falls short."
        : "Open each control: it says what to do and which records to keep. Mark it in progress when work starts.",
      action: { label: "Open the controls", route: "controls" }, weight: list.length,
    });
  }

  // Findings already raised and left past their date.
  if (refs.finding) {
    const { rows: overdue } = await query<{ seq: number; title: string; clause: string; due_date: string; owner: string }>(
      `select seq, title, clause, due_date, owner from findings
        where status <> 'Closed' and due_date is not null and due_date < $1 order by due_date`,
      [today],
    );
    for (const f of overdue) {
      out.push({
        id: `finding:${f.seq}`, ref: f.clause || refs.finding, title: `${f.title}: past its due date (${f.due_date})`, label: "Fail",
        says: `A known weakness was not fixed by the date set for it. An ${who} checks exactly this.`,
        fix: `Fix it, or agree a new date with ${f.owner || "its owner"} and record why it moved.`,
        action: { label: "Open the finding", route: "findings" }, weight: 1,
      });
    }
  }

  // Critical suppliers nobody has reviewed.
  if (refs.vendor) {
    const { rows: vendors } = await query<{ seq: number; name: string; assurance: string; assessed_date: string | null }>(
      `select seq, name, assurance, assessed_date from vendors
        where status <> 'Exited' and criticality = 'High'
          and (trim(assurance) = '' or assessed_date is null or assessed_date < $1) order by name`,
      [yearAgo],
    );
    for (const v of vendors) {
      out.push({
        id: `vendor:${v.seq}`, ref: refs.vendor,
        title: `${v.name}: ${v.assurance.trim() ? "not reviewed in the last 12 months" : "no assurance recorded"}`,
        label: "Stale",
        says: "A critical supplier's security was not reviewed in the last year. Having their certificate is not the same as reviewing it.",
        fix: "Look at their latest certificate or report, note anything it leaves out, and set the date you assessed them.",
        action: { label: "Review the supplier", route: "vendors" }, weight: 1,
      });
    }
  }

  // Policies that are not approved, or are past their review date.
  if (refs.policy) {
    const { rows: policies } = await query<{ seq: number; name: string; status: string; review_date: string | null }>(
      `select seq, name, status, review_date from policies
        where status <> 'Approved' or (review_date is not null and review_date < $1) order by name`,
      [today],
    );
    for (const p of policies) {
      const late = p.status === "Approved";
      out.push({
        id: `policy:${p.seq}`, ref: refs.policy, title: late ? `${p.name}: past its review date` : `${p.name}: not approved`,
        label: late ? "Stale" : "Gap",
        says: late ? "The policy was not reviewed when it said it would be." : "Policies have to be approved by management before they count.",
        fix: late ? "Review it, update the version if anything changed, and set the next review date." : "Send it to the approver and record the approval date.",
        action: { label: "Open the policy", route: "policies" }, weight: 1,
      });
    }
  }

  // The yearly checks: an internal audit, and a management review.
  const heldSince = async (kind: string): Promise<boolean> =>
    ((await query<{ n: number }>(
      "select count(*) as n from reviews where kind = $1 and status = 'Completed' and coalesce(held_date, planned_date) >= $2",
      [kind, yearAgo],
    )).rows[0]?.n ?? 0) > 0;
  if (refs.audit && !(await heldSince("Internal audit"))) {
    out.push({
      id: "yearly:audit", ref: refs.audit, title: "No internal audit held in the last 12 months", label: "Gap",
      says: "There is no record of an internal audit in the last year, so nobody has checked the programme works as written.",
      fix: "Plan one in Audits and reviews, hold it, and record what it found as findings.",
      action: { label: "Plan an internal audit", route: "reviews" }, weight: 1,
    });
  }
  if (refs.review && !(await heldSince("Management review"))) {
    out.push({
      id: "yearly:review", ref: refs.review, title: "No management review held in the last 12 months", label: "Gap",
      says: "Top management has not formally looked at how security is going in the last year.",
      fix: "Hold a management review, using the executive summary in Reports, and record it in Audits and reviews.",
      action: { label: "Plan a management review", route: "reviews" }, weight: 1,
    });
  }

  // Risks nobody owns, or nobody has decided what to do about.
  if (refs.risk) {
    const { rows } = await query<{ n: number }>(
      "select count(*) as n from risks where status <> 'Closed' and (trim(owner) = '' or trim(treatment) = '')",
    );
    const n = rows[0]?.n ?? 0;
    if (n > 0) {
      out.push({
        id: "risks:owned", ref: refs.risk, title: `${plural(n, "risk")} with no owner or no decision`, label: "Gap",
        says: "Every risk needs someone accountable and a decision about how it is treated.",
        fix: "Open each one, give it an owner, and choose how it is treated.",
        action: { label: "Open the risks", route: "risks" }, weight: n,
      });
    }
  }

  const rank: Record<FindingLabel, number> = { Fail: 0, Gap: 1, Partial: 2, Stale: 3 };
  return out.sort((a, b) => rank[a.label] - rank[b.label] || b.weight - a.weight);
}

export async function quickWins(): Promise<QuickWin[]> {
  const n = async (sql: string, params: unknown[] = []): Promise<number> =>
    (await query<{ n: number }>(sql, params)).rows[0]?.n ?? 0;
  const wins: QuickWin[] = [
    { id: "owners", title: "Set an owner on controls that have none", minutes: 1,
      count: await n("select count(*) as n from controls where status <> 'not_applicable' and trim(owner) = ''"), route: "controls" },
    { id: "policyDates", title: "Add a review date to policies that have none", minutes: 1,
      count: await n("select count(*) as n from policies where review_date is null"), route: "policies" },
    { id: "evidenceDates", title: "Date evidence that has no date", minutes: 1,
      count: await n("select count(*) as n from evidence where collected_date is null"), route: "evidence" },
    { id: "vendorDates", title: "Record when you last assessed critical suppliers", minutes: 2,
      count: await n("select count(*) as n from vendors where status <> 'Exited' and criticality = 'High' and assessed_date is null"), route: "vendors" },
    { id: "findingOwners", title: "Give open findings an owner and a due date", minutes: 1,
      count: await n("select count(*) as n from findings where status <> 'Closed' and (trim(owner) = '' or due_date is null)"), route: "findings" },
  ];
  return wins.filter((w) => w.count > 0);
}

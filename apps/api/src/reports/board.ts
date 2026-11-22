import type { Content, TDocumentDefinitions } from "pdfmake/interfaces.js";
import { query } from "../db/pool.js";
import { MATURITY_DEFAULT_TARGET, product } from "../config.js";
import { loadBranding, loadOrganisation } from "../routes/settings.js";
import { boardLogo, renderPdf, safe } from "./pdf.js";
import { stampLocal } from "../lib/time.js";
import type { Tone, M, Snapshot, Area, Decision, RiskRow } from "./board-data.js";
import { NAVY, NAVY2, GOLD, GOLD_LIGHT, BLUE, INK, INK2, MUTED, LINE, SOFT, BAND_TEXT, BAND_MUTED, TONE, SERIF, PAGE_W, SIDE, WIDTH, BAND_H, today, addDays, longDate, shortDate, daysBetween, plural, loadSnapshots, saveSnapshot, gather, decisions } from "./board-data.js";
import { spaced, svgW, chip, sparkline, section, gauge, ladder, dots, scoreBox, arrow, avatar, heatGrid } from "./board-draw.js";

/**
 * The executive summary, written for a board.
 *
 * The plain report lists figures; a board member reading it has to work out
 * what they mean. This one says it: a verdict in a sentence, what changed since
 * the last paper, the decisions the committee is being asked for, and what
 * happens in the next ninety days. Two pages, laid out like the rest of the
 * papers in a board pack rather than like an export.
 *
 * Everything on it is computed from the same tables the screens read. The only
 * thing it stores is a small snapshot of its own headline figures each time it
 * is produced, because "since last month" needs a last month and nothing else
 * in the product keeps one.
 */

// ── the document ─────────────────────────────────────────────────────────────

type Meta = { disclaimer: string; contact: string; edition: string };

/** Pages in a PDF from pdfkit, which writes its page objects uncompressed. */
const pageCount = (pdf: Buffer): number => (pdf.toString("latin1").match(/\/Type \/Page\b(?!s)/g) ?? []).length;

/**
 * The paper as a PDF, on two pages whatever is in it.
 *
 * A board paper that runs to a third page because one month had an extra
 * decision in it reads as careless. So it is laid out, measured, and laid out
 * again more tightly when it overflows: first the lists get shorter, then only
 * the first decision gets a card and the rest are named under it.
 */
export async function boardPdf(generatedBy: string, meta: Meta): Promise<Buffer> {
  let built = await boardDocument(generatedBy, meta, 0);
  let pdf = await renderPdf(built.doc);
  for (let level = 1; level <= 3 && pageCount(pdf) > 2; level++) {
    built = await boardDocument(generatedBy, meta, level);
    pdf = await renderPdf(built.doc);
  }
  await built.save();
  return pdf;
}

async function boardDocument(generatedBy: string, meta: Meta, tight: number): Promise<{ doc: TDocumentDefinitions; save: () => Promise<void> }> {
  const [f, snapshots, branding, organisation] = await Promise.all([gather(), loadSnapshots(), loadBranding(), loadOrganisation()]);
  const d = today();
  const prev = [...snapshots].reverse().find((s) => daysBetween(s.day, d) >= 7) ?? null;
  const asks = await decisions(f);

  const critical = f.risks.filter((r) => f.after(r) >= 20).length;
  const overdue = f.overdueTasks + f.overdueFindings;
  const now: Snapshot = { day: d, headline: f.headline, average: f.average, critical, overdue, atTarget: f.good, evidence: f.evidence };
  const series = (pick: (s: Snapshot) => number | null): number[] =>
    [...snapshots.filter((s) => s.day !== d).slice(-5), now].map(pick).filter((v): v is number => v !== null);
  // The headline has a daily history of its own: the last reading of each of the past six months.
  const { rows: trend } = await query<{ day: string; pct: number }>(
    "select day, pct from trend where day >= $1 order by day", [addDays(-185)],
  );
  const monthly = new Map<string, number>();
  for (const t of trend) monthly.set(t.day.slice(0, 7), t.pct);
  monthly.set(d.slice(0, 7), f.headline);
  const prevHeadline = prev?.headline ?? null;

  // The verdict.
  const delta = prevHeadline === null ? null : f.headline - prevHeadline;
  const status: { word: string; tone: Tone } = delta === null ? { word: "First report", tone: "flat" }
    : delta >= 2 ? { word: "Improving", tone: "up" } : delta <= -2 ? { word: "Slipping", tone: "down" } : { word: "Steady", tone: "flat" };
  const weakest = [...f.areas].filter((a) => a.level < a.target).sort((a, b) => (a.level - a.target) - (b.level - b.target)).slice(0, 2);
  const weakThemes = [...f.themes].sort((a, b) => a.pct - b.pct).slice(0, 2);
  const verdict: Content[] = [];
  const em = (t: string): Content => ({ text: safe(t), bold: true, color: NAVY });
  if (f.scored) {
    verdict.push("We meet our target in ", em(`${f.headline}% of the framework`));
    verdict.push(f.assessed < f.counted.length ? ` (${f.good} of the ${f.assessed} controls assessed so far)` : "");
  } else {
    verdict.push(em(`${f.headline}% of the controls in scope`), " are in place");
  }
  verdict.push(delta === null ? ". " : delta === 0 ? `, the same as on ${shortDate(prev!.day)}. ` : `, ${delta > 0 ? "up" : "down"} from ${prevHeadline}% on ${shortDate(prev!.day)}. `);
  if (f.scored && weakest.length) {
    verdict.push(`Furthest from target: ${weakest.map((a) => a.name.toLowerCase()).join(" and ")}. `);
  } else if (!f.scored && weakThemes.length && weakThemes[0]!.pct < 100) {
    verdict.push(`Least far along: ${weakThemes[0]!.name.replace(/^A\.\d+\s*/, "").toLowerCase()} controls. `);
  }
  if (!f.scored && f.pack.features?.["certificationTracking"]) {
    const { rows: p } = await query<{ expires: string | null; body: string | null }>(
      "select json_extract(attrs, '$.certification.expires') as expires, json_extract(attrs, '$.certification.body') as body from programme where id = 1",
    );
    if (p[0]?.expires) verdict.push(`The certificate${p[0].body ? ` from ${p[0].body}` : ""} runs until ${longDate(p[0].expires)}. `);
  }
  verdict.push(asks.length ? em(`${asks.length === 1 ? "One decision is" : `${asks.length} decisions are`} needed`) : "No decision is needed", asks.length ? " from this committee." : " from this committee this time.");

  const logo = boardLogo(branding.logo ? { kind: branding.logo.kind, data: branding.logo.data } : null);
  const orgName = organisation.name.trim();

  // ── page 1: the band ──
  const band: Content = {
    stack: [
      {
        columns: [
          { ...(spaced(`${product.name}  ·  ${product.framework}`, 7, BAND_TEXT) as object), width: "*", margin: [0, 6, 0, 0] } as unknown as Content,
          logo
            ? { table: { body: [[{ ...(logo as object), fillColor: "#ffffff", margin: [6, 4, 6, 4] } as unknown as Content]] }, layout: "noBorders", width: "auto" } as unknown as Content
            : { text: "", width: "auto" },
        ],
      },
      { text: "Executive summary", font: SERIF, bold: true, fontSize: 30, color: "#ffffff", margin: [0, 14, 0, 2] },
      { text: safe(f.scored ? `Our cyber security position against the ${product.framework}` : `Our information security position against ${product.framework}`), fontSize: 10, color: BAND_TEXT },
      {
        columns: [
          ...(orgName ? [{ stack: [spaced("Organisation", 6.5, BAND_MUTED), { text: safe(orgName), fontSize: 9.5, color: "#ffffff", margin: [0, 2, 0, 0] as M }], width: "auto" }] : []),
          { stack: [spaced("As at", 6.5, BAND_MUTED), { text: longDate(d), fontSize: 9.5, color: "#ffffff", margin: [0, 2, 0, 0] as M }], width: "auto" },
          { stack: [spaced("Compared with", 6.5, BAND_MUTED), { text: prev ? longDate(prev.day) : "No earlier paper", fontSize: 9.5, color: "#ffffff", margin: [0, 2, 0, 0] as M }], width: "auto" },
          { stack: [spaced("Prepared by", 6.5, BAND_MUTED), { text: safe(generatedBy), fontSize: 9.5, color: "#ffffff", margin: [0, 2, 0, 0] as M }], width: "auto" },
        ],
        columnGap: 26,
        margin: [0, 18, 0, 0],
      },
    ],
    margin: [0, 0, 0, 0],
  } as unknown as Content;

  // ── hero ──
  const hero: Content = {
    columns: [
      { stack: [gauge(f.headline, prevHeadline), { ...(spaced(f.scored ? "of the framework at target" : "of controls in place", 6) as object), characterSpacing: 0.8, alignment: "center", margin: [0, 10, 0, 0] } as unknown as Content], width: 170 },
      {
        stack: [
          { table: { body: [[{ text: safe(status.word.toUpperCase()), fontSize: 7, bold: true, characterSpacing: 1.2, color: TONE[status.tone].fg, fillColor: TONE[status.tone].bg, margin: [6, 2, 6, 2] }]] }, layout: "noBorders" },
          { text: verdict.map((v) => (typeof v === "string" ? safe(v) : v)) as unknown as Content[], font: SERIF, fontSize: 12.5, lineHeight: 1.32, color: INK, margin: [0, 8, 0, 0] } as unknown as Content,
        ],
        width: "*",
        margin: [10, 10, 0, 0],
      },
    ],
    margin: [0, 34, 0, 0],
  } as unknown as Content;

  // ── key figures ──
  const change = (now: number | null, then: number | null | undefined, goodWhenUp: boolean, unit = ""): Content => {
    if (now === null || then === null || then === undefined) return { text: "", width: "auto" } as unknown as Content;
    const dlt = Math.round((now - then) * 10) / 10;
    if (dlt === 0) return chip("no change", "flat");
    const better = goodWhenUp ? dlt > 0 : dlt < 0;
    return chip(`${Math.abs(dlt)}${unit}`, better ? "up" : "down", dlt > 0 ? "up" : "down");
  };
  const kpi = (label: string, value: Content[], ch: Content, spark: Content, note: string): Content => ({
    stack: [
      spaced(label, 6.6),
      { text: value, font: SERIF, bold: true, fontSize: 21, color: NAVY, margin: [0, 4, 0, 1] },
      { columns: [{ ...(ch as object), width: "auto" } as unknown as Content, { text: "", width: "*" }, { ...(spark as object), width: 58 } as unknown as Content], margin: [0, 1, 0, 3] },
      { text: safe(note), fontSize: 7.3, color: INK2 },
    ],
    margin: [9, 9, 9, 9],
  } as unknown as Content);
  const small = (t: string): Content => ({ text: safe(t), font: "Helvetica", bold: false, fontSize: 8.5, color: MUTED });
  const kpis: Content = {
    table: {
      widths: ["*", "*", "*", "*"],
      body: [[
        f.scored
          ? kpi("At target", [String(f.good), small(` / ${f.assessed}`)], change(f.good, prev?.atTarget, true), sparkline(series((s) => s.atTarget), BLUE), "controls at their target level")
          : kpi("In place", [String(f.good), small(` / ${f.counted.length}`)], change(f.good, prev?.atTarget, true), sparkline(series((s) => s.atTarget), BLUE), "controls in scope implemented"),
        f.scored
          ? kpi("Average maturity", [f.average === null ? "-" : f.average.toFixed(1), small(" / 5")], change(f.average, prev?.average, true), sparkline(series((s) => s.average), BLUE),
              f.assessed < f.counted.length ? `${f.counted.length - f.assessed} not assessed yet` : `target level ${MATURITY_DEFAULT_TARGET} unless set higher`)
          : kpi("Evidence gaps", [String(f.bareControls)], { text: "", width: "auto" } as unknown as Content, { text: "", width: 58 } as unknown as Content, "in place, but nothing to prove it"),
        kpi("Critical risks", [String(critical), small(` of ${f.risks.length} open`)], change(critical, prev?.critical, false), sparkline(series((s) => s.critical), TONE.down.fg), "score 20 or more after treatment"),
        kpi("Overdue", [String(overdue)], change(overdue, prev?.overdue, false), sparkline(series((s) => s.overdue), TONE.up.fg), `${plural(f.overdueTasks, "task")}, ${plural(f.overdueFindings, "finding")}`),
      ]],
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === node.table.body.length ? 0.7 : 0),
      vLineWidth: () => 0.7, hLineColor: () => LINE, vLineColor: () => LINE,
    },
    margin: [0, 16, 0, 0],
  } as unknown as Content;

  // ── decisions ──
  const card = (dec: Decision, i: number): Content => ({
    table: {
      widths: ["*"],
      body: [[{
        stack: [
          spaced(`Decision ${i + 1}  ·  ${dec.kind}`, 6.6, GOLD),
          { text: safe(dec.title), font: SERIF, bold: true, fontSize: 11, color: NAVY, margin: [0, 4, 0, 4] },
          { text: safe(dec.why), fontSize: 8, color: INK2, lineHeight: 1.3 },
          {
            table: { widths: ["*"], body: [[{ stack: [spaced("Recommendation", 6, GOLD_LIGHT), { text: safe(dec.recommend), fontSize: 8, color: "#ffffff", margin: [0, 2, 0, 0] }], fillColor: NAVY, margin: [7, 6, 7, 6] }]] },
            layout: "noBorders", margin: [0, 8, 0, 0],
          },
        ],
        margin: [9, 9, 9, 9],
      }]],
    },
    layout: {
      hLineWidth: (k: number) => (k === 0 ? 2.5 : 0.7), vLineWidth: () => 0.7,
      hLineColor: (k: number) => (k === 0 ? GOLD : LINE), vLineColor: () => LINE,
    },
  } as unknown as Content);
  const shown = asks.slice(0, tight >= 2 ? 1 : 2);
  const decisionBlock: Content = shown.length
    ? {
        stack: [
          { columns: shown.map((dec, i) => ({ ...(card(dec, i) as object), width: "*" } as unknown as Content)), columnGap: 12 },
          ...(asks.length > shown.length ? [{ text: safe(`Also for the committee: ${asks.slice(shown.length).map((a) => `${a.title} (${a.kind.toLowerCase()})`).join("; ")}.`), fontSize: 7.5, color: INK2, margin: [0, 6, 0, 0] as M }] : []),
        ],
      } as unknown as Content
    : { table: { widths: ["*"], body: [[{ text: "Nothing needs the committee's decision this time: no risk is above appetite without a decision, and no finding is overdue.", fontSize: 9, color: TONE.up.fg, fillColor: TONE.up.bg, margin: [10, 8, 10, 8] }]] }, layout: "noBorders" } as unknown as Content;

  // ── domains ──
  const domains: Content = {
    stack: f.themes.map((t) => ({
      columns: [
        { stack: [{ text: safe(t.name), bold: true, fontSize: 8.8, color: INK }, { text: safe(f.scored && t.den < t.count ? `${t.count} controls, ${t.den} assessed` : plural(t.count, "control")), fontSize: 7.2, color: MUTED }], width: 170 },
        { ...(ladder(t.pct) as object), width: 200 } as unknown as Content,
        { text: [{ text: `${t.pct}%`, font: SERIF, bold: true, fontSize: 12, color: NAVY }, { text: `  ${t.num} of ${t.den}`, fontSize: 7.8, color: INK2 }], alignment: "right", width: "*", margin: [0, 1, 0, 0] },
      ],
      columnGap: 10,
      margin: [0, 0, 0, 7],
    } as unknown as Content)),
  } as unknown as Content;

  // ── needs attention / strongest ──
  // pdfmake cannot lay out a table with no rows, so an empty list says so instead.
  const listTable = (rows: Content[][], widths: (string | number)[]): Content => !rows.length
    ? { text: "Nothing to show yet.", fontSize: 8.5, color: MUTED, margin: [0, 4, 0, 0] } as unknown as Content
    : ({
    table: { widths, body: rows },
    layout: { hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === node.table.body.length ? 0 : 0.6), vLineWidth: () => 0, hLineColor: () => LINE, paddingTop: () => 4.5, paddingBottom: () => 4.5, paddingLeft: () => 0, paddingRight: () => 4 },
  } as unknown as Content);
  let attention: Content;
  let strongest: Content;
  if (f.scored && f.areas.length) {
    const below = [...f.areas].sort((a, b) => (a.level - a.target) - (b.level - b.target)).slice(0, tight >= 1 ? 2 : 3);
    const best = [...f.areas].sort((a, b) => (b.level - b.target) - (a.level - a.target) || b.level - a.level).slice(0, tight >= 1 ? 2 : 3);
    const row = (a: Area): Content[] => [
      { text: a.ref, font: "Courier", fontSize: 7.5, color: MUTED },
      { text: safe(a.name), fontSize: 8.5, color: INK },
      dots(a.level, a.target),
      { text: `${a.level.toFixed(1)}/${a.target}`, fontSize: 7, color: MUTED, alignment: "right", margin: [0, 1, 0, 0] },
    ];
    attention = listTable(below.map(row), [34, "*", 46, 24]);
    strongest = { stack: [listTable(best.map(row), [34, "*", 46, 24]), { text: "Dots show levels 1 to 5, the average of each area; the gold ring is its target.", fontSize: 6.8, color: MUTED, margin: [0, 4, 0, 0] }] } as unknown as Content;
  } else {
    const items = [
      { n: f.bareControls, t: "controls in place with no evidence to prove it" },
      { n: f.staleEvidence, t: "evidence items older than 90 days or undated" },
      { n: f.notStarted, t: "controls in scope not started yet" },
      { n: f.policiesOverdue, t: "policies past their review date" },
      { n: f.overdueFindings, t: "findings past their due date" },
    ].filter((i) => i.n > 0).sort((a, b) => b.n - a.n).slice(0, tight >= 1 ? 2 : 3);
    attention = items.length
      ? listTable(items.map((i) => [{ text: String(i.n), font: SERIF, bold: true, fontSize: 11, color: TONE.down.fg }, { text: safe(i.t), fontSize: 8.5, color: INK, margin: [0, 2, 0, 0] }]), [30, "*"])
      : { text: "Nothing stands out.", fontSize: 8.5, color: MUTED };
    strongest = listTable(
      [...f.themes].sort((a, b) => b.pct - a.pct).slice(0, tight >= 1 ? 2 : 3).map((t) => [
        { text: `${t.pct}%`, font: SERIF, bold: true, fontSize: 11, color: TONE.up.fg },
        { text: safe(t.name), fontSize: 8.5, color: INK, margin: [0, 2, 0, 0] },
      ]),
      [30, "*"],
    );
  }
  const split: Content = {
    columns: [
      { stack: [{ text: "Needs attention", font: SERIF, bold: true, fontSize: 11, color: NAVY, margin: [0, 0, 0, 3] }, attention], width: "*" },
      { stack: [{ text: "Strongest", font: SERIF, bold: true, fontSize: 11, color: NAVY, margin: [0, 0, 0, 3] }, strongest], width: "*" },
    ],
    columnGap: 20,
    margin: [0, 10, 0, 0],
  } as unknown as Content;

  // ── page 2: risks ──
  const decided = new Set(asks.map((a) => a.riskSeq).filter((s): s is number => s !== undefined));
  const top = [...f.risks].sort((a, b) => f.after(b) - f.after(a) || f.before(b) - f.before(a)).slice(0, tight >= 3 ? 4 : 5);
  const riskRows: Content[][] = top.map((r) => {
    const mine = f.links.filter((l) => l.risk_id === r.id);
    const done = mine.filter((l) => l.status === "implemented").length;
    const next = decided.has(r.seq) ? ["Committee decision", "this meeting"]
      : mine.length && done < mine.length ? [`Put ${plural(mine.length - done, "control")} in place`, r.review_date ? `review ${shortDate(r.review_date)}` : "no date set"]
      : !mine.length && r.treatment !== "Accept" ? ["Choose its controls", "not treated yet"]
      : [r.review_date ? "Review" : "Keep under review", r.review_date ? shortDate(r.review_date) : "no date set"];
    const detail = decided.has(r.seq) ? `#${r.seq} · see the decisions on page 1`
      : mine.length ? `#${r.seq} · ${done} of ${mine.length} controls in place` : `#${r.seq} · ${r.treatment.toLowerCase()}`;
    return [
      { stack: [{ text: safe(r.title), bold: true, fontSize: 8.6, color: INK }, { text: safe(detail), fontSize: 7.3, color: MUTED, margin: [0, 1, 0, 0] }] },
      r.owner.trim() ? { columns: [{ ...(avatar(r.owner) as object), width: 21 } as unknown as Content, { text: safe(r.owner.trim()), fontSize: 8, color: INK2, margin: [0, 2, 0, 0] }] } : { text: "Nobody", fontSize: 8, color: TONE.down.fg },
      { columns: [scoreBox(f.before(r)), { ...(arrow() as object), width: 20 } as unknown as Content, scoreBox(f.after(r))], columnGap: 0 },
      { stack: [{ text: safe(next[0]!), bold: true, fontSize: 8, color: INK }, { text: safe(next[1]!), fontSize: 7.3, color: MUTED }] },
    ];
  });
  const th = (t: string): Content => ({ ...(spaced(t, 6.5) as object), margin: [0, 0, 0, 3] } as unknown as Content);
  const risksTable: Content = riskRows.length
    ? {
        table: { headerRows: 1, dontBreakRows: true, widths: ["*", 104, 76, 96], body: [[th("Risk"), th("Owner"), th("Before / after"), th("Next step")], ...riskRows] },
        layout: { hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 1 ? 1 : i === 0 || i === node.table.body.length ? 0 : 0.6), vLineWidth: () => 0, hLineColor: (i: number) => (i === 1 ? NAVY : LINE), paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 3, paddingRight: () => 3 },
      } as unknown as Content
    : { text: "No open risks are recorded.", fontSize: 9, color: MUTED };

  // ── heat maps ──
  const grid = (pick: (r: RiskRow) => [number, number]): number[][] => {
    const g = [0, 1, 2, 3, 4].map(() => [0, 0, 0, 0, 0]);
    for (const r of f.risks) {
      const [l, i] = pick(r);
      if (l >= 1 && l <= 5 && i >= 1 && i <= 5) g[l - 1]![i - 1]!++;
    }
    return g;
  };
  const criticalBefore = f.risks.filter((r) => f.before(r) >= 20).length;
  const heat: Content = {
    stack: [
      {
        columns: [
          { ...(heatGrid(grid((r) => [r.likelihood, r.impact]), "Before treatment") as object), width: "*" } as unknown as Content,
          { stack: [svgW(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="12" viewBox="0 0 34 12"><path d="M0 6 H28" stroke="${GOLD}" stroke-width="1.6"/><path d="M26 1 L34 6 L26 11 Z" fill="${GOLD}"/></svg>`, 34, 12, [6, 44, 0, 4]), { ...(spaced("treatment", 5.8) as object), alignment: "center" } as unknown as Content], width: 46 },
          { ...(heatGrid(grid((r) => [r.res_likelihood ?? r.likelihood, r.res_impact ?? r.impact]), "After treatment") as object), width: "*" } as unknown as Content,
        ],
        columnGap: 8,
      },
      { text: safe(`Impact runs left to right, likelihood bottom to top. ${plural(criticalBefore, "risk")} ${criticalBefore === 1 ? "is" : "are"} critical before treatment; ${critical} ${critical === 1 ? "stays" : "stay"} critical after it.`), fontSize: 7.3, color: MUTED, margin: [0, 5, 0, 0] },
    ],
  } as unknown as Content;

  // ── the next 90 days ──
  const horizon = addDays(90);
  const { rows: upcoming } = await query<{ due: string; what: string }>(
    `select due_date as due, title as what from tasks where status <> 'Done' and due_date is not null and due_date <= $1
     union all select due_date, 'Finding: ' || title from findings where status <> 'Closed' and due_date is not null and due_date <= $1
     union all select planned_date, title from reviews where status = 'Planned' and planned_date is not null and planned_date between $2 and $1
     union all select review_date, 'Review the ' || lower(name) from policies where review_date is not null and review_date <= $1
     order by 1 limit 6`,
    [horizon, d],
  );
  const timeline: Content = upcoming.length
    ? (() => {
        const n = upcoming.length;
        const colW = WIDTH / n;
        const lateCount = upcoming.filter((u) => u.due < d).length;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="12" viewBox="0 0 ${WIDTH} 12">`;
        svg += `<path d="M0 6 H${WIDTH}" stroke="${LINE}" stroke-width="2"/>`;
        if (lateCount) svg += `<path d="M0 6 H${colW * lateCount}" stroke="${TONE.down.fg}" stroke-width="2"/>`;
        upcoming.forEach((u, i) => {
          const late = u.due < d;
          svg += `<circle cx="${i * colW + 5}" cy="6" r="4" fill="${late ? TONE.down.fg : "#ffffff"}" stroke="${late ? TONE.down.fg : NAVY2}" stroke-width="2"/>`;
        });
        svg += "</svg>";
        return {
          stack: [
            svgW(svg, WIDTH, 12),
            {
              columns: upcoming.map((u) => {
                const late = u.due < d;
                const lateBy = daysBetween(u.due, d);
                return {
                  stack: [
                    spaced(late ? `${plural(lateBy, "day")} late` : shortDate(u.due), 6.6, late ? TONE.down.fg : NAVY),
                    { text: safe(u.what), fontSize: 7.8, color: INK2, margin: [0, 2, 6, 0] as M },
                  ],
                  width: colW,
                };
              }),
              columnGap: 0,
              margin: [0, 6, 0, 0],
            },
          ],
        } as unknown as Content;
      })()
    : { text: "Nothing is due in the next 90 days.", fontSize: 8.5, color: MUTED };

  // ── since last time ──
  let tiles: { big: string; text: string }[];
  if (prev) {
    const { rows: s } = await query<{ closed: number; risks: number; crit: number }>(
      `select (select count(*) from findings where status = 'Closed' and updated_at >= $1) as closed,
              (select count(*) from risks where created_at >= $1) as risks,
              (select count(*) from risks where created_at >= $1 and status <> 'Closed'
                 and coalesce(res_likelihood, likelihood) * coalesce(res_impact, impact) >= 20) as crit`,
      [prev.day],
    );
    const moved = f.good - prev.atTarget;
    tiles = [
      { big: `${moved > 0 ? "+" : ""}${moved}`, text: f.scored ? "controls at their target level" : "controls in place" },
      { big: String(s[0]?.closed ?? 0), text: "findings closed" },
      { big: String(s[0]?.risks ?? 0), text: `new risks recorded${(s[0]?.crit ?? 0) ? `, ${s[0]!.crit} of them critical` : ""}` },
      { big: String(f.evidence), text: `evidence items; ${f.staleEvidence} older than 90 days or undated` },
    ];
  } else {
    tiles = [
      { big: String(f.good), text: f.scored ? "controls at their target level" : "controls in place" },
      { big: String(f.risks.length), text: "open risks" },
      { big: String(overdue), text: "overdue tasks and findings" },
      { big: String(f.evidence), text: `evidence items; ${f.staleEvidence} older than 90 days or undated` },
    ];
  }
  const since: Content = {
    columns: tiles.map((t) => ({
      table: { widths: ["*"], body: [[{ stack: [{ text: safe(t.big), font: SERIF, bold: true, fontSize: 15, color: NAVY }, { text: safe(t.text), fontSize: 7.6, color: INK2, margin: [0, 2, 0, 0] }], fillColor: SOFT, margin: [8, 7, 8, 7] }]] },
      layout: "noBorders",
      width: "*",
    } as unknown as Content)),
    columnGap: 8,
  } as unknown as Content;

  const method: Content = {
    table: { widths: ["*"], body: [[{
      text: safe(
        (f.scored
          ? `How the figures are worked out: each control is scored 0 to 5. The target is level ${MATURITY_DEFAULT_TARGET} unless a control carries a higher one. `
          : "How the figures are worked out: the share of controls in scope whose status is Implemented. ") +
          "Risk scores are likelihood times impact, before and after treatment; 20 or more is critical, and a risk above 12 needs this committee to accept it. " +
          (prev ? `Changes compare with the paper of ${longDate(prev.day)}.` : "This is the first paper, so there is nothing to compare with yet."),
      ),
      fontSize: 7.2, color: MUTED, lineHeight: 1.3, margin: [7, 2, 0, 2],
    }]] },
    layout: { hLineWidth: () => 0, vLineWidth: (i: number) => (i === 0 ? 1.5 : 0), vLineColor: () => GOLD },
    margin: [0, 14, 0, 0],
  } as unknown as Content;

  const stampTime = stampLocal().slice(11);
  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [SIDE, 52, SIDE, 58],
    defaultStyle: { font: "Helvetica", fontSize: 9, color: INK, lineHeight: 1.2 },
    info: { title: "Executive summary", author: "Offset Security", subject: safe(`${product.name} - ${product.framework}`), creator: safe(product.name) },
    background: (page: number) => ({
      canvas: page === 1
        ? [
            { type: "rect", x: 0, y: 0, w: PAGE_W, h: BAND_H, color: NAVY },
            ...[44, 74, 104, 134, 164].map((r) => ({ type: "ellipse" as const, x: PAGE_W, y: 18, r1: r, r2: r, lineColor: "#2a3a5e", lineWidth: 0.6 })),
            { type: "rect", x: 0, y: BAND_H, w: PAGE_W * 0.55, h: 2.6, color: GOLD },
            { type: "rect", x: PAGE_W * 0.55, y: BAND_H, w: PAGE_W * 0.2, h: 2.6, color: GOLD_LIGHT },
          ]
        : [{ type: "rect", x: 0, y: 0, w: PAGE_W, h: 34, color: NAVY }],
    }) as unknown as Content,
    header: (page: number) => (page === 1 ? null : {
      columns: [
        { ...(spaced(`Executive summary  ·  ${longDate(d)}`, 6.8, BAND_TEXT) as object), width: "*", margin: [0, 3, 0, 0] } as unknown as Content,
        { text: safe(orgName || product.name), font: SERIF, bold: true, fontSize: 10.5, color: "#ffffff", width: "auto" },
      ],
      margin: [SIDE, 11, SIDE, 0],
    }) as unknown as Content,
    footer: (page: number, pages: number) => ({
      stack: [
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: WIDTH, y2: 0, lineWidth: 0.5, lineColor: LINE }], margin: [0, 0, 0, 5] },
        {
          columns: [
            { text: safe(`Board confidential  ·  built from live data on ${longDate(d)} at ${stampTime} by ${generatedBy}  ·  recorded in the audit log`), fontSize: 6.8, color: MUTED, width: "*" },
            { text: `${page} / ${pages}`, font: SERIF, bold: true, fontSize: 9, color: NAVY, width: "auto" },
          ],
        },
        {
          text: safe(`© ${new Date().getFullYear()} Offset Security${meta.edition ? `  ·  ${meta.edition}` : ""}  ·  ${meta.disclaimer}  ·  ${meta.contact}`),
          fontSize: 6, color: "#a3acbb", margin: [0, 3, 0, 0],
        },
      ],
      margin: [SIDE, 12, SIDE, 0],
    }) as unknown as Content,
    content: [
      { ...(band as object), margin: [0, -20, 0, 0] } as unknown as Content,
      hero,
      kpis,
      section("01", "Decisions for the committee"),
      decisionBlock,
      section("02", "Where we stand, by domain", f.scored ? "share of assessed controls at target" : "share of controls in place"),
      domains,
      split,
      { ...(section("03", "The risks that matter most", "score: likelihood x impact") as object), pageBreak: "before", margin: [0, 4, 0, 8] } as unknown as Content,
      risksTable,
      { unbreakable: true, stack: [section("04", "Risk before and after treatment", plural(f.risks.length, "open risk")), heat] } as unknown as Content,
      { unbreakable: true, stack: [section("05", "The next 90 days"), timeline] } as unknown as Content,
      { unbreakable: true, stack: [section("06", prev ? "Since the last paper" : "Where things stand"), since] } as unknown as Content,
      ...(tight >= 3 ? [] : [method]),
    ],
  };
  return { doc, save: () => saveSnapshot(snapshots, now) };
}

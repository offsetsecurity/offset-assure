import { query } from "../db/pool.js";
import { MATURITY_DEFAULT_TARGET } from "../config.js";
import { packMeta, readPack, themeOrder } from "../lib/pack.js";
import { todayIso, dayIso, staleSql } from "../lib/time.js";

/** The board paper's palette and its figures: what is read from the tables, the snapshot it keeps of its own headline numbers, and the decisions it asks for. */

// ── palette ──────────────────────────────────────────────────────────────────
export const NAVY = "#0f1c36";
export const NAVY2 = "#1b2c52";
export const GOLD = "#c39a4a";
export const GOLD_LIGHT = "#e3c483";
export const BLUE = "#2f5bd3";
export const INK = "#101828";
export const INK2 = "#475467";
export const MUTED = "#8a94a6";
export const LINE = "#e6e9f0";
export const SOFT = "#f6f7fa";
export const BAND_TEXT = "#c9d3ea";
export const BAND_MUTED = "#8fa0c4";
export const TONE = {
  up: { fg: "#1f8a4c", bg: "#e6f4ec" },
  down: { fg: "#b42318", bg: "#fcebea" },
  warn: { fg: "#c27a0e", bg: "#fbf1df" },
  flat: { fg: INK2, bg: SOFT },
} as const;
export type Tone = keyof typeof TONE;

export const SERIF = "Times";
export const PAGE_W = 595.28;
export const SIDE = 42;
export const WIDTH = PAGE_W - 2 * SIDE;
export const BAND_H = 196;

export type M = [number, number, number, number];
export const x = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── the figures ──────────────────────────────────────────────────────────────

export interface Snapshot {
  day: string;
  headline: number;
  average: number | null;
  critical: number;
  overdue: number;
  atTarget: number;
  evidence: number;
}

export interface Area { ref: string; name: string; level: number; target: number }

export interface Decision { kind: string; title: string; why: string; recommend: string; riskSeq?: number }

export interface RiskRow {
  id: string; seq: number; title: string; owner: string; status: string; treatment: string;
  likelihood: number; impact: number; res_likelihood: number | null; res_impact: number | null;
  accepted_by: string | null; review_date: string | null; created_at: string;
}

export const today = (): string => todayIso();
export const addDays = (days: number): string => dayIso(days);
export const longDate = (iso: string): string =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const shortDate = (iso: string): string =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000);
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
export const initials = (name: string): string =>
  name.trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !["of", "and", "the"].includes(w.toLowerCase()))
    .slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "-";

/** The words a reader uses for a group of controls, by framework. */
export async function themeNames(): Promise<Map<string, string>> {
  try {
    const names = await readPack<Record<string, string>>("themes.json");
    // SAMA writes "CYBER SECURITY LEADERSHIP AND GOVERNANCE (3.1)"; a board
    // paper reads better as "3.1 Leadership and governance".
    const tidy = (v: string): string => {
      if (v !== v.toUpperCase()) return v;
      const num = /\(([\d.]+)\)\s*$/.exec(v)?.[1];
      const words = v.replace(/\([^)]*\)\s*$/, "").replace(/^CYBER SECURITY\s+/, "").trim().toLowerCase();
      const name = words.charAt(0).toUpperCase() + words.slice(1);
      return num ? `${num} ${name}` : name;
    };
    return new Map(Object.entries(names).map(([k, v]) => [k, tidy(v)]));
  } catch {
    return new Map();
  }
}

/** Snapshots of earlier board papers, oldest first. */
export async function loadSnapshots(): Promise<Snapshot[]> {
  const { rows } = await query<{ value: string }>("select value from settings where key = 'board_snapshots'");
  try {
    const list = JSON.parse(rows[0]?.value ?? "[]") as Snapshot[];
    return Array.isArray(list) ? list.sort((a, b) => a.day.localeCompare(b.day)) : [];
  } catch {
    return [];
  }
}

/** Keeps today's figures, one per day, the last two years at most. */
export async function saveSnapshot(list: Snapshot[], now: Snapshot): Promise<void> {
  const kept = [...list.filter((s) => s.day !== now.day), now].sort((a, b) => a.day.localeCompare(b.day)).slice(-24);
  await query(
    `insert into settings (key, value) values ('board_snapshots', $1)
     on conflict (key) do update set value = excluded.value, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    [JSON.stringify(kept)],
  );
}

export async function gather() {
  const [order, names, pack] = await Promise.all([themeOrder(), themeNames(), packMeta()]);
  const scored = Boolean(pack.features?.["maturity"]);
  const { rows: controls } = await query<{
    id: string; ref: string; title: string; theme: string; parent_ref: string | null; status: string;
    maturity: number | null; target_maturity: number | null;
  }>("select id, ref, title, theme, parent_ref, status, maturity, target_maturity from controls");
  const inScope = controls.filter((c) => c.status !== "not_applicable");
  const target = (c: { target_maturity: number | null }): number => c.target_maturity ?? MATURITY_DEFAULT_TARGET;
  const parents = new Set(controls.map((c) => c.parent_ref).filter((r): r is string => Boolean(r)));
  // A subdomain heading is not itself a control to score, where it has children.
  const counted = inScope.filter((c) => !parents.has(c.ref));

  // Headline: share at target (scored) or share implemented (ticked).
  const isGood = (c: (typeof counted)[number]): boolean =>
    scored ? c.maturity !== null && c.maturity >= target(c) : c.status === "implemented";
  const assessed = scored ? counted.filter((c) => c.maturity !== null) : counted;
  const good = assessed.filter(isGood).length;
  const headline = assessed.length ? Math.round((good / assessed.length) * 100) : 0;
  const levels = counted.filter((c) => c.maturity !== null).map((c) => c.maturity as number);
  const average = levels.length ? Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10 : null;

  const themes = order.filter((t) => counted.some((c) => c.theme === t)).map((t) => {
    const mine = counted.filter((c) => c.theme === t);
    const den = scored ? mine.filter((c) => c.maturity !== null).length : mine.length;
    const num = (scored ? mine.filter((c) => c.maturity !== null) : mine).filter(isGood).length;
    return { key: t, name: names.get(t) ?? t, count: mine.length, num, den, pct: den ? Math.round((num / den) * 100) : 0 };
  });

  // Subdomains, for a scored framework: the average level of their children.
  const areas: Area[] = [];
  if (scored) {
    const byParent = new Map<string, typeof counted>();
    for (const c of counted) {
      const key = c.parent_ref ?? c.ref;
      byParent.set(key, [...(byParent.get(key) ?? []), c]);
    }
    for (const [ref, kids] of byParent) {
      const marked = kids.filter((k) => k.maturity !== null);
      if (!marked.length) continue;
      const head = controls.find((c) => c.ref === ref);
      areas.push({
        ref,
        name: (head?.title ?? kids[0]!.title).replace(/^Cyber Security (?=\S)/, "").replace(/^in /, "Security in "),
        level: Math.round((marked.reduce((a, k) => a + (k.maturity as number), 0) / marked.length) * 10) / 10,
        target: Math.max(...kids.map(target)),
      });
    }
  }

  const { rows: risks } = await query<RiskRow>(
    `select id, seq, title, owner, status, treatment, likelihood, impact, res_likelihood, res_impact,
            accepted_by, review_date, created_at from risks where status <> 'Closed'`,
  );
  const after = (r: RiskRow): number => (r.res_likelihood ?? r.likelihood) * (r.res_impact ?? r.impact);
  const before = (r: RiskRow): number => r.likelihood * r.impact;
  const { rows: links } = await query<{ risk_id: string; status: string }>(
    `select rc.risk_id, c.status from risk_controls rc join controls c on c.id = rc.control_id`,
  );

  const d = today();
  const { rows: od } = await query<{ tasks: number; findings: number }>(
    `select (select count(*) from tasks where status <> 'Done' and due_date is not null and due_date < $1) as tasks,
            (select count(*) from findings where status <> 'Closed' and due_date is not null and due_date < $1) as findings`,
    [d],
  );
  const { rows: ev } = await query<{ total: number; stale: number; bare: number; policies: number }>(
    `select (select count(*) from evidence) as total,
            (select count(*) from evidence where ${staleSql("collected_date")}) as stale,
            (select count(*) from controls c where c.status = 'implemented'
               and not exists (select 1 from evidence_controls ec where ec.control_id = c.id)) as bare,
            (select count(*) from policies where review_date is not null and review_date < $1) as policies`,
    [d],
  );

  return {
    scored, pack, controls, counted, themes, areas, headline, good, assessed: assessed.length, average,
    notStarted: counted.filter((c) => c.status === "not_started").length,
    risks, links, before, after,
    overdueTasks: od[0]?.tasks ?? 0, overdueFindings: od[0]?.findings ?? 0,
    evidence: ev[0]?.total ?? 0, staleEvidence: ev[0]?.stale ?? 0, bareControls: ev[0]?.bare ?? 0,
    policiesOverdue: ev[0]?.policies ?? 0,
  };
}

export type Facts = Awaited<ReturnType<typeof gather>>;

/** What the committee is asked to decide, picked from the records. */
export async function decisions(f: Facts): Promise<Decision[]> {
  const out: Decision[] = [];
  const APPETITE = 12;
  const sorted = [...f.risks].sort((a, b) => f.after(b) - f.after(a) || f.before(b) - f.before(a));
  for (const r of sorted) {
    const score = f.after(r);
    if (score < APPETITE) break;
    const accepting = r.treatment === "Accept" || r.status === "Accepted";
    if (accepting && r.accepted_by) continue;
    out.push(accepting
      ? {
          kind: "Risk acceptance", riskSeq: r.seq, title: r.title,
          why: `Risk #${r.seq} is to be accepted at a score of ${score}, above the level of ${APPETITE} at which acceptance needs this committee. Nobody has signed it off yet.`,
          recommend: `Accept it formally, with a review date and an owner, or fund treatment to bring it below ${APPETITE}.`,
        }
      : {
          kind: score >= 20 ? "Critical risk" : "Risk above appetite", riskSeq: r.seq, title: r.title,
          why: `Risk #${r.seq} still scores ${score} after the treatment planned for it, above the level of ${APPETITE}. ${r.owner.trim() ? `${r.owner.trim()} owns it.` : "Nobody owns it yet."}`,
          recommend: `Agree further treatment and the money for it, or accept the risk formally for a set period.`,
        });
  }
  const { rows: late } = await query<{ seq: number; title: string; type: string; due_date: string; owner: string }>(
    `select seq, title, type, due_date, owner from findings
      where status <> 'Closed' and due_date is not null and due_date < $1
      order by case when type like 'Major%' then 0 else 1 end, due_date limit 3`,
    [today()],
  );
  for (const g of late) {
    out.push({
      kind: "Overdue finding", title: g.title,
      why: `${g.type || "Finding"} F-${g.seq} was due on ${shortDate(g.due_date)} and is ${plural(daysBetween(g.due_date, today()), "day")} late. ${g.owner.trim() ? `${g.owner.trim()} owns it.` : "Nobody owns it."}`,
      recommend: "Agree a new date, and the people or budget needed to meet it.",
    });
  }
  return out;
}


import { query } from "../db/pool.js";
import { packMeta, readPack } from "../lib/pack.js";
import { MATURITY_DEFAULT_TARGET } from "../config.js";
import { dayIso } from "../lib/time.js";

/** What the readiness figures share: the finding and quick-win shapes, the framework's words, and the scope and theme helpers. */

export type FindingLabel = "Fail" | "Gap" | "Stale" | "Partial";

export interface LikelyFinding {
  id: string;
  ref: string;
  title: string;
  label: FindingLabel;
  /** What the auditor would say. */
  says: string;
  /** What to do about it. */
  fix: string;
  action: { label: string; route: string };
  /** How many findings fixing this one removes. Drives "Fix these first". */
  weight: number;
  /** For a failed test: the control, so a passing retest can be recorded in place. */
  controlId?: string;
}

export interface QuickWin {
  id: string;
  title: string;
  count: number;
  minutes: number;
  route: string;
}

/** The pack's `readiness` block: the words and references for this framework. */
export interface ReadinessWords {
  /** "certification auditor", "SAMA assessor". */
  auditor: string;
  /** "auditor", "assessor". */
  auditorShort: string;
  /** What one is called: "nonconformity", "finding". */
  finding: string;
  findings: string;
  /** The date everything aims at: "certification audit", "SAMA assessment". */
  keyDate: string;
  /** Who carries it out, for the booking form: "Certification body", "Led by". */
  ledBy: string;
  /** References each rule cites. A rule without one is not run. */
  refs: Partial<Record<"policy" | "finding" | "vendor" | "audit" | "review" | "risk", string>>;
}

export const DEFAULT_WORDS: ReadinessWords = {
  auditor: "auditor", auditorShort: "auditor", finding: "finding", findings: "findings",
  keyDate: "external audit", ledBy: "Led by", refs: {},
};

export async function readinessWords(): Promise<ReadinessWords> {
  const meta = (await packMeta()) as unknown as { readiness?: Partial<ReadinessWords> };
  return { ...DEFAULT_WORDS, ...meta.readiness, refs: { ...meta.readiness?.refs } };
}

export interface ControlRow {
  id: string; ref: string; title: string; theme: string; status: string; owner: string;
  maturity: number | null; target_maturity: number | null;
  evidence: number; fresh: number; last_result: string | null; last_test: string | null;
}

export const DAY = 86_400_000;
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

export async function guideRecords(): Promise<Record<string, string>> {
  try {
    const g = await readPack<Record<string, { r?: string }>>("guide.json");
    return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.r ?? ""]));
  } catch {
    return {};
  }
}

/**
 * Theme names a reader would write: SAMA's "CYBER SECURITY LEADERSHIP AND
 * GOVERNANCE (3.1)" becomes "3.1 Leadership and governance". Names already in
 * ordinary case, such as "A.5 Organizational", are left alone.
 */
export function tidyTheme(v: string): string {
  if (v !== v.toUpperCase() || !/[A-Z]/.test(v)) return v;
  const num = /\(([\d.]+)\)\s*$/.exec(v)?.[1];
  const words = v.replace(/\([^)]*\)\s*$/, "").replace(/^CYBER SECURITY\s+/, "").trim().toLowerCase();
  const name = words.charAt(0).toUpperCase() + words.slice(1);
  return num ? `${num} ${name}` : name;
}

export async function themeNames(): Promise<Record<string, string>> {
  try {
    const raw = await readPack<Record<string, string>>("themes.json");
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, tidyTheme(v)]));
  } catch {
    return {};
  }
}

/** Every control that applies, with what proves it and its last test. */
export async function controlsInScope(): Promise<ControlRow[]> {
  const { rows } = await query<ControlRow>(
    `select c.id, c.ref, c.title, c.theme, c.status, c.owner, c.maturity, c.target_maturity,
            (select count(*) from evidence_controls ec where ec.control_id = c.id) as evidence,
            (select count(*) from evidence_controls ec join evidence e on e.id = ec.evidence_id
              where ec.control_id = c.id and e.collected_date >= $1) as fresh,
            (select t.result from control_tests t where t.control_id = c.id order by t.tested_on desc, t.created_at desc limit 1) as last_result,
            (select t.tested_on from control_tests t where t.control_id = c.id order by t.tested_on desc, t.created_at desc limit 1) as last_test
       from controls c where c.status <> 'not_applicable'`,
    [dayIso(-365)],
  );
  return rows;
}

/**
 * Whether a control counts as in place. In a product that scores maturity it
 * is at or above its target, the same rule the readiness figure and its
 * nightly history use; otherwise it is marked implemented.
 */
export function inPlaceTest(scored: boolean): (c: ControlRow) => boolean {
  return scored
    ? (c) => c.maturity !== null && c.maturity >= (c.target_maturity ?? MATURITY_DEFAULT_TARGET)
    : (c) => c.status === "implemented";
}


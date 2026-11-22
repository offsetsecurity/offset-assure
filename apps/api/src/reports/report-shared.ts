import type { Content } from "pdfmake/interfaces.js";
import { query } from "../db/pool.js";
import { MATURITY_DEFAULT_TARGET } from "../config.js";
import { packMeta, themeOrder } from "../lib/pack.js";
import { byThemeThenRef } from "../lib/refs.js";
import { readPack } from "../lib/pack.js";

/** What every report builder needs: the shape of a report, the framework's words, and the figures the reports and the screens both read. */

export interface ReportSpec {
  id: string;
  title: string;
  description: string;
  /**
   * What to say instead when the framework is scored rather than ticked.
   *
   * A couple of reports change what they contain on a maturity pack - the gap
   * report lists what is below target rather than what is unimplemented - and
   * a description that still promises the old contents is simply wrong. Only
   * the reports that actually change need this.
   */
  scoredDescription?: string;
  /** Pack feature required for this report to be offered. */
  requires?: string;
  landscape?: boolean;
  build: () => Promise<Content[]>;
  /**
   * A whole PDF of its own, for a report laid out differently from the rest.
   * Returning null falls back to `build` in the usual chrome.
   */
  document?: (generatedBy: string, pack: { disclaimer: string; contact: string; edition: string }) => Promise<Buffer | null>;
}

export const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  implemented: "Implemented",
  not_applicable: "Not applicable",
};

/**
 * "Function"/"Subcategory", "Family"/"Control", "Theme"/"Control" — the words
 * each framework uses. They live in the pack, not in the product constants,
 * because that is the file the API also seeded its controls from.
 */
export async function labels(): Promise<{ theme: string; item: string }> {
  const meta = await packMeta();
  return { theme: meta.themeLabel, item: meta.itemLabel };
}

/**
 * Theme names a reader understands: "A.5 Organizational", not "A5". Packs that
 * write their names in capitals ("GOVERN (GV)") are put into ordinary case,
 * leaving what is in brackets alone.
 */
export async function themeTitles(): Promise<Map<string, string>> {
  let names: Record<string, string> = {};
  try {
    names = await readPack<Record<string, string>>("themes.json");
  } catch {
    /* a pack without names keeps its keys */
  }
  const SMALL = new Set(["and", "of", "the", "for", "in", "to", "a", "an", "on"]);
  const tidy = (label: string): string => {
    if (label !== label.toUpperCase() || !/[A-Z]/.test(label)) return label;
    return label
      .split(/(\([^)]*\))/)
      .map((part) =>
        part.startsWith("(")
          ? part
          : part.toLowerCase().replace(/[a-z][a-z'-]*/g, (w, i: number) =>
              i > 0 && SMALL.has(w) ? w : w[0]!.toUpperCase() + w.slice(1)),
      )
      .join("");
  };
  return new Map(Object.entries(names).map(([k, v]) => [k, tidy(v)]));
}

export const dash = (value: unknown): string => {
  const text = String(value ?? "").trim();
  return text === "" ? "-" : text;
};

export interface ControlRow {
  ref: string;
  title: string;
  theme: string;
  status: string;
  owner: string;
  justification: string;
  attrs: string;
  updated_at: string;
  maturity: number | null;
  target_maturity: number | null;
}

/**
 * The 0-5 ladder, spelled out.
 *
 * Repeated from the web bundle rather than shared, because a report is read by
 * somebody who was not looking at the screen: the words have to travel with
 * the PDF. The web copy lives in apps/web/src/ui/format.ts and the two are
 * checked against each other by test/reports.e2e.test.ts.
 */
export const MATURITY_LEVELS: { level: number; name: string; note: string }[] = [
  { level: 0, name: "Non-existent", note: "no documentation, no awareness" },
  { level: 1, name: "Ad-hoc", note: "done inconsistently, nothing defined" },
  { level: 2, name: "Repeatable but informal", note: "repeated, but not formally defined" },
  { level: 3, name: "Structured and formalised", note: "defined, approved, monitored" },
  { level: 4, name: "Managed and measurable", note: "effectiveness measured" },
  { level: 5, name: "Adaptive", note: "continuously improved" },
];

export const levelName = (level: number | null): string =>
  level === null ? "Not assessed" : `${level} · ${MATURITY_LEVELS[level]?.name ?? ""}`.trim();

export const targetOf = (c: ControlRow): number => c.target_maturity ?? MATURITY_DEFAULT_TARGET;

export const controls = async (): Promise<ControlRow[]> => {
  const [rows, order] = await Promise.all([
    query<ControlRow>("select * from controls").then((r) => r.rows),
    themeOrder(),
  ]);
  return byThemeThenRef(rows, order);
};

export const attrOf = (row: { attrs: string }, key: string): string =>
  String((JSON.parse(row.attrs || "{}") as Record<string, unknown>)[key] ?? "");

/**
 * The same arithmetic the summary endpoint does, so a report and the dashboard
 * cannot disagree. Unscored subdomains are left out of the averages rather
 * than counted as nought: "nobody has looked at this yet" is not the same
 * finding as "this does not exist", and treating it as one makes the first
 * week of an assessment look like a catastrophe.
 */
export async function maturityStats(): Promise<{
  rows: ControlRow[];
  all: ControlRow[];
  total: number; excluded: number; scored: number; unscored: number;
  atTarget: number; atTargetPct: number; average: number;
  byLevel: number[];
  byTheme: Map<string, { scored: number; atTarget: number; total: number; sum: number }>;
}> {
  const all = await controls();
  // Ruled out is not the same as not yet looked at, so excluded items leave the
  // totals rather than sitting in "not assessed" forever.
  const rows = all.filter((c) => c.status !== "not_applicable");
  const byTheme = new Map<string, { scored: number; atTarget: number; total: number; sum: number }>();
  const byLevel = MATURITY_LEVELS.map(() => 0);
  let scored = 0;
  let atTarget = 0;
  let sum = 0;

  for (const c of rows) {
    const t = byTheme.get(c.theme) ?? { scored: 0, atTarget: 0, total: 0, sum: 0 };
    t.total++;
    if (c.maturity !== null) {
      scored++;
      sum += c.maturity;
      t.scored++;
      t.sum += c.maturity;
      byLevel[c.maturity] = (byLevel[c.maturity] ?? 0) + 1;
      if (c.maturity >= targetOf(c)) {
        atTarget++;
        t.atTarget++;
      }
    }
    byTheme.set(c.theme, t);
  }

  return {
    rows,
    all,
    total: rows.length,
    excluded: all.length - rows.length,
    scored,
    unscored: rows.length - scored,
    atTarget,
    atTargetPct: scored ? Math.round((atTarget / scored) * 100) : 0,
    average: scored ? Math.round((sum / scored) * 10) / 10 : 0,
    byLevel,
    byTheme,
  };
}

/** Readiness figures, computed the one way the whole product computes them. */
export async function readiness(): Promise<{
  total: number; applicable: number; implemented: number; pct: number;
  byTheme: Map<string, { applicable: number; implemented: number; total: number }>;
}> {
  const rows = await controls();
  const byTheme = new Map<string, { applicable: number; implemented: number; total: number }>();
  let applicable = 0;
  let implemented = 0;

  for (const c of rows) {
    const t = byTheme.get(c.theme) ?? { applicable: 0, implemented: 0, total: 0 };
    t.total++;
    if (c.status !== "not_applicable") {
      t.applicable++;
      applicable++;
      if (c.status === "implemented") {
        t.implemented++;
        implemented++;
      }
    }
    byTheme.set(c.theme, t);
  }
  return {
    total: rows.length,
    applicable,
    implemented,
    pct: applicable ? Math.round((implemented / applicable) * 100) : 0,
    byTheme,
  };
}


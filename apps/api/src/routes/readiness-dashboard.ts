import { query } from "../db/pool.js";
import { hasFeature } from "../lib/pack.js";
import { dayIso, todayIso } from "../lib/time.js";
import { DAY, themeNames, controlsInScope, inPlaceTest } from "./readiness-shared.js";

/** The Dashboard: the key audit date, where you stand and where you are heading. */

export interface KeyDate {
  title: string;
  date: string;
  ledBy: string;
  daysTo: number;
}

/** The next external audit planned in Audits and reviews: the date everything aims at. */
export async function keyDate(): Promise<KeyDate | null> {
  const { rows } = await query<{ title: string; planned_date: string; led_by: string }>(
    `select title, planned_date, led_by from reviews
      where kind = 'External audit' and status in ('Planned', 'In progress') and planned_date is not null
      order by planned_date limit 1`,
  );
  const r = rows[0];
  if (!r) return null;
  return {
    title: r.title, date: r.planned_date, ledBy: r.led_by,
    daysTo: Math.round((Date.parse(`${r.planned_date}T00:00:00Z`) - Date.parse(`${todayIso()}T00:00:00Z`)) / DAY),
  };
}

// ── the Dashboard: where you stand, and where you are heading ────────────────

export interface ReadinessDashboard {
  readyPct: number;
  keyDate: KeyDate | null;
  /** The internal audit and management review planned before the key date, for the flight path. */
  milestones: { kind: string; date: string }[];
  /** Today's pace, as the date readiness reaches 100%. Null when there is no pace yet. */
  projectedReady: string | null;
  /** Readiness history, one point a day, oldest first. */
  trend: { day: string; pct: number }[];
  /** How the auditor would see each control in scope. */
  lens: { ready: number; questions: number; findings: number; total: number };
  team: { owner: string; total: number; implemented: number }[];
  weakest: { theme: string; name: string; pct: number; implemented: number; total: number } | null;
  weekChange: number;
}

export async function readinessDashboard(): Promise<ReadinessDashboard> {
  const [names, scored, tested] = await Promise.all([themeNames(), hasFeature("maturity"), hasFeature("controlTesting")]);
  const inPlace = inPlaceTest(scored);
  const controls = await controlsInScope();
  // The same figure as the nightly history: a scored product counts what has
  // been scored so far, so the forecast line and today's point agree.
  const counted = scored ? controls.filter((c) => c.maturity !== null) : controls;
  const implemented = counted.filter(inPlace);
  const readyPct = counted.length ? Math.round((implemented.length / counted.length) * 100) : 0;

  // The auditor's eye: shown cleanly, questioned, or written up. Where the
  // product does not record tests, a control is not marked down for having none.
  const lens = { ready: 0, questions: 0, findings: 0, total: controls.length };
  for (const c of controls) {
    const failing = c.last_result === "Fail" || c.last_result === "Partial";
    if (!inPlace(c) || failing || c.evidence === 0) lens.findings++;
    else if (c.fresh === 0 || (tested && !c.last_test)) lens.questions++;
    else lens.ready++;
  }

  const key = await keyDate();
  const { rows: planned } = await query<{ kind: string; date: string }>(
    `select kind, planned_date as date from reviews
      where kind in ('Internal audit', 'Management review') and status in ('Planned', 'In progress')
        and planned_date is not null and planned_date >= $1 ${key ? "and planned_date <= $2" : ""}
      order by planned_date`,
    key ? [todayIso(), key.date] : [todayIso()],
  );
  const milestones = planned.slice(0, 4);

  // Pace: the line through the last four weeks of the daily snapshots, plus today.
  const today = todayIso();
  const { rows: history } = await query<{ day: string; pct: number }>(
    "select day, pct from trend where day >= $1 order by day", [dayIso(-120)],
  );
  const trend = history.filter((h) => h.day !== today).concat([{ day: today, pct: readyPct }]);
  const recent = trend.filter((t) => t.day >= dayIso(-28));
  let projectedReady: string | null = null;
  if (readyPct >= 100) projectedReady = today;
  else if (recent.length >= 2) {
    const xs = recent.map((t) => Date.parse(`${t.day}T00:00:00Z`) / DAY);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = recent.reduce((a, t) => a + t.pct, 0) / recent.length;
    const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const slope = den ? xs.reduce((a, x, i) => a + (x - mx) * (recent[i]!.pct - my), 0) / den : 0;
    if (slope > 0.01) projectedReady = dayIso(Math.ceil((100 - readyPct) / slope));
  }
  const weekAgo = trend.find((t) => t.day >= dayIso(-7));
  const weekChange = weekAgo ? readyPct - weekAgo.pct : 0;

  // Who is carrying it, and the weakest theme in scope.
  const byOwner = new Map<string, { owner: string; total: number; implemented: number }>();
  for (const c of controls) {
    const name = c.owner.trim() || "Unassigned";
    const o = byOwner.get(name) ?? { owner: name, total: 0, implemented: 0 };
    o.total++;
    if (inPlace(c)) o.implemented++;
    byOwner.set(name, o);
  }
  const team = [...byOwner.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  const byTheme = new Map<string, { total: number; implemented: number }>();
  for (const c of controls) {
    const t = byTheme.get(c.theme) ?? { total: 0, implemented: 0 };
    t.total++;
    if (inPlace(c)) t.implemented++;
    byTheme.set(c.theme, t);
  }
  const weakestEntry = [...byTheme.entries()].sort((a, b) => a[1].implemented / a[1].total - b[1].implemented / b[1].total)[0];
  const weakest = weakestEntry
    ? { theme: weakestEntry[0], name: names[weakestEntry[0]] ?? weakestEntry[0], pct: Math.round((weakestEntry[1].implemented / weakestEntry[1].total) * 100), ...weakestEntry[1] }
    : null;

  return { readyPct, keyDate: key, milestones, projectedReady, trend, lens, team, weakest, weekChange };
}

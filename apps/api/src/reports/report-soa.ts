import type { Content } from "pdfmake/interfaces.js";
import { query } from "../db/pool.js";
import { kpiRow, table, safe } from "./pdf.js";
import type { ReportSpec } from "./report-shared.js";
import { STATUS_LABEL, labels, dash, controls } from "./report-shared.js";

/** The Statement of Applicability, and baseline and tailoring. */

// ── statement of applicability ───────────────────────────────────────────────
export const statementOfApplicability: ReportSpec = {
  id: "statement-of-applicability",
  title: "Statement of Applicability",
  description:
    "Every control, whether it applies, why, and its implementation status. The document a certification auditor asks for first.",
  requires: "statementOfApplicability",
  landscape: true,
  async build() {
    const l = await labels();
    const rows = await controls();
    const excluded = rows.filter((c) => c.status === "not_applicable");
    const unjustified = excluded.filter((c) => !c.justification.trim());

    const { rows: prog } = await query<{ scope: string; methodology: string }>(
      "select scope, methodology from programme where id = 1",
    );
    const scope = prog[0]?.scope?.trim() ?? "";
    const methodology = prog[0]?.methodology?.trim() ?? "";

    const preface: Content[] = [
      kpiRow([
        { label: "Applicable", value: String(rows.length - excluded.length), note: `of ${rows.length} controls` },
        { label: "Excluded", value: String(excluded.length), note: "with a stated reason" },
        {
          label: "Implemented",
          value: String(rows.filter((c) => c.status === "implemented").length),
          note: "of the applicable controls",
        },
        { label: "Missing reason", value: String(unjustified.length), note: "exclusions to explain" },
      ]),
    ];

    if (scope || methodology) {
      preface.push({ text: "Scope and methodology", style: "h2" });
      if (scope) {
        preface.push({ text: safe(scope), style: "td", margin: [0, 0, 0, 6] });
      }
      if (methodology) {
        preface.push({ text: safe(methodology), style: "td", margin: [0, 0, 0, 4] });
      }
    }

    if (unjustified.length) {
      preface.push({
        text:
          `${unjustified.length} excluded control(s) have no stated reason. ` +
          "An assessor will ask why each does not apply.",
        style: "small",
        color: "#b91c1c",
        margin: [0, 6, 0, 0],
      });
    }

    return [
      ...preface,
      { text: "Statement", style: "h2" },
      table(
        ["Ref", "Control", l.theme, "Applies", "Status", "Justification", "Owner"],
        rows.map((c) => [
          c.ref,
          c.title,
          c.theme,
          c.status === "not_applicable" ? "No" : "Yes",
          STATUS_LABEL[c.status] ?? c.status,
          c.justification.trim() ||
            (c.status === "not_applicable" ? "NO REASON GIVEN" : "-"),
          dash(c.owner),
        ]),
        [50, "*", 58, 40, 62, 190, 74],
      ),
    ];
  },
};

// ── baseline and tailoring ───────────────────────────────────────────────────
export const baselineReport: ReportSpec = {
  id: "baseline-tailoring",
  title: "Baseline and tailoring",
  description:
    "Which controls the chosen baseline selected, how each was tailored, and the parameters that have been defined.",
  requires: "baselines",
  landscape: true,
  async build() {
    const rows = await controls();
    const inScope = rows.filter((c) => c.status !== "not_applicable");

    const { rows: prog } = await query<{ attrs: string }>(
      "select attrs from programme where id = 1",
    );
    const attrs = JSON.parse(prog[0]?.attrs ?? "{}") as Record<string, unknown>;
    const level = String(attrs["baseline"] ?? "none selected");
    const system = (attrs["system"] as Record<string, string> | undefined) ?? {};

    const withParams = inScope.filter(
      (c) => Object.keys(JSON.parse(c.attrs || "{}")["paramValues"] ?? {}).length > 0,
    ).length;

    return [
      kpiRow([
        { label: "Baseline", value: level, note: "SP 800-53B" },
        { label: "In scope", value: String(inScope.length), note: `of ${rows.length} controls` },
        { label: "Parameters set", value: String(withParams), note: "controls tailored" },
        {
          label: "Implemented",
          value: String(inScope.filter((c) => c.status === "implemented").length),
          note: "of the selected controls",
        },
      ]),
      {
        text: system["name"]
          ? safe(`System: ${system["name"]}${system["ao"] ? ` — authorising official ${system["ao"]}` : ""}`)
          : "No system details recorded.",
        style: "small",
        margin: [0, 4, 0, 0],
      },
      { text: "Selected controls", style: "h2" },
      table(
        ["Ref", "Control", "Family", "Status", "Origination", "Owner", "Parameters"],
        inScope.map((c) => {
          const a = JSON.parse(c.attrs || "{}") as Record<string, unknown>;
          const params = Object.keys((a["paramValues"] as object) ?? {}).length;
          return [
            c.ref,
            c.title,
            c.theme,
            STATUS_LABEL[c.status] ?? c.status,
            dash(a["origination"]),
            dash(c.owner),
            params ? `${params} set` : "-",
          ];
        }),
        [58, "*", 40, 62, 74, 78, 54],
      ),
    ];
  },
};

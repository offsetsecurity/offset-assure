import { query } from "../db/pool.js";
import { kpiRow, table } from "./pdf.js";
import { todayIso } from "../lib/time.js";
import type { ReportSpec } from "./report-shared.js";
import { dash } from "./report-shared.js";

/** The document control list. */

// ── document control list ────────────────────────────────────────────────────
/**
 * Every controlled document, its version, who approved it and when it is next
 * reviewed. Clause 7.5 on one page, and the list an auditor uses to choose
 * which document to ask for.
 */
export const documentControlList: ReportSpec = {
  id: "document-control-list",
  title: "Document control list",
  description:
    "Every policy and procedure, with its version, owner, approval, review date and the versions it has been through.",
  requires: "ismsRegisters",
  landscape: true,
  async build() {
    const { rows } = await query<{
      name: string; version: string; status: string; owner: string; approver: string;
      approval_date: string | null; review_date: string | null; refs: string; history: number;
      acknowledgements: number;
    }>(
      `select p.name, p.version, p.status, p.owner, p.approver, p.approval_date, p.review_date,
              coalesce((select group_concat(c.ref, ', ')
                          from policy_controls pc
                          join controls c on c.id = pc.control_id
                         where pc.policy_id = p.id), '') as refs,
              (select count(*) from policy_versions v where v.policy_id = p.id) as history,
              (select count(*) from policy_acknowledgements a
                where a.policy_id = p.id and a.version = p.version) as acknowledgements
         from policies p
        order by p.name`,
    );

    const today = todayIso();
    const approved = rows.filter((r) => r.status === "Approved").length;
    const overdue = rows.filter((r) => r.review_date && r.review_date < today).length;

    return [
      kpiRow([
        { label: "Documents", value: String(rows.length), note: "under control" },
        { label: "Approved", value: String(approved), note: `of ${rows.length}` },
        { label: "Review overdue", value: String(overdue), note: "past their review date" },
        { label: "Unlinked", value: String(rows.filter((r) => !r.refs).length), note: "not tied to a control" },
      ]),
      { text: "Documents", style: "h2" },
      table(
        ["Document", "Version", "Status", "Owner", "Approved by", "Approved", "Next review",
         "Earlier versions", "Read this version", "Covers"],
        rows.length
          ? rows.map((r) => [
              r.name, r.version, r.status, dash(r.owner), dash(r.approver),
              dash(r.approval_date), dash(r.review_date), String(r.history),
              r.acknowledgements ? String(r.acknowledgements) : "-", dash(r.refs),
            ])
          : [["None recorded", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
        ["*", 44, 54, 68, 68, 52, 56, 42, 50, 96],
      ),
    ];
  },
};

import { product } from "../config.js";
import { packMeta } from "../lib/pack.js";
import { loadBranding } from "../routes/settings.js";
import { buildDocument, renderPdf } from "./pdf.js";
import { ReportSpec } from "./report-shared.js";
import { executiveSummary } from "./report-executive.js";
import { gapReport, readinessPlan, maturityAssessment } from "./report-gap.js";
import { riskRegister, evidenceRegister } from "./report-registers.js";
import { statementOfApplicability, baselineReport } from "./report-soa.js";
import { managementReviewPack } from "./report-review.js";
import { documentControlList } from "./report-doccontrol.js";
export { ReportSpec } from "./report-shared.js";

/**
 * The report catalogue.
 *
 * Each report says which feature flag it needs, so the list a customer sees is
 * the list their framework actually has. Every one is assembled from the same
 * tables the screens read, so a report and the dashboard can never disagree.
 */

export const REPORTS: ReportSpec[] = [
  readinessPlan,
  executiveSummary,
  maturityAssessment,
  gapReport,
  statementOfApplicability,
  baselineReport,
  riskRegister,
  evidenceRegister,
  managementReviewPack,
  documentControlList,
];

/** Builds one report to a PDF buffer. */
export async function renderReport(spec: ReportSpec, generatedBy: string): Promise<Buffer> {
  const own = spec.document ? await spec.document(generatedBy, await packMeta()) : null;
  if (own) return own;
  const [body, branding, pack] = await Promise.all([
    spec.build(),
    loadBranding(),
    packMeta(),
  ]);
  return renderPdf(
    buildDocument(
      {
        title: spec.title,
        subtitle: `${product.name} — ${product.framework}`,
        generatedBy,
        edition: pack.edition,
        disclaimer: pack.disclaimer,
        contact: pack.contact,
        landscape: spec.landscape ?? false,
        clientLogo: branding.logo
          ? { kind: branding.logo.kind, data: branding.logo.data }
          : null,
      },
      body,
    ),
  );
}


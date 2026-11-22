import PdfPrinter from "pdfmake";
import type { TDocumentDefinitions, Content, ContentTable, StyleDictionary } from "pdfmake/interfaces.js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { product } from "../config.js";
import { stampLocal } from "../lib/time.js";
import { NAVY, MUTED, LINE, safe } from "./pdf-shared.js";
export { BRAND } from "./pdf-shared.js";
export { NAVY } from "./pdf-shared.js";
export { MUTED } from "./pdf-shared.js";
export { LINE } from "./pdf-shared.js";
export { safe } from "./pdf-shared.js";
export { barChart } from "./pdf-charts.js";
export { stackedBar } from "./pdf-charts.js";
export { radar } from "./pdf-charts.js";
export { heatMap } from "./pdf-charts.js";

/**
 * PDF generation.
 *
 * Not a bundled browser: that is roughly 300 MB on every image and every
 * Windows installer, for a document a library renders in a few milliseconds.
 * Not hand-drawn either — pdfmake takes a declarative definition and handles
 * the part that actually matters here, which is paginating long tables and
 * repeating their headers.
 *
 * Fonts are the PDF standard 14, built into every reader, so nothing is
 * embedded and nothing extra ships. The trade is WinAnsi encoding: Western
 * European Latin only. `safe()` below keeps that from turning into a crash or
 * a silently wrong character.
 */

const FONTS = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
  // The serif the board paper sets its headings and figures in. Also one of
  // the standard 14, so it costs nothing to ship either.
  Times: {
    normal: "Times-Roman",
    bold: "Times-Bold",
    italics: "Times-Italic",
    bolditalics: "Times-BoldItalic",
  },
  // For references such as "3.3.17", which line up better in a fixed width.
  Courier: {
    normal: "Courier",
    bold: "Courier-Bold",
    italics: "Courier-Oblique",
    bolditalics: "Courier-BoldOblique",
  },
};

const printer = new PdfPrinter(FONTS);

/**
 * The wordmark, drawn as vector rather than a raster image so it stays sharp at
 * any zoom and adds almost nothing to the file. Copied into dist at build time
 * from the web package, so the logo has one source.
 *
 * A missing logo must never stop a report being produced — the report is the
 * point, the letterhead is not — so this degrades to the product name in text.
 */
const here = dirname(fileURLToPath(import.meta.url));

function loadLogo(): string | null {
  for (const path of [
    resolve(here, "../brand/logo.svg"),
    resolve(here, "../../../web/src/assets/brand/logo-light-notagline.svg"),
  ]) {
    if (existsSync(path)) {
      try {
        return readFileSync(path, "utf8");
      } catch {
        /* fall through to the next candidate */
      }
    }
  }
  return null;
}

const LOGO = loadLogo();

export const styles: StyleDictionary = {
  h1: { fontSize: 20, bold: true, color: NAVY, alignment: "center", margin: [0, 0, 0, 3] },
  h2: { fontSize: 12, bold: true, color: NAVY, margin: [0, 16, 0, 6] },
  lede: { fontSize: 9.5, color: MUTED, alignment: "center", margin: [0, 0, 0, 18] },
  th: { fontSize: 8, bold: true, color: MUTED, fillColor: "#f6f8fc" },
  td: { fontSize: 8.5, color: "#0f172a" },
  small: { fontSize: 8, color: MUTED },
  // Smaller than `small` on purpose: the notice has to be present on every
  // page without competing with the report itself.
  footnote: { fontSize: 7.5, color: MUTED, lineHeight: 1.2 },
  kpiLabel: { fontSize: 7.5, bold: true, color: MUTED },
  kpiValue: { fontSize: 17, bold: true, color: NAVY },
};

/** A row of headline figures, the same four a dashboard would lead with. */
export function kpiRow(items: { label: string; value: string; note?: string }[]): ContentTable {
  return {
    table: {
      widths: items.map(() => "*"),
      body: [
        items.map((k) => ({
          stack: [
            { text: safe(k.label.toUpperCase()), style: "kpiLabel" },
            { text: safe(k.value), style: "kpiValue", margin: [0, 3, 0, 1] as [number, number, number, number] },
            { text: safe(k.note ?? ""), style: "small" },
          ],
          margin: [8, 8, 8, 8] as [number, number, number, number],
        })),
      ],
    },
    layout: {
      hLineColor: () => LINE,
      vLineColor: () => LINE,
      hLineWidth: () => 0.7,
      vLineWidth: () => 0.7,
    },
    margin: [0, 4, 0, 4],
  };
}

/** A table whose header repeats on every page — the point of using a library. */
export function table(
  headers: string[],
  rows: (string | number)[][],
  widths: (string | number)[],
): Content {
  if (rows.length === 0) {
    return { text: "Nothing to report.", style: "small", margin: [0, 4, 0, 8] };
  }
  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths,
      body: [
        headers.map((h) => ({ text: safe(h), style: "th", margin: [3, 4, 3, 4] as [number, number, number, number] })),
        ...rows.map((r) =>
          r.map((cell) => ({
            text: safe(cell),
            style: "td",
            margin: [3, 3, 3, 3] as [number, number, number, number],
          })),
        ),
      ],
    },
    layout: {
      hLineColor: () => LINE,
      vLineColor: () => LINE,
      hLineWidth: (i: number) => (i === 1 ? 0.9 : 0.5),
      vLineWidth: () => 0.5,
    },
    margin: [0, 2, 0, 10],
  };
}

export interface DocMeta {
  title: string;
  subtitle: string;
  generatedBy: string;
  /** Printed after the copyright line, when there is one. Usually empty. */
  edition: string;
  /** The framework non-affiliation notice, from the product's pack. */
  disclaimer: string;
  /** Support address, printed under the notice. */
  contact: string;
  landscape?: boolean;
  /** The customer's own logo, when they have set one. */
  clientLogo?: { kind: "image" | "svg"; data: string } | null;
}

/**
 * Two logo sizes, because a report is not one page.
 *
 * The first page carries the logo at letterhead size, in the content, which is
 * where the eye expects it on a document someone hands over. Later pages get a
 * small mark in the running header — repeating a 68pt logo on page seven of a
 * table would cost real space for no benefit.
 *
 * Both are fit boxes, so aspect ratio is always kept: a square mark uses the
 * full height, a wide wordmark the full width, and neither is ever stretched.
 */
const LOGO_LETTERHEAD: [number, number] = [180, 68];
const LOGO_RUNNING: [number, number] = [104, 26];

/** Whichever mark belongs on the page, at the size asked for. */
function logoNode(clientLogo: DocMeta["clientLogo"], fit: [number, number]): Content | null {
  if (clientLogo) {
    return clientLogo.kind === "svg"
      ? { svg: clientLogo.data, fit }
      : { image: clientLogo.data, fit };
  }
  if (LOGO) return { svg: LOGO, fit };
  return null;
}

/** The mark for the board paper's cover band, where it sits on a white tile. */
export function boardLogo(clientLogo: DocMeta["clientLogo"]): Content | null {
  return logoNode(clientLogo ?? null, [104, 28]);
}

/**
 * Renders a one-line PDF containing the logo, to find out whether it can be
 * drawn at all. Called before a logo is saved, so a file the engine cannot
 * handle is rejected at upload rather than breaking every later export.
 */
export async function probeLogo(kind: "image" | "svg", data: string): Promise<boolean> {
  try {
    await renderPdf({
      pageSize: "A4",
      defaultStyle: { font: "Helvetica" },
      content: [
        kind === "svg"
          ? { svg: data, fit: LOGO_LETTERHEAD }
          : { image: data, fit: LOGO_LETTERHEAD },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wraps report content in the same chrome every time: who produced it, when,
 * from which product, and a page number on every page. An exported document
 * that cannot say when it was run is not evidence of anything.
 */
export function buildDocument(meta: DocMeta, body: Content[]): TDocumentDefinitions {
  // In the organisation's zone, named, so "Generated 03:37" is the time on the reader's clock.
  const stamp = stampLocal();

  // Wrapped in a stack so the spacing below it can be set without having to
  // widen the image/svg union by hand.
  // A4 less the 40pt side margins, so the footer rule spans the text column
  // exactly rather than being eyeballed.
  const contentWidth = (meta.landscape ? 841.89 : 595.28) - 80;

  const mark = logoNode(meta.clientLogo ?? null, LOGO_LETTERHEAD);
  const letterhead: Content | null = mark
    ? { stack: [mark], margin: [0, 0, 0, 30] as [number, number, number, number] }
    : null;

  return {
    pageSize: "A4",
    pageOrientation: meta.landscape ? "landscape" : "portrait",
    // Top clears the running header: 20pt down plus a 26pt mark is 46pt, so 78
    // leaves 32pt of air. Page one has no logo up there — it is in the content
    // instead — so it gets the same margin and more room besides.
    //
    // Bottom holds four things: a rule, the notice (which wraps to two lines
    // on the longest of the three packs), and the generated/page row. That is
    // about 46pt of ink plus a 12pt gap above it, so 64 leaves the last line
    // clear of the paper edge rather than sitting on it.
    pageMargins: [40, 78, 40, 64],
    defaultStyle: { font: "Helvetica", fontSize: 9, color: "#0f172a", lineHeight: 1.25 },
    styles,
    info: {
      title: safe(meta.title),
      author: "Offset Security",
      subject: safe(`${product.name} — ${product.framework}`),
      creator: safe(product.name),
    },
    header: (currentPage: number) => {
      const identity = {
        stack: [
          { text: safe(product.name), style: "small", bold: true, color: NAVY },
          { text: safe(product.framework), style: "small" },
        ],
        alignment: "right" as const,
        margin: [0, 2, 0, 0] as [number, number, number, number],
      };
      // Page one shows the logo at letterhead size in the content, so putting
      // it up here as well would be the same mark twice on one page.
      const running = currentPage === 1 ? null : logoNode(meta.clientLogo ?? null, LOGO_RUNNING);
      return {
        columns: running ? [running, identity] : [{ text: "" }, identity],
        margin: [40, 20, 40, 0],
      };
    },
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        // A hairline, so the notice reads as chrome rather than as the last
        // paragraph of the report.
        {
          canvas: [
            {
              type: "line" as const,
              x1: 0,
              y1: 0,
              x2: contentWidth,
              y2: 0,
              lineWidth: 0.5,
              lineColor: "#e2e8f0",
            },
          ],
          margin: [0, 0, 0, 6] as [number, number, number, number],
        },
        {
          text: safe(
            `\u00a9 ${new Date().getFullYear()} Offset Security` +
            (meta.edition ? `  ·  ${meta.edition}` : "") +
              `  ·  ${meta.disclaimer}` +
              `  ·  For more information contact ${meta.contact}`,
          ),
          style: "footnote",
          margin: [0, 0, 0, 5] as [number, number, number, number],
        },
        {
          columns: [
            {
              // With the customer's logo in the header, this is where the tool
              // is credited — the document belongs to them, not to us.
              text: safe(
                meta.clientLogo
                  ? `Generated ${stamp} by ${meta.generatedBy} · Produced with ${product.name}`
                  : `Generated ${stamp} by ${meta.generatedBy}`,
              ),
              style: "small",
            },
            {
              text: safe(`Page ${currentPage} of ${pageCount}`),
              style: "small",
              alignment: "right" as const,
            },
          ],
        },
      ],
      margin: [40, 12, 40, 0],
    }),
    content: [
      ...(letterhead ? [letterhead] : []),
      { text: safe(meta.title), style: "h1" },
      { text: safe(meta.subtitle), style: "lede" },
      ...body,
    ],
  };
}

/** Renders a definition to a buffer. */
export async function renderPdf(doc: TDocumentDefinitions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = printer.createPdfKitDocument(doc);
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    stream.end();
  });
}

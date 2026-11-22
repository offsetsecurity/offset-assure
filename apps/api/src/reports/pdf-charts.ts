import type { Content } from "pdfmake/interfaces.js";
import { BRAND, LINE, safe } from "./pdf-shared.js";

/** The charts: bars, stacked bars, radar and heat map, drawn with pdfmake's own shapes. */

// ── charts ───────────────────────────────────────────────────────────────────
// Drawn with pdfmake's own shapes, so a report has pictures without a charting
// library or a headless browser on the customer's server.

export const TRACK = "#eef2f8";

/** One labelled bar per row, with the figure at the end. */
export function barChart(items: { label: string; pct: number; note: string }[]): Content {
  if (!items.length) return { text: "Nothing to show yet.", style: "small", margin: [0, 2, 0, 8] };
  const W = 190;
  return {
    table: {
      widths: [170, W + 4, "*"],
      body: items.map((i) => {
        const pct = Math.max(0, Math.min(100, i.pct));
        return [
          { text: safe(i.label), style: "td", margin: [0, 3, 6, 3] as [number, number, number, number] },
          {
            canvas: [
              { type: "rect", x: 0, y: 3, w: W, h: 9, r: 3, color: TRACK },
              ...(pct > 0 ? [{ type: "rect" as const, x: 0, y: 3, w: Math.max(4, (W * pct) / 100), h: 9, r: 3, color: BRAND }] : []),
            ],
            margin: [0, 2, 0, 2] as [number, number, number, number],
          },
          { text: safe(i.note), style: "td", margin: [6, 3, 0, 3] as [number, number, number, number] },
        ];
      }),
    },
    layout: "noBorders",
    margin: [0, 2, 0, 8],
  };
}

/** One bar split into parts, with a key underneath. */
export function stackedBar(parts: { label: string; value: number; color: string }[]): Content {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return { text: "Nothing to show yet.", style: "small", margin: [0, 2, 0, 8] };
  const W = 500;
  let x = 0;
  const shapes = parts
    .filter((p) => p.value > 0)
    .map((p) => {
      const w = (W * p.value) / total;
      const shape = { type: "rect" as const, x, y: 0, w, h: 14, color: p.color };
      x += w;
      return shape;
    });
  return {
    stack: [
      { canvas: shapes },
      // The key, four to a row so long names do not squeeze each other.
      {
        table: {
          widths: ["25%", "25%", "25%", "25%"],
          body: Array.from({ length: Math.ceil(parts.length / 4) }, (_, row) =>
            [0, 1, 2, 3].map((col) => {
              const p = parts[row * 4 + col];
              return p
                ? {
                    columns: [
                      { width: 9, canvas: [{ type: "rect" as const, x: 0, y: 2, w: 8, h: 8, r: 2, color: p.color }] },
                      { width: "*", text: safe(`${p.label}  ${p.value}`), style: "small", margin: [3, 0, 6, 0] as [number, number, number, number] },
                    ],
                  }
                : { text: "" };
            })),
        },
        layout: "noBorders",
        margin: [0, 6, 0, 0] as [number, number, number, number],
      },
    ],
    margin: [0, 4, 0, 10],
  };
}

/**
 * The coverage profile: one spoke per theme, clockwise from the top, the
 * shaded shape reaching out as far as each theme has got. Shapes carry no
 * text in pdfmake, so the spokes are numbered by the table beside it.
 */
export function radar(items: { label: string; pct: number }[]): Content {
  if (items.length < 3) return { text: "", margin: [0, 0, 0, 0] };
  const S = 180;
  const c = S / 2;
  const R = 78;
  const n = items.length;
  const at = (i: number, r: number) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };
  const ring = (f: number) => ({
    type: "polyline" as const, closePath: true, lineWidth: 0.6, lineColor: LINE,
    points: items.map((_, i) => at(i, R * f)),
  });
  const spokes = items.map((_, i) => ({
    type: "line" as const, x1: c, y1: c, x2: at(i, R).x, y2: at(i, R).y, lineWidth: 0.5, lineColor: LINE,
  }));
  const shape = {
    type: "polyline" as const, closePath: true, lineWidth: 1.2, lineColor: BRAND, color: BRAND, fillOpacity: 0.18,
    points: items.map((it, i) => at(i, R * Math.max(0.02, Math.min(1, it.pct / 100)))),
  };
  const dots = items.map((it, i) => {
    const p = at(i, R * Math.max(0.02, Math.min(1, it.pct / 100)));
    return { type: "ellipse" as const, x: p.x, y: p.y, r1: 2, r2: 2, color: BRAND };
  });
  return {
    columns: [
      { width: S + 10, canvas: [ring(0.25), ring(0.5), ring(0.75), ring(1), ...spokes, shape, ...dots] },
      {
        width: "*",
        table: {
          widths: [16, "*", 40],
          body: items.map((it, i) => [
            { text: String(i + 1), style: "small", margin: [0, 2, 0, 2] as [number, number, number, number] },
            { text: safe(it.label), style: "td", margin: [0, 2, 0, 2] as [number, number, number, number] },
            { text: `${Math.round(it.pct)}%`, style: "td", alignment: "right", margin: [0, 2, 0, 2] as [number, number, number, number] },
          ]),
        },
        layout: "noBorders",
        margin: [0, 6, 0, 0] as [number, number, number, number],
      },
    ],
    margin: [0, 2, 0, 4],
  };
}

/** Risks placed by likelihood and impact, coloured by score. */
export function heatMap(counts: number[][]): Content {
  const fill = (l: number, i: number) => (l * i >= 20 ? "#fecaca" : l * i >= 12 ? "#fde68a" : "#dcfce7");
  const cell = (text: string, extra: Record<string, unknown> = {}) => ({
    text, style: "td", alignment: "center" as const, margin: [0, 5, 0, 5] as [number, number, number, number], ...extra,
  });
  const body: unknown[][] = [];
  for (let l = 5; l >= 1; l--) {
    body.push([
      cell(String(l), { style: "small" }),
      ...[1, 2, 3, 4, 5].map((i) => {
        const n = counts[l - 1]?.[i - 1] ?? 0;
        return cell(n ? String(n) : "", { fillColor: fill(l, i), bold: n > 0 });
      }),
    ]);
  }
  body.push([cell(""), ...[1, 2, 3, 4, 5].map((i) => cell(String(i), { style: "small" }))]);
  return {
    columns: [
      { width: 52, text: "Likelihood", style: "small", alignment: "right", margin: [0, 50, 4, 0] as [number, number, number, number] },
      {
        width: 280,
        stack: [
          {
            table: { widths: [16, 40, 40, 40, 40, 40], body: body as never },
            layout: { hLineColor: () => "#ffffff", vLineColor: () => "#ffffff", hLineWidth: () => 1.5, vLineWidth: () => 1.5 },
          },
          { text: "Impact", style: "small", alignment: "center", margin: [16, 2, 0, 0] as [number, number, number, number] },
        ],
      },
      {
        width: "*",
        stack: [
          { text: "Red: score 20 or more. Amber: 12 to 19. Green: below 12.", style: "small", margin: [10, 10, 0, 4] as [number, number, number, number] },
          { text: "Open risks, before treatment (likelihood × impact).", style: "small", margin: [10, 0, 0, 0] as [number, number, number, number] },
        ],
      },
    ],
    margin: [0, 2, 0, 10],
  };
}

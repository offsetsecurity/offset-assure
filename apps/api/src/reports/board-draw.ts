import type { Content } from "pdfmake/interfaces.js";
import { safe } from "./pdf.js";
import type { Tone, M } from "./board-data.js";
import { NAVY, NAVY2, GOLD, INK, MUTED, LINE, TONE, SERIF, WIDTH, x, initials } from "./board-data.js";

/** The drawing helpers of the board paper: chips, gauges, ladders, heat grid and the small shapes. */

// ── drawing helpers ──────────────────────────────────────────────────────────

export const spaced = (text: string, size = 7, color = MUTED): Content =>
  ({ text: safe(text.toUpperCase()), fontSize: size, color, bold: true, characterSpacing: 1.1 });

export const svgW = (svg: string, width: number, height: number, margin?: M): Content =>
  ({ svg, width, height, ...(margin ? { margin } : {}) }) as unknown as Content;

/** A small ▲ or ▼, drawn: the PDF standard fonts have no such glyph. */
export const triangle = (dir: "up" | "down", color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6"><path d="${dir === "up" ? "M3 0 L6 6 L0 6 Z" : "M0 0 L6 0 L3 6 Z"}" fill="${color}"/></svg>`;

/** "▲ 12" in a soft pill. */
export function chip(text: string, tone: Tone, dir?: "up" | "down"): Content {
  const c = TONE[tone];
  return {
    table: { body: [[{
      columns: [
        ...(dir ? [svgW(triangle(dir, c.fg), 5, 5, [0, 1.6, 3, 0])] : []),
        { text: safe(text), fontSize: 7, bold: true, color: c.fg, width: "auto" },
      ],
      columnGap: 0, fillColor: c.bg, margin: [2, 0.5, 2, 0.5] as M,
    }]] },
    layout: "noBorders",
  } as unknown as Content;
}

/** A six-point trend line. */
export function sparkline(values: number[], color: string): Content {
  if (values.length < 2) return { text: "", width: 58 } as unknown as Content;
  const w = 58, h = 18, lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => [1 + (i * (w - 4)) / (values.length - 1), h - 2 - ((v - lo) / span) * (h - 5)] as const);
  const last = pts[pts.length - 1]!;
  return svgW(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<polyline fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" points="${pts.map((p) => p.join(",")).join(" ")}"/>` +
      `<circle cx="${last[0]}" cy="${last[1]}" r="2" fill="${color}"/></svg>`,
    w, h,
  );
}

export function section(no: string, title: string, hint = ""): Content {
  // The rule runs from the title to the hint. Its length is worked out from the
  // text, because a fixed-length line in a "*" column pushes the title onto
  // several lines instead of shrinking.
  const titleW = title.length * 6.9 + 4;
  const hintW = hint ? hint.length * 3.7 + 10 : 0;
  const line = Math.max(20, WIDTH - 22 - titleW - hintW - 12);
  return {
    columns: [
      { text: no, font: SERIF, bold: true, fontSize: 11, color: GOLD, width: 22, margin: [0, 2, 0, 0] },
      { text: safe(title), font: SERIF, bold: true, fontSize: 14, color: NAVY, width: titleW },
      { canvas: [{ type: "line", x1: 6, y1: 9, x2: line, y2: 9, lineWidth: 0.6, lineColor: LINE }], width: line + 6 },
      ...(hint ? [{ text: safe(hint), fontSize: 7.5, color: MUTED, width: "*", alignment: "right", margin: [0, 4, 0, 0] as M }] : []),
    ],
    columnGap: 0,
    margin: [0, 14, 0, 7],
  } as unknown as Content;
}

/** The headline as a half dial, with last paper's figure marked in gold. */
export function gauge(pct: number, prev: number | null): Content {
  const cx = 110, cy = 112, r = 88;
  const at = (p: number): [number, number] => {
    const a = Math.PI * (1 - Math.max(0, Math.min(100, p)) / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const [ex, ey] = at(pct);
  const tick = prev === null ? "" : (() => {
    const a = Math.PI * (1 - prev / 100);
    const [x1, y1] = [cx + (r - 13) * Math.cos(a), cy - (r - 13) * Math.sin(a)];
    const [x2, y2] = [cx + (r + 13) * Math.cos(a), cy - (r + 13) * Math.sin(a)];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-width="3"/>`;
  })();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="122" viewBox="0 0 220 122">` +
    `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#eceff4" stroke-width="16" stroke-linecap="round"/>` +
    (pct > 0 ? `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex} ${ey}" fill="none" stroke="${NAVY2}" stroke-width="16" stroke-linecap="round"/>` : "") +
    tick + `</svg>`;
  return {
    stack: [
      svgW(svg, 165, 92),
      { text: [{ text: String(pct), fontSize: 34 }, { text: "%", fontSize: 16, color: MUTED }], font: SERIF, bold: true, color: NAVY, alignment: "center", margin: [0, -50, 0, 0] },
    ],
    width: 170,
  } as unknown as Content;
}

/** Ten segments, filled to the share. */
export function ladder(pct: number): Content {
  const seg = 10, w = 200, gap = 2.4, sw = (w - gap * (seg - 1)) / seg;
  let rects = "";
  for (let i = 0; i < seg; i++) {
    const fill = Math.max(0, Math.min(1, pct / 10 - i));
    const px = i * (sw + gap);
    rects += `<rect x="${px}" y="0" width="${sw}" height="9" rx="1.5" fill="#eceff4"/>`;
    if (fill > 0) rects += `<rect x="${px}" y="0" width="${sw * fill}" height="9" rx="1.5" fill="${NAVY2}"/>`;
  }
  return svgW(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="9" viewBox="0 0 ${w} 9">${rects}</svg>`, w, 9, [0, 4, 0, 0]);
}

/** Levels 1 to 5 as dots, filled to the level, the target ringed in gold. */
export function dots(level: number, target: number): Content {
  let s = "";
  const filled = Math.round(level);
  for (let i = 1; i <= 5; i++) {
    const cxp = 4 + (i - 1) * 9;
    s += `<circle cx="${cxp}" cy="4.5" r="3.1" fill="${i <= filled ? NAVY2 : "#e3e7ee"}"/>`;
    if (i === target) s += `<circle cx="${cxp}" cy="4.5" r="3.7" fill="none" stroke="${GOLD}" stroke-width="1.3"/>`;
  }
  return svgW(`<svg xmlns="http://www.w3.org/2000/svg" width="46" height="9" viewBox="0 0 46 9">${s}</svg>`, 46, 9, [0, 2, 0, 0]);
}

export const scoreTone = (s: number): { fg: string; bg: string } => (s >= 20 ? TONE.down : s >= 12 ? TONE.warn : TONE.up);
export const scoreBox = (s: number): Content => {
  const t = scoreTone(s);
  return { table: { widths: [18], body: [[{ text: String(s), bold: true, fontSize: 8, color: t.fg, fillColor: t.bg, alignment: "center", margin: [0, 1.5, 0, 1.5] }]] }, layout: "noBorders", width: 20 } as unknown as Content;
};
export const arrow = (w = 14, color = MUTED): Content =>
  svgW(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="6" viewBox="0 0 ${w} 6"><path d="M0 3 H${w - 3}" stroke="${color}" stroke-width="1"/><path d="M${w - 4} 0.5 L${w} 3 L${w - 4} 5.5 Z" fill="${color}"/></svg>`, w, 6, [3, 5, 3, 0]);

export function avatar(name: string): Content {
  return svgW(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${NAVY2}"/>` +
      `<text x="8" y="10.6" text-anchor="middle" font-family="Helvetica" font-weight="bold" font-size="6.6" fill="#ffffff">${x(initials(name))}</text></svg>`,
    16, 16, [0, -1, 5, 0],
  );
}

export const HEAT = ["#eaf3ee", "#f6efd9", "#f3dcbf", "#e8b3a3", "#d98a85"];
export function heatGrid(grid: number[][], label: string): Content {
  const band = (l: number, i: number): number => Math.min(4, Math.floor(((l + 1) * (i + 1) - 1) / 5));
  const rows: Content[][] = [];
  for (let l = 4; l >= 0; l--) {
    rows.push([0, 1, 2, 3, 4].map((i) => {
      const n = grid[l]![i]!;
      const b = band(l, i);
      return { text: n ? String(n) : " ", bold: true, fontSize: 8.5, color: b === 4 ? "#ffffff" : INK, fillColor: HEAT[b], alignment: "center", margin: [0, 3.2, 0, 3.2] } as unknown as Content;
    }));
  }
  return {
    stack: [
      { ...(spaced(label, 7) as object), margin: [0, 0, 0, 4] } as unknown as Content,
      { table: { widths: ["*", "*", "*", "*", "*"], body: rows }, layout: { hLineWidth: () => 1.5, vLineWidth: () => 1.5, hLineColor: () => "#ffffff", vLineColor: () => "#ffffff" } },
    ],
  } as unknown as Content;
}

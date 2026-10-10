import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";

/**
 * The policy templates and the Get ready steps that point at them.
 *
 * A step that says "start from this template" and names one that is not there
 * sends somebody to a dead end at the moment they are most likely to give up.
 * A template that still carries the vendor's watermark, or has no places to
 * put the customer's own name, is a document nobody can hand to an auditor.
 */
const pack = resolve(process.cwd(), "../../packs", readdirSync(resolve(process.cwd(), "../../packs"))[0]!);
const dir = resolve(pack, "templates");
const has = existsSync(resolve(dir, "index.json"));
const maybe = has ? describe : describe.skip;

/** Reads one entry out of a .docx, which is a zip, without a zip library. */
function entry(file: string, name: string): string {
  const b = readFileSync(file);
  let p = b.length - 22;
  while (p > 0 && b.readUInt32LE(p) !== 0x06054b50) p--;
  let o = b.readUInt32LE(p + 16);
  for (let i = 0; i < b.readUInt16LE(p + 10); i++) {
    const nameLen = b.readUInt16LE(o + 28), extra = b.readUInt16LE(o + 30), comment = b.readUInt16LE(o + 32);
    if (b.toString("utf8", o + 46, o + 46 + nameLen) === name) {
      const lh = b.readUInt32LE(o + 42);
      const start = lh + 30 + b.readUInt16LE(lh + 26) + b.readUInt16LE(lh + 28);
      const data = b.subarray(start, start + b.readUInt32LE(o + 20));
      return (b.readUInt16LE(o + 10) === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    o += 46 + nameLen + extra + comment;
  }
  return "";
}

maybe("policy templates", () => {
  const index = has ? (JSON.parse(readFileSync(resolve(dir, "index.json"), "utf8")) as { documents: { file: string; title: string }[] }) : { documents: [] };

  it("lists only files that exist, and every file is listed", () => {
    for (const d of index.documents) expect(existsSync(resolve(dir, d.file)), d.file).toBe(true);
    const listed = new Set(index.documents.map((d) => d.file));
    const strays = readdirSync(dir).filter((f) => /\.(docx|xlsx)$/.test(f) && !listed.has(f));
    expect(strays).toEqual([]);
  });

  it("carries no vendor watermark, and leaves a place for the customer's name", () => {
    const docs = index.documents.filter((d) => d.file.endsWith(".docx"));
    expect(docs.length).toBeGreaterThan(0);
    for (const d of docs) {
      const f = resolve(dir, d.file);
      const header = entry(f, "word/header1.xml");
      expect(header, `${d.file} watermark`).not.toMatch(/OFFSET SECURITY/i);
      expect(entry(f, "word/document.xml"), `${d.file} says whose it is`).toMatch(/&lt;[^&]{2,60}&gt;/);
    }
  });

  it("is named by every Get ready step that points at one", () => {
    const j = resolve(pack, "journey.json");
    if (!existsSync(j)) return;
    const listed = new Set(index.documents.map((d) => d.file));
    const steps = (JSON.parse(readFileSync(j, "utf8")) as { stages: { tasks: { id: string; template?: string }[] }[] }).stages.flatMap((s) => s.tasks);
    for (const t of steps) if (t.template) expect(listed.has(t.template), `${t.id} -> ${t.template}`).toBe(true);
  });
});


/** The brand colours and the text clean-up every report page uses. */

export const BRAND = "#2457D6";
export const NAVY = "#0B1220";
export const MUTED = "#64748b";
export const LINE = "#e6eaf2";

/**
 * The standard fonts cannot encode outside WinAnsi. Rather than crash on a
 * name with an unusual character, or emit the wrong glyph silently, map the
 * punctuation we actually generate and transliterate the rest to a form a
 * reader can still act on.
 */
export function safe(value: unknown): string {
  const text = value == null ? "" : String(value);
  return text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[   ]/g, " ")
    .normalize("NFKD")
    // Anything still outside Latin-1 becomes a visible marker, never a wrong
    // glyph and never a dropped character: a report that quietly loses text is
    // worse than one that admits it.
    // eslint-disable-next-line no-control-regex -- keeps tab, newline and carriage return, drops the other control characters
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}


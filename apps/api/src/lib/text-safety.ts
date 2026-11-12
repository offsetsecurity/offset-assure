/**
 * Text that cannot be meant.
 *
 * What people type is stored as typed, shown as text and quoted in exports,
 * so none of these is dangerous by itself. They are refused anyway, because a
 * name with a line break in it, or a title that reads backwards on the screen,
 * is never what the person meant, and later code (a mail header, a log line, a
 * spreadsheet cell) is safer for not having to wonder.
 *
 *  - Any field: the null character and other control characters (except tab,
 *    line feed and carriage return; and except U+0085, which old text pasted
 *    from other systems carries), and the two characters that FORCE text to
 *    run left to right or right to left (U+202D and U+202E). Those are the ones
 *    used to make "gnp.exe" look like "exe.png".
 *  - NOT refused: the marks, embeddings and isolates that Arabic and Hebrew
 *    text carries when pasted from Word, Excel or a web page (U+200E, U+200F,
 *    U+061C, U+202A to U+202C, U+2066 to U+2069). Refusing those would turn
 *    away ordinary text people cannot even see.
 *  - A name or title: no line breaks either, since it is one line.
 *  - A body too big or too deep to check is refused, never waved through.
 */

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F]/;
const FORCED_DIRECTION = /[\u202D\u202E]/;
const LINE_BREAK = /[\r\n\u2028\u2029]/;

/** Fields that hold one line. Anything else may hold several. */
const ONE_LINE = new Set([
  "name", "title", "username", "email", "owner", "topic", "person", "subject", "supplier", "vendor", "label",
  "ref", "control_ref", "approver", "responsible", "department", "location", "assignee", "url", "address",
  "phone", "role", "position", "contact", "organisation", "organization", "company", "version",
]);

/**
 * Never looked at. A password may hold anything its owner typed, and refusing
 * one at sign-in would lock out a person whose password has such a character.
 */
const LEFT_ALONE = new Set(["password", "newPassword", "currentPassword", "secret", "confirm"]);

const MAX_DEPTH = 12;
const MAX_VISITS = 50_000;

const code = (c: string): string => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;

/** A plain sentence saying what is wrong, or null when the body is fine. */
export function findControlCharacters(body: unknown): string | null {
  let visits = 0;
  const walk = (value: unknown, key: string, depth: number): string | null => {
    if (++visits > MAX_VISITS || depth > MAX_DEPTH) return "This request is too large or too deeply nested to save.";
    if (typeof value === "string") {
      if (LEFT_ALONE.has(key)) return null;
      const bad = CONTROL.exec(value) ?? FORCED_DIRECTION.exec(value);
      if (bad) return `"${key || "text"}" contains the character ${code(bad[0])}, which cannot be saved. Remove it and try again.`;
      if (ONE_LINE.has(key) && LINE_BREAK.test(value)) return `"${key}" must be on one line.`;
      return null;
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        const found = walk(v, key, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        const found = walk(v, k, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(body, "", 0);
}

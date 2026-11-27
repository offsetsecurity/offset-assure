import { h, Fragment, type VNode } from "preact";
import htm from "htm";

type Template = (strings: TemplateStringsArray, ...values: unknown[]) => VNode;

/**
 * Tagged-template markup, bound to Preact's `h`.
 *
 * The single import every component needs. See
 * docs/dev/adr/0003-preact-and-htm-for-the-front-end.md for why the templates
 * look like the ones in the standalone HTML tools.
 *
 * The wrapper exists for one reason: htm compiles `<>…</>` to a call with an
 * empty tag name, which Preact would hand to `createElementNS` and the browser
 * would reject. Mapping a missing tag to `Fragment` makes the shorthand work.
 *
 * htm types its result as `VNode | VNode[]`, because a template is allowed
 * several roots. Narrowing it to `VNode` here keeps every component signature
 * simple, and stays true because multi-root markup goes in a fragment rather
 * than being returned loose.
 */
const createElement = (
  type: unknown,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): VNode =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h((type || Fragment) as any, props as any, ...(children as any[]));

export const html = htm.bind(createElement) as unknown as Template;

/**
 * Lets a row or cell that opens on a click also open from the keyboard: it
 * joins the Tab order, and Enter or Space opens it. Keys pressed on a field or
 * button inside the row are left to that field. Spread it on the element:
 * `<tr onClick=${go} ...${opensOnKey(go)}>`. Without it a record could be
 * opened only with a mouse (WCAG 2.1.1).
 */
export function opensOnKey(go: (() => void) | undefined): Record<string, unknown> {
  if (!go) return {};
  return {
    tabIndex: 0,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    },
  };
}

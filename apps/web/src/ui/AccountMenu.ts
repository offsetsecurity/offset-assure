import { useEffect, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import { html } from "./html.js";

/**
 * The top bar's right side: Help, and the person's own menu.
 *
 * Change password and Sign out sat as buttons in the top bar and the row grew
 * with every feature. One chip with the person's initials, name and role
 * opens a small menu instead, the way most products
 * do it now. Jump to a screen (Ctrl K) lives here too.
 */

const svg = (d: string): VNode =>
  html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${d} /></svg>`;

const ICON = {
  key: svg("M15 7a4 4 0 1 1-3.9 4.9L4 19v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7Zm1.5 2.5h.01"),
  search: svg("M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm9 2-4-4"),
  out: svg("M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4"),
  help: svg("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"),
  chevron: svg("M6 9l6 6 6-6"),
};

const initials = (name: string): string =>
  name.trim().split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";

export function AccountMenu({ name, username, role, onChangePassword, onJump, onSignOut, before }: {
  name: string;
  username: string;
  role: string;
  onChangePassword: () => void;
  /** Shown before Help. */
  before?: unknown;
  onJump: () => void;
  onSignOut: () => void;
}): VNode {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  // Closes on a click outside or Escape, like any menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (action: () => void) => (): void => {
    setOpen(false);
    action();
  };

  return html`<div class="acct">
    ${before ?? null}
    <a class="acct-help" href="#/help" title="Help" aria-label="Help">${ICON.help}</a>
    <div class="acct-wrap" ref=${box}>
      <button type="button" class="acct-chip" aria-haspopup="menu" aria-expanded=${open} onClick=${() => setOpen(!open)}>
        <span class="acct-av" aria-hidden="true">${initials(name || username)}</span>
        <span class="acct-who"><b>${name || username}</b><span>${role}</span></span>
        ${ICON.chevron}
      </button>
      ${open
        ? html`<div class="acct-menu" role="menu">
            <div class="acct-head"><b>${name || username}</b><span>${username} · ${role}</span></div>
            <button type="button" role="menuitem" onClick=${pick(onChangePassword)}>${ICON.key}<span>Change password</span></button>
            <button type="button" role="menuitem" onClick=${pick(onJump)}>${ICON.search}<span>Jump to a screen</span><kbd>Ctrl K</kbd></button>
            <div class="acct-sep" role="separator"></div>
            <button type="button" role="menuitem" onClick=${pick(onSignOut)}>${ICON.out}<span>Sign out</span></button>
          </div>`
        : null}
    </div>
  </div>`;
}

/**
 * Jump to a screen: type a few letters of its name, Enter to go. Only the
 * screens this person can open are listed.
 */
export function JumpTo({ screens, onClose }: { screens: { route: string; label: string }[]; onClose: () => void }): VNode {
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => input.current?.focus(), []);

  const words = q.trim().toLowerCase();
  const hits = screens.filter((s) => !words || s.label.toLowerCase().includes(words));
  const go = (route: string): void => {
    window.location.hash = `#/${route}`;
    onClose();
  };

  return html`<div class="jump-back" onMouseDown=${(e: MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="jump" role="dialog" aria-label="Jump to a screen">
      <div class="jump-in">${ICON.search}
        <input ref=${input} value=${q} placeholder="Jump to a screen…" aria-label="Screen name"
               onInput=${(e: Event) => { setQ((e.target as HTMLInputElement).value); setAt(0); }}
               onKeyDown=${(e: KeyboardEvent) => {
                 if (e.key === "Escape") onClose();
                 else if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(hits.length - 1, i + 1)); }
                 else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); }
                 else if (e.key === "Enter" && hits[at]) go(hits[at]!.route);
               }} />
        <kbd>Esc</kbd>
      </div>
      <ul class="jump-list" role="listbox">
        ${hits.length === 0
          ? html`<li class="jump-none">No screen called that.</li>`
          : hits.map((s, i) => html`<li key=${s.route} role="option" aria-selected=${i === at}
              class=${i === at ? "on" : ""} onMouseEnter=${() => setAt(i)} onClick=${() => go(s.route)}>${s.label}</li>`)}
      </ul>
    </div>
  </div>`;
}

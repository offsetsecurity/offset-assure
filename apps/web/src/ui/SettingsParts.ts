import type { VNode } from "preact";
import { html } from "./html.js";

/**
 * The pieces every Settings section is made of, so the sections look and
 * behave the same: a card with a header, an optional switch at the top that
 * acts at once, rows of label-and-control, and a bar that appears only while
 * there is something unsaved.
 */

export type Tone = "on" | "off" | "warn" | "bad";

/** A status in a word, with a dot. Never colour alone. */
export const Pill = ({ tone, children }: { tone: Tone; children: unknown }): VNode =>
  html`<span class=${`st-pill ${tone}`}><i aria-hidden="true"></i>${children}</span>`;

export function SectionCard({ title, intro, children, aside }: {
  title: string;
  intro?: unknown;
  children?: unknown;
  aside?: unknown;
}): VNode {
  return html`<section class="card set-card">
    <header class="set-card-h">
      <div><h2>${title}</h2>${intro ? html`<p>${intro}</p>` : null}</div>
      ${aside ?? null}
    </header>
    ${children}
  </section>`;
}

/**
 * The big on/off for a section. It acts at once, on what is saved; the
 * section decides what that means and reports any refusal underneath.
 */
export function HeroSwitch({ on, label, help, busy, error, onToggle }: {
  on: boolean;
  label: string;
  help: unknown;
  busy?: boolean;
  error?: string;
  onToggle: () => void;
}): VNode {
  return html`<div class="set-hero">
    <button type="button" role="switch" aria-checked=${on} aria-label=${label}
            class=${`set-switch${on ? " on" : ""}`} disabled=${busy} onClick=${onToggle}>
      <span aria-hidden="true"></span>
    </button>
    <div>
      <div class="set-hero-label">${label}</div>
      <div class="set-help">${help}</div>
      ${error ? html`<div class="err" role="alert" style="margin:6px 0 0">${error}</div>` : null}
    </div>
  </div>`;
}

export const Row = ({ label, help, children }: { label: string; help?: unknown; children?: unknown }): VNode =>
  html`<div class="set-row">
    <div class="set-row-l"><b>${label}</b>${help ? html`<span>${help}</span>` : null}</div>
    <div class="set-row-c">${children}</div>
  </div>`;

/** Appears only while the section differs from what is saved. */
export function SaveBar({ what, busy, onSave, onDiscard }: {
  what: string;
  busy?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}): VNode {
  return html`<div class="set-savebar" role="region" aria-label="Unsaved changes">
    <span>You have unsaved changes to ${what}.</span>
    <span class="set-inline">
      <button type="button" class="btn ghost" disabled=${busy} onClick=${onDiscard}>Discard</button>
      <button type="button" class="btn primary" disabled=${busy} onClick=${onSave}>${busy ? "Saving…" : "Save changes"}</button>
    </span>
  </div>`;
}

export type Note = { kind: "ok" | "err"; text: string } | null;

export const NoteLine = ({ note }: { note: Note }): VNode | null =>
  note ? html`<div class=${note.kind === "ok" ? "ok-note set-note" : "err set-note"} role=${note.kind === "err" ? "alert" : "status"}>${note.text}</div>` : null;

/** Same contents, compared as data rather than by identity. */
export const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

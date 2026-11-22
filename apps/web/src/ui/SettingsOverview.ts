import { useEffect, useState } from "preact/hooks";
import type { VNode } from "preact";
import { html } from "./html.js";
import { demo, settingsOverview, updates, type SettingsOverview as Data, type UpdateCheck } from "../persistence/apiClient.js";

/**
 * Settings → Overview: one box for each section below, at the top of the page.
 *
 * Each box says in a word whether the section is on, one sentence about what
 * it does, and a link that goes down the page to it. Nothing here changes
 * anything or contacts anything outside this server.
 */

type Tone = "on" | "off" | "warn" | "bad";

const DAY = 86_400_000;
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;
const bytes = (n: number): string =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;
const duration = (s: number): string => {
  const days = Math.floor(s / 86_400);
  if (days >= 1) return plural(days, "day");
  const hours = Math.floor(s / 3600);
  if (hours >= 1) return plural(hours, "hour");
  return plural(Math.max(1, Math.floor(s / 60)), "minute");
};
const when = (iso: string | null): string => {
  if (!iso) return "Never";
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  if (d.toDateString() === new Date(Date.now() - DAY).toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
const INSTALL: Record<string, string> = { docker: "Docker", windows: "Windows installer", linux: "Linux", none: "Run by hand" };
const ROLE_ORDER: [string, string][] = [["admin", "admin"], ["contributor", "contributor"], ["auditor", "auditor"], ["readonly", "read-only user"]];

/** The section a box leads to, found by its heading, so no section needs a number. */
function goTo(heading: string): void {
  const stack = [...document.querySelectorAll<HTMLElement>(".settings-stack > *")];
  const hit = stack.find((el) => (el.querySelector("h2, h3")?.textContent ?? "").trim().startsWith(heading));
  hit?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Box({ title, pill, text, link, to, alert }: {
  title: string;
  pill: [Tone, string];
  text: string;
  link: string;
  to: string;
  alert?: boolean;
}): VNode {
  return html`<a class=${`ov-box${alert ? " alert" : ""}`} href="#/settings"
      onClick=${(e: Event) => { e.preventDefault(); goTo(to); }}>
    <span class="ov-box-h"><b>${title}</b><span class=${`st-pill ${pill[0]}`}><i aria-hidden="true"></i>${pill[1]}</span></span>
    <span class="ov-box-t">${text}</span>
    <span class="ov-box-a">${link} →</span>
  </a>`;
}

export function SettingsOverview({ hasExample }: { hasExample: boolean }): VNode {
  const [data, setData] = useState<Data | null>(null);
  const [check, setCheck] = useState<UpdateCheck | null>(null);
  const [example, setExample] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    settingsOverview.get().then(setData).catch((e: Error) => setError(e.message));
    updates.get().then((u) => setCheck(u.lastCheck)).catch(() => {});
    if (hasExample) demo.state().then((d) => setExample(d.rows)).catch(() => {});
  }, []);

  if (!data) return html`<section class="card pad muted">${error || "Loading…"}</section>`;

  const version = data.server.version;
  const updateReady = Boolean(check?.newer && check.current === version);

  const sv = data.server;
  const encrypted = location.protocol === "https:";
  const people = ROLE_ORDER.filter(([r]) => sv.people[r]).map(([r, w]) => plural(sv.people[r]!, w));
  const totalPeople = Object.values(sv.people).reduce((a, b) => a + b, 0);
  const facts: [string, string, string, ("ok" | "bad")?][] = [
    ["Version", version, updateReady ? "A newer version is ready" : "Checks only when you press the button"],
    ["Installed with", INSTALL[sv.installKind] ?? sv.installKind, "Updates from Settings → Updates"],
    ["Address", location.origin, encrypted ? "Encrypted (HTTPS)" : "Plain HTTP, not encrypted", encrypted ? "ok" : "bad"],
    ["Time zone", sv.timeZone, "Due dates and “today” follow this"],
    ["Last backup", sv.backups.last ? when(sv.backups.last.at) : "None yet",
      sv.backups.enabled ? `Nightly backups on. ${sv.backups.count} kept` : "Nightly backups are off",
      sv.backups.enabled && sv.backups.last ? "ok" : "bad"],
    ["Database", bytes(sv.databaseBytes), `Evidence files: ${bytes(sv.evidence.bytes)}${sv.evidence.partial ? " or more" : ""}`],
    ["People", plural(totalPeople, "account"), people.join(", ") || "None"],
    ["Running for", duration(sv.uptimeSeconds), "Since the last restart"],
  ];
  async function copy(): Promise<void> {
    const text = ["Offset Assure: about this server", ...facts.map(([k, v, note]) => `${k}: ${v} (${note})`)].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied.");
    } catch {
      setCopied("Your browser would not copy it.");
    }
  }

  return html`
    <section class="card ov-card" aria-label="Overview">
      <h2>Overview</h2>
      <p class="ov-sub">Everything in Settings at a glance. Click a box to change it.</p>
      <div class="ov-grid">
        <${Box} title="Updates" to="Updates"
          pill=${updateReady ? ["warn", "Update ready"] : ["off", `v${version}`]}
          text=${`You have version ${version}. Checking for a newer one happens only when you press the button.`}
          link=${updateReady ? "Update now" : "Check for updates"} />
        <${Box} title="HTTPS" to="HTTPS" alert=${!data.https.on}
          pill=${data.https.on ? ["on", "On"] : ["bad", "Off"]}
          text=${data.https.on
            ? "Connections to this server are encrypted."
            : "Browsers show “Not secure”, and passwords cross the network unprotected. Ask your IT team for a certificate."}
          link=${data.https.on ? "Manage" : "Add a certificate"} />
        <${Box} title="Outgoing email" to="Outgoing email"
          pill=${data.email.enabled ? ["on", "On"] : ["off", "Off"]}
          text="Optional. Without it there are no reminders, invitations or digests."
          link=${data.email.enabled ? "Manage" : "Set up email"} />
        <${Box} title="Daily digest" to="Daily digest"
          pill=${data.digest.enabled ? ["on", "On"] : ["off", "Off"]}
          text="One email a day with what needs attention. Needs outgoing email first."
          link=${data.digest.enabled ? "Manage" : "Set up"} />
        ${hasExample
          ? html`<${Box} title="Example data" to="Example data"
              pill=${example ? ["on", "Loaded"] : ["off", "None"]}
              text="Load a small made-up company to see how a filled-in programme looks."
              link=${example ? "Manage" : "Load"} />`
          : null}
      </div>
    </section>

    <section class="card ov-card ov-about">
      <header class="ov-about-h">
        <div><h2>About this server</h2><p class="ov-sub">The facts an auditor or your IT team asks for. Nothing here is sent anywhere.</p></div>
        <span class="ov-copy">${copied ? html`<span class="muted">${copied}</span>` : null}<button type="button" class="btn" onClick=${copy}>Copy details</button></span>
      </header>
      <dl class="ov-facts">
        ${facts.map(([k, v, note, tone]) => html`<div class="ov-fact" key=${k}>
          <dt>${k}</dt><dd><b>${v}</b><span class=${tone ?? ""}>${note}</span></dd>
        </div>`)}
      </dl>
    </section>`;
}

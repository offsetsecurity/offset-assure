import { useEffect, useState } from "preact/hooks";
import type { VNode } from "preact";
import { html } from "./html.js";
import { demo, settingsOverview, updates, type SettingsEvent, type SettingsOverview as Data, type UpdateCheck } from "../persistence/apiClient.js";
import { Pill, type Tone } from "./SettingsParts.js";

/**
 * Settings → Overview.
 *
 * One box per section: its state in a word, the details that matter, and
 * what changed lately (from the audit trail), with a link to change it. Under
 * them, the facts about this server an auditor or an IT team asks for, with
 * a button to copy them all as plain text.
 *
 * Nothing here contacts anything outside this server.
 */

const DAY = 86_400_000;

const shortDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const when = (iso: string | null): string => {
  if (!iso) return "Never";
  const t = Date.parse(iso);
  const today = new Date();
  const d = new Date(t);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === new Date(Date.now() - DAY).toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
const bytes = (n: number): string =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;
const duration = (s: number): string => {
  const days = Math.floor(s / 86_400);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(s / 3600);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const minutes = Math.max(1, Math.floor(s / 60));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Audit action names as a person would say them. */
const ACTION: Record<string, string> = {
  "Update requested": "Update started",
};
const event = (e: SettingsEvent): string => `${ACTION[e.action] ?? e.action} ${shortDay(e.at)} by ${e.actor}`;

const INSTALL: Record<string, string> = { docker: "Docker", windows: "Windows installer", linux: "Linux", none: "Run by hand" };
const ROLE_ORDER: [string, string][] = [["admin", "admin"], ["contributor", "contributor"], ["auditor", "auditor"], ["readonly", "read-only user"]];

function Tile({ id, title, pill, alert, rows, history, empty, note, link }: {
  id: string;
  title: string;
  pill: [Tone, string];
  alert?: boolean;
  rows: [string, unknown, boolean?][];
  history: SettingsEvent[];
  empty: string;
  note: string;
  link: string;
}): VNode {
  return html`<a class=${`set-btile${alert ? " alert" : ""}`} href=${`#/settings/${id}`}>
    <span class="set-tile-h"><b>${title}</b><${Pill} tone=${pill[0]}>${pill[1]}<//></span>
    <span class="set-kv">
      ${rows.map(([k, v, bad]) => html`<span>${k}</span><b class=${bad ? "bad" : ""}>${v}</b>`)}
    </span>
    <span class="set-hist">
      <span class="set-hist-e">${history.length ? event(history[0]!) : empty}</span>
      <span class="set-tile-a" title=${note}>${link} →</span>
    </span>
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

  if (!data) return html`<div class="card pad muted">${error || "Loading…"}</div>`;

  const s = data.server;
  const address = location.origin;
  const encrypted = location.protocol === "https:";
  const updateReady = Boolean(check?.newer && check.current === s.version);
  const people = ROLE_ORDER.filter(([r]) => s.people[r]).map(([r, w]) => plural(s.people[r]!, w));
  const totalPeople = Object.values(s.people).reduce((a, b) => a + b, 0);

  const facts: [string, string, string, ("ok" | "bad")?][] = [
    ["Version", s.version, updateReady ? "A newer version is ready" : "Checks only when you press the button"],
    ["Installed with", INSTALL[s.installKind] ?? s.installKind, "Updates from Settings → Updates"],
    ["Address", address, encrypted ? "Encrypted (HTTPS)" : "Plain HTTP, not encrypted", encrypted ? "ok" : "bad"],
    ["Time zone", s.timeZone, "Due dates and \"today\" follow this"],
    ["Last backup", s.backups.last ? when(s.backups.last.at) : "None yet",
      s.backups.enabled ? `Nightly backups on. ${s.backups.count} kept` : "Nightly backups are off",
      s.backups.enabled && s.backups.last ? "ok" : "bad"],
    ["Database", bytes(s.databaseBytes), `Evidence files: ${bytes(s.evidence.bytes)}${s.evidence.partial ? " or more" : ""}`],
    ["People", plural(totalPeople, "account"), people.join(", ") || "None"],
    ["Running for", duration(s.uptimeSeconds), "Since the last restart"],
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
    <section class="card set-card set-ov" aria-label="Overview">
      <div class="set-btiles">
        <${Tile} id="updates" title="Updates"
          pill=${updateReady ? ["warn", "Update ready"] : ["off", `v${s.version}`]}
          rows=${[["Version", s.version], ["Installed with", INSTALL[s.installKind] ?? s.installKind], ["Last check", check ? when(check.checkedAt) : "Never"]]}
          history=${data.history["updates"] ?? []} empty="No updates started from here yet"
          note="Checks only when you press the button." link=${updateReady ? "Update now" : "Check for updates"} />
        <${Tile} id="https" title="HTTPS" alert=${!data.https.on}
          pill=${data.https.on ? ["on", "On"] : ["bad", "Off"]}
          rows=${[["Address", address], ["Certificate", data.https.on ? (data.https.source === "uploaded" ? "Uploaded here" : "From the settings file") : "None"],
            ...(data.https.on ? [] : [["Risk", "Passwords cross the network unprotected", true]])] as [string, unknown, boolean?][]}
          history=${data.history["https"] ?? []} empty="No certificate has been added here"
          note=${data.https.on ? "Connections are encrypted." : "Ask your IT team for a certificate."}
          link=${data.https.on ? "Manage" : "Add a certificate"} />
        <${Tile} id="email" title="Outgoing email"
          pill=${data.email.enabled ? ["on", "On"] : ["off", "Off"]}
          rows=${[["Provider", data.email.provider ?? "Not set"], ["Sender", data.email.sender ?? "Not set"],
            ["Last test", data.email.lastTest ? `${when(data.email.lastTest.at)}, ${data.email.lastTest.action === "Email test sent" ? "worked" : "failed"}` : "Never",
              data.email.lastTest?.action === "Email test failed"]]}
          history=${data.history["email"] ?? []} empty="Never set up"
          note="Needed for reminders and invitations." link=${data.email.enabled ? "Manage" : "Set up email"} />
        <${Tile} id="digest" title="Daily digest"
          pill=${data.digest.enabled ? ["on", "On"] : ["off", "Off"]}
          rows=${[["Sent to", data.digest.recipients ? plural(data.digest.recipients, "address") : "Every administrator"],
            ["Looks ahead", `${data.digest.horizonDays} days`], ["Last sent", when(data.digest.lastSent)]]}
          history=${data.history["digest"] ?? []} empty="Never turned on"
          note="Needs outgoing email first." link=${data.digest.enabled ? "Manage" : "Set up"} />
        ${hasExample
          ? html`<${Tile} id="example" title="Example data"
              pill=${example ? ["on", "Loaded"] : ["off", "None"]}
              rows=${[["Loaded", example ? "Yes" : "No"], ["Rows", String(example ?? 0)]]}
              history=${data.history["example"] ?? []} empty="Never loaded"
              note="A made-up company, to see a filled-in programme." link=${example ? "Manage" : "Load"} />`
          : null}
      </div>
    </section>

    <section class="card set-card set-about">
      <header class="set-card-h compact">
        <div><h2>About this server</h2><p>The facts an auditor or your IT team asks for. Nothing here is sent anywhere.</p></div>
        <span class="set-inline">${copied ? html`<span class="set-help">${copied}</span>` : null}<button type="button" class="btn" onClick=${copy}>Copy details</button></span>
      </header>
      <dl class="set-facts">
        ${facts.map(([k, v, note, tone]) => html`<div class="set-fact" key=${k}>
          <dt>${k}</dt><dd><b>${v}</b><span class=${tone ?? ""}>${note}</span></dd>
        </div>`)}
      </dl>
    </section>`;
}

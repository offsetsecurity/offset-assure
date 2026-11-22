import { useEffect, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import { html } from "./html.js";
import { Updates } from "./Updates.js";
import { Certificate } from "./Certificate.js";
import { ExampleData } from "./ExampleData.js";
import { EmailSection, DigestSection } from "./SettingsMail.js";
import { Pill, type Tone } from "./SettingsParts.js";
import { SettingsOverview } from "./SettingsOverview.js";
import { certificate, demo, digest, smtp, updates, type SessionUser } from "../persistence/apiClient.js";

/**
 * Settings, for administrators.
 *
 * A bar of sections across the top, each with its status in a word, and an Overview that
 * opens first so what is on and off is plain at a glance. Each section has
 * its own address (#/settings/ai), so links and Back work.
 *
 * Nothing here contacts anything outside this server by itself. Updates in
 * particular shows the version, and "Update ready" only from a check
 * somebody pressed; the Updates section's button is still the only thing
 * that asks the release server.
 */

type SectionId = "overview" | "updates" | "https" | "email" | "digest" | "example";

interface Status {
  version?: string;
  updateReady?: boolean;
  https?: boolean;
  email?: boolean;
  digest?: boolean;
  ai?: boolean;
  aiRoles?: number;
  example?: boolean;
}

const sectionFromHash = (): SectionId => {
  const part = window.location.hash.replace(/^#\/?/, "").split("/")[1] ?? "";
  return (["updates", "https", "email", "digest", "example"] as const).find((s) => s === part) ?? "overview";
};

const onOff = (v: boolean | undefined, onWord = "On", offWord = "Off"): [Tone, string] | null =>
  v === undefined ? null : v ? ["on", onWord] : ["off", offWord];

export function Settings({ me, features }: {
  me: SessionUser;
  /** The pack's feature flags, for the sections not every product has. */
  features: Record<string, boolean>;
}): VNode {
  const [section, setSection] = useState<SectionId>(sectionFromHash);
  const [status, setStatus] = useState<Status>({});
  const dirty = useRef(false);
  const shownHash = useRef(window.location.hash);
  const hasExample = Boolean(features["demoData"]);

  async function loadStatus(): Promise<void> {
    const next: Status = {};
    await Promise.all([
      updates.get().then((u) => {
        next.version = u.current;
        next.updateReady = Boolean(u.lastCheck?.newer && u.lastCheck.current === u.current);
      }).catch(() => {}),
      certificate.get().then((c) => { next.https = c.serving === "https"; }).catch(() => {}),
      smtp.get().then((s) => { next.email = s.enabled; }).catch(() => {}),
      digest.get().then((d) => { next.digest = d.enabled; }).catch(() => {}),
      hasExample ? demo.state().then((d) => { next.example = d.rows > 0; }).catch(() => {}) : Promise.resolve(),
    ]);
    setStatus(next);
  }
  // Again on every section change: Updates, HTTPS and Example data change
  // things from their own buttons.
  useEffect(() => { void loadStatus(); }, [section]);

  // Unsaved changes are not lost by a click elsewhere: moving to another
  // section or screen asks first, and closing the tab gets the browser's own
  // warning.
  useEffect(() => {
    const onHash = (): void => {
      if (window.location.hash === shownHash.current) return;
      if (dirty.current && !confirm("You have unsaved changes. Discard them?")) {
        history.replaceState(null, "", shownHash.current);
        return;
      }
      dirty.current = false;
      shownHash.current = window.location.hash;
      setSection(sectionFromHash());
    };
    const onUnload = (e: BeforeUnloadEvent): void => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const pills: Record<Exclude<SectionId, "overview">, [Tone, string] | null> = {
    updates: status.version ? (status.updateReady ? ["warn", "Update ready"] : ["off", `v${status.version}`]) : null,
    https: status.https === undefined ? null : status.https ? ["on", "On"] : ["bad", "Off"],
    email: onOff(status.email),
    digest: onOff(status.digest),
    example: onOff(status.example, "Loaded", "None"),
  };

  const item = (id: SectionId, label: string): VNode => {
    const pill = id === "overview" ? null : pills[id];
    return html`<a href=${id === "overview" ? "#/settings" : `#/settings/${id}`} key=${id}
                   class=${section === id ? "on" : ""} aria-current=${section === id ? "page" : undefined}>
      <span>${label}</span>${pill ? html`<${Pill} tone=${pill[0]}>${pill[1]}<//>` : null}
    </a>`;
  };

  const sectionProps = { onDirty: (d: boolean) => { dirty.current = d; }, onChanged: () => void loadStatus() };

  const overview = html`<${SettingsOverview} hasExample=${hasExample} />`;

  return html`
    <div class=${`set-layout set-page${section === "overview" ? " set-fill" : ""}`}>
      <nav class="set-menu card" aria-label="Settings sections">
        ${item("overview", "Overview")}
        <span class="set-sep" aria-hidden="true"></span>
        ${item("updates", "Updates")}
        <span class="set-sep" aria-hidden="true"></span>
        ${item("https", "HTTPS")}
        <span class="set-sep" aria-hidden="true"></span>
        ${item("email", "Outgoing email")}
        <span class="set-sep" aria-hidden="true"></span>
        ${item("digest", "Daily digest")}
        ${hasExample ? html`<span class="set-sep" aria-hidden="true"></span>${item("example", "Example data")}` : null}
      </nav>
      <div class="set-body">
        ${section === "overview" ? overview
          : section === "updates" ? html`<${Updates} />`
          : section === "https" ? html`<${Certificate} />`
          : section === "email" ? html`<${EmailSection} me=${me} ...${sectionProps} />`
          : section === "digest" ? html`<${DigestSection} ...${sectionProps} />`
          : hasExample ? html`<${ExampleData} />` : overview}
      </div>
    </div>`;
}

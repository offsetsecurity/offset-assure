import { useEffect, useState } from "preact/hooks";
import type { VNode } from "preact";
import { html } from "./html.js";
import {
  smtp, digest, MAIL_PROVIDERS,
  type SmtpSettings, type MailProvider, type DigestSettings, type DigestPreview,
} from "../persistence/apiClient.js";
import { HeroSwitch, NoteLine, Row, SaveBar, SectionCard, same, type Note } from "./SettingsParts.js";

/**
 * Settings → Outgoing email and Settings → Daily digest.
 *
 * Built around one fact: **an install with no mail server is normal and must
 * keep working.** Nothing here is required, nothing nags, and the product does
 * not behave differently until somebody turns email on.
 *
 * Administrators only, and not merely hidden from everyone else: the server
 * refuses these routes for any other role.
 */

/** Everything the form edits. `hasPassword` is read-only, from the server. */
type Draft = Omit<SmtpSettings, "hasPassword">;

const EMPTY: Draft = {
  provider: "custom",
  enabled: false,
  host: "",
  port: 587,
  secure: false,
  username: "",
  fromAddress: "",
  fromName: "",
  rejectUnauthorized: true,
};

interface Section {
  onDirty?: (dirty: boolean) => void;
  onChanged?: () => void;
}

export function EmailSection({ me, onDirty, onChanged }: Section & { me: { email?: string | null } }): VNode {
  const [saved, setSaved] = useState<Draft>(EMPTY);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [hasPassword, setHasPassword] = useState(false);
  /**
   * Empty means "leave the stored password alone".
   *
   * The server never sends the password back, so the field starts blank on
   * every load. Without this rule, saving a change to the port would clear the
   * password every time.
   */
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [switchError, setSwitchError] = useState("");
  const [testTo, setTestTo] = useState(me.email ?? "");
  const [testing, setTesting] = useState(false);
  const [testNote, setTestNote] = useState<Note>(null);

  // Functional updates: a browser autofilling four boxes at once would
  // otherwise leave a stale draft.
  const patch = (change: Partial<Draft>): void => setDraft((current) => ({ ...current, ...change }));

  const take = (s: SmtpSettings): void => {
    const { hasPassword: stored, ...rest } = s;
    setSaved(rest);
    setDraft(rest);
    setHasPassword(stored);
    setPassword("");
    setClearPassword(false);
  };

  useEffect(() => {
    let live = true;
    smtp.get()
      .then((s) => live && take(s))
      .catch(() => live && setNote({ kind: "err", text: "Could not load the email settings." }))
      .finally(() => live && setLoaded(true));
    return () => { live = false; };
  }, []);

  const dirty = loaded && (!same({ ...draft, enabled: saved.enabled }, saved) || password !== "" || clearPassword);
  useEffect(() => onDirty?.(dirty), [dirty]);
  useEffect(() => () => onDirty?.(false), []);

  async function store(next: Draft, withSecret: boolean): Promise<boolean> {
    setBusy(true);
    setNote(null);
    setTestNote(null);
    try {
      const body: Draft & { password?: string } = { ...next };
      if (withSecret && clearPassword) body.password = "";
      else if (withSecret && password) body.password = password;
      take(await smtp.save(body));
      onChanged?.();
      return true;
    } catch (err) {
      setNote({ kind: "err", text: (err as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function toggle(): Promise<void> {
    setSwitchError("");
    const enabled = !saved.enabled;
    const withChanges = dirty && confirm("Save your other changes to outgoing email too?");
    setBusy(true);
    try {
      const body: Draft & { password?: string } = { ...(withChanges ? draft : saved), enabled };
      if (withChanges && clearPassword) body.password = "";
      else if (withChanges && password) body.password = password;
      take(await smtp.save(body));
      onChanged?.();
    } catch (err) {
      // The server refuses to turn email on with anything missing, and says what.
      setSwitchError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(): Promise<void> {
    if (await store({ ...draft, enabled: saved.enabled }, true)) setNote({ kind: "ok", text: "Saved." });
  }

  /** Tests what is saved, not what is on screen: that is what will be used. */
  async function sendTest(): Promise<void> {
    setTesting(true);
    setTestNote(null);
    try {
      const result = await smtp.test(testTo.trim());
      setTestNote(
        result.ok
          ? { kind: "ok", text: `Sent. Check ${result.to}, including the spam folder.` }
          : {
              kind: "err",
              text: result.stage === "connect"
                ? `Could not reach the mail server. ${result.reason ?? ""}`.trim()
                : `Connected, but the message was refused. ${result.reason ?? ""}`.trim(),
            },
      );
    } catch (err) {
      setTestNote({ kind: "err", text: (err as Error).message });
    } finally {
      setTesting(false);
    }
  }

  if (!loaded) return html`<div class="card pad muted">Loading…</div>`;

  const provider = MAIL_PROVIDERS[draft.provider] ?? MAIL_PROVIDERS.custom;
  const isCustom = draft.provider === "custom";
  const value = (e: Event): string => (e.target as HTMLInputElement).value;

  return html`
    <${SectionCard} title="Outgoing email"
      intro="Optional. Everything works without it; email adds reminders, invitations and the daily digest.">
      <${HeroSwitch} on=${saved.enabled} busy=${busy} error=${switchError}
        label=${saved.enabled ? "Email is on" : "Email is off"}
        help=${saved.enabled
          ? "Offset Assure sends reminders and notifications. Turning this off stops them at once."
          : "Fill in the server below, save, and send a test first. Then turn this on."}
        onToggle=${toggle} />
      <${NoteLine} note=${note} />

      <${Row} label="Mail provider" help=${provider.note || "Pick yours and the server is filled in for you."}>
        <select class="w-m" value=${draft.provider} aria-label="Mail provider"
                onInput=${(e: Event) => {
                  // The secret belongs to the old provider, so drop what was
                  // typed. The server clears the stored one to match.
                  setPassword("");
                  setClearPassword(false);
                  patch({ provider: value(e) as MailProvider });
                }}>
          ${(Object.keys(MAIL_PROVIDERS) as MailProvider[]).map((id) => html`<option value=${id}>${MAIL_PROVIDERS[id].label}</option>`)}
        </select>
      <//>

      ${isCustom
        ? html`<${Row} label="Server" help="Your mail server's name, its port, and how the connection is protected. 587 with STARTTLS is the usual choice.">
            <span class="set-inline">
              <input class="w-m" value=${draft.host} placeholder="smtp.example.com" aria-label="Mail server"
                     onInput=${(e: Event) => patch({ host: value(e) })} />
              <input class="w-s" type="number" min="1" max="65535" value=${String(draft.port)} aria-label="Port"
                     onInput=${(e: Event) => patch({ port: Number(value(e)) || 0 })} />
              <select class="w-m" value=${draft.secure ? "tls" : "starttls"} aria-label="Encryption"
                      onInput=${(e: Event) => {
                        // Move the port with it: the pair is almost always
                        // 587/STARTTLS or 465/TLS.
                        const tls = value(e) === "tls";
                        patch({ secure: tls, port: tls ? 465 : 587 });
                      }}>
                <option value="starttls">STARTTLS (port 587)</option>
                <option value="tls">TLS from the start (port 465)</option>
              </select>
            </span>
          <//>`
        : null}

      <${Row} label="Sign-in" help="The mailbox the emails are sent from.">
        ${isCustom
          ? html`<input class="w-m" value=${draft.username} autocomplete="off" placeholder="Username (blank if none)" aria-label="Username"
                        onInput=${(e: Event) => patch({ username: value(e) })} />`
          : null}
        <input class="w-m" type="password" value=${password} autocomplete="new-password" disabled=${clearPassword}
               aria-label=${provider.secretLabel}
               placeholder=${hasPassword && !clearPassword ? `${provider.secretLabel}: unchanged` : provider.secretLabel}
               onInput=${(e: Event) => setPassword(value(e))} />
        <span class="set-help">${hasPassword && !clearPassword
          ? `A ${provider.inlineLabel} is saved. Leave blank to keep it.`
          : "Stored encrypted, and never shown again."}</span>
        ${hasPassword
          ? html`<label class="set-check">
              <input type="checkbox" checked=${clearPassword}
                     onChange=${(e: Event) => { setClearPassword((e.target as HTMLInputElement).checked); setPassword(""); }} />
              <span>Forget the saved ${provider.inlineLabel}</span>
            </label>`
          : null}
      <//>

      <${Row} label="Sender" help="How the emails look in people's inboxes.">
        <span class="set-inline">
          <input class="w-m" type="email" value=${draft.fromAddress} placeholder="grc@example.com" aria-label="From address"
                 onInput=${(e: Event) => patch({ fromAddress: value(e) })} />
          <input class="w-m" value=${draft.fromName} placeholder="Offset Assure" aria-label="From name"
                 onInput=${(e: Event) => patch({ fromName: value(e) })} />
        </span>
      <//>

      <${Row} label="Send a test" help="Uses the saved settings, whether or not email is on. Save first, then test.">
        <span class="set-inline">
          <input class="w-m" type="email" value=${testTo} placeholder="you@example.com" aria-label="Send the test to"
                 onInput=${(e: Event) => setTestTo(value(e))} />
          <button class="btn" type="button" disabled=${testing || !testTo.trim() || (isCustom && !saved.host.trim())} onClick=${sendTest}>
            ${testing ? "Sending…" : "Send test email"}
          </button>
        </span>
        <${NoteLine} note=${testNote} />
      <//>

      ${isCustom
        ? html`<${Row} label="Advanced" help="Leave as it is unless your mail server needs it.">
            <label class="set-check">
              <input type="checkbox" checked=${draft.rejectUnauthorized}
                     onChange=${(e: Event) => patch({ rejectUnauthorized: (e.target as HTMLInputElement).checked })} />
              <span>Check the mail server's certificate</span>
            </label>
            <span class="set-help">Turn this off only for an internal server with its own certificate. With it off, the connection is encrypted but not protected against interception.</span>
          <//>`
        : null}
    <//>

    ${dirty
      ? html`<${SaveBar} what="outgoing email" busy=${busy} onSave=${save}
               onDiscard=${() => { setDraft(saved); setPassword(""); setClearPassword(false); setNote(null); }} />`
      : null}`;
}

export function DigestSection({ onDirty, onChanged }: Section): VNode {
  const [saved, setSaved] = useState<DigestSettings | null>(null);
  const [dig, setDig] = useState<DigestSettings | null>(null);
  // Edited as text, one address per line: easier to paste into and read back.
  const [digTo, setDigTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [switchError, setSwitchError] = useState("");
  const [preview, setPreview] = useState<DigestPreview | null>(null);

  const addressesFrom = (text: string): string[] => text.split(/[\n,;]+/).map((a) => a.trim()).filter(Boolean);
  const take = (d: DigestSettings): void => {
    setSaved(d);
    setDig(d);
    setDigTo(d.recipients.join("\n"));
  };

  useEffect(() => {
    digest.get().then(take).catch((e: Error) => setNote({ kind: "err", text: e.message }));
  }, []);

  const current = dig ? { ...dig, recipients: addressesFrom(digTo) } : null;
  const dirty = Boolean(current && saved && !same({ ...current, enabled: saved.enabled }, saved));
  useEffect(() => onDirty?.(dirty), [dirty]);
  useEffect(() => () => onDirty?.(false), []);

  if (!dig || !saved || !current) return html`<div class="card pad muted">${note ? note.text : "Loading…"}</div>`;

  const patch = (change: Partial<DigestSettings>): void => setDig((d) => (d ? { ...d, ...change } : d));

  async function store(next: DigestSettings): Promise<boolean> {
    setBusy(true);
    setNote(null);
    try {
      take(await digest.save(next));
      onChanged?.();
      return true;
    } catch (err) {
      setNote({ kind: "err", text: (err as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function toggle(): Promise<void> {
    if (!saved || !current) return;
    setSwitchError("");
    const base = dirty && confirm("Save your other changes to the daily digest too?") ? current : saved;
    setBusy(true);
    try {
      take(await digest.save({ ...base, enabled: !saved.enabled }));
      onChanged?.();
    } catch (err) {
      setSwitchError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(): Promise<void> {
    if (saved && current && (await store({ ...current, enabled: saved.enabled }))) setNote({ kind: "ok", text: "Saved." });
  }

  async function run(work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setNote(null);
    try {
      await work();
    } catch (err) {
      setNote({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return html`
    <${SectionCard} title="Daily digest"
      intro="One email a day with what needs attention: evidence out of date, overdue tasks and findings, policies due for review, and the highest risks. Sent after the nightly readiness snapshot.">
      <${HeroSwitch} on=${saved.enabled} busy=${busy} error=${switchError}
        label=${saved.enabled ? "The daily digest is on" : "The daily digest is off"}
        help="Needs outgoing email to be working. It takes effect straight away."
        onToggle=${toggle} />
      <${NoteLine} note=${note} />

      <${Row} label="Send to" help="One address per line. Leave it empty and it goes to every administrator who has an email address.">
        <textarea class="w-l" rows="3" value=${digTo} placeholder="Every administrator" aria-label="Send the digest to"
                  onInput=${(e: Event) => setDigTo((e.target as HTMLTextAreaElement).value)}></textarea>
      <//>
      <${Row} label="Look ahead" help="How far ahead to warn about things coming due.">
        <select class="w-s" value=${String(dig.horizonDays)} aria-label="Look ahead"
                onInput=${(e: Event) => patch({ horizonDays: Number((e.target as HTMLSelectElement).value) })}>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
        </select>
      <//>
      <${Row} label="Quiet days" help="An email every day saying nothing trains people to ignore it.">
        <label class="set-check">
          <input type="checkbox" checked=${dig.sendWhenEmpty}
                 onChange=${(e: Event) => patch({ sendWhenEmpty: (e.target as HTMLInputElement).checked })} />
          <span>Send even when nothing needs attention</span>
        </label>
      <//>
      <${Row} label="Try it" help="See today's digest, or send it now to the people above.">
        <span class="set-inline">
          <button class="btn" type="button" disabled=${busy} onClick=${() => run(async () => setPreview(await digest.preview()))}>Preview today's</button>
          <button class="btn" type="button" disabled=${busy}
                  onClick=${() => run(async () => {
                    const r = await digest.send();
                    setNote(r.ok ? { kind: "ok", text: `Sent to ${(r.to ?? []).join(", ")}.` } : { kind: "err", text: r.reason ?? "It could not be sent." });
                  })}>Send it now</button>
        </span>
        ${preview
          ? html`<div class="preview set-preview">
              <div class="preview-head">
                <strong>${preview.subject}</strong>
                <span class="muted">${preview.recipients.length ? `to ${preview.recipients.join(", ")}` : "nobody would receive this"}</span>
              </div>
              ${!preview.wouldSend ? html`<div class="muted preview-note">Nothing needs attention, so tonight it would send nothing.</div>` : null}
              <pre>${preview.body}</pre>
            </div>`
          : null}
      <//>
    <//>

    ${dirty
      ? html`<${SaveBar} what="the daily digest" busy=${busy} onSave=${save} onDiscard=${() => { take(saved); setNote(null); }} />`
      : null}`;
}

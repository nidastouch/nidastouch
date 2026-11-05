"use client";

import { useState } from "react";
import styles from "./touch.module.css";
import { press } from "./sound";

/*
  The say hi screen: its own full screen at the end, not a part of the page you can scroll into.
  Reached through the camera's viewfinder (Stage). A short form, the three ways to reach us, and a way
  back to the page.

  The form posts to /api/inquiry. If that isn't connected yet (no INQUIRY_WEBHOOK_URL), it opens the
  sender's email app with the message filled in instead, so an inquiry never disappears.
*/

const KINDS = ["brand or product film", "short form", "series", "photos", "something else"];
const EMAIL = "hello@nidastouch.com";

type State = "idle" | "sending" | "sent" | "mailto" | "error";

// What's been typed so far, kept for the visit: leaving the say hi screen and coming back (or a slip of the
// finger on "back to the page") doesn't lose a half-written message.
const draft = { name: "", email: "", message: "", kind: KINDS[0] };

const mailtoFor = (d: { name: string; kind: string; message: string }) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(`say hi: ${d.kind}`)}&body=${encodeURIComponent([d.message, "", `name: ${d.name}`, `for: ${d.kind}`].join("\n"))}`;

export default function SayHi({ onClose, live }: { onClose: () => void; live: boolean }) {
  const [kind, setKind] = useState(draft.kind);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [mail, setMail] = useState<{ href: string; message: string } | null>(null);
  const keep = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const k = e.currentTarget.name as "name" | "email" | "message";
    if (k in draft) draft[k] = e.currentTarget.value;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    press();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name") || ""),
      email: String(f.get("email") || ""),
      kind,
      message: String(f.get("message") || ""),
      company: String(f.get("company") || ""),
    };
    setState("sending");
    setError("");
    // Whenever it can't be sent from here (not hooked up yet, the server or the connection failing, a phone
    // that never hears back), it turns into an email instead, with a real button for it: opening the email
    // app by itself, after waiting on the network, is something browsers are allowed to block.
    const asEmail = () => {
      const href = mailtoFor(data);
      setMail({ href, message: data.message });
      setState("mailto");
      try { window.location.href = href; } catch { /* the button is there */ }
    };
    const stop = new AbortController();
    const timer = window.setTimeout(() => stop.abort(), 12000);
    try {
      const r = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: stop.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setState("sent"); Object.assign(draft, { name: "", email: "", message: "", kind: KINDS[0] }); return; }
      if (j.fallback === "mailto" || r.status >= 500) { asEmail(); return; }
      setError(j.error || "Something went wrong.");
      setState("error");
    } catch {
      asEmail();
    } finally {
      window.clearTimeout(timer);
    }
  };

  return (
    <div className={styles.hiScreen} role="dialog" aria-modal="true" aria-label="Say hi" data-live={live ? "" : undefined}>
      <header className={styles.hiTop}>
        <span className={styles.hiMark}>nidas touch</span>
        <button type="button" className={styles.hiClose} onClick={onClose} tabIndex={live ? 0 : -1}>
          back to the page
        </button>
      </header>

      <div className={styles.hiBody}>
        <h2 aria-label="say hi">
          {"say hi".split("").map((c, i) => (
            <span key={i} aria-hidden="true">{c === " " ? " " : c}</span>
          ))}
        </h2>

        {state === "sent" ? (
          <p className={styles.hiDone}>got it. we&apos;ll get back to you soon.</p>
        ) : state === "mailto" ? (
          <div className={styles.hiDone}>
            <p>
              this one goes by email. your email app should have opened with it filled in. if it didn&apos;t,
              tap below, or send it to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
            {mail && (
              <>
                <p><a className={styles.hiMailBtn} href={mail.href}>open it in your email app</a></p>
                <blockquote className={styles.hiMailCopy}>{mail.message}</blockquote>
              </>
            )}
          </div>
        ) : (
          <form className={styles.hiForm} onSubmit={submit}>
            <p className={styles.hiLede}>tell us what you&apos;re making and we&apos;ll get back to you.</p>
            <div className={styles.hiRow}>
              <label>
                <span>your name</span>
                <input name="name" autoComplete="name" required tabIndex={live ? 0 : -1} defaultValue={draft.name} onChange={keep} />
              </label>
              <label>
                <span>email</span>
                <input name="email" type="email" autoComplete="email" required tabIndex={live ? 0 : -1} defaultValue={draft.email} onChange={keep} />
              </label>
            </div>
            <fieldset className={styles.hiKinds}>
              <legend>what&apos;s it for</legend>
              {KINDS.map((k) => (
                <label key={k} className={kind === k ? styles.hiKindOn : undefined}>
                  <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => { setKind(k); draft.kind = k; }} tabIndex={live ? 0 : -1} />
                  {k}
                </label>
              ))}
            </fieldset>
            <label>
              <span>what are you making?</span>
              <textarea name="message" rows={3} required placeholder="a product launch, a menu, a band, a trip" tabIndex={live ? 0 : -1} defaultValue={draft.message} onChange={keep} />
            </label>
            {/* people never see this one */}
            <input name="company" className={styles.hiTrap} tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className={styles.hiSend}>
              <button type="submit" disabled={state === "sending"} tabIndex={live ? 0 : -1}>
                {state === "sending" ? "sending" : "send it"}
              </button>
              {error && <span role="alert">{error}</span>}
            </div>
          </form>
        )}

        <p className={styles.hiLinks}>
          <a href={`mailto:${EMAIL}`} tabIndex={live ? 0 : -1}>{EMAIL}</a>
          <a href="https://instagram.com/leonidastouch" target="_blank" rel="noreferrer" tabIndex={live ? 0 : -1}>instagram @leonidastouch</a>
          <a href="https://www.tiktok.com/@nidastouch" target="_blank" rel="noreferrer" tabIndex={live ? 0 : -1}>tiktok @nidastouch</a>
        </p>
        <p className={styles.hiWhere}>san antonio, texas. happy to drive.</p>
      </div>
    </div>
  );
}

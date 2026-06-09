"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "./motion";

function Field({
  label, name, type = "text", value, onChange, multiline, required,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; required?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  const Tag = multiline ? "textarea" : "input";
  return (
    <label className="block">
      <span className="font-mono block mb-2.5" style={{ fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color: focus ? "var(--gold)" : "var(--text-faint)", transition: "color 0.3s" }}>
        {label}{required && <span style={{ color: "var(--gold)" }}> *</span>}
      </span>
      <Tag
        name={name}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        suppressHydrationWarning
        className={multiline ? "min-h-[120px] resize-none" : ""}
        style={{
          width: "100%",
          background: "transparent",
          color: "var(--text)",
          fontFamily: "var(--font-manrope)",
          fontSize: "1.05rem",
          padding: "0 0 0.9rem 0",
          border: "0",
          borderBottom: `1px solid ${focus ? "var(--gold)" : "var(--line)"}`,
          outline: "none",
          transition: "border-color 0.3s",
          borderRadius: 0,
        }}
      />
    </label>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    await new Promise((r) => setTimeout(r, 1500));
    setState("sent");
    setTimeout(() => { setState("idle"); setForm({ name: "", email: "", message: "" }); }, 3500);
  };

  return (
    <section id="contact" className="section relative overflow-hidden">
      <div className="wrap relative grid lg:grid-cols-[1fr_1fr] gap-14 lg:gap-20 items-start">
        <div>
          <Reveal><span className="eyebrow">Contact</span></Reveal>
          <Reveal delay={0.08}>
            <h2 className="display mt-6" style={{ fontSize: "clamp(2.25rem, 8vw, 6.5rem)", color: "var(--text)" }}>
              Let&apos;s build<br /><span className="text-gold">something gold.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lead mt-8 max-w-[38ch]">
              Tell us what you want to build. We reply to every serious enquiry within 48 hours.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col gap-5">
              <a href="mailto:hello@nidastouch.com" className="font-display font-semibold transition-colors duration-300"
                style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", color: "var(--text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
              >
                hello@nidastouch.com
              </a>
              <div className="flex gap-6">
                <a href="https://www.instagram.com/leonidastouch/" target="_blank" rel="noopener noreferrer" className="font-mono transition-colors duration-300"
                  style={{ fontSize: "0.72rem", letterSpacing: "0.12em", color: "var(--text-faint)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                >
                  Instagram
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="w-full">
          <form onSubmit={submit} className="flex flex-col gap-8" suppressHydrationWarning>
            <div className="grid sm:grid-cols-2 gap-8">
              <Field label="Your name" name="name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} required />
            </div>
            <Field label="About the project" name="message" multiline value={form.message} onChange={(v) => setForm((p) => ({ ...p, message: v }))} required />

            <motion.button
              type="submit"
              disabled={state !== "idle"}
              whileTap={{ scale: 0.98 }}
              className="btn-gold w-full mt-2"
              style={{ minHeight: "3.5rem", opacity: state === "idle" ? 1 : 0.92, cursor: state === "idle" ? "pointer" : "default" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {state === "sending" ? (
                  <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Sending…</motion.span>
                ) : state === "sent" ? (
                  <motion.span key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>✓ Message sent</motion.span>
                ) : (
                  <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    Send Enquiry →
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

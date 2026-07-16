"use client";

import React, { useState, useEffect } from "react";

const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Renovation"];
const BUDGET_BANDS = ["under 5M", "5-10M", "10-20M", "20M+"];
const TIMELINES = [
  { value: "ready now", label: "Ready now" },
  { value: "3-6 months", label: "3–6 months" },
  { value: "6-12 months", label: "6–12 months" },
  { value: "exploring", label: "Just exploring" },
];

const blank = () => ({
  name: "",
  phone: "",
  project_type: "",
  location: "",
  budget_band: "",
  has_land: null,
  has_drawings: null,
  timeline: "",
  diaspora: false,
  diaspora_country: "",
  message: "",
  consent: false,
  company: "", // honeypot
});

export default function InquiryForm() {
  const [draft, setDraft] = useState(blank());
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [errMsg, setErrMsg] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCampaign(params.get("campaign"));
  }, []);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    if (!draft.name.trim()) return setErrMsg("Please tell us your name.");
    if (!draft.phone.trim()) return setErrMsg("Please share a phone number we can reach you on.");
    if (!draft.consent) return setErrMsg("Please accept the data-protection consent to continue.");

    setStatus("submitting");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, campaign }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setUpdated(!!json.updated);
      setStatus("done");
    } catch (err) {
      setErrMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="fq-root">
        <style>{CSS}</style>
        <div className="fq-card fq-done">
          <Logo />
          <h1>{updated ? "Thanks — we've updated your details" : "Thanks — we've got your inquiry"}</h1>
          <p>A member of the Fingerprint Builders team will reach out to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fq-root">
      <style>{CSS}</style>
      <form className="fq-card" onSubmit={submit}>
        <div className="fq-head">
          <Logo />
          <div>
            <h1>Fingerprint Builders</h1>
            <p>Tell us about your project and we'll be in touch.</p>
          </div>
        </div>

        {errMsg && <div className="fq-alert">{errMsg}</div>}

        {/* honeypot, hidden from real visitors */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={draft.company}
          onChange={(e) => set({ company: e.target.value })}
          className="fq-hp"
          aria-hidden="true"
        />

        <Field label="Your name *">
          <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Rose W.M" required />
        </Field>

        <Field label="Phone number *">
          <input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07XX XXX XXX" required />
        </Field>

        <Field label="Project type">
          <select value={draft.project_type} onChange={(e) => set({ project_type: e.target.value })}>
            <option value="">Select…</option>
            {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Location / plot">
          <input value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Ntima, Meru" />
        </Field>

        <Field label="Budget range (KES)">
          <select value={draft.budget_band} onChange={(e) => set({ budget_band: e.target.value })}>
            <option value="">Select…</option>
            {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>

        <Field label="Timeline">
          <select value={draft.timeline} onChange={(e) => set({ timeline: e.target.value })}>
            <option value="">Select…</option>
            {TIMELINES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <YesNo label="Do you already own the land?" value={draft.has_land} onChange={(v) => set({ has_land: v })} />
        <YesNo label="Do you have architectural drawings?" value={draft.has_drawings} onChange={(v) => set({ has_drawings: v })} />

        <label className="fq-check">
          <input type="checkbox" checked={draft.diaspora} onChange={(e) => set({ diaspora: e.target.checked, diaspora_country: e.target.checked ? draft.diaspora_country : "" })} />
          I currently live abroad
        </label>
        {draft.diaspora && (
          <Field label="Which country?">
            <input value={draft.diaspora_country} onChange={(e) => set({ diaspora_country: e.target.value })} placeholder="e.g. United Kingdom" />
          </Field>
        )}

        <Field label="Tell us a bit more">
          <textarea rows={3} value={draft.message} onChange={(e) => set({ message: e.target.value })} placeholder="What are you looking to build?" />
        </Field>

        <label className="fq-check fq-consent">
          <input type="checkbox" checked={draft.consent} onChange={(e) => set({ consent: e.target.checked })} required />
          I agree to Fingerprint Builders storing and using my details to respond to this inquiry.
        </label>

        <button className="fq-submit" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Send inquiry"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="fq-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Logo({ size = 40 }) {
  return (
    <svg width={size} height={Math.round(size * 0.83)} viewBox="0 0 120 100" className="fq-mark" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="60" width="10" height="32" rx="5" fill="#0f2942" />
      <rect x="20" y="40" width="10" height="52" rx="5" fill="#0f2942" />
      <rect x="36" y="62" width="10" height="30" rx="5" fill="#e8792b" />
      <rect x="52" y="20" width="10" height="72" rx="5" fill="#0f2942" />
      <rect x="68" y="40" width="10" height="52" rx="5" fill="#0f2942" />
      <rect x="84" y="54" width="10" height="38" rx="5" fill="#0f2942" />
      <rect x="100" y="66" width="10" height="26" rx="5" fill="#e8792b" />
    </svg>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <div className="fq-field">
      <span>{label}</span>
      <div className="fq-yesno">
        <button type="button" className={`fq-pill ${value === true ? "on" : ""}`} onClick={() => onChange(value === true ? null : true)}>Yes</button>
        <button type="button" className={`fq-pill ${value === false ? "on" : ""}`} onClick={() => onChange(value === false ? null : false)}>No</button>
      </div>
    </div>
  );
}

const CSS = `
.fq-root{--navy:#0f2942;--orange:#e8792b;--ink:#1e293b;--muted:#64748b;--line:#e2e8f0;--bg:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;padding:24px 16px;box-sizing:border-box}
.fq-root *{box-sizing:border-box}
.fq-card{max-width:480px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px}
.fq-head{display:flex;align-items:center;gap:12px;margin-bottom:4px}
.fq-mark{flex:none}
.fq-head h1{font-size:17px;margin:0;color:var(--navy)}
.fq-head p{font-size:12px;margin:2px 0 0;color:var(--muted)}
.fq-alert{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;padding:10px 12px;border-radius:8px;font-size:13px}
.fq-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.fq-field{display:flex;flex-direction:column;gap:5px}
.fq-field span{font-size:12px;font-weight:600;color:var(--muted)}
.fq-field input,.fq-field select,.fq-field textarea{border:1px solid var(--line);border-radius:8px;padding:10px;font-size:14px;font-family:inherit;color:var(--ink);background:#fff;width:100%}
.fq-field input:focus,.fq-field select:focus,.fq-field textarea:focus{outline:none;border-color:var(--orange)}
.fq-yesno{display:flex;gap:8px}
.fq-pill{flex:1;border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:8px;padding:9px;font-size:13px;font-weight:600;cursor:pointer}
.fq-pill.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.fq-check{display:flex;align-items:flex-start;gap:8px;font-size:13px;font-weight:600;color:var(--ink);line-height:1.4}
.fq-check input{width:16px;height:16px;flex:none;margin-top:2px;accent-color:var(--orange)}
.fq-consent{font-weight:400;color:var(--muted)}
.fq-submit{border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;background:var(--orange);color:#fff;cursor:pointer;margin-top:4px}
.fq-submit:hover{filter:brightness(1.05)}
.fq-submit:disabled{opacity:.6;cursor:default}
.fq-done{text-align:center;align-items:center;padding:40px 22px}
.fq-done h1{font-size:18px;color:var(--navy);margin:14px 0 6px}
.fq-done p{font-size:13px;color:var(--muted);margin:0}
`;

"use client";

import React, { useState, useEffect, useMemo } from "react";

const STAGES = [
  { key: "New Inquiry", prob: 0.1, color: "#64748b" },
  { key: "Contacted", prob: 0.25, color: "#0ea5e9" },
  { key: "Consultation", prob: 0.4, color: "#6366f1" },
  { key: "Proposal/BOQ Sent", prob: 0.6, color: "#a855f7" },
  { key: "Negotiation", prob: 0.8, color: "#e8792b" },
  { key: "Won", prob: 1.0, color: "#16a34a" },
  { key: "Lost", prob: 0.0, color: "#94a3b8" },
];

const OPEN_STAGES = ["New Inquiry", "Contacted", "Consultation", "Proposal/BOQ Sent", "Negotiation"];
const NEXT_ORDER = ["New Inquiry", "Contacted", "Consultation", "Proposal/BOQ Sent", "Negotiation", "Won"];

const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Renovation"];
const SOURCES = ["Instagram", "Referral", "Website", "Walk-in", "Diaspora Network", "Other"];

const stageOf = (key) => STAGES.find((s) => s.key === key) || STAGES[0];
const nextStage = (key) => {
  const i = NEXT_ORDER.indexOf(key);
  return i >= 0 && i < NEXT_ORDER.length - 1 ? NEXT_ORDER[i + 1] : null;
};

const fmtKES = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`;
  return `KES ${v.toLocaleString()}`;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const t = new Date(todayISO() + "T00:00:00");
  return Math.round((d - t) / 86400000);
};

const blankLead = () => ({
  name: "",
  phone: "",
  email: "",
  project_type: "Residential",
  estimated_value: "",
  location: "",
  source: "Instagram",
  diaspora: false,
  diaspora_country: "",
  stage: "New Inquiry",
  next_follow_up_at: "",
  message: "",
});

async function apiFetch(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

export default function LeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(blankLead());
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { leads } = await apiFetch("/api/leads");
        setLeads(leads || []);
      } catch (e) {
        setErr(e.message || "Couldn't load leads.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setDraft(blankLead());
    setEditingId(null);
    setErr("");
  };

  const openEdit = (lead) => {
    setDraft({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      project_type: lead.project_type || "Residential",
      estimated_value: lead.estimated_value == null ? "" : String(lead.estimated_value),
      location: lead.location || "",
      source: lead.source || "Instagram",
      diaspora: !!lead.diaspora,
      diaspora_country: lead.diaspora_country || "",
      stage: lead.stage || "New Inquiry",
      next_follow_up_at: lead.next_follow_up_at || "",
      message: lead.message || "",
    });
    setEditingId(lead.id);
    setShowForm(true);
  };

  const saveLead = async () => {
    if (!draft.name.trim()) {
      setErr("Add a client name before saving.");
      return;
    }
    try {
      if (editingId) {
        const { lead } = await apiFetch(`/api/leads/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(draft),
        });
        setLeads((prev) => prev.map((l) => (l.id === editingId ? lead : l)));
      } else {
        const { lead } = await apiFetch("/api/leads", {
          method: "POST",
          body: JSON.stringify(draft),
        });
        setLeads((prev) => [lead, ...prev]);
      }
      setErr("");
      closeForm();
    } catch (e) {
      setErr(e.message || "Couldn't save this lead. Try again.");
    }
  };

  const setStage = async (lead, stage) => {
    try {
      const { lead: updated } = await apiFetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    } catch (e) {
      setErr(e.message || "Couldn't update this lead's stage.");
    }
  };

  const advance = (lead) => {
    const ns = nextStage(lead.stage);
    if (ns) setStage(lead, ns);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this lead? This can't be undone.")) return;
    try {
      await apiFetch(`/api/leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setErr(e.message || "Couldn't delete this lead.");
    }
  };

  const metrics = useMemo(() => {
    const open = leads.filter((l) => OPEN_STAGES.includes(l.stage));
    const pipeline = open.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
    const weighted = open.reduce(
      (s, l) => s + (Number(l.estimated_value) || 0) * stageOf(l.stage).prob,
      0
    );
    return { pipeline, weighted, openCount: open.length };
  }, [leads]);

  const visible = useMemo(() => {
    let out = leads;
    if (filter !== "all") out = out.filter((l) => l.stage === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (l) =>
          (l.name || "").toLowerCase().includes(q) ||
          (l.location || "").toLowerCase().includes(q) ||
          (l.phone || "").includes(q)
      );
    }
    return [...out].sort((a, b) => {
      const ao = OPEN_STAGES.includes(a.stage) ? 0 : 1;
      const bo = OPEN_STAGES.includes(b.stage) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      const ad = daysBetween(a.next_follow_up_at);
      const bd = daysBetween(b.next_follow_up_at);
      if (ad === null) return 1;
      if (bd === null) return -1;
      return ad - bd;
    });
  }, [leads, filter, search]);

  return (
    <div className="fp-root">
      <style>{CSS}</style>

      <header className="fp-header">
        <div className="fp-brand">
          <span className="fp-mark">▚</span>
          <div>
            <h1>Fingerprint Builders</h1>
            <p>Lead Tracker · Design, Build &amp; Renovate</p>
          </div>
        </div>
        <button
          className="fp-btn fp-btn-primary"
          onClick={() => {
            setDraft(blankLead());
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + New Lead
        </button>
      </header>

      {err && <div className="fp-alert">{err}</div>}

      <section className="fp-stats">
        <Stat label="Open Pipeline" value={fmtKES(metrics.pipeline)} sub={`${metrics.openCount} active leads`} accent="#0f2942" />
        <Stat label="Weighted Forecast" value={fmtKES(metrics.weighted)} sub="probability-adjusted" accent="#6366f1" />
      </section>

      {showForm && (
        <section className="fp-form">
          <div className="fp-form-head">
            <h2>{editingId ? "Edit lead" : "Add a lead"}</h2>
            <button className="fp-x" onClick={closeForm} aria-label="Close">✕</button>
          </div>
          <div className="fp-grid">
            <Field label="Client name">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Rose W.M" />
            </Field>
            <Field label="Phone">
              <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="07…" />
            </Field>
            <Field label="Email">
              <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@example.com" />
            </Field>
            <Field label="Project type">
              <select value={draft.project_type} onChange={(e) => setDraft({ ...draft, project_type: e.target.value })}>
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Estimated value (KES)">
              <input type="number" value={draft.estimated_value} onChange={(e) => setDraft({ ...draft, estimated_value: e.target.value })} placeholder="24500000" />
            </Field>
            <Field label="Location / plot">
              <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="e.g. Ntima, Meru" />
            </Field>
            <Field label="Source">
              <select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value })}>
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
              </select>
            </Field>
            <Field label="Next follow-up">
              <input type="date" value={draft.next_follow_up_at} onChange={(e) => setDraft({ ...draft, next_follow_up_at: e.target.value })} />
            </Field>
            <label className="fp-check">
              <input type="checkbox" checked={draft.diaspora} onChange={(e) => setDraft({ ...draft, diaspora: e.target.checked })} />
              Diaspora client
            </label>
            {draft.diaspora && (
              <Field label="Diaspora country">
                <input value={draft.diaspora_country} onChange={(e) => setDraft({ ...draft, diaspora_country: e.target.value })} placeholder="e.g. United Kingdom" />
              </Field>
            )}
            <Field label="Notes" full>
              <textarea rows={2} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} placeholder="Budget signals, plot status, decision timeline…" />
            </Field>
          </div>
          <div className="fp-form-actions">
            <button className="fp-btn fp-btn-ghost" onClick={closeForm}>Cancel</button>
            <button className="fp-btn fp-btn-primary" onClick={saveLead}>{editingId ? "Save changes" : "Add lead"}</button>
          </div>
        </section>
      )}

      <div className="fp-controls">
        <input className="fp-search" placeholder="Search name, plot, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="fp-chips">
          <button className={`fp-chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>All</button>
          {STAGES.map((s) => (
            <button
              key={s.key}
              className={`fp-chip ${filter === s.key ? "on" : ""}`}
              onClick={() => setFilter(s.key)}
              style={filter === s.key ? { background: s.color, borderColor: s.color } : {}}
            >
              {s.key}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="fp-empty">Loading your pipeline…</div>
      ) : visible.length === 0 ? (
        <div className="fp-empty">
          {leads.length === 0 ? "No leads yet. Add your first one to start building the pipeline." : "No leads match this view."}
        </div>
      ) : (
        <div className="fp-list">
          {visible.map((l) => {
            const st = stageOf(l.stage);
            const d = daysBetween(l.next_follow_up_at);
            const overdue = d !== null && d < 0 && OPEN_STAGES.includes(l.stage);
            const dueToday = d === 0 && OPEN_STAGES.includes(l.stage);
            return (
              <article key={l.id} className={`fp-card ${overdue ? "fp-card-overdue" : ""}`}>
                <div className="fp-card-top">
                  <div>
                    <div className="fp-name">
                      {l.name} {l.diaspora && <span className="fp-tag-dia">Diaspora</span>}
                    </div>
                    <div className="fp-meta">{l.project_type || "—"} · {l.location || "—"} · {l.source || "—"}</div>
                  </div>
                  <div className="fp-value">{fmtKES(l.estimated_value)}</div>
                </div>

                <div className="fp-card-mid">
                  <span className="fp-badge" style={{ background: st.color }}>{st.key}</span>
                  {l.next_follow_up_at && OPEN_STAGES.includes(l.stage) && (
                    <span className={`fp-follow ${overdue ? "over" : dueToday ? "today" : ""}`}>
                      {overdue ? `Overdue ${Math.abs(d)}d` : dueToday ? "Follow up today" : `Follow up in ${d}d`}
                    </span>
                  )}
                </div>

                {l.message && <p className="fp-notes">{l.message}</p>}

                <div className="fp-card-actions">
                  {nextStage(l.stage) && (
                    <button className="fp-btn fp-btn-accent" onClick={() => advance(l)}>
                      → {nextStage(l.stage)}
                    </button>
                  )}
                  {OPEN_STAGES.includes(l.stage) && (
                    <button className="fp-btn fp-btn-lost" onClick={() => setStage(l, "Lost")}>Mark lost</button>
                  )}
                  <button className="fp-btn fp-btn-ghost" onClick={() => openEdit(l)}>Edit</button>
                  <button className="fp-btn fp-btn-ghost" onClick={() => remove(l.id)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {leads.length > 0 && (
        <footer className="fp-footer">
          <span>{leads.length} lead{leads.length !== 1 ? "s" : ""} tracked</span>
        </footer>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="fp-stat" style={{ borderTopColor: accent }}>
      <div className="fp-stat-label">{label}</div>
      <div className="fp-stat-value" style={{ color: accent }}>{value}</div>
      <div className="fp-stat-sub">{sub}</div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`fp-field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const CSS = `
.fp-root{--navy:#0f2942;--orange:#e8792b;--ink:#1e293b;--muted:#64748b;--line:#e2e8f0;--bg:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;padding:16px;max-width:820px;margin:0 auto;box-sizing:border-box}
.fp-root *{box-sizing:border-box}
.fp-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}
.fp-brand{display:flex;align-items:center;gap:12px}
.fp-mark{width:40px;height:40px;display:grid;place-items:center;background:var(--navy);color:var(--orange);border-radius:10px;font-size:20px;font-weight:700}
.fp-brand h1{font-size:17px;margin:0;color:var(--navy);letter-spacing:-.01em}
.fp-brand p{font-size:11px;margin:2px 0 0;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.fp-btn{border:none;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:filter .15s,transform .05s}
.fp-btn:active{transform:translateY(1px)}
.fp-btn:focus-visible{outline:2px solid var(--orange);outline-offset:2px}
.fp-btn-primary{background:var(--navy);color:#fff}
.fp-btn-primary:hover{filter:brightness(1.15)}
.fp-btn-accent{background:var(--orange);color:#fff}
.fp-btn-accent:hover{filter:brightness(1.05)}
.fp-btn-ghost{background:#fff;color:var(--muted);border:1px solid var(--line)}
.fp-btn-ghost:hover{background:#f1f5f9}
.fp-btn-lost{background:#fff;color:#94a3b8;border:1px solid var(--line)}
.fp-alert{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:12px}
.fp-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.fp-stat{background:#fff;border:1px solid var(--line);border-top:3px solid;border-radius:10px;padding:12px 14px}
.fp-stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-weight:600}
.fp-stat-value{font-size:22px;font-weight:700;margin:4px 0 2px;letter-spacing:-.02em}
.fp-stat-sub{font-size:11px;color:var(--muted)}
.fp-form{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
.fp-form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.fp-form-head h2{font-size:15px;margin:0;color:var(--navy)}
.fp-x{background:none;border:none;font-size:16px;color:var(--muted);cursor:pointer}
.fp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fp-field{display:flex;flex-direction:column;gap:5px}
.fp-field.full{grid-column:1/-1}
.fp-field span{font-size:12px;font-weight:600;color:var(--muted)}
.fp-field input,.fp-field select,.fp-field textarea{border:1px solid var(--line);border-radius:8px;padding:9px 10px;font-size:14px;font-family:inherit;color:var(--ink);background:#fff}
.fp-field input:focus,.fp-field select:focus,.fp-field textarea:focus{outline:none;border-color:var(--orange)}
.fp-check{grid-column:1/-1;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink)}
.fp-check input{width:16px;height:16px;accent-color:var(--orange)}
.fp-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
.fp-controls{margin-bottom:14px}
.fp-search{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-size:14px;margin-bottom:10px;font-family:inherit}
.fp-search:focus{outline:none;border-color:var(--orange)}
.fp-chips{display:flex;flex-wrap:wrap;gap:6px}
.fp-chip{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer}
.fp-chip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.fp-list{display:flex;flex-direction:column;gap:10px}
.fp-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}
.fp-card-overdue{border-color:#fecaca;background:#fffaf9}
.fp-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.fp-name{font-size:15px;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fp-tag-dia{background:#eef2ff;color:#4338ca;font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;text-transform:uppercase;letter-spacing:.03em}
.fp-meta{font-size:12px;color:var(--muted);margin-top:3px}
.fp-value{font-size:16px;font-weight:700;color:var(--ink);white-space:nowrap}
.fp-card-mid{display:flex;align-items:center;gap:8px;margin:10px 0;flex-wrap:wrap}
.fp-badge{color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px}
.fp-follow{font-size:11px;font-weight:600;color:var(--muted);background:#f1f5f9;padding:4px 8px;border-radius:6px}
.fp-follow.today{background:#fff7ed;color:var(--orange)}
.fp-follow.over{background:#fef2f2;color:#dc2626}
.fp-notes{font-size:13px;color:#475569;margin:0 0 10px;line-height:1.4}
.fp-card-actions{display:flex;flex-wrap:wrap;gap:6px}
.fp-card-actions .fp-btn{padding:7px 11px;font-size:12px}
.fp-empty{background:#fff;border:1px dashed var(--line);border-radius:12px;padding:32px 16px;text-align:center;color:var(--muted);font-size:14px}
.fp-footer{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:12px;color:var(--muted)}
@media(max-width:560px){.fp-grid{grid-template-columns:1fr}.fp-header h1{font-size:16px}}
`;

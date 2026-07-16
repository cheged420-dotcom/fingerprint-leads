import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Renovation"];
const BUDGET_BANDS = ["under 5M", "5-10M", "10-20M", "20M+"];
const TIMELINES = ["ready now", "3-6 months", "6-12 months", "exploring"];

function normalizeKenyanPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+254" + digits.slice(1);
  if (digits.length === 9) return "+254" + digits;
  if (digits.startsWith("254")) return "+" + digits;
  return "+" + digits;
}

function orNull(value, allowed) {
  if (!value || !allowed.includes(value)) return null;
  return value;
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));

  // Honeypot: real visitors never fill this hidden field, bots often do.
  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }

  const phone = normalizeKenyanPhone(body.phone);
  if (phone.replace(/\D/g, "").length < 12) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  if (!body.consent) {
    return NextResponse.json(
      { error: "Please accept the data-protection consent to continue." },
      { status: 400 }
    );
  }

  const fields = {
    name: body.name.trim(),
    phone,
    project_type: orNull(body.project_type, PROJECT_TYPES),
    location: body.location ? String(body.location).trim() : null,
    budget_band: orNull(body.budget_band, BUDGET_BANDS),
    has_land: typeof body.has_land === "boolean" ? body.has_land : null,
    has_drawings: typeof body.has_drawings === "boolean" ? body.has_drawings : null,
    timeline: orNull(body.timeline, TIMELINES),
    diaspora: !!body.diaspora,
    diaspora_country: body.diaspora && body.diaspora_country ? String(body.diaspora_country).trim() : null,
    message: body.message ? String(body.message).trim() : null,
    consent: true,
    source: "website",
    campaign: body.campaign ? String(body.campaign).trim() : null,
  };

  const { data: existing, error: findErr } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }

  if (existing) {
    const { error: updateErr } = await supabase.from("leads").update(fields).eq("id", existing.id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error: insertErr } = await supabase.from("leads").insert(fields);
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, updated: false });
}

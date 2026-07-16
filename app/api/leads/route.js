import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { computeLeadScore } from "../../../lib/leadScore";
import { notifyHotLead } from "../../../lib/notifyHotLead";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data });
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const body = await request.json();

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const insertFields = {
    name: body.name,
    phone: body.phone || null,
    email: body.email || null,
    project_type: body.project_type || null,
    location: body.location || null,
    estimated_value: body.estimated_value === "" || body.estimated_value == null
      ? null
      : Number(body.estimated_value),
    site_visit_fee: body.site_visit_fee === "" || body.site_visit_fee == null
      ? null
      : Number(body.site_visit_fee),
    drawings_fee: body.drawings_fee === "" || body.drawings_fee == null
      ? null
      : Number(body.drawings_fee),
    construction_value: body.construction_value === "" || body.construction_value == null
      ? null
      : Number(body.construction_value),
    source: body.source || null,
    budget_band: body.budget_band || null,
    has_land: typeof body.has_land === "boolean" ? body.has_land : null,
    has_drawings: typeof body.has_drawings === "boolean" ? body.has_drawings : null,
    timeline: body.timeline || null,
    diaspora: !!body.diaspora,
    diaspora_country: body.diaspora_country || null,
    stage: body.stage || "New Inquiry",
    next_follow_up_at: body.next_follow_up_at || null,
    message: body.message || null,
  };
  insertFields.lead_score = computeLeadScore(insertFields);

  const { data, error } = await supabase
    .from("leads")
    .insert(insertFields)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.lead_score >= 7) {
    await notifyHotLead(data);
  }

  return NextResponse.json({ lead: data }, { status: 201 });
}

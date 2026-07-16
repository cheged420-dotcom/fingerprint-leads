import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { computeLeadScore } from "../../../../lib/leadScore";

const EDITABLE_FIELDS = [
  "name",
  "phone",
  "email",
  "project_type",
  "location",
  "estimated_value",
  "source",
  "budget_band",
  "has_land",
  "has_drawings",
  "timeline",
  "diaspora",
  "diaspora_country",
  "stage",
  "next_follow_up_at",
  "message",
];

const SCORE_INPUT_FIELDS = ["budget_band", "has_land", "has_drawings", "timeline", "diaspora"];

export async function PATCH(request, context) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if ("estimated_value" in updates) {
    updates.estimated_value =
      updates.estimated_value === "" || updates.estimated_value == null
        ? null
        : Number(updates.estimated_value);
  }

  if (SCORE_INPUT_FIELDS.some((f) => f in updates)) {
    const { data: current, error: fetchErr } = await supabase
      .from("leads")
      .select("budget_band, has_land, has_drawings, timeline, diaspora")
      .eq("id", id)
      .single();
    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    updates.lead_score = computeLeadScore({ ...current, ...updates });
  }

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: data });
}

export async function DELETE(request, context) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

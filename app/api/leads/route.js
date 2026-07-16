import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

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

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      project_type: body.project_type || null,
      location: body.location || null,
      estimated_value: body.estimated_value === "" || body.estimated_value == null
        ? null
        : Number(body.estimated_value),
      source: body.source || null,
      diaspora: !!body.diaspora,
      diaspora_country: body.diaspora_country || null,
      stage: body.stage || "New Inquiry",
      next_follow_up_at: body.next_follow_up_at || null,
      message: body.message || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: data }, { status: 201 });
}

import { getSupabaseAdmin } from "../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getDbStatus() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { connected: false, message: "Environment variables not set yet." };
  }

  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  if (error) {
    return { connected: false, message: error.message };
  }

  return { connected: true, count };
}

export default async function Home() {
  const status = await getDbStatus();

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "64px 24px",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Fingerprint Builders</h1>
      <p style={{ color: "#9a9a9a", marginTop: 0 }}>Lead Management</p>

      <div
        style={{
          marginTop: 32,
          padding: 20,
          borderRadius: 12,
          background: status.connected ? "#123a1f" : "#3a1f1f",
          border: `1px solid ${status.connected ? "#2f7d4f" : "#7d3a2f"}`,
        }}
      >
        <strong>
          {status.connected ? "✅ Database connected" : "⚠️ Database not connected"}
        </strong>
        <p style={{ margin: "8px 0 0", color: "#c8c8c8" }}>
          {status.connected
            ? `The "leads" table is reachable. Current lead count: ${status.count ?? 0}.`
            : status.message}
        </p>
      </div>

      <p style={{ marginTop: 40, color: "#6a6a6a", fontSize: 14 }}>
        This is the base setup. Lead capture forms and the pipeline dashboard
        will be added next.
      </p>
    </main>
  );
}

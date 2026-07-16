const ALERT_RECIPIENT = "hello@fingerprintbuilders.com";

export async function notifyHotLead(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const subject = `Hot lead: ${lead.name} (score ${lead.lead_score})`;
  const text = [
    "A new hot lead just came in.",
    "",
    `Name: ${lead.name}`,
    `Phone: ${lead.phone || "—"}`,
    `Project type: ${lead.project_type || "—"}`,
    `Budget: ${lead.budget_band || "—"}`,
    `Score: ${lead.lead_score} / 9`,
  ].join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fingerprint Builders Leads <onboarding@resend.dev>",
        to: ALERT_RECIPIENT,
        subject,
        text,
      }),
    });
  } catch (e) {
    // Best-effort notification — a failed email must never block saving the lead.
  }
}

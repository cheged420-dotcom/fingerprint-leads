export function computeLeadScore({ budget_band, has_land, timeline, has_drawings, diaspora }) {
  let score = 0;

  if (budget_band === "20M+") score += 3;
  else if (budget_band === "10-20M") score += 2;
  else if (budget_band === "5-10M") score += 1;

  if (has_land === true) score += 2;
  if (timeline === "ready now" || timeline === "3-6 months") score += 2;
  if (has_drawings === true) score += 1;
  if (diaspora === true && has_land === true) score += 1;

  return score;
}

export function scoreLabel(score) {
  if (score == null) return null;
  if (score >= 7) return "Hot";
  if (score >= 4) return "Warm";
  return "Cold";
}

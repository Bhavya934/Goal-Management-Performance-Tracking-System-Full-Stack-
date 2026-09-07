// ─── Progress Calculation Formulas ──────────────────────────────
// These are the exact formulas from the hackathon requirements

export function calculateProgress(
  uom: string,
  target: number,
  achievement: number
): number {
  switch (uom) {
    case "NUMERIC_HIGHER":
    case "PERCENTAGE":
      // Higher is better: (Achievement / Target) × 100
      return target > 0 ? Math.min((achievement / target) * 100, 150) : 0;

    case "NUMERIC_LOWER":
      // Lower is better: (Target / Achievement) × 100
      return achievement > 0 ? Math.min((target / achievement) * 100, 150) : 0;

    case "TIMELINE":
      // Timeline: Date comparison — simplified as numeric for now
      // achievement = days completed, target = deadline days
      if (achievement <= target) return 100;
      return Math.max(0, (target / achievement) * 100);

    case "ZERO_BASED":
      // Zero-based: 100% if 0, else 0%
      return achievement === 0 ? 100 : 0;

    default:
      return 0;
  }
}

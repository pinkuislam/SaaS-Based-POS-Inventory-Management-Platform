import type { TenantSettings } from "@/lib/tenant-settings";

export function getLoyaltyConfig(settings: TenantSettings) {
  const loyalty = settings.loyalty;
  return {
    enabled: loyalty?.enabled ?? false,
    /** Spend this amount (currency) to earn 1 point */
    spendPerPoint: loyalty?.spendPerPoint ?? 100,
    /** Redeem value per point (currency) */
    valuePerPoint: loyalty?.valuePerPoint ?? 1,
  };
}

export function pointsEarnedForSale(
  total: number,
  settings: TenantSettings
): number {
  const { enabled, spendPerPoint } = getLoyaltyConfig(settings);
  if (!enabled || spendPerPoint <= 0) return 0;
  return Math.floor(total / spendPerPoint);
}

export function discountFromPoints(
  points: number,
  settings: TenantSettings
): number {
  const { valuePerPoint } = getLoyaltyConfig(settings);
  return Math.max(0, points * valuePerPoint);
}

export type EcommercePlatform = "woocommerce" | "shopify";

export function parsePlatform(
  value: string | null | undefined,
  fallback: EcommercePlatform = "woocommerce"
): EcommercePlatform {
  if (value === "shopify") return "shopify";
  if (value === "woocommerce") return "woocommerce";
  return fallback;
}

export function ecommerceSettingKey(
  tenantId: string,
  platform: EcommercePlatform
) {
  return { tenantId_platform: { tenantId, platform } } as const;
}

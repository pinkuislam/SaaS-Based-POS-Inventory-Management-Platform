import { prisma } from "@/lib/prisma";

export async function getTenantPackageFeatures(
  tenantId: string
): Promise<string[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: { select: { features: true } } },
  });
  const raw = tenant?.package?.features;
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => String(f));
}

/** Match package feature labels (case-insensitive). "All Features" grants everything. */
export function hasPackageFeature(
  features: string[],
  required: string
): boolean {
  if (features.length === 0) return true;
  const norm = (s: string) => s.trim().toLowerCase();
  const list = features.map(norm);
  if (list.includes("all features")) return true;
  return list.includes(norm(required));
}

export const PACKAGE_FEATURES = {
  ECOMMERCE: "E-commerce API",
  ADVANCED_REPORTS: "Advanced Reports",
  BARCODE: "Barcode",
  API_ACCESS: "API access",
} as const;

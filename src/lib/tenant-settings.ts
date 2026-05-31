import { prisma } from "@/lib/prisma";

export interface TenantSettings {
  pos?: {
    defaultTaxRate?: number;
    receiptFooter?: string;
    showLogo?: boolean;
  };
  business?: {
    currency?: string;
    timezone?: string;
  };
  loyalty?: {
    enabled?: boolean;
    spendPerPoint?: number;
    valuePerPoint?: number;
  };
}

export async function getTenantSettings(
  tenantId: string
): Promise<TenantSettings> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const raw = tenant?.settings;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as TenantSettings;
  }
  return {};
}

export async function updateTenantSettings(
  tenantId: string,
  settings: TenantSettings
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { settings: settings as object },
  });
}

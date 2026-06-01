import { prisma } from "@/lib/prisma";

export interface TenantTaxRate {
  id: string;
  name: string;
  rate: number;
  type: string;
  isActive: boolean;
}

export interface TenantInvoiceSettings {
  prefix?: string;
  numberFormat?: string;
  footerText?: string;
  terms?: string;
  showTax?: boolean;
  showDiscount?: boolean;
  showCustomerDue?: boolean;
  showLogo?: boolean;
  defaultPrintFormat?: "thermal" | "a4";
  thermalLayout?: "compact" | "standard";
  a4Layout?: "classic" | "modern";
}

export interface TenantNotificationSettings {
  emailLowStock?: boolean;
  emailCustomerDue?: boolean;
  emailSupplierDue?: boolean;
  emailPurchaseDue?: boolean;
  emailSaleReturn?: boolean;
  emailSubscription?: boolean;
  inAppCustomerDue?: boolean;
  inAppSupplierDue?: boolean;
  inAppPurchaseDue?: boolean;
  inAppSaleReturn?: boolean;
}

export interface TenantStockSettings {
  lowStockAlertEnabled?: boolean;
  lowStockDedupHours?: number;
}

export interface TenantReturnPolicySettings {
  saleReturnDays?: number;
  purchaseReturnDays?: number;
  policyText?: string;
}

export interface TenantGeneralSettings {
  dateFormat?: string;
  paymentMethods?: string[];
}

export interface TenantSecuritySettings {
  sessionTimeoutMinutes?: number;
}

export interface TenantSettings {
  pos?: {
    defaultTaxRate?: number;
    receiptFooter?: string;
    showLogo?: boolean;
  };
  business?: {
    currency?: string;
    timezone?: string;
    invoicePrefix?: string;
    taxVatNumber?: string;
    businessType?: string;
  };
  loyalty?: {
    enabled?: boolean;
    spendPerPoint?: number;
    valuePerPoint?: number;
  };
  taxes?: TenantTaxRate[];
  invoice?: TenantInvoiceSettings;
  notifications?: TenantNotificationSettings;
  stock?: TenantStockSettings;
  returnPolicy?: TenantReturnPolicySettings;
  general?: TenantGeneralSettings;
  security?: TenantSecuritySettings;
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

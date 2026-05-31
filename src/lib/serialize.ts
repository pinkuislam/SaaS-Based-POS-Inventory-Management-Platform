import { decimalToNumber } from "@/lib/utils";

function toIsoDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Customer row for edit dialog (no Prisma Decimal fields). */
export type SerializedCustomerEdit = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: string;
};

export function serializeCustomerForEdit(customer: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: string;
}): SerializedCustomerEdit {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    customerType: customer.customerType,
  };
}

/** Due sale row for customer payment dialog. */
export type SerializedDueSale = {
  id: string;
  invoiceNo: string;
  dueAmount: number;
  saleDate: string;
};

export function serializeDueSale(sale: {
  id: string;
  invoiceNo: string;
  dueAmount: unknown;
  saleDate: Date | string;
}): SerializedDueSale {
  return {
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    dueAmount: decimalToNumber(sale.dueAmount),
    saleDate: toIsoDateString(sale.saleDate) ?? new Date().toISOString(),
  };
}

/** Supplier row for edit dialog (no Prisma Decimal fields). */
export type SerializedSupplierEdit = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
};

export function serializeSupplierForEdit(supplier: {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
}): SerializedSupplierEdit {
  return {
    id: supplier.id,
    name: supplier.name,
    companyName: supplier.companyName,
    phone: supplier.phone,
    email: supplier.email,
  };
}

/** Due purchase row for supplier payment dialog. */
export type SerializedDuePurchase = {
  id: string;
  invoiceNo: string;
  dueAmount: number;
};

export function serializeDuePurchase(purchase: {
  id: string;
  invoiceNo: string;
  dueAmount: unknown;
}): SerializedDuePurchase {
  return {
    id: purchase.id,
    invoiceNo: purchase.invoiceNo,
    dueAmount: decimalToNumber(purchase.dueAmount),
  };
}

/** Plain product shape safe to pass from Server Components to client components. */
export type SerializedProductClient = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number | null;
  reorderLevel: number;
  batchNo: string | null;
  expiryDate: string | null;
  image: string | null;
};

/** Product row for stock transfer / adjust dialogs. */
export type SerializedProductStockOption = {
  id: string;
  name: string;
  sku: string | null;
  stockQty: number;
  branchId: string | null;
};

export type SerializedProductAdjustOption = {
  id: string;
  name: string;
  stockQty: number;
};

export function serializeProductStockOption(product: {
  id: string;
  name: string;
  sku: string | null;
  stockQty: unknown;
  branchId: string | null;
}): SerializedProductStockOption {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    stockQty: decimalToNumber(product.stockQty),
    branchId: product.branchId,
  };
}

export function serializeProductAdjustOption(product: {
  id: string;
  name: string;
  stockQty: unknown;
}): SerializedProductAdjustOption {
  return {
    id: product.id,
    name: product.name,
    stockQty: decimalToNumber(product.stockQty),
  };
}

export function serializeProductForClient(product: {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  purchasePrice: unknown;
  sellingPrice: unknown;
  wholesalePrice?: unknown | null;
  reorderLevel: unknown;
  batchNo?: string | null;
  expiryDate?: Date | string | null;
  image?: string | null;
}): SerializedProductClient {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    purchasePrice: decimalToNumber(product.purchasePrice),
    sellingPrice: decimalToNumber(product.sellingPrice),
    wholesalePrice:
      product.wholesalePrice == null
        ? null
        : decimalToNumber(product.wholesalePrice),
    reorderLevel: decimalToNumber(product.reorderLevel),
    batchNo: product.batchNo ?? null,
    expiryDate: toIsoDateString(product.expiryDate),
    image: product.image ?? null,
  };
}

/** Plain package shape safe to pass from Server Components to client components. */
export type SerializedSubscriptionPackage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  yearlyPrice: number | null;
  billingCycle: string;
  trialDays: number;
  graceDays: number;
  maxUsers: number;
  maxBranches: number;
  maxProducts: number;
  maxInvoices: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
};

/** Subscription row for admin edit dialog (no Prisma Decimal). */
export type SerializedSubscription = {
  id: string;
  tenantId: string;
  packageId: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
};

export function serializeSubscription(sub: {
  id: string;
  tenantId: string;
  packageId: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  amount: unknown;
}): SerializedSubscription {
  return {
    id: sub.id,
    tenantId: sub.tenantId,
    packageId: sub.packageId,
    status: sub.status,
    startDate: toIsoDateString(sub.startDate) ?? "",
    endDate: toIsoDateString(sub.endDate) ?? "",
    amount: decimalToNumber(sub.amount),
  };
}

/** Subscription payment row for admin edit dialog. */
export type SerializedSubscriptionPayment = {
  id: string;
  subscriptionId: string;
  amount: number;
  method: string | null;
  transactionId: string | null;
  status: string;
};

export function serializeSubscriptionPayment(payment: {
  id: string;
  subscriptionId: string;
  amount: unknown;
  method: string | null;
  transactionId: string | null;
  status: string;
}): SerializedSubscriptionPayment {
  return {
    id: payment.id,
    subscriptionId: payment.subscriptionId,
    amount: decimalToNumber(payment.amount),
    method: payment.method,
    transactionId: payment.transactionId,
    status: payment.status,
  };
}

/** Coupon row for admin edit dialog. */
export type SerializedCoupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate: string | null;
  usageLimit: number | null;
  packageId: string | null;
};

export function serializeCoupon(coupon: {
  id: string;
  code: string;
  discountType: string;
  discountValue: unknown;
  expiryDate: Date | string | null;
  usageLimit: number | null;
  packageId: string | null;
}): SerializedCoupon {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: decimalToNumber(coupon.discountValue),
    expiryDate: toIsoDateString(coupon.expiryDate),
    usageLimit: coupon.usageLimit,
    packageId: coupon.packageId,
  };
}

export function serializeSubscriptionPackage(pkg: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: unknown;
  yearlyPrice?: unknown | null;
  billingCycle: string;
  trialDays: number;
  graceDays?: number;
  maxUsers: number;
  maxBranches: number;
  maxProducts: number;
  maxInvoices: number;
  features: unknown;
  isPopular?: boolean;
  isActive: boolean;
  sortOrder: number;
}): SerializedSubscriptionPackage {
  return {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description,
    price: decimalToNumber(pkg.price),
    yearlyPrice:
      pkg.yearlyPrice != null ? decimalToNumber(pkg.yearlyPrice) : null,
    billingCycle: pkg.billingCycle,
    trialDays: pkg.trialDays,
    graceDays: pkg.graceDays ?? 7,
    maxUsers: pkg.maxUsers,
    maxBranches: pkg.maxBranches,
    maxProducts: pkg.maxProducts,
    maxInvoices: pkg.maxInvoices,
    features: Array.isArray(pkg.features) ? (pkg.features as string[]) : [],
    isPopular: pkg.isPopular ?? false,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
  };
}

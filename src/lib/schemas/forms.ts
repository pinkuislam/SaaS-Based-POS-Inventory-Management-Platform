import { z } from "zod";
import { PLATFORM_SETTING_KEYS as K } from "@/lib/admin/platform-setting-keys";

const optStr = z.string().optional().or(z.literal(""));
const optEmail = z
  .string()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""));

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = loginSchema.extend({
  totp: optStr,
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name is required"),
  slug: z
    .string()
    .min(2, "Shop URL slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: optStr,
  email: optEmail,
  address: optStr,
  customerType: z.string().min(1, "Customer type is required"),
  openingBalance: optStr,
  creditLimit: optStr,
  groupId: optStr,
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: optStr,
  email: optEmail,
  address: optStr,
  openingBalance: optStr,
});

export const supplierFormSchema = supplierSchema.extend({
  companyName: optStr,
});

export const customerEditSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: optStr,
  email: optEmail,
  address: optStr,
  customerType: z.string().min(1, "Customer type is required"),
});

export const supplierEditSchema = supplierFormSchema.omit({ openingBalance: true, address: true });

export const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: optStr,
  address: optStr,
  contactPerson: optStr,
  phone: optStr,
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
  openingBalance: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(parseFloat(v)) && parseFloat(v) >= 0),
      "Enter a valid opening balance"
    ),
  managerId: optStr,
  isActive: z.boolean().optional(),
});

export const branchFormSchema = branchSchema.extend({
  isMain: z.boolean().optional(),
  invoicePrefix: optStr,
  settingsNotes: optStr,
});

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: optStr,
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Select a role"),
  branchId: optStr,
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().min(1, "Amount is required").refine((v) => !Number.isNaN(parseFloat(v)) && parseFloat(v) > 0, "Enter a valid amount"),
  categoryId: z.string().min(1, "Select a category"),
  branchId: optStr,
  note: optStr,
  expenseDate: optStr,
});

export const expenseFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (v) => !Number.isNaN(parseFloat(v)) && parseFloat(v) > 0,
        "Enter a valid amount"
      ),
    categoryId: optStr,
    categoryName: optStr,
    expenseDate: optStr,
    notes: optStr,
    useNewCategory: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.useNewCategory) {
      if (!data.categoryName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category name is required",
          path: ["categoryName"],
        });
      }
    } else if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a category",
        path: ["categoryId"],
      });
    }
  });

export const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().min(1, "Discount value is required"),
  expiryDate: optStr,
  usageLimit: optStr,
  packageId: optStr,
});

export const subscriptionSchema = z.object({
  tenantId: z.string().min(1, "Select a tenant"),
  packageId: z.string().min(1, "Select a package"),
  status: z.string().min(1, "Select status"),
  startDate: optStr,
  endDate: z.string().min(1, "End date is required"),
  amount: optStr,
});

export const invoiceSchema = z.object({
  tenantId: z.string().min(1, "Select a tenant"),
  amount: z.string().min(1, "Amount is required"),
  tax: optStr,
  discount: optStr,
  dueDate: optStr,
  notes: optStr,
});

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
  target: z.string().min(1, "Select target"),
  publish: z.boolean().optional(),
});

export const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  sendNow: z.boolean().optional(),
});

export const subscriptionPaymentSchema = z.object({
  subscriptionId: z.string().min(1, "Select a subscription"),
  amount: z.string().min(1, "Amount is required"),
  method: optStr,
  transactionId: optStr,
  status: z.string().min(1, "Select status"),
});

export const invoiceEditSchema = z.object({
  status: z.string().min(1, "Select status"),
  notes: optStr,
});

export const adminRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: optStr,
  permissions: optStr,
});

export const featureSchema = z.object({
  key: z.string().min(1, "Feature key is required"),
  name: z.string().min(1, "Feature name is required"),
  module: optStr,
  description: optStr,
  isActive: z.boolean().optional(),
  sortOrder: optStr,
});

export const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: optStr,
  price: z.string().min(1, "Price is required"),
  yearlyPrice: optStr,
  billingCycle: z.string().min(1, "Select billing cycle"),
  trialDays: optStr,
  graceDays: optStr,
  maxUsers: optStr,
  maxBranches: optStr,
  maxProducts: optStr,
  maxInvoices: optStr,
  featureKeys: z.array(z.string()).default([]),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: optStr,
});

export const platformSettingsSchema = z.object({
  [K.platformName]: z.string().min(1, "Platform name is required"),
  [K.platformEmail]: optEmail,
  [K.supportEmail]: optEmail,
  [K.currency]: z.string().min(1, "Currency is required"),
  [K.timezone]: z.string().min(1, "Timezone is required"),
  [K.dateFormat]: z.string().min(1, "Date format is required"),
  [K.defaultTrialDays]: optStr,
  [K.defaultGraceDays]: optStr,
  [K.sessionTimeout]: optStr,
  [K.passwordMinLength]: optStr,
  [K.termsUrl]: optStr,
  [K.privacyUrl]: optStr,
});

export const smtpSettingsSchema = z.object({
  smtpEnabled: z.boolean(),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.string().min(1, "Port is required"),
  smtpSecure: z.boolean(),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPass: optStr,
  smtpFrom: optStr,
});

export const smtpTestSchema = z.object({
  testEmail: z.string().email("Enter a valid email address"),
});

export const paymentSettingsSchema = z.object({
  stripeEnabled: z.boolean(),
  stripePublishableKey: optStr,
  stripeSecretKey: optStr,
  stripeWebhookSecret: optStr,
  sslcommerzEnabled: z.boolean(),
  sslcommerzStoreId: optStr,
  sslcommerzStorePass: optStr,
  sslcommerzSandbox: z.boolean(),
  defaultGateway: z.string().min(1, "Select default gateway"),
});

export const maintenanceSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: optStr,
});

export const securityIpSchema = z.object({
  ips: optStr,
});

export const tenantPackageSchema = z.object({
  packageId: z.string().min(1, "Select a package"),
});

export const paymentAmountSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((v) => parseFloat(v) > 0, "Enter a valid amount"),
  note: optStr,
});

export const customerPaymentSchema = paymentAmountSchema.extend({
  method: z.string().min(1, "Select payment method"),
  saleId: optStr,
});

export const supplierPaymentSchema = paymentAmountSchema.extend({
  method: z.string().min(1, "Select payment method"),
  purchaseId: optStr,
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  branchId: z.string().min(1, "Select a branch"),
  quantity: z.string().min(1, "Quantity is required"),
  type: z.string().min(1, "Select adjustment type"),
  note: optStr,
});

export const stockAdjustFormSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((v) => parseFloat(v) > 0, "Enter a valid quantity"),
  direction: z.string().min(1),
  adjustType: z.string().min(1),
  reason: optStr,
  note: optStr,
});

export const stockTransferSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  fromBranchId: z.string().min(1, "Select source branch"),
  toBranchId: z.string().min(1, "Select destination branch"),
  quantity: z.string().min(1, "Quantity is required"),
  note: optStr,
});

export const stockTransferFormSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  fromBranchId: optStr,
  toBranchId: z.string().min(1, "Select destination branch"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((v) => parseFloat(v) > 0, "Enter a valid quantity"),
  note: optStr,
});

export const loyaltySchema = z.object({
  points: z.string().min(1, "Points are required"),
  note: optStr,
});

export const supportReplySchema = z.object({
  message: z.string().min(1, "Reply message is required"),
});

export const customerGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

export const apiKeySchema = z.object({
  name: z.string().min(1, "Key name is required"),
});

export const tenantProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: optStr,
  address: optStr,
});

export const tenantProfileFormSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  phone: optStr,
  address: optStr,
  defaultTaxRate: optStr,
  receiptFooter: optStr,
  loyaltyEnabled: z.boolean().optional(),
  spendPerPoint: optStr,
  valuePerPoint: optStr,
});

export const businessProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  email: z.string().email("Enter a valid business email"),
  phone: optStr,
  address: optStr,
  taxVatNumber: optStr,
  businessType: z.string().min(1, "Select business type"),
  invoicePrefix: z.string().min(1, "Invoice prefix is required").max(12),
  currency: z.string().min(1, "Select currency"),
  timezone: z.string().min(1, "Select timezone"),
});

export const accountDeletionRequestSchema = z.object({
  reason: z.string().min(10, "Please provide a reason (at least 10 characters)"),
  confirmName: z.string().min(1, "Type your business name to confirm"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: optStr,
  barcode: optStr,
  serialNo: optStr,
  categoryId: optStr,
  brandId: optStr,
  unitId: optStr,
  purchasePrice: optStr,
  sellingPrice: z.string().min(1, "Selling price is required"),
  wholesalePrice: optStr,
  taxRate: optStr,
  batchNo: optStr,
  expiryDate: optStr,
  stockQty: optStr,
  reorderLevel: optStr,
});

export const productEditSchema = productSchema.omit({
  categoryId: true,
  brandId: true,
  unitId: true,
  stockQty: true,
});

export const categoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: optStr,
  shortName: optStr,
});

export const registerFormSchema = registerSchema
  .omit({ name: true })
  .extend({
    ownerName: z.string().min(2, "Name must be at least 2 characters"),
    phone: optStr,
    packageSlug: z.string().min(1, "Select a package"),
  });

export const woocommerceSchema = z.object({
  storeUrl: z.string().min(1, "Store URL is required").url("Enter a valid store URL"),
  consumerKey: optStr,
  consumerSecret: optStr,
  isActive: z.boolean().optional(),
  syncProducts: z.boolean().optional(),
  syncStock: z.boolean().optional(),
  syncOrders: z.boolean().optional(),
  syncCustomers: z.boolean().optional(),
  syncDirection: z.enum(["inbound", "outbound", "both"]).optional(),
  webhookSecret: optStr,
});

export const shopifySchema = z.object({
  storeUrl: z
    .string()
    .min(1, "Store URL is required")
    .refine(
      (v) =>
        /^https?:\/\/.+\.myshopify\.com\/?$/i.test(v.trim()) ||
        /^[\w-]+\.myshopify\.com\/?$/i.test(v.trim()),
      "Enter your Shopify store URL (e.g. your-store.myshopify.com)"
    ),
  accessToken: optStr,
  isActive: z.boolean().optional(),
  syncProducts: z.boolean().optional(),
  syncStock: z.boolean().optional(),
  syncOrders: z.boolean().optional(),
  syncCustomers: z.boolean().optional(),
  syncDirection: z.enum(["inbound", "outbound", "both"]).optional(),
  webhookSecret: optStr,
});

export const saleReturnSchema = z.object({
  returnReason: optStr,
});

export const saleExchangeSchema = z.object({
  exchangeReason: optStr,
});

export const manualSaleSchema = z.object({
  customerId: optStr,
  paymentMethod: z.string().min(1, "Select payment method"),
  paidAmount: optStr,
  notes: optStr,
});

export const purchaseFormSchema = z.object({
  supplierId: optStr,
  paidAmount: optStr,
  notes: optStr,
});

export const supportTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  priority: optStr,
});

export const reportDateSchema = z.object({
  from: z.string().min(1, "From date is required"),
  to: z.string().min(1, "To date is required"),
});

export const barcodePrintSchema = z.object({
  code: z.string().min(1, "Barcode value is required"),
  copies: z
    .string()
    .min(1, "Number of copies is required")
    .refine((v) => {
      const n = parseInt(v, 10);
      return !Number.isNaN(n) && n >= 1 && n <= 50;
    }, "Enter 1–50 copies"),
});

export const totpCodeSchema = z.object({
  code: z.string().min(6, "Enter the 6-digit code").max(8, "Invalid code"),
});

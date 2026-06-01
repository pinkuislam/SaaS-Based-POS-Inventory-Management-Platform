/** Seed defaults (also used by prisma/seed.ts). */
export const DEFAULT_ADMIN_ROLES = [
  {
    name: "Owner",
    description: "Full platform access",
    permissions: ["*"] as string[],
  },
  {
    name: "Support Agent",
    description: "Tenant and support management",
    permissions: ["tenants:read", "support:*", "announcements:read"] as string[],
  },
];

export const DEFAULT_PLATFORM_FEATURES = [
  { key: "pos", name: "POS", module: "Sales" },
  { key: "basic_inventory", name: "Basic Inventory", module: "Inventory" },
  { key: "basic_reports", name: "Basic Reports", module: "Reports" },
  { key: "inventory", name: "Inventory", module: "Inventory" },
  { key: "purchase", name: "Purchase", module: "Purchase" },
  { key: "sales", name: "Sales", module: "Sales" },
  { key: "customers", name: "Customers", module: "CRM" },
  { key: "suppliers", name: "Suppliers", module: "Purchase" },
  { key: "advanced_reports", name: "Advanced Reports", module: "Reports" },
  { key: "barcode", name: "Barcode", module: "POS" },
  { key: "all_features", name: "All Features", module: "Platform" },
  { key: "ecommerce_api", name: "E-commerce API", module: "Integrations" },
  { key: "priority_support", name: "Priority Support", module: "Support" },
  { key: "custom_roles", name: "Custom Roles", module: "Settings" },
];

export const DEFAULT_PLATFORM_FEATURES = [
  { key: "pos_billing", name: "POS Billing", module: "POS" },
  { key: "inventory", name: "Inventory Management", module: "Inventory" },
  { key: "purchase", name: "Purchase Management", module: "Purchase" },
  { key: "sales_return", name: "Sales Return", module: "Sales" },
  { key: "barcode", name: "Barcode Printing", module: "Products" },
  { key: "multi_branch", name: "Multi-Branch Access", module: "Branches" },
  { key: "advanced_reports", name: "Advanced Reports", module: "Reports" },
  { key: "ecommerce", name: "E-commerce Integration", module: "Integrations" },
  { key: "api_access", name: "API Access", module: "API" },
  { key: "user_roles", name: "User Role Management", module: "Users" },
  { key: "customer_due", name: "Customer Due Tracking", module: "Customers" },
  { key: "supplier_due", name: "Supplier Due Tracking", module: "Suppliers" },
  { key: "expenses", name: "Expense Management", module: "Expenses" },
] as const;

export const DEFAULT_ADMIN_ROLES = [
  {
    name: "Owner",
    description: "Full platform access",
    permissions: ["*"],
  },
  {
    name: "Billing Manager",
    description: "Payments, invoices, subscriptions",
    permissions: ["billing", "subscriptions", "payments", "invoices", "coupons"],
  },
  {
    name: "Support Manager",
    description: "Support tickets and tenant assistance",
    permissions: ["support", "tenants.view", "tenants.impersonate"],
  },
  {
    name: "Read-only Viewer",
    description: "View-only access to dashboards and reports",
    permissions: ["view"],
  },
] as const;

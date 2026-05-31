export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_PRODUCTS: "manage_products",
  CREATE_SALES: "create_sales",
  DELETE_SALES: "delete_sales",
  MANAGE_PURCHASES: "manage_purchases",
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_SUPPLIERS: "manage_suppliers",
  VIEW_REPORTS: "view_reports",
  MANAGE_USERS: "manage_users",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_BRANCHES: "manage_branches",
  MANAGE_POS: "manage_pos",
  MANAGE_INVENTORY: "manage_inventory",
  MANAGE_EXPENSES: "manage_expenses",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLES: Record<
  string,
  { name: string; permissions: Permission[] }
> = {
  owner: {
    name: "Owner",
    permissions: Object.values(PERMISSIONS),
  },
  manager: {
    name: "Manager",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_PRODUCTS,
      PERMISSIONS.CREATE_SALES,
      PERMISSIONS.MANAGE_PURCHASES,
      PERMISSIONS.MANAGE_CUSTOMERS,
      PERMISSIONS.MANAGE_SUPPLIERS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_BRANCHES,
      PERMISSIONS.MANAGE_POS,
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.MANAGE_EXPENSES,
    ],
  },
  cashier: {
    name: "Cashier",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.CREATE_SALES,
      PERMISSIONS.MANAGE_POS,
      PERMISSIONS.MANAGE_CUSTOMERS,
    ],
  },
  inventory: {
    name: "Inventory Manager",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_PRODUCTS,
      PERMISSIONS.MANAGE_PURCHASES,
      PERMISSIONS.MANAGE_SUPPLIERS,
      PERMISSIONS.MANAGE_INVENTORY,
    ],
  },
  accountant: {
    name: "Accountant",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_EXPENSES,
      PERMISSIONS.MANAGE_CUSTOMERS,
      PERMISSIONS.MANAGE_SUPPLIERS,
    ],
  },
};

export function hasPermission(
  userPermissions: string[],
  required: Permission
): boolean {
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(required);
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: "View Dashboard",
  manage_products: "Manage Products",
  create_sales: "Create Sales",
  delete_sales: "Delete Sales",
  manage_purchases: "Manage Purchases",
  manage_customers: "Manage Customers",
  manage_suppliers: "Manage Suppliers",
  view_reports: "View Reports",
  manage_users: "Manage Users & Roles",
  manage_settings: "Manage Settings",
  manage_branches: "Manage Branches",
  manage_pos: "Use POS",
  manage_inventory: "Manage Inventory",
  manage_expenses: "Manage Expenses",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

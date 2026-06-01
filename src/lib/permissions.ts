export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_POS: "manage_pos",
  CREATE_SALES: "create_sales",
  EDIT_SALES: "edit_sales",
  DELETE_SALES: "delete_sales",
  VIEW_REPORTS: "view_reports",
  EXPORT_REPORTS: "export_reports",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_PURCHASES: "manage_purchases",
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_SUPPLIERS: "manage_suppliers",
  MANAGE_INVENTORY: "manage_inventory",
  APPROVE_STOCK_ADJUSTMENT: "approve_stock_adjustment",
  APPROVE_RETURNS: "approve_returns",
  MANAGE_EXPENSES: "manage_expenses",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  MANAGE_BRANCHES: "manage_branches",
  MANAGE_SETTINGS: "manage_settings",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_GROUPS: {
  title: string;
  permissions: Permission[];
}[] = [
  {
    title: "Dashboard & POS",
    permissions: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.MANAGE_POS],
  },
  {
    title: "Sales",
    permissions: [
      PERMISSIONS.CREATE_SALES,
      PERMISSIONS.EDIT_SALES,
      PERMISSIONS.DELETE_SALES,
      PERMISSIONS.APPROVE_RETURNS,
    ],
  },
  {
    title: "Reports",
    permissions: [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.EXPORT_REPORTS],
  },
  {
    title: "Inventory & Products",
    permissions: [
      PERMISSIONS.MANAGE_PRODUCTS,
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.APPROVE_STOCK_ADJUSTMENT,
    ],
  },
  {
    title: "Purchases & Parties",
    permissions: [
      PERMISSIONS.MANAGE_PURCHASES,
      PERMISSIONS.MANAGE_CUSTOMERS,
      PERMISSIONS.MANAGE_SUPPLIERS,
    ],
  },
  {
    title: "Finance",
    permissions: [PERMISSIONS.MANAGE_EXPENSES],
  },
  {
    title: "Administration",
    permissions: [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.MANAGE_BRANCHES,
      PERMISSIONS.MANAGE_SETTINGS,
    ],
  },
];

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
      PERMISSIONS.EDIT_SALES,
      PERMISSIONS.MANAGE_PURCHASES,
      PERMISSIONS.MANAGE_CUSTOMERS,
      PERMISSIONS.MANAGE_SUPPLIERS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.EXPORT_REPORTS,
      PERMISSIONS.MANAGE_BRANCHES,
      PERMISSIONS.MANAGE_POS,
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.APPROVE_STOCK_ADJUSTMENT,
      PERMISSIONS.APPROVE_RETURNS,
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
      PERMISSIONS.APPROVE_STOCK_ADJUSTMENT,
    ],
  },
  accountant: {
    name: "Accountant",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.EXPORT_REPORTS,
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
  view_dashboard: "Dashboard access",
  manage_pos: "POS access",
  create_sales: "Create sale",
  edit_sales: "Edit sale",
  delete_sales: "Delete sale",
  view_reports: "View sales & reports",
  export_reports: "Export reports",
  manage_products: "Manage products",
  manage_purchases: "Manage purchases",
  manage_customers: "Manage customers",
  manage_suppliers: "Manage suppliers",
  manage_inventory: "Manage inventory",
  approve_stock_adjustment: "Approve stock adjustment",
  approve_returns: "Approve returns",
  manage_expenses: "Manage expenses",
  manage_users: "Manage users",
  manage_roles: "Manage roles",
  manage_branches: "Manage branches",
  manage_settings: "Manage settings",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export function resolveUserPermissions(
  rolePermissions: unknown,
  extraPermissions: unknown
): string[] {
  const role = Array.isArray(rolePermissions)
    ? rolePermissions.filter((p): p is string => typeof p === "string")
    : [];
  const extra = Array.isArray(extraPermissions)
    ? extraPermissions.filter((p): p is string => typeof p === "string")
    : [];
  return [...new Set([...role, ...extra])];
}

export function filterValidPermissions(permissions: unknown): Permission[] {
  if (!Array.isArray(permissions)) return [];
  return permissions.filter((p): p is Permission =>
    (ALL_PERMISSIONS as readonly string[]).includes(p)
  );
}

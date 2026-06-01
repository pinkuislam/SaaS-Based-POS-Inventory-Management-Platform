import { Permission, hasPermission } from "@/lib/permissions";
import { toLegacyDashboardPath } from "@/lib/tenant-path";

const DASHBOARD_ROUTE_PERMISSIONS: { pattern: RegExp; permission: Permission }[] = [
  { pattern: /^\/dashboard\/pos/, permission: "manage_pos" },
  { pattern: /^\/dashboard\/products/, permission: "manage_products" },
  { pattern: /^\/dashboard\/categories/, permission: "manage_products" },
  { pattern: /^\/dashboard\/brands/, permission: "manage_products" },
  { pattern: /^\/dashboard\/units/, permission: "manage_products" },
  { pattern: /^\/dashboard\/barcode/, permission: "manage_products" },
  { pattern: /^\/dashboard\/inventory/, permission: "manage_inventory" },
  { pattern: /^\/dashboard\/sales/, permission: "create_sales" },
  { pattern: /^\/dashboard\/purchases/, permission: "manage_purchases" },
  { pattern: /^\/dashboard\/customers/, permission: "manage_customers" },
  { pattern: /^\/dashboard\/suppliers/, permission: "manage_suppliers" },
  { pattern: /^\/dashboard\/expenses/, permission: "manage_expenses" },
  { pattern: /^\/dashboard\/payments/, permission: "view_reports" },
  { pattern: /^\/dashboard\/reports/, permission: "view_reports" },
  { pattern: /^\/dashboard\/users/, permission: "manage_users" },
  { pattern: /^\/dashboard\/roles/, permission: "manage_users" },
  { pattern: /^\/dashboard\/branches/, permission: "manage_branches" },
  { pattern: /^\/dashboard\/files/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/profile/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/settings/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/settings\/billing/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/subscription/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/integrations/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/activity/, permission: "manage_settings" },
  { pattern: /^\/dashboard\/import-export/, permission: "manage_products" },
  { pattern: /^\/dashboard\/due/, permission: "view_reports" },
  { pattern: /^\/dashboard\/notifications/, permission: "view_dashboard" },
  { pattern: /^\/dashboard\/?$/, permission: "view_dashboard" },
];

export function getRequiredPermission(pathname: string): Permission | null {
  const normalized = toLegacyDashboardPath(pathname);
  for (const { pattern, permission } of DASHBOARD_ROUTE_PERMISSIONS) {
    if (pattern.test(normalized)) return permission;
  }
  return null;
}

export function canAccessRoute(
  pathname: string,
  userPermissions: string[] | undefined
): boolean {
  const required = getRequiredPermission(pathname);
  if (!required) return true;
  if (!userPermissions?.length) return false;
  return hasPermission(userPermissions, required);
}

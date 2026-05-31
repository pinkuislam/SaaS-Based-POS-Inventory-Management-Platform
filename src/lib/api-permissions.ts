import { Permission } from "@/lib/permissions";

/** Maps API route patterns to required permissions for tenant APIs */
export const API_ROUTE_PERMISSIONS: {
  method: string;
  pattern: RegExp;
  permission: Permission;
}[] = [
  { method: "POST", pattern: /^\/api\/sales\/hold/, permission: "manage_pos" },
  { method: "POST", pattern: /^\/api\/sales\/[^/]+\/complete/, permission: "manage_pos" },
  { method: "GET", pattern: /^\/api\/sales/, permission: "create_sales" },
  { method: "POST", pattern: /^\/api\/sales/, permission: "create_sales" },
  { method: "POST", pattern: /^\/api\/sales\/[^/]+\/return/, permission: "create_sales" },
  { method: "GET", pattern: /^\/api\/purchases/, permission: "manage_purchases" },
  { method: "POST", pattern: /^\/api\/purchases/, permission: "manage_purchases" },
  { method: "POST", pattern: /^\/api\/products\/import/, permission: "manage_products" },
  { method: "GET", pattern: /^\/api\/products\/export/, permission: "manage_products" },
  { method: "POST", pattern: /^\/api\/products/, permission: "manage_products" },
  { method: "PATCH", pattern: /^\/api\/products/, permission: "manage_products" },
  { method: "GET", pattern: /^\/api\/products/, permission: "manage_products" },
  { method: "GET", pattern: /^\/api\/customers/, permission: "manage_customers" },
  { method: "POST", pattern: /^\/api\/customers/, permission: "manage_customers" },
  { method: "PATCH", pattern: /^\/api\/customers/, permission: "manage_customers" },
  { method: "POST", pattern: /^\/api\/customers\/[^/]+\/payments/, permission: "manage_customers" },
  { method: "GET", pattern: /^\/api\/suppliers/, permission: "manage_suppliers" },
  { method: "POST", pattern: /^\/api\/suppliers/, permission: "manage_suppliers" },
  { method: "PATCH", pattern: /^\/api\/suppliers/, permission: "manage_suppliers" },
  { method: "POST", pattern: /^\/api\/suppliers\/[^/]+\/payments/, permission: "manage_suppliers" },
  { method: "GET", pattern: /^\/api\/expenses/, permission: "manage_expenses" },
  { method: "POST", pattern: /^\/api\/expenses/, permission: "manage_expenses" },
  { method: "POST", pattern: /^\/api\/inventory/, permission: "manage_inventory" },
  { method: "GET", pattern: /^\/api\/due/, permission: "view_reports" },
  { method: "GET", pattern: /^\/api\/reports/, permission: "view_reports" },
  { method: "POST", pattern: /^\/api\/reports/, permission: "view_reports" },
  { method: "GET", pattern: /^\/api\/users/, permission: "manage_users" },
  { method: "POST", pattern: /^\/api\/users/, permission: "manage_users" },
  { method: "PATCH", pattern: /^\/api\/roles/, permission: "manage_users" },
  { method: "GET", pattern: /^\/api\/branches/, permission: "manage_branches" },
  { method: "POST", pattern: /^\/api\/branches/, permission: "manage_branches" },
  { method: "POST", pattern: /^\/api\/categories/, permission: "manage_products" },
  { method: "POST", pattern: /^\/api\/support/, permission: "manage_settings" },
];

export function getApiPermission(
  method: string,
  pathname: string
): Permission | null {
  for (const route of API_ROUTE_PERMISSIONS) {
    if (route.method === method && route.pattern.test(pathname)) {
      return route.permission;
    }
  }
  return null;
}

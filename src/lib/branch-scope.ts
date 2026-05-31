import { hasPermission, PERMISSIONS } from "@/lib/permissions";

/** Restrict queries to the user's branch when they are branch-scoped staff. */
export function getBranchFilter(session: {
  branchId?: string | null;
  permissions?: string[];
}): { branchId?: string } {
  const permissions = session.permissions || [];
  if (permissions.includes("*")) return {};
  if (hasPermission(permissions, PERMISSIONS.MANAGE_BRANCHES)) return {};
  if (session.branchId) return { branchId: session.branchId };
  return {};
}

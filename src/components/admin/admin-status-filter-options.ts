export const ADMIN_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export function matchesAdminActiveFilter(
  isActive: boolean,
  filterValue: string
): boolean {
  if (filterValue === "all") return true;
  if (filterValue === "active") return isActive;
  if (filterValue === "inactive") return !isActive;
  return true;
}

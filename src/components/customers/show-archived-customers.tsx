"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { tenantDashboardPath } from "@/lib/tenant-path";

export function ShowArchivedCustomers({ tenantSlug }: { tenantSlug: string }) {
  const searchParams = useSearchParams();
  const show = searchParams.get("show") === "all";

  const href = show
    ? tenantDashboardPath(tenantSlug, "/customers")
    : `${tenantDashboardPath(tenantSlug, "/customers")}?show=all`;

  return (
    <Link href={href} className="flex items-center gap-2 text-sm">
      <Checkbox checked={show} />
      <Label className="cursor-pointer font-normal">
        Show archived & deleted customers
      </Label>
    </Link>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function TenantActions({
  tenantId,
  status,
}: {
  tenantId: string;
  status: string;
}) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(`Tenant ${newStatus.toLowerCase()}`);
      router.refresh();
    } else {
      toast.error("Failed to update tenant");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-lg hover:bg-muted h-8 w-8"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status !== "ACTIVE" && (
          <DropdownMenuItem onClick={() => updateStatus("ACTIVE")}>
            Activate
          </DropdownMenuItem>
        )}
        {status === "ACTIVE" && (
          <DropdownMenuItem onClick={() => updateStatus("SUSPENDED")}>
            Suspend
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => updateStatus("EXPIRED")}>
          Mark Expired
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

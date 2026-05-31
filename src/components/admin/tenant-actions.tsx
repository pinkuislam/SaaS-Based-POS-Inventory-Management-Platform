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

  async function deleteTenant() {
    if (
      !confirm(
        "Permanently delete this tenant and all business data? This cannot be undone."
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Tenant deleted");
      router.refresh();
    } else {
      toast.error(data.error || "Delete failed");
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
        {(status === "PENDING" || status !== "ACTIVE") && (
          <DropdownMenuItem onClick={() => updateStatus("ACTIVE")}>
            {status === "PENDING" ? "Approve & Activate" : "Activate"}
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
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={deleteTenant}
        >
          Delete tenant permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

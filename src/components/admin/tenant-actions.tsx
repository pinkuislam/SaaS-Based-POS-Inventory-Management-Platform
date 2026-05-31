"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TenantEditDialog,
  type TenantEditData,
} from "@/components/admin/tenant-edit-dialog";
import { MoreHorizontal, Pencil } from "lucide-react";

async function readApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.error === "string") return data.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export function TenantActions({
  tenantId,
  status,
  tenant,
  packages = [],
}: {
  tenantId: string;
  status: string;
  tenant?: TenantEditData;
  packages?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function updateStatus(newStatus: string) {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        notify.error(await readApiError(res));
        return;
      }
      const labels: Record<string, string> = {
        ACTIVE: "activated",
        SUSPENDED: "suspended",
        EXPIRED: "marked as expired",
        PENDING: "set to pending",
        INACTIVE: "deactivated",
      };
      notify.success(`Tenant ${labels[newStatus] ?? "updated"} successfully`);
      router.refresh();
    } catch {
      notify.error("Failed to update tenant");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTenant() {
    if (busy) return;
    setOpen(false);
    const confirmed = await confirmDelete(
      "Delete tenant permanently?",
      "All business data for this tenant will be removed. This cannot be undone."
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permanent: true }),
      });
      if (!res.ok) {
        notify.error(await readApiError(res));
        return;
      }
      notify.success("Tenant deleted successfully");
      router.refresh();
    } catch {
      notify.error("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg hover:bg-muted h-8 w-8 disabled:opacity-50"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {tenant && packages.length > 0 && (
            <>
              <DropdownMenuItem
                closeOnClick={false}
                onClick={() => {
                  setOpen(false);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit tenant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {(status === "PENDING" ||
            status === "SUSPENDED" ||
            status === "EXPIRED" ||
            status === "INACTIVE") && (
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => updateStatus("ACTIVE")}
            >
              {status === "PENDING" ? "Approve & Activate" : "Activate"}
            </DropdownMenuItem>
          )}
          {status === "ACTIVE" && (
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => updateStatus("SUSPENDED")}
            >
              Suspend
            </DropdownMenuItem>
          )}
          {status !== "EXPIRED" && status !== "INACTIVE" && (
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => updateStatus("EXPIRED")}
            >
              Mark Expired
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            closeOnClick={false}
            onClick={deleteTenant}
          >
            Delete tenant permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {tenant && packages.length > 0 && (
        <TenantEditDialog
          tenant={tenant}
          packages={packages}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
